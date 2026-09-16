# WiSARD walkthrough and product evolution

This project was reworked from a device-focused demo into a launch-ready operational dashboard for browser-based deployment and team use. The goal is not just to show controls on a screen, but to present a real command-center interface that can be used by many people across teams and regions.

---

## Product transformation

The original build was a local hardware control app. It was useful for understanding the system and validating the ESP32 pipeline, but it was not yet a public-facing product. We changed that by:

- restructuring the UI as an operations dashboard
- introducing a stronger global command-center layout
- making the signal panel dynamic and continuously updating
- emphasizing browser-based launch and multi-user readiness
- clarifying the product narrative as a scalable defense platform

---

## Why the app now looks like a real product

A real-world web product is judged by more than a few buttons. It has to communicate trust, system health, operational readiness, and scale. That is why the app now includes:

- a left-side operations panel
- live working status blocks
- dynamic spectrum activity
- incident feed and operator presence
- deployment-ready command layout

This makes it feel like a real control interface that could be used by teams in a central operations center.

---

## Dynamic chart approach

The spectrum panel is now driven by live state updates instead of static values. It refreshes continuously with generated signal data, which gives the interface the motion and responsiveness expected from modern monitoring dashboards.

This makes the app feel active rather than static and helps present the product as a real-time operational system, not just a mock UI.

---

## Multi-user and public launch direction

For a truly global and shared deployment, a real system should include:

1. user authentication and roles
2. secure cloud hosting
3. live telemetry and event streams
4. persistent device and operator history
5. API endpoints for multiple clients at once

This project now serves as the front-end foundation for that future architecture.

---

## Execution model

The current app is a strong frontend shell for a launch-ready product. It is designed to support:

- local demo use
- browser-based access in a team environment
- future public deployment through cloud hosting
- extension into a broader defense or monitoring platform

---

## Recommended next milestone

The next step is to add a proper backend and deployment layer:

- API server for shared state
- authentication for multiple users
- database for history and events
- live updates across all connected clients
- hosted web deployment for global access

That is the difference between a demo and a platform.

  Serial.begin(115200);
  delay(1000);

  Serial.println();
  Serial.println("================================");
  Serial.println("  BLUETOOTH / BLE JAMMER");
  Serial.println("  Arka Sengupta");
  Serial.println("================================");
  Serial.println();

  // Shut down ESP32's own radios
  wifi_init_config_t cfg = WIFI_INIT_CONFIG_DEFAULT();
  esp_wifi_init(&cfg);
  esp_wifi_disconnect();
  esp_wifi_stop();
  esp_wifi_deinit();
  esp_bt_controller_deinit();

  // Init HSPI — explicit pins
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
    hspiOK = true;
  } else {
    Serial.println("HSPI Radio 1: FAILED");
  }

  // Init VSPI — explicit pins
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
    vspiOK = true;
  } else {
    Serial.println("VSPI Radio 2: FAILED");
  }

  Serial.println();
  if (hspiOK && vspiOK) {
    Serial.println("Both radios OK — JAMMING ACTIVE!");
    Serial.println("Radio 1 -> BLE advertising channels (2, 26, 80)");
    Serial.println("Radio 2 -> Sweeping all 40 BLE channels");
  } else {
    Serial.println("WARNING: Not all radios started!");
  }
  Serial.println();
}

void loop() {
  if (!hspiOK && !vspiOK) {
    delay(500);
    return;
  }

  jam();
  loopCount++;

  if (loopCount % 300 == 0) {
    static unsigned long lastTime = 0;
    unsigned long now = millis();
    Serial.print("ADV:");
    Serial.print(BLE_ADV_CHANNELS[loopCount % 3]);
    Serial.print(" DATA:");
    Serial.print(BLE_ALL_CHANNELS[dataIdx]);
    if (now - lastTime > 0) {
      Serial.print("  loops/s:");
      Serial.print(300000UL / (now - lastTime));
    }
    lastTime = now;
    Serial.println();
  }
}
```

---

## Key Lessons Learned

1. **`startConstCarrier()` is useless for jamming** — it's a diagnostic mode that produces a clean tone WiFi/BLE receivers can filter out. Use `writeFast()` packet blasting instead.
2. **WiFi is too robust for NRF24L01 jamming** — 20MHz channel width vs 2MHz NRF bandwidth makes it impractical. BLE's 2MHz channels are a perfect match.
3. **ESP32 WiFi deinit order matters** — must be `disconnect → stop → deinit`, and init first if not already initialized.
4. **Always explicitly set SPI pins** — `SPIClass::begin(SCK, MISO, MOSI, SS)` instead of relying on defaults.
5. **PA+LNA modules need separate 3.3V power** — they draw ~150mA each, too much for ESP32's onboard regulator.
6. **Serial.print in tight loops kills TX duty cycle** — print only every Nth iteration.
7. **Both radios failing = shared issue** (power or ground), one failing = wiring issue on that module.

---

## Libraries Required

- **RF24** by TMRh20 (NRF24L01 driver)
- **SPI** (built-in)
- **esp_wifi.h** / **esp_bt.h** (ESP-IDF, built-in with ESP32 Arduino core)
