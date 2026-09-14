# WiSARD — Wireless Spectrum Attack Resolution and Defense

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web%20%7C%20Windows%20%7C%20macOS-blue?style=for-the-badge&logo=react" alt="Platforms" />
  <img src="https://img.shields.io/badge/Hardware-ESP32%20%2B%202%C3%97%20NRF24L01%2BPA%2BLNA-red?style=for-the-badge&logo=expressif" alt="Hardware" />
  <img src="https://img.shields.io/badge/Framework-React%20Native%20%2F%20Expo-000000?style=for-the-badge&logo=expo" alt="Framework" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

---

## 📌 Project Overview

**WiSARD** (**W**ireless **S**pectrum **A**ttack **R**esolution and **D**efense) is an open-source, cross-platform hardware-software system designed for real-time 2.4 GHz wireless spectrum monitoring, interference analysis, and defensive signal audit.

By coupling a high-performance **ESP32 dual-core microcontroller** equipped with dual **NRF24L01+PA+LNA** RF modules with a **React Native cross-platform application** (Android, iOS, Web, Windows, macOS), WiSARD provides researchers and systems engineers with precise control over 2.4 GHz spectrum testing, Bluetooth Low Energy (BLE) stability auditing, and signal vulnerability assessment within authorized shielded environments (Faraday cages).

---

## ✨ Key Features

- 🌐 **Cross-Platform Control Application**: Runs seamlessly on **Android**, **iOS**, **Web Browsers**, **Windows**, and **macOS** via React Native & Expo.
- ⚡ **Dual-Core FreeRTOS Microcontroller Architecture**:
  - **Core 1**: Dedicated high-speed RF hardware loop running at >5,000 hops/sec.
  - **Core 0**: Wi-Fi SoftAP and asynchronous REST API server for zero-latency remote management.
- 📊 **Real-Time 40-Channel Spectrum Visualizer**: Displays live RF power distribution across all 40 BLE channels (2402 MHz to 2480 MHz).
- 🎛️ **Multi-Mode Defense & Audit Spectrum Modes**:
  - **Full Spectrum Sweep**: Sweeps all 40 BLE data and advertising channels simultaneously.
  - **Advertising Channel Audit**: Targets BLE discovery channels 37, 38, and 39 (2402, 2426, 2480 MHz).
  - **Data Link Audit**: Sweeps channels 0–36 to evaluate active connection resistance.
- 🔧 **Hardware Power & Dwell Time Calibration**: Dynamic runtime adjustments for Phase-Locked Loop (PLL) dwell time (100 µs – 1000 µs) and PA transmit levels (`MIN`, `LOW`, `HIGH`, `MAX`).
- 🚨 **Emergency Hardware Cutoff**: Instant emergency stop protocol built into UI and firmware to halt RF transmission immediately.

---

## 🏗️ System Architecture

```
+-----------------------------------------------------------------------------------+
|                           WiSARD Cross-Platform Client                            |
|                 (Android | iOS | Web | Windows | macOS - React Native)            |
|                                                                                   |
|  +--------------------+   +---------------------------+   +--------------------+  |
|  |  Control Dashboard |   | 40-Ch Spectrum Visualizer |   | Calibration Panel  |  |
|  +--------------------+   +---------------------------+   +--------------------+  |
+-----------------------------------------+-----------------------------------------+
                                          |
                                 Wi-Fi SoftAP (HTTP REST)
                                  IP: 192.168.4.1:80
                                          |
+-----------------------------------------v-----------------------------------------+
|                                ESP32 Microcontroller                              |
|                                                                                   |
|  +-------------------------------------+   +-----------------------------------+  |
|  |             Core 0                  |   |               Core 1              |  |
|  | - Wi-Fi Access Point ("WiSARD-AP")  |   | - High-Speed NRF24 Sweeper Task   |  |
|  | - Asynchronous REST API Server      |   | - Priority 10 FreeRTOS Loop       |  |
|  +-------------------------------------+   +-----------------------------------+  |
|                                         \ /                                       |
|                                          V                                        |
|  +----------------------------------+         +---------------------------------+ |
|  | NRF24L01 #1 (HSPI Bus) - Adv Ch  |         | NRF24L01 #2 (VSPI Bus) - Data   | |
|  +----------------------------------+         +---------------------------------+ |
+-----------------------------------------------------------------------------------+
```

---

## 🔌 Hardware Wiring Diagram

WiSARD utilizes dual SPI buses on the ESP32 to drive two independent NRF24L01+PA+LNA modules.

