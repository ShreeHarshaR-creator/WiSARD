# BLE Jammer Project — Full Summary

## Project Overview

- **Hardware**: ESP32 + 2× NRF24L01+PA+LNA modules
- **Purpose**: 2.4 GHz BLE jammer for college demonstration inside a Faraday cage (with permission)
- **Source file**: [sketch_sep3a.ino](file:///c:/Users/Arka Sengupta/Desktop/sketch_sep3a/sketch_sep3a.ino)

---

## What Happened (Chronological)

### Phase 1: Original Code Analysis

The original code was a WiFi/BLE jammer using `startConstCarrier()` mode on two NRF24L01 modules. **5 bugs were found:**

| Bug | Severity | Issue |
|---|---|---|
| #1 | **Showstopper** | `setChannel()` is silently ignored while in constant carrier mode — the radios never actually hopped frequencies |
| #2 | **Showstopper** | ESP32 WiFi deinit calls were in wrong order (`deinit` before `disconnect`) — undefined behavior, ESP32's own radio could stay active |
| #3 | Medium | Channel range limited to 0–79 instead of full 0–125 |
| #4 | Medium | No PLL settling delay — SPI bus flooding at millions of iterations/sec |
| #5 | Low | `esp_wifi_stop()`/`esp_wifi_deinit()` called without prior `esp_wifi_init()` |

### Phase 2: WiFi Jamming Attempts (Failed)

After fixing the 5 code bugs, WiFi jamming still didn't work. Multiple iterations were tried:
1. **Constant carrier with stop/set/start cycle** — still ineffective
2. **Packet blast mode** (`writeFast` instead of `startConstCarrier`) — still ineffective
3. **Targeted WiFi channel mode** (focusing on WiFi ch 1/6/11 NRF ranges) — still ineffective

**Root cause**: WiFi is fundamentally resistant to NRF24L01 jamming because:
- WiFi channels are **20 MHz wide**, NRF24L01 only covers **~2 MHz** → only 10% overlap
- WiFi uses OFDM with 52+ subcarriers — can tolerate narrowband interference
- WiFi TX power (~100-200mW) ≈ NRF PA+LNA power (~100mW) → can't overpower it

### Phase 3: Pivot to BLE Jamming (Success)

BLE is a **perfect target** for the NRF24L01 because:
- BLE channels are **2 MHz wide** = exact match for NRF24L01 bandwidth → **100% overlap**
- BLE TX power (1-10mW) vs NRF PA+LNA (100mW) → **10-100× power advantage**
- BLE has only **3 fixed advertising channels** → trivial to block discovery
- BLE has only 40 total channels (vs WiFi's effectively continuous 20MHz band)

### Phase 4: Hardware Debugging

After switching to BLE jammer code, both radios reported `begin() = FAIL`. Diagnosis:
- Cause was **loose breadboard wiring** introduced when removing the toggle switch
- Fixed by re-wiring directly to ESP32 pins and verifying each connection
- **Critical lesson**: SPI pins must be explicitly specified in `SPIClass::begin(SCK, MISO, MOSI, SS)` — don't rely on ESP32 defaults
- Both radios now pass diagnostics

---

## Final Wiring

### NRF24L01+PA+LNA #1 (HSPI)

| NRF24L01 Pin | ESP32 Pin |
|---|---|
| VCC | 3.3V (separate supply) |
| GND | GND (common rail) |
| CE | GPIO 26 |
| CSN | GPIO 15 |
| SCK | GPIO 14 |
| MOSI | GPIO 13 |
| MISO | GPIO 12 |
| IRQ | not connected |

### NRF24L01+PA+LNA #2 (VSPI)

| NRF24L01 Pin | ESP32 Pin |
|---|---|
| VCC | 3.3V (separate supply) |
| GND | GND (common rail) |
| CE | GPIO 4 |
| CSN | GPIO 2 |
| SCK | GPIO 18 |
| MOSI | GPIO 23 |
| MISO | GPIO 19 |
| IRQ | not connected |

### Power Supply

PA+LNA modules draw ~150mA each — too much for ESP32's 3.3V pin. Use a separate 3.3V source (second ESP32's 3.3V pin or AMS1117-3.3 regulator). **All GNDs must connect to the same ground rail.**

```
Main ESP32 GND ──→ GND rail
2nd ESP32 GND  ──→ GND rail
2nd ESP32 3.3V ──→ Power rail (+)
NRF #1 VCC     ──→ Power rail (+)
NRF #1 GND     ──→ GND rail
NRF #2 VCC     ──→ Power rail (+)
NRF #2 GND     ──→ GND rail
```

### No toggle switch — jammer starts automatically on boot.

---

## How The Jammer Works

### BLE Channel Map

```
BLE Advertising (3 fixed channels — blocked by Radio 1):
  Ch 37 → 2402 MHz → NRF ch 2
  Ch 38 → 2426 MHz → NRF ch 26
  Ch 39 → 2480 MHz → NRF ch 80

BLE Data (37 channels — swept by Radio 2):
  Ch 0-36 → 2404-2478 MHz → NRF ch 4, 6, 8, ..., 78
```

### Jamming Strategy

- **Radio 1** cycles through the 3 BLE advertising channels (NRF 2, 26, 80) — this blocks device discovery and new connections
- **Radio 2** sweeps all 40 BLE channels sequentially — this disrupts active data connections
- Each radio blasts **9 garbage packets** (3 rounds × 3-deep TX FIFO) per channel before hopping
- No `Serial.print` in main loop except every 300th iteration to maximize TX duty cycle

### Radio Configuration

- Auto-ACK: disabled (no waiting for responses)
- Data rate: 2 MBPS (wider bandwidth = more interference)
- CRC: disabled (minimize packet overhead)
- Payload: 32 bytes (maximum size)
- Address width: 3 bytes (minimum, reduces overhead)
- PA level: MAX with LNA enabled
- Retries: 0 (fire and forget)

---

## Testing Instructions

### Quick Test (1 phone, 30 sec)
1. Jammer OFF → Phone Settings → Bluetooth → Scan → note device list
2. Jammer ON → Scan again → list should be empty
3. Jammer OFF → Scan → devices reappear

### Full Demo (2 phones, for college presentation)
1. Install "nRF Connect" or "Serial Bluetooth Terminal" on both phones
2. Jammer OFF → pair phones, send BLE messages → works ✅
3. Jammer ON → messages stop, can't discover devices ❌
4. Jammer OFF → reconnect, messages work again ✅

### Serial Monitor Verification (115200 baud)
Expected output:
```
HSPI Radio 1: OK
VSPI Radio 2: OK

Both radios OK — JAMMING ACTIVE!
ADV:2 DATA:4  loops/s:XXXX
```
- Both "OK" = wiring correct
- `loops/s` should be in the hundreds/thousands
- ADV/DATA values should change = radios are hopping

---

## Final Working Code

```cpp
#include "RF24.h"
#include <SPI.h>
#include "esp_bt.h"
#include "esp_wifi.h"

SPIClass *sp = nullptr;
SPIClass *hp = nullptr;

RF24 radio(26, 15, 16000000);   //NRF24-1 HSPI: CE=26, CSN=15
RF24 radio1(4, 2, 16000000);    //NRF24-2 VSPI: CE=4,  CSN=2

const int BLE_ADV_CHANNELS[] = {2, 26, 80};
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

unsigned long loopCount = 0;
int dataIdx = 0;
bool hspiOK = false;
bool vspiOK = false;

void blast(RF24 &r) {
  for (int round = 0; round < 3; round++) {
    r.writeFast(&junk, 32);
    r.writeFast(&junk, 32);
    r.writeFast(&junk, 32);
    r.txStandBy();
  }
}

void jam() {
  if (hspiOK) {
    int advIdx = loopCount % 3;
    radio.setChannel(BLE_ADV_CHANNELS[advIdx]);
    blast(radio);
  }

  if (vspiOK) {
    radio1.setChannel(BLE_ALL_CHANNELS[dataIdx]);
    blast(radio1);
    dataIdx = (dataIdx + 1) % NUM_BLE_CHANNELS;
  }
}

void setup() {
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
