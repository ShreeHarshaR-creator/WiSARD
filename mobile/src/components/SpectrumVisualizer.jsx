import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';

const createMockSeries = (phase = 0) =>
  Array.from({ length: 28 }, (_, index) => {
    const wave = Math.sin(index / 1.65 + phase) * 25;
    const harmonic = Math.cos(index / 3.8 + phase * 0.7) * 17;
    const spike = index === 8 || index === 20 ? 28 : 0;
    return Math.max(12, Math.min(98, 48 + wave + harmonic + spike));
  });

export const SpectrumVisualizer = ({ status, series = [], isConnected = false }) => {
  const loopsPerSec = status?.loopsPerSec ?? 0;
  const currentAdvCh = status?.currentAdvCh ?? 2;
  const currentDataCh = status?.currentDataCh ?? 2;
  const dwellTimeUs = status?.dwellTimeUs ?? 300;
  const signalQuality = status?.signalQuality ?? 80;

  const allChannels = Array.from({ length: 40 }, (_, i) => (i + 1) * 2);
  const advChannels = [2, 26, 80];
  const sweepMs = loopsPerSec > 0 ? (1000 / (loopsPerSec / 40)).toFixed(1) : 0;

  const [animatedSeries, setAnimatedSeries] = useState(() => series.length ? series : createMockSeries());
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isConnected && series.length) {
      setAnimatedSeries(series);
    }
  }, [isConnected, series]);

  useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      phase += 0.32;
      if (!isConnected) setAnimatedSeries(createMockSeries(phase));
    }, 520);

    return () => clearInterval(interval);
  }, [isConnected]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(scan, { toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true })
    );
    animation.start();
    return () => animation.stop();
  }, [scan]);

  const chartData = animatedSeries.length ? animatedSeries : createMockSeries();
  const heatmapData = chartData.slice(0, 24);

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.kicker}>RF / TELEMETRY 04</Text>
          <Text style={styles.title}>2.4 GHz BLE Spectrum</Text>
        </View>
        <View style={[styles.liveTag, isConnected ? styles.liveTagOn : styles.liveTagMock]}>
          <View style={styles.liveDot} />
          <Text style={styles.liveTagText}>{isConnected ? 'LIVE DEVICE' : 'MOCK STREAM'}</Text>
        </View>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{loopsPerSec}</Text>
          <Text style={styles.metricLabel}>Loops/s</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{dwellTimeUs} µs</Text>
          <Text style={styles.metricLabel}>Dwell</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{sweepMs} ms</Text>
          <Text style={styles.metricLabel}>Sweep</Text>
        </View>
      </View>

      <View style={styles.signalPanel}>
        <Text style={styles.signalLabel}>Live signal confidence</Text>
        <Text style={styles.signalValue}>{signalQuality}%</Text>
      </View>

      <View style={styles.wavePanel}>
        <View style={styles.panelHeadingRow}>
          <View>
            <Text style={styles.panelKicker}>SIGNAL INTELLIGENCE</Text>
            <Text style={styles.panelHeading}>Live frequency trace</Text>
          </View>
          <Text style={styles.panelMeta}>{isConnected ? 'ESP32 / RF24' : 'SIMULATED / LOCAL'}</Text>
        </View>
        <View style={styles.waveGrid}>
          {[0, 1, 2, 3].map((line) => <View key={line} style={[styles.waveGridLine, { top: `${line * 33}%` }]} />)}
          <Animated.View style={[styles.scanLine, { transform: [{ translateX: scan.interpolate({ inputRange: [0, 1], outputRange: [-12, 420] }) }] }]} />
          <View style={styles.waveBars}>
            {chartData.map((value, index) => (
              <View key={`wave-${index}`} style={styles.waveBarWrap}>
                <View style={[styles.waveBar, { height: `${Math.max(8, value)}%`, opacity: 0.38 + value / 180 }]} />
              </View>
            ))}
          </View>
        </View>
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>2402</Text><Text style={styles.axisLabel}>2426</Text><Text style={styles.axisLabel}>2450</Text><Text style={styles.axisLabel}>2480 MHz</Text>
        </View>
      </View>

      <View style={styles.channelPanel}>
        <View style={styles.panelHeadingRow}>
          <View>
            <Text style={styles.panelKicker}>CHANNEL OCCUPANCY</Text>
            <Text style={styles.panelHeading}>Threat field / 40 channels</Text>
          </View>
          <Text style={styles.panelMeta}>UPDATED 0.5s</Text>
        </View>
        <View style={styles.heatmap}>
          {heatmapData.map((value, index) => {
            const channel = (index + 1) * 2;
            const isActive = channel === currentAdvCh || channel === currentDataCh;
            return <View key={`heat-${channel}`} style={[styles.heatCell, { opacity: 0.35 + value / 150 }, isActive && styles.heatCellActive]} />;
          })}
        </View>
        <View style={styles.channelLegend}><Text style={styles.legendCaption}>LOW ACTIVITY</Text><View style={styles.legendRamp} /><Text style={styles.legendCaption}>INTERFERENCE</Text></View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f87171' }]} />
          <Text style={styles.legendText}>Adv</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#60a5fa' }]} />
          <Text style={styles.legendText}>Data</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#334155' }]} />
          <Text style={styles.legendText}>Idle</Text>
        </View>
      </View>

      <View style={styles.gridContainer}>
        {chartData.map((value, index) => {
          const effectiveIndex = index + 1;
          const channel = effectiveIndex * 2;
          const isAdv = advChannels.includes(channel);
          const isAdvActive = currentAdvCh === channel;
          const isDataActive = currentDataCh === channel;
          const heightPercent = isAdvActive || isDataActive ? 100 : isAdv ? 52 : Math.max(20, value / 1.6);
          let barColor = '#1e293b';
          if (isAdvActive) barColor = '#f87171';
          else if (isDataActive) barColor = '#60a5fa';
          else if (isAdv) barColor = '#7f1d1d';

          return (
            <View key={`${channel}-${index}`} style={styles.barWrapper}>
              <View
                style={[
                  styles.channelBar,
                  { backgroundColor: barColor, height: `${heightPercent}%` },
                  (isAdvActive || isDataActive) && styles.activeBarGlow,
                ]}
              />
              <Text style={styles.barLabel}>{channel}</Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.spectrumFooter}>Frequencies: 2402 MHz (Ch 2) ────────────── 2480 MHz (Ch 80)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
      backgroundColor: 'rgba(255, 255, 255, 0.62)',
    padding: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e3dcef',
    marginVertical: 12,
    shadowColor: '#58e2ff',
    shadowOpacity: 0.12,
    shadowRadius: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kicker: {
      color: '#d8a7ff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 5,
  },
  title: {
    color: '#17121f',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderRadius: 3,
  },
  liveTagOn: {
    backgroundColor: 'rgba(201, 242, 109, 0.1)',
    borderColor: 'rgba(201, 242, 109, 0.45)',
  },
  liveTagMock: {
    backgroundColor: 'rgba(88, 226, 255, 0.08)',
      borderColor: 'rgba(207, 160, 255, 0.45)',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
      backgroundColor: '#ff5577',
    marginRight: 6,
  },
  liveTagText: {
    color: '#edfaff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  metricCard: {
    flex: 0.31,
    backgroundColor: 'rgba(246, 242, 255, 0.72)',
    padding: 10,
    borderRadius: 3,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(88, 226, 255, 0.2)',
  },
  metricValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  metricLabel: {
    color: '#7f9aa3',
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  signalPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(246, 242, 255, 0.72)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 3,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(88, 226, 255, 0.16)',
  },
  signalLabel: {
    color: '#c4d7dc',
    fontSize: 11,
    fontWeight: '600',
  },
  signalValue: {
    color: '#ff8aa1',
    fontSize: 14,
    fontWeight: '700',
  },
  wavePanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(88, 226, 255, 0.22)',
    padding: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  panelHeadingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  panelKicker: {
    color: '#728b93',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  panelHeading: {
    color: '#edfaff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 3,
  },
  panelMeta: {
    color: '#58e2ff',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  waveGrid: {
    height: 126,
    position: 'relative',
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(88, 226, 255, 0.16)',
  },
  waveGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(88, 226, 255, 0.1)',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
      backgroundColor: '#c084fc',
    opacity: 0.75,
    zIndex: 2,
  },
  waveBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 5,
    paddingTop: 8,
  },
  waveBarWrap: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 1,
  },
  waveBar: {
      backgroundColor: '#ff5577',
    minHeight: 5,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
  },
  axisLabel: {
    color: '#60727a',
    fontSize: 8,
  },
  channelPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(201, 242, 109, 0.18)',
    padding: 12,
    marginBottom: 12,
  },
  heatmap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 2,
  },
  heatCell: {
    width: '7.8%',
    height: 22,
      backgroundColor: '#663399',
    borderRadius: 2,
  },
  heatCellActive: {
    backgroundColor: '#ff5577',
    shadowColor: '#ff315d',
    shadowOpacity: 0.8,
    shadowRadius: 7,
  },
  channelLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 9,
  },
  legendCaption: {
    color: '#60727a',
    fontSize: 7,
    letterSpacing: 0.4,
  },
  legendRamp: {
    flex: 1,
    height: 4,
    marginHorizontal: 8,
    backgroundColor: '#2c7090',
    borderRadius: 2,
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
    color: '#dce8ff',
    fontSize: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  channelBar: {
    width: '100%',
    minHeight: 20,
    borderRadius: 4,
  },
  activeBarGlow: {
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.35,
    shadowRadius: 4,
  },
  barLabel: {
    color: '#8ea5c4',
    fontSize: 7,
    marginTop: 4,
  },
  spectrumFooter: {
    color: '#9fb0c7',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 8,
  },
});
