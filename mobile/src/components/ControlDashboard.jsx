import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export const ControlDashboard = ({ status, onToggleJamming, onSelectMode, onEmergencyStop }) => {
  const isJamming = status?.isJamming ?? false;
  const currentMode = status?.jammerMode ?? 0;
  const radio1OK = status?.radio1OK ?? false;
  const radio2OK = status?.radio2OK ?? false;
  const loopsPerSec = status?.loopsPerSec ?? 0;
  const signalQuality = status?.signalQuality ?? 0;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: isJamming ? 900 : 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: isJamming ? 900 : 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [isJamming, pulse]);

  const modes = [
    { id: 0, title: 'Full BLE Sweep', subtitle: 'Adv (37-39) + all 40 data channels' },
    { id: 1, title: 'Adv Block Only', subtitle: 'Target channels 37, 38, 39' },
    { id: 2, title: 'Data Channels Only', subtitle: 'Sweep active links across 0-36' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.powerSection}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onToggleJamming}
          style={styles.powerButtonWrap}
        >
          <Animated.View style={{ transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, isJamming ? 1.012 : 1.006] }) }] }}>
            <LinearGradient
              colors={isJamming ? ['#ff315d', '#c51f56', '#59144f'] : ['#ffffff', '#c9b5ff', '#7144c2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.powerButton}
            >
              <Text style={[styles.powerIcon, !isJamming && styles.powerIconStandby]}>{isJamming ? '⚡' : '◒'}</Text>
              <Text style={[styles.powerText, !isJamming && styles.powerTextStandby]}>{isJamming ? 'JAMMER ACTIVE' : 'SYSTEM STANDBY'}</Text>
              <Text style={[styles.powerSubtext, !isJamming && styles.powerSubtextStandby]}>
                {isJamming ? 'Tap to pause transmission' : 'Tap to activate jamming'}
              </Text>
            </LinearGradient>
          </Animated.View>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.pill, radio1OK ? styles.pillSuccess : styles.pillError]}>
          <Text style={styles.pillText}>Radio 1: {radio1OK ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
        <View style={[styles.pill, radio2OK ? styles.pillSuccess : styles.pillError]}>
          <Text style={styles.pillText}>Radio 2: {radio2OK ? 'ONLINE' : 'OFFLINE'}</Text>
        </View>
      </View>

      <View style={styles.metricsPanel}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Signal</Text>
          <Text style={styles.metricValue}>{signalQuality}%</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Loop rate</Text>
          <Text style={styles.metricValue}>{loopsPerSec}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Operating Mode</Text>
      {modes.map((m) => {
        const isSelected = currentMode === m.id;
        return (
          <TouchableOpacity
            key={m.id}
            style={[styles.modeCard, isSelected && styles.modeCardSelected]}
            onPress={() => onSelectMode(m.id)}
          >
            <View style={styles.radioDot}>{isSelected && <View style={styles.radioDotInner} />}</View>
            <View style={styles.modeTextContainer}>
              <Text style={[styles.modeTitle, isSelected && styles.modeTitleSelected]}>{m.title}</Text>
              <Text style={styles.modeSubtitle}>{m.subtitle}</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      <TouchableOpacity
        style={styles.emergencyButtonWrap}
        onPress={onEmergencyStop}
        activeOpacity={0.9}
      >
        <LinearGradient colors={['#7f1d1d', '#450a0a']} style={styles.emergencyButton}>
          <Text style={styles.emergencyText}>🚨 EMERGENCY HARDWARE STOP</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 18,
  },
  powerSection: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  powerButtonWrap: {
    width: '100%',
  },
  powerButton: {
    width: '100%',
    paddingVertical: 28,
      borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff315d',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 12,
        borderWidth: 1,
        borderColor: 'rgba(241,243,232,0.25)',
  },
  powerIcon: {
    fontSize: 40,
    marginBottom: 8,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 12,
  },
  powerIconStandby: {
    color: '#4c123f',
    textShadowColor: 'rgba(255,255,255,0.8)',
  },
  powerText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  powerTextStandby: {
    color: '#32134f',
  },
      powerSubtext: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 0.2,
  },
  powerSubtextStandby: {
    color: 'rgba(50, 19, 79, 0.78)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
        gap: 8,
  },
  pill: {
    flex: 0.48,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
        borderWidth: 1,
  },
  pillSuccess: {
    backgroundColor: 'rgba(151, 71, 255, 0.14)',
    borderColor: 'rgba(207, 160, 255, 0.7)',
  },
  pillError: {
    backgroundColor: 'rgba(255, 49, 93, 0.12)',
    borderColor: 'rgba(255, 101, 132, 0.7)',
  },
  pillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
      metricsPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  metricBox: {
    flex: 0.48,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e3dcef',
    shadowColor: '#9747ff',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  metricLabel: {
    color: '#a78bbd',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
      metricValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 18,
    marginBottom: 10,
  },
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.72)',
    padding: 14,
    borderRadius: 4,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e3dcef',
  },
  modeCardSelected: {
    borderColor: 'rgba(207, 160, 255, 0.9)',
    backgroundColor: 'rgba(151, 71, 255, 0.2)',
    shadowColor: '#9747ff',
    shadowOpacity: 0.14,
    shadowRadius: 12,
  },
  radioDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#bba9cf',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ff5577',
  },
  modeTextContainer: {
    flex: 1,
  },
  modeTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  modeTitleSelected: {
    color: '#ffb3c1',
  },
  modeSubtitle: {
    color: '#a78bbd',
    fontSize: 11,
    marginTop: 3,
    lineHeight: 16,
  },
  emergencyButtonWrap: {
    marginTop: 18,
    borderRadius: 4,
    overflow: 'hidden',
  },
  emergencyButton: {
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 101, 132, 0.85)',
  },
  emergencyText: {
    color: '#fff1f4',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 0.5,
  },
});
