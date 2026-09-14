import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const ControlDashboard = ({ status, onToggleJamming, onSelectMode, onEmergencyStop }) => {
  const isJamming = status?.isJamming ?? false;
  const currentMode = status?.jammerMode ?? 0;
  const radio1OK = status?.radio1OK ?? false;
  const radio2OK = status?.radio2OK ?? false;

  const modes = [
    { id: 0, title: 'Full BLE Sweep', subtitle: 'Adv (37-39) + All 40 Data Ch' },
    { id: 1, title: 'Adv Block Only', subtitle: 'Target Ch 37, 38, 39 (Discovery)' },
    { id: 2, title: 'Data Channels Only', subtitle: 'Sweep Ch 0-36 (Active Links)' },
  ];

  return (
    <View style={styles.container}>
      {/* Master Toggle Power Button */}
      <View style={styles.powerSection}>
        <TouchableOpacity
          style={[
            styles.powerButton,
            isJamming ? styles.powerButtonActive : styles.powerButtonInactive,
          ]}
          activeOpacity={0.8}
          onPress={onToggleJamming}
        >
          <Text style={styles.powerIcon}>⚡</Text>
          <Text style={styles.powerText}>
            {isJamming ? 'JAMMER ACTIVE' : 'SYSTEM STANDBY'}
          </Text>
          <Text style={styles.powerSubtext}>
            {isJamming ? 'Tap to Pause Transmission' : 'Tap to Activate Jamming'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Radio Hardware Status Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.badge, radio1OK ? styles.badgeSuccess : styles.badgeError]}>
          <Text style={styles.badgeText}>
            Radio 1 (HSPI): {radio1OK ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
        <View style={[styles.badge, radio2OK ? styles.badgeSuccess : styles.badgeError]}>
          <Text style={styles.badgeText}>
            Radio 2 (VSPI): {radio2OK ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* Mode Selector Cards */}
      <Text style={styles.sectionTitle}>Operating Mode</Text>
      {modes.map((m) => {
        const isSelected = currentMode === m.id;
        return (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeCard, isSelected && styles.modeCardSelected]}
            onPress={() => onSelectMode(m.id)}
          >
            <View style={styles.radioDot}>
              {isSelected && <View style={styles.radioDotInner} />}
            </View>
            <View style={styles.modeTextContainer}>
              <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>
                {m.title}
              </Text>
              <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Emergency Stop Button */}
      <TouchableOpacity style={styles.emergencyButton} onPress={onEmergencyStop}>
        <Text style={styles.emergencyText}>🚨 EMERGENCY HARDWARE STOP</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  powerSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  powerButton: {
    width: '100%',
    paddingVertical: 28,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  powerButtonActive: {
    backgroundColor: '#dc2626',
  },
  powerButtonInactive: {
    backgroundColor: '#2563eb',
  },
  powerIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  powerText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  powerSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  badge: {
    flex: 0.48,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#065f46',
  },
  badgeError: {
    backgroundColor: '#991b1b',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#f3f4f6',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  modeCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a8a',
  },
  radioDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6',
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    color: '#e5e7eb',
    fontSize: 15,
    fontWeight: '600',
  },
  modeTitleSelected: {
    color: '#60a5fa',
  },
  modeSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 2,
  },
  emergencyButton: {
    backgroundColor: '#7f1d1d',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  emergencyText: {
    color: '#fca5a5',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
