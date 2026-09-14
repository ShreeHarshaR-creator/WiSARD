import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const SettingsPanel = ({ status, onUpdateSettings }) => {
  const currentDwell = status?.dwellTimeUs ?? 300;
  const currentPa = status?.paLevel ?? 3;

  const dwellOptions = [100, 300, 500, 1000];
  const paOptions = [
    { level: 0, label: 'MIN (0dBm)' },
    { level: 1, label: 'LOW (-6dBm)' },
    { level: 2, label: 'HIGH (0dBm)' },
    { level: 3, label: 'MAX (+20dBm)' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Hardware Calibration & Settings</Text>

      {/* Dwell Time Selection */}
      <Text style={styles.label}>PLL Dwell Time per Channel (µs)</Text>
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

      {/* RF PA Power Selection */}
      <Text style={styles.label}>RF Output PA Power Level</Text>
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

      {/* Wi-Fi SoftAP Connection Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>📶 Control Connection Info</Text>
        <Text style={styles.infoText}>SSID: AntiJammer-Control</Text>
        <Text style={styles.infoText}>Target IP: 192.168.4.1 (Port 80)</Text>
        <Text style={styles.infoSubtext}>
          Ensure mobile device is connected to the ESP32 Wi-Fi SoftAP network.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginVertical: 12,
  },
  sectionTitle: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  label: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  chip: {
    flex: 0.23,
    backgroundColor: '#1f2937',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  chipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  chipText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
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
    backgroundColor: '#1f2937',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  paCardActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  paText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  paTextActive: {
    color: '#ffffff',
  },
  infoCard: {
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoTitle: {
    color: '#60a5fa',
    fontWeight: 'bold',
    fontSize: 13,
    marginBottom: 4,
  },
  infoText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
  infoSubtext: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
