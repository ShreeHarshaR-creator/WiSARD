import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const SpectrumVisualizer = ({ status }) => {
  const loopsPerSec = status?.loopsPerSec ?? 0;
  const currentAdvCh = status?.currentAdvCh ?? 2;
  const currentDataCh = status?.currentDataCh ?? 2;
  const dwellTimeUs = status?.dwellTimeUs ?? 300;

  // 40 BLE Channels (NRF channel numbers: 2, 4, 6, ..., 80)
  const allChannels = Array.from({ length: 40 }, (_, i) => (i + 1) * 2);
  const advChannels = [2, 26, 80];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>2.4 GHz BLE Spectrum Sweeper</Text>

      {/* Speed Metrics Gauge */}
      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{loopsPerSec}</Text>
          <Text style={styles.metricLabel}>Hopping Loops/s</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{dwellTimeUs} µs</Text>
          <Text style={styles.metricLabel}>Channel Dwell</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {loopsPerSec > 0 ? (1000 / (loopsPerSec / 40)).toFixed(1) : 0} ms
          </Text>
          <Text style={styles.metricLabel}>Full Spectrum Sweep</Text>
        </View>
      </View>

      {/* Active Channels Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>Active Adv (Radio 1)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#3b82f6' }]} />
          <Text style={styles.legendText}>Active Data (Radio 2)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#374151' }]} />
          <Text style={styles.legendText}>Channel Grid</Text>
        </View>
      </View>

      {/* 40 Channel Visual Grid */}
      <View style={styles.gridContainer}>
        {allChannels.map((ch) => {
          const isAdv = advChannels.includes(ch);
          const isAdvActive = currentAdvCh === ch;
          const isDataActive = currentDataCh === ch;

          let barColor = '#1f2937';
          if (isAdvActive) barColor = '#ef4444';
          else if (isDataActive) barColor = '#3b82f6';
          else if (isAdv) barColor = '#991b1b';

          return (
            <View key={ch} style={styles.barWrapper}>
              <View
                style={[
                  styles.channelBar,
                  { backgroundColor: barColor },
                  (isAdvActive || isDataActive) && styles.activeBarGlow,
                ]}
              />
              <Text style={styles.barLabel}>{ch}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.spectrumFooter}>
        Frequencies: 2402 MHz (Ch 2) ────────────────────────── 2480 MHz (Ch 80)
      </Text>
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
  title: {
    color: '#f9fafb',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    flex: 0.31,
    backgroundColor: '#1f2937',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  metricValue: {
    color: '#60a5fa',
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  legendText: {
    color: '#d1d5db',
    fontSize: 11,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 90,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
  },
  channelBar: {
    width: '100%',
    height: 50,
    borderRadius: 3,
  },
  activeBarGlow: {
    height: 65,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  barLabel: {
    color: '#6b7280',
    fontSize: 8,
    marginTop: 4,
  },
  spectrumFooter: {
    color: '#6b7280',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 8,
  },
});