### Radio 1: HSPI Bus (BLE Advertising Channels 37, 38, 39)
| NRF24L01 #1 Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **VCC** | **3.3V Rail (External)** | Power Supply (~150mA peak) |
| **GND** | **Common Ground** | Ground |
| **CE** | **GPIO 26** | Chip Enable |
| **CSN** | **GPIO 15** | SPI Chip Select |
| **SCK** | **GPIO 14** | Clock |
| **MOSI** | **GPIO 13** | Master Out Slave In |
| **MISO** | **GPIO 12** | Master In Slave Out |

### Radio 2: VSPI Bus (40 BLE Data Channels Sweep)
| NRF24L01 #2 Pin | ESP32 Pin | Function |
| :--- | :--- | :--- |
| **VCC** | **3.3V Rail (External)** | Power Supply (~150mA peak) |
| **GND** | **Common Ground** | Ground |
| **CE** | **GPIO 4** | Chip Enable |
| **CSN** | **GPIO 2** | SPI Chip Select |
| **SCK** | **GPIO 18** | Clock |
| **MOSI** | **GPIO 23** | Master Out Slave In |
| **MISO** | **GPIO 19** | Master In Slave Out |

> ⚠️ **Power Supply Note**: Both PA+LNA modules draw up to ~300mA combined. Power them using a dedicated 3.3V power regulator or a secondary microcontroller's 3.3V pin. Ensure all GND pins are tied to a common ground rail. Place 10µF–100µF capacitors across `VCC` and `GND` pins on each module for stability.

---

## 🚀 Quick Start Guide

### 1. Flash the ESP32 Firmware

1. Install the **Arduino IDE** (or PlatformIO).
2. Install the **RF24** library by TMRh20 via Library Manager.
3. Open [`sketch_sep12a/sketch_sep12a.ino`](sketch_sep12a/sketch_sep12a.ino).
4. Select board **DOIT ESP32 DEVKIT V1** and your COM port.
5. Upload the sketch and open Serial Monitor at **115200 baud**.

### 2. Run the Cross-Platform Mobile / Web App

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- Expo Go app on mobile, or Android Studio / Xcode for emulators

#### Installation
```bash
# Clone the repository
git clone https://github.com/<your-username>/WiSARD.git
cd WiSARD/mobile

# Install dependencies
npm install

# Start the application for All Platforms (Android, iOS, Web)
npm start
```

#### Running on Platforms
- **Android / iOS**: Scan the QR code generated by Expo CLI using the **Expo Go** app.
- **Web Browser**: Press `w` in the terminal to launch the web client on `http://localhost:8081`.
- **Desktop (Windows / macOS / Linux)**: Run `npx expo run:android` or build via Electron wrapper.

### 3. Connect App to WiSARD Hardware
1. On your device (phone/laptop), connect to the Wi-Fi Access Point:
   - **SSID**: `AntiJammer-Control`
   - **Password**: `12345678`
2. Open the **WiSARD** application. The connection status indicator in the top header will display **`ESP32 CONNECTED`**.

---

## 📡 REST API Documentation

The ESP32 REST server runs on `http://192.168.4.1:80` with full CORS support.

| Endpoint | Method | Parameters | Description |
| :--- | :--- | :--- | :--- |
| `/api/status` | `GET` | None | Returns JSON system status, loop speed, active channels, and radio health. |
| `/api/control` | `POST` | `action=start\|stop\|toggle`, `mode=0\|1\|2` | Controls RF jamming state and operating mode. |
| `/api/settings` | `POST` | `dwell=100..2000`, `pa=0..3` | Dynamically updates PLL dwell time (µs) and PA transmit power level. |

---

## 📂 Repository Structure

```text
WiSARD/
├── sketch_sep12a/
│   └── sketch_sep12a.ino      # ESP32 Dual-Core Firmware (C++ / FreeRTOS)
├── mobile/
│   ├── App.js                 # App root & navigation bar
│   ├── app.json               # Expo configuration
│   ├── package.json           # Dependencies
│   └── src/
│       ├── components/
│       │   ├── ControlDashboard.jsx   # Power toggle, mode selector, emergency stop
│       │   ├── SpectrumVisualizer.jsx # Real-time 40-channel BLE grid & telemetry
│       │   └── SettingsPanel.jsx      # Dwell time & PA power calibration
│       └── services/
│           └── jammerApi.js           # REST API client module
├── walkthrough.md             # Project build log & walkthrough
├── implementation_plan.md     # Architecture design plan
└── README.md                  # Project Documentation
```

---

## ⚖️ Responsible Use & Legal Disclaimer

This tool is strictly intended for **academic research, educational demonstrations, and authorized RF isolation testing inside certified Faraday cages or shielded enclosures**. Operation of RF jamming equipment on public frequencies without regulatory authorization is illegal under federal and international communications regulations (e.g., FCC regulations in the US, ITU regulations internationally). Always comply with local laws and regulations.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
