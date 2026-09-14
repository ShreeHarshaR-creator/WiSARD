#include "RF24.h"
#include <SPI.h>
#include <WiFi.h>
#include <WebServer.h>
#include "esp_bt.h"
#include "esp_wifi.h"

// Hardware Pin Definitions
const int CE1_PIN = 26;
const int CSN1_PIN = 15;
const int CE2_PIN = 4;
const int CSN2_PIN = 2;

SPIClass *hp = nullptr;
SPIClass *sp = nullptr;

RF24 radio(CE1_PIN, CSN1_PIN, 16000000);   // NRF24-1 HSPI: CE=26, CSN=15
RF24 radio1(CE2_PIN, CSN2_PIN, 16000000);  // NRF24-2 VSPI: CE=4,  CSN=2

// Frequency Channels
const int BLE_ADV_CHANNELS[] = {2, 26, 80}; // BLE Adv Ch 37 (2402MHz), 38 (2426MHz), 39 (2480MHz)
const int BLE_ALL_CHANNELS[] = {
   2,  4,  6,  8, 10, 12, 14, 16, 18, 20,
  22, 24, 26, 28, 30, 32, 34, 36, 38, 40,
  42, 44, 46, 48, 50, 52, 54, 56, 58, 60,
  62, 64, 66, 68, 70, 72, 74, 76, 78, 80
};
const int NUM_BLE_CHANNELS = 40;

const byte junk[32] = {
  0xAA, 0x55, 0xAA, 0x55, 0xDE, 0xAD, 0xBE, 0xEF,
  0xFF, 0x00, 0xFF, 0x00, 0xCA, 0xFE, 0xBA, 0xBE,
  0x13, 0x37, 0x42, 0x69, 0xF0, 0x0F, 0xA5, 0x5A,
  0xCC, 0x33, 0xCC, 0x33, 0x96, 0x69, 0x3C, 0xC3
};

// Global Shared State (Atomic / Volatile for Inter-Core Safety)
volatile bool isJamming = true;
volatile int jammerMode = 0; // 0 = Full Spectrum, 1 = Adv Only, 2 = Data Only
volatile int dwellTimeUs = 300;
volatile int currentPaLevel = 3; // 0=MIN, 1=LOW, 2=HIGH, 3=MAX
volatile unsigned long loopsPerSec = 0;
volatile int currentAdvCh = 2;
volatile int currentDataCh = 2;

bool hspiOK = false;
bool vspiOK = false;

// Web Server on Port 80 (Core 0)
WebServer server(80);

// Core 1 Jammer Task Handle
TaskHandle_t JammerTaskHandle = NULL;

inline void fire(RF24 &r) {
  r.writeFast(&junk, 32);
  r.writeFast(&junk, 32);
  delayMicroseconds(dwellTimeUs);
}

// Dedicated High-Priority Core 1 Jammer Execution Loop
void jammerTask(void *pvParameters) {
  unsigned long loopCounter = 0;
  unsigned long lastCalcTime = millis();
  int advIdx = 0;
  int dataIdx = 0;

  for (;;) {
    if (isJamming) {
      if (hspiOK && (jammerMode == 0 || jammerMode == 1)) {
        currentAdvCh = BLE_ADV_CHANNELS[advIdx];
        radio.setChannel(currentAdvCh);
        fire(radio);
        advIdx = (advIdx + 1) % 3;
      }

      if (vspiOK && (jammerMode == 0 || jammerMode == 2)) {
        currentDataCh = BLE_ALL_CHANNELS[dataIdx];
        radio1.setChannel(currentDataCh);
        fire(radio1);
        dataIdx = (dataIdx + 1) % NUM_BLE_CHANNELS;
      }

      loopCounter++;
      if (loopCounter >= 500) {
        unsigned long now = millis();
        if (now - lastCalcTime > 0) {
          loopsPerSec = (loopCounter * 1000UL) / (now - lastCalcTime);
        }
        loopCounter = 0;
        lastCalcTime = now;
      }
    } else {
      vTaskDelay(pdMS_TO_TICKS(50));
    }
  }
}

// CORS Header Helper
void sendCORS() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleOptions() {
  sendCORS();
  server.send(204);
}

void handleStatus() {
  sendCORS();
  String json = "{";
  json += "\"isJamming\":" + String(isJamming ? "true" : "false") + ",";
  json += "\"jammerMode\":" + String(jammerMode) + ",";
  json += "\"dwellTimeUs\":" + String(dwellTimeUs) + ",";
  json += "\"paLevel\":" + String(currentPaLevel) + ",";
  json += "\"loopsPerSec\":" + String(loopsPerSec) + ",";
  json += "\"currentAdvCh\":" + String(currentAdvCh) + ",";
  json += "\"currentDataCh\":" + String(currentDataCh) + ",";
  json += "\"radio1OK\":" + String(hspiOK ? "true" : "false") + ",";
  json += "\"radio2OK\":" + String(vspiOK ? "true" : "false");
  json += "}";
  server.send(200, "application/json", json);
}

