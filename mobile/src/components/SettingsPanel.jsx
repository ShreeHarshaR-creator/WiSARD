import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const SettingsPanel = ({ status, onUpdateSettings }) => {
  const currentDwell = status?.dwellTimeUs ?? 300;
  const currentPa = status?.paLevel ?? 3;

  const dwellOptions = [100, 250, 500, 750, 1000];
  const paOptions = [
    { level: 0, label: 'MIN (0 dBm)' },
    { level: 1, label: 'LOW (-6 dBm)' },
    { level: 2, label: 'HIGH (0 dBm)' },
    { level: 3, label: 'MAX (+20 dBm)' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Hardware Calibration & Settings</Text>

      <Text style={styles.label}>PLL dwell time per channel (µs)</Text>
      <View style={styles.optionRow}>
        {dwellOptions.map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.chip, currentDwell === d && styles.chipActive]}
            onPress={() => onUpdateSettings(d, currentPa)}
          >
            <Text style={[styles.chipText, currentDwell === d && styles.chipTextActive]}>
              {d} µs
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>RF output power level</Text>
      <View style={styles.optionGrid}>
        {paOptions.map((p) => (
          <TouchableOpacity
            key={p.level}
            style={[styles.paCard, currentPa === p.level && styles.paCardActive]}
            onPress={() => onUpdateSettings(currentDwell, p.level)}
          >
            <Text style={[styles.paText, currentPa === p.level && styles.paTextActive]}>
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📶 Control connection info</Text>
        <Text style={styles.infoText}>SSID: AntiJammer-Control</Text>
        <Text style={styles.infoText}>Target IP: 192.168.4.1 (Port 80)</Text>
        <Text style={styles.infoSubtext}>
          Make sure the device is connected to the ESP32 Wi-Fi SoftAP network.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e3dcef',
    marginVertical: 12,
    shadowColor: '#9747ff',
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  label: {
    color: '#a78bbd',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  chip: {
    flex: 1,
    backgroundColor: 'rgba(246, 242, 255, 0.72)',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(207, 160, 255, 0.18)',
  },
  chipActive: {
    backgroundColor: 'rgba(151, 71, 255, 0.2)',
    borderColor: '#d8a7ff',
  },
  chipText: {
    color: '#eee7f5',
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paCard: {
    width: '48%',
    backgroundColor: 'rgba(246, 242, 255, 0.72)',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.13)',
  },
  paCardActive: {
    backgroundColor: 'rgba(255, 49, 93, 0.16)',
    borderColor: '#ff8aa1',
  },
  paText: {
    color: '#eee7f5',
    fontSize: 12,
    fontWeight: '600',
  },
  paTextActive: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: 'rgba(246, 242, 255, 0.72)',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff5577',
  },
  infoTitle: {
    color: '#d8a7ff',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 6,
  },
  infoText: {
    color: '#eee7f5',
    fontSize: 12,
    marginTop: 2,
  },
  infoSubtext: {
    color: '#a78bbd',
    fontSize: 11,
    marginTop: 6,
    fontStyle: 'italic',
  },
});