void handleControl() {
  sendCORS();
  if (server.hasArg("action")) {
    String act = server.arg("action");
    if (act == "start") isJamming = true;
    else if (act == "stop") isJamming = false;
    else if (act == "toggle") isJamming = !isJamming;
  }
  if (server.hasArg("mode")) {
    jammerMode = server.arg("mode").toInt();
  }
  handleStatus();
}

void handleSettings() {
  sendCORS();
  if (server.hasArg("dwell")) {
    int d = server.arg("dwell").toInt();
    if (d >= 50 && d <= 2000) dwellTimeUs = d;
  }
  if (server.hasArg("pa")) {
    int p = server.arg("pa").toInt();
    if (p >= 0 && p <= 3) {
      currentPaLevel = p;
      rf24_pa_dbm_e level = RF24_PA_MAX;
      if (p == 0) level = RF24_PA_MIN;
      else if (p == 1) level = RF24_PA_LOW;
      else if (p == 2) level = RF24_PA_HIGH;
      
      if (hspiOK) radio.setPALevel(level, true);
      if (vspiOK) radio1.setPALevel(level, true);
    }
  }
  handleStatus();
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("==========================================");
  Serial.println("  ANTI-JAMMER v3.0 (DUAL-CORE + MOBILE AP)");
  Serial.println("==========================================");

  pinMode(CE1_PIN, OUTPUT);
  pinMode(CE2_PIN, OUTPUT);
  digitalWrite(CE1_PIN, HIGH);
  digitalWrite(CE2_PIN, HIGH);

  // Disable internal Bluetooth radio
  esp_bt_controller_deinit();

  // Configure Wi-Fi SoftAP for Mobile Control
  WiFi.mode(WIFI_AP);
  WiFi.softAP("AntiJammer-Control", "12345678");
  IPAddress apIP = WiFi.softAPIP();
  Serial.print("Mobile Control SoftAP Ready! IP Address: ");
  Serial.println(apIP);

  // Configure HTTP Endpoints
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/control", HTTP_POST, handleControl);
  server.on("/api/control", HTTP_GET, handleControl);
  server.on("/api/settings", HTTP_POST, handleSettings);
  server.on("/api/settings", HTTP_GET, handleSettings);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/control", HTTP_OPTIONS, handleOptions);
  server.on("/api/settings", HTTP_OPTIONS, handleOptions);
  server.begin();
  Serial.println("REST API WebServer started on Port 80");

  // Init HSPI Radio 1
  hp = new SPIClass(HSPI);
  hp->begin(14, 12, 13, 15);
  delay(100);
  if (radio.begin(hp)) {
    Serial.println("HSPI Radio 1: OK");
    radio.setAutoAck(false);
    radio.stopListening();
    radio.setRetries(0, 0);
    radio.setPALevel(RF24_PA_MAX, true);
    radio.setDataRate(RF24_2MBPS);
    radio.setCRCLength(RF24_CRC_DISABLED);
    radio.setPayloadSize(32);
    radio.setAddressWidth(3);
    radio.openWritingPipe(0xE7E7E7LL);
    radio.flush_tx();
    digitalWrite(CE1_PIN, HIGH);
    hspiOK = true;
  } else {
    Serial.println("HSPI Radio 1: FAILED");
  }

  // Init VSPI Radio 2
  sp = new SPIClass(VSPI);
  sp->begin(18, 19, 23, 2);
  delay(100);
  if (radio1.begin(sp)) {
    Serial.println("VSPI Radio 2: OK");
    radio1.setAutoAck(false);
    radio1.stopListening();
    radio1.setRetries(0, 0);
    radio1.setPALevel(RF24_PA_MAX, true);
    radio1.setDataRate(RF24_2MBPS);
    radio1.setCRCLength(RF24_CRC_DISABLED);
    radio1.setPayloadSize(32);
    radio1.setAddressWidth(3);
    radio1.openWritingPipe(0xE7E7E7LL);
    radio1.flush_tx();
    digitalWrite(CE2_PIN, HIGH);
    vspiOK = true;
  } else {
    Serial.println("VSPI Radio 2: FAILED");
  }

  // Create & Pin Jammer Task to Core 1
  xTaskCreatePinnedToCore(
    jammerTask,
    "JammerCore1",
    4096,
    NULL,
    10, // High Priority
    &JammerTaskHandle,
    1  // Pin to Core 1
  );
  Serial.println("High-priority Jammer Task pinned to Core 1!");
}

void loop() {
  // Handle HTTP REST Client requests on Core 0
  server.handleClient();
  
  static unsigned long lastSerialPrint = 0;
  if (millis() - lastSerialPrint > 2000) {
    Serial.print("[Core 0 Telemetry] Jamming: ");
    Serial.print(isJamming ? "ACTIVE" : "PAUSED");
    Serial.print(" | Speed: ");
    Serial.print(loopsPerSec);
    Serial.print(" loops/s | Adv Ch: ");
    Serial.print(currentAdvCh);
    Serial.print(" | Data Ch: ");
    Serial.println(currentDataCh);
    lastSerialPrint = millis();
  }
}