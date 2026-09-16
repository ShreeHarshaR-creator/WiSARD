import React, { useMemo, useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { registerRootComponent } from 'expo';
import { LinearGradient } from 'expo-linear-gradient';
import {
  getSystemStatus,
  sendControlCommand,
  updateSettings,
} from './src/services/jammerApi';
import { ControlDashboard } from './src/components/ControlDashboard';
import { SpectrumVisualizer } from './src/components/SpectrumVisualizer';
import { SettingsPanel } from './src/components/SettingsPanel';
import { SignalArtifact } from './src/components/SignalArtifact';

const DEFAULT_DEMO_STATUS = {
  isJamming: true,
  jammerMode: 0,
  dwellTimeUs: 300,
  paLevel: 3,
  loopsPerSec: 5320,
  currentAdvCh: 26,
  currentDataCh: 14,
  radio1OK: true,
  radio2OK: true,
  signalQuality: 88,
  systemHealth: 92,
  riskLevel: 'LOW',
};

const normalizeStatus = (incoming = {}) => {
  const safe = { ...DEFAULT_DEMO_STATUS, ...incoming };

  return {
    ...safe,
    jammerMode: Number(safe.jammerMode ?? 0),
    dwellTimeUs: Number(safe.dwellTimeUs ?? 300),
    paLevel: Number(safe.paLevel ?? 3),
    loopsPerSec: Number(safe.loopsPerSec ?? 0),
    currentAdvCh: Number(safe.currentAdvCh ?? 2),
    currentDataCh: Number(safe.currentDataCh ?? 2),
    signalQuality: Math.min(100, Math.max(0, Number(safe.signalQuality ?? 80))),
    systemHealth: Math.min(100, Math.max(0, Number(safe.systemHealth ?? 90))),
    radio1OK: Boolean(safe.radio1OK),
    radio2OK: Boolean(safe.radio2OK),
    isJamming: Boolean(safe.isJamming),
  };
};

const buildSignalSeries = () =>
  Array.from({ length: 18 }, (_, index) => {
    const wave = Math.sin(index / 1.5) * 26;
    const pulse = Math.cos(index / 2.1) * 18;
    const drift = index * 1.7;
    return Math.max(18, Math.min(96, 68 + wave + pulse + drift * 0.3));
  });

export default function App() {
  const [status, setStatus] = useState(DEFAULT_DEMO_STATUS);
  const [activeTab, setActiveTab] = useState('overview');
  const [isConnected, setIsConnected] = useState(false);
  const [isLanding, setIsLanding] = useState(true);
  const [signalSeries, setSignalSeries] = useState(() => buildSignalSeries());
  const pulse = React.useRef(new Animated.Value(0)).current;
  const magmaShift = React.useRef(new Animated.Value(0)).current;
  const dragonFlight = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(magmaShift, { toValue: 1, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(magmaShift, { toValue: 0, duration: 9000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [magmaShift]);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(dragonFlight, { toValue: 1, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(dragonFlight, { toValue: 0, duration: 12000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [dragonFlight]);

  const refreshHardwareState = async () => {
    const data = await getSystemStatus();

    if (data && typeof data === 'object') {
      setStatus(normalizeStatus(data));
      setIsConnected(true);
      return true;
    }

    setIsConnected(false);
    return false;
  };

  useEffect(() => {
    let isMounted = true;

    const poll = async () => {
      const ok = await refreshHardwareState();
      if (!isMounted) return;
      if (!ok) {
        setStatus((prev) => ({ ...normalizeStatus(prev) }));
      }
    };

    poll();
    const interval = setInterval(poll, 1200);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const animate = setInterval(() => {
      setSignalSeries((prev) =>
        prev.map((value, index) => {
          const progress = Math.sin((Date.now() / 550 + index) / 2.2) * 12;
          return Math.max(25, Math.min(98, value + progress * 0.25));
        })
      );
    }, 1200);

    return () => clearInterval(animate);
  }, []);

  const overview = useMemo(() => {
    const modeNames = ['Full Sweep', 'Adv Block', 'Data Sweep'];
    const healthTone = status.systemHealth >= 80 ? 'Healthy' : status.systemHealth >= 50 ? 'Watch' : 'Critical';

    return [
      { label: 'RF Health', value: `${status.systemHealth}%`, sub: healthTone },
      { label: 'Mode', value: modeNames[status.jammerMode] ?? modeNames[0], sub: status.isJamming ? 'Active lock' : 'Standby' },
      { label: 'Signal Quality', value: `${status.signalQuality}%`, sub: status.riskLevel || 'LOW' },
      { label: 'Coverage', value: '128 Sites', sub: '14 regions' },
    ];
  }, [status]);

  const incidentFeed = [
    { id: 1, tag: 'Threat', label: 'Channel drift detected', time: '2 min ago', level: 'HIGH' },
    { id: 2, tag: 'Node', label: 'Frankfurt relay healthy', time: '4 min ago', level: 'NORMAL' },
    { id: 3, tag: 'Ops', label: 'Operator team synced', time: '8 min ago', level: 'LOW' },
  ];

  const operators = [
    { name: 'Shree Harsha R', role: 'Threat Analyst', status: 'Online' },
    { name: 'Arka Sengupta', role: 'Field Ops', status: 'Monitoring' },
    { name: 'Ajay', role: 'Network Guard', status: 'Online' },
  ];

  const handleToggleJamming = async () => {
    if (isConnected) {
      const res = await sendControlCommand('toggle');
      if (res) setStatus(normalizeStatus(res));
      return;
    }

    setStatus((prev) => ({
      ...normalizeStatus(prev),
      isJamming: !prev.isJamming,
      signalQuality: prev.isJamming ? 68 : 92,
      systemHealth: prev.isJamming ? 84 : 95,
    }));
  };

  const handleSelectMode = async (modeId) => {
    if (isConnected) {
      const res = await sendControlCommand('start', modeId);
      if (res) setStatus(normalizeStatus(res));
      return;
    }

    setStatus((prev) => ({
      ...normalizeStatus(prev),
      jammerMode: modeId,
      riskLevel: modeId === 1 ? 'MEDIUM' : 'LOW',
    }));
  };

  const handleEmergencyStop = async () => {
    if (isConnected) {
      const res = await sendControlCommand('stop');
      if (res) setStatus(normalizeStatus(res));
      return;
    }

    setStatus((prev) => ({
      ...normalizeStatus(prev),
      isJamming: false,
      systemHealth: 78,
      riskLevel: 'SAFE',
    }));
  };

  const handleUpdateSettings = async (dwell, pa) => {
    if (isConnected) {
      const res = await updateSettings(dwell, pa);
      if (res) setStatus(normalizeStatus(res));
      return;
    }

    setStatus((prev) => ({
      ...normalizeStatus(prev),
      dwellTimeUs: dwell,
      paLevel: pa,
      signalQuality: Math.min(100, prev.signalQuality + 2),
    }));
  };

  const navItems = [
    { id: 'overview', label: 'Command view', index: '01' },
    { id: 'operations', label: 'Operations', index: '02' },
    { id: 'spectrum', label: 'Spectrum', index: '03' },
    { id: 'settings', label: 'Configuration', index: '04' },
  ];

  const renderPublicSite = () => (
    <View style={styles.publicPage}>
      <View style={styles.publicNav}>
        <View style={styles.publicBrand}>
          <View style={styles.publicBrandMark}><Text style={styles.publicBrandMarkText}>A</Text></View>
          <Text style={styles.publicBrandName}>ANTIJAMMER</Text>
        </View>
        <View style={styles.publicNavLinks}>
          <Text style={styles.publicNavLink}>Platform</Text>
          <Text style={styles.publicNavLink}>Telemetry</Text>
          <Text style={styles.publicNavLink}>Edge security</Text>
          <TouchableOpacity style={styles.publicNavButton} onPress={() => setIsLanding(false)}>
            <Text style={styles.publicNavButtonText}>Open console</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.publicScroll} contentContainerStyle={styles.publicContent}>
        <View style={styles.publicHero}>
          <View style={styles.publicHeroCopy}>
            <Text style={styles.publicEyebrow}>THE SIGNAL SECURITY PLATFORM</Text>
            <Text style={styles.publicTitle}>Make interference impossible to ignore.</Text>
            <Text style={styles.publicLead}>AntiJammer turns invisible RF disruption into a clear operating picture, so teams can detect, decide, and protect from one calm command surface.</Text>
            <View style={styles.publicActionRow}>
              <TouchableOpacity style={styles.publicPrimaryButton} onPress={() => setIsLanding(false)}>
                <Text style={styles.publicPrimaryButtonText}>Enter live console</Text>
                <Text style={styles.publicPrimaryArrow}>-&gt;</Text>
              </TouchableOpacity>
              <Text style={styles.publicActionMeta}>Works offline in simulation mode</Text>
            </View>
          </View>

          <View style={styles.publicSignalCard}>
            <View style={styles.publicSignalTopline}>
              <Text style={styles.publicSignalLabel}>LIVE RF SURFACE</Text>
              <View style={styles.publicSignalStatus}><View style={styles.publicSignalDot} /><Text style={styles.publicSignalStatusText}>{isConnected ? 'CONNECTED' : 'SIMULATED'}</Text></View>
            </View>
            <View style={styles.publicSignalBars}>
              {signalSeries.slice(0, 18).map((value, index) => <View key={`public-${index}`} style={[styles.publicSignalBar, { height: `${Math.max(12, value)}%`, backgroundColor: index === 8 || index === 13 ? '#ff5577' : '#7c3aed' }]} />)}
            </View>
            <View style={styles.publicSignalFooter}><Text style={styles.publicSignalBig}>{status.signalQuality}%</Text><Text style={styles.publicSignalSmall}>signal confidence / 2.4 GHz</Text></View>
          </View>
        </View>

        <View style={styles.publicProofRow}>
          <Text style={styles.publicProofNumber}>40</Text><Text style={styles.publicProofLabel}>BLE channels watched in one continuous sweep</Text>
          <Text style={styles.publicProofNumber}>1.2s</Text><Text style={styles.publicProofLabel}>status refresh loop for the edge console</Text>
          <Text style={styles.publicProofNumber}>24/7</Text><Text style={styles.publicProofLabel}>clarity for field and network teams</Text>
        </View>

        <View style={styles.publicFeatureGrid}>
          <View style={[styles.publicFeatureCard, styles.publicFeatureWide]}><Text style={styles.publicCardKicker}>01 / OBSERVE</Text><Text style={styles.publicCardTitle}>See the signal, not just the alert.</Text><Text style={styles.publicCardBody}>A living spectrum view exposes channel drift, active interference, and device health in the same frame.</Text><View style={styles.publicMiniWave}>{signalSeries.slice(0, 16).map((value, index) => <View key={`mini-${index}`} style={[styles.publicMiniBar, { height: `${Math.max(14, value / 1.4)}%` }]} />)}</View></View>
          <View style={styles.publicFeatureCard}><Text style={styles.publicCardKicker}>02 / DECIDE</Text><Text style={styles.publicCardTitle}>Move from noise to action.</Text><Text style={styles.publicCardBody}>Choose a sweep mode, tune the edge node, or stop transmission with deliberate controls.</Text><View style={styles.publicCardStamp}>EDGE<br />CONTROL</View></View>
          <View style={styles.publicFeatureCard}><Text style={styles.publicCardKicker}>03 / PROTECT</Text><Text style={styles.publicCardTitle}>A system teams can trust.</Text><Text style={styles.publicCardBody}>Designed for operators who need resilient local control even when the wider network is unavailable.</Text><View style={styles.publicTrustLine}><View style={styles.publicTrustDot} /><Text style={styles.publicTrustText}>HARDWARE-READY / LOCAL-FIRST</Text></View></View>
        </View>
      </ScrollView>
    </View>
  );

  const renderActiveScreen = () => {
    if (activeTab === 'operations') {
      return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <ControlDashboard
            status={status}
            onToggleJamming={handleToggleJamming}
            onSelectMode={handleSelectMode}
            onEmergencyStop={handleEmergencyStop}
          />
        </ScrollView>
      );
    }

    if (activeTab === 'spectrum') {
      return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <SpectrumVisualizer status={status} series={signalSeries} isConnected={isConnected} />
        </ScrollView>
      );
    }

    if (activeTab === 'settings') {
      return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          <SettingsPanel status={status} onUpdateSettings={handleUpdateSettings} />
        </ScrollView>
      );
    }

    return (
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.eyebrow}>Global operating status</Text>
            <Text style={styles.heroTitle}>Network defense platform is fully operational.</Text>
          </View>
          <TouchableOpacity style={styles.primaryAction} onPress={handleToggleJamming}>
            <Text style={styles.primaryActionText}>{status.isJamming ? 'Pause network lock' : 'Activate defense'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryGrid}>
          {overview.map((item) => (
            <View key={item.label} style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summarySub}>{item.sub}</Text>
            </View>
          ))}
        </View>

        <View style={styles.mainGrid}>
          <View style={styles.largePanel}>
            <Text style={styles.panelTitle}>Live RF activity</Text>
            <SpectrumVisualizer status={status} series={signalSeries} isConnected={isConnected} />
          </View>

          <View style={styles.sideStack}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Active incidents</Text>
              {incidentFeed.map((item) => (
                <View key={item.id} style={styles.feedItem}>
                  <View style={styles.feedDot} />
                  <View style={styles.feedTextWrap}>
                    <Text style={styles.feedTag}>{item.tag}</Text>
                    <Text style={styles.feedLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.feedMetaBlock}>
                    <Text style={styles.feedTime}>{item.time}</Text>
                    <Text style={[styles.feedLevel, item.level === 'HIGH' ? styles.highLevel : item.level === 'NORMAL' ? styles.normalLevel : styles.lowLevel]}>{item.level}</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Operator status</Text>
              {operators.map((person) => (
                <View key={person.name} style={styles.operatorRow}>
                        <View style={styles.avatar}><Text style={styles.avatarText}>{person.name[0]}</Text></View>
                  <View style={styles.operatorMeta}>
                    <Text style={styles.operatorName}>{person.name}</Text>
                    <Text style={styles.operatorRole}>{person.role}</Text>
                  </View>
                  <Text style={styles.operatorStatus}>{person.status}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  if (isLanding) {
    return renderPublicSite();
  }

  return (
    <LinearGradient colors={['#faf9ff', '#f5f0ff', '#fff7fb']} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#faf9ff" />

        <View pointerEvents="none" style={styles.atmosphere}>
          <Animated.View style={[styles.innerAurora, { transform: [{ translateX: magmaShift.interpolate({ inputRange: [0, 1], outputRange: [-120, 140] }) }, { translateY: magmaShift.interpolate({ inputRange: [0, 1], outputRange: [30, -20] }) }] }]} />
          <View style={styles.innerGrid} />
        </View>

        <View style={styles.shell}>
          <View style={styles.sidebar}>
            <View style={styles.brandWrap}>
              <Animated.View style={[styles.brandMark, { transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>
                <Text style={styles.wolfSymbol}>🐺</Text>
                <View style={styles.magmaRim} />
              </Animated.View>
              <View>
                <Text style={styles.brandName}>ANTIJAMMER</Text>
                <Text style={styles.brandSub}>NIGHT WOLF / 2.4 GHZ</Text>
              </View>
            </View>

            <View style={styles.sidebarRule} />
            <Text style={styles.sidebarKicker}>Wolfpack control surface</Text>

            <View style={styles.navList}>
              {navItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.navButton, activeTab === item.id && styles.navButtonActive]}
                  onPress={() => setActiveTab(item.id)}
                >
                  <Text style={[styles.navIndex, activeTab === item.id && styles.navIndexActive]}>{item.index}</Text>
                  <Text style={[styles.navLabel, activeTab === item.id && styles.navLabelActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.deployCard}>
              <View style={styles.deployTopline}>
                <Text style={styles.deployTitle}>System integrity</Text>
                <Animated.View style={[styles.deploySignal, { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] }) }]} />
              </View>
              <Text style={styles.deployValue}>NOMINAL</Text>
              <Text style={styles.deploySub}>Night Wolf edge node ready</Text>
            </View>

            <Text style={styles.sidebarFooter}>BUILD 1.0.0  /  LOCAL EDGE</Text>
          </View>

          <View style={styles.mainPanel}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.breadcrumb}>ANTIJAMMER <Text style={styles.breadcrumbSlash}>/</Text> {navItems.find((item) => item.id === activeTab)?.label.toUpperCase()}</Text>
                <Text style={styles.topTitle}>{activeTab === 'overview' ? 'A clear signal in a noisy world.' : navItems.find((item) => item.id === activeTab)?.label}</Text>
              </View>

              <View style={styles.topBarRight}>
                <SignalArtifact size={48} />
                <View style={[styles.connBadge, isConnected ? styles.connSuccess : styles.connOffline]}>
                  <View style={[styles.connDot, { backgroundColor: isConnected ? '#ec4899' : '#7c3aed' }]} />
                  <Text style={styles.connText}>{isConnected ? 'EDGE LINK LIVE' : 'SIMULATION MODE'}</Text>
                </View>
              </View>
            </View>

            {!isConnected && (
              <View style={styles.connectionGuide}>
                <Text style={styles.connectionGuideTitle}>Connect to the hardware access point</Text>
                <Text style={styles.connectionGuideBody}>SSID: AntiJammer-Control</Text>
                <Text style={styles.connectionGuideBody}>Password: 12345678</Text>
                <Text style={styles.connectionGuideBody}>Target: http://192.168.4.1</Text>
                <TouchableOpacity style={styles.refreshButton} onPress={refreshHardwareState}>
                  <Text style={styles.refreshButtonText}>Refresh hardware connection</Text>
                </TouchableOpacity>
              </View>
            )}

            {renderActiveScreen()}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

registerRootComponent(App);

const styles = StyleSheet.create({
  publicPage: {
    flex: 1,
    backgroundColor: '#f7f5ff',
  },
  publicNav: {
    height: 74,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
    borderBottomWidth: 1,
    borderBottomColor: '#e9e3f5',
  },
  publicBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  publicBrandMark: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  publicBrandMarkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  publicBrandName: {
    color: '#16111f',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  publicNavLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  publicNavLink: {
    color: '#625c70',
    fontSize: 12,
    fontWeight: '700',
  },
  publicNavButton: {
    backgroundColor: '#5b21b6',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
  },
  publicNavButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  publicScroll: {
    flex: 1,
  },
  publicContent: {
    paddingHorizontal: 32,
    paddingTop: 56,
    paddingBottom: 80,
  },
  publicHero: {
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 44,
    paddingBottom: 72,
  },
  publicHeroCopy: {
    flex: 1,
    maxWidth: 610,
  },
  publicEyebrow: {
    color: '#7c3aed',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.8,
    marginBottom: 18,
  },
  publicTitle: {
    color: '#17121f',
    fontSize: 54,
    lineHeight: 58,
    fontWeight: '900',
    letterSpacing: -1.5,
  },
  publicLead: {
    color: '#625c70',
    fontSize: 17,
    lineHeight: 27,
    marginTop: 22,
    maxWidth: 560,
  },
  publicActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 28,
  },
  publicPrimaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#5b21b6',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 4,
    shadowColor: '#7c3aed',
    shadowOpacity: 0.28,
    shadowRadius: 14,
  },
  publicPrimaryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  publicPrimaryArrow: {
    color: '#f0abfc',
    fontSize: 17,
    fontWeight: '800',
  },
  publicActionMeta: {
    color: '#8d849a',
    fontSize: 11,
  },
  publicSignalCard: {
    width: 390,
    height: 330,
    padding: 22,
    backgroundColor: '#16121f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#302040',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.2,
    shadowRadius: 30,
  },
  publicSignalTopline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  publicSignalLabel: {
    color: '#c4b5fd',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  publicSignalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  publicSignalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fb7185',
  },
  publicSignalStatusText: {
    color: '#fb7185',
    fontSize: 8,
    fontWeight: '800',
  },
  publicSignalBars: {
    height: 190,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    marginTop: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#49395a',
  },
  publicSignalBar: {
    flex: 1,
    minHeight: 12,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  publicSignalFooter: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 9,
    marginTop: 14,
  },
  publicSignalBig: {
    color: '#ffffff',
    fontSize: 23,
    fontWeight: '900',
  },
  publicSignalSmall: {
    color: '#9d91ab',
    fontSize: 10,
  },
  publicProofRow: {
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e3dcef',
  },
  publicProofNumber: {
    color: '#5b21b6',
    fontSize: 24,
    fontWeight: '900',
    marginLeft: 12,
  },
  publicProofLabel: {
    color: '#736b80',
    fontSize: 10,
    maxWidth: 170,
  },
  publicFeatureGrid: {
    maxWidth: 1180,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
  },
  publicFeatureCard: {
    flex: 1,
    minHeight: 310,
    padding: 22,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e3dcef',
    borderRadius: 6,
  },
  publicFeatureWide: {
    flex: 1.35,
    backgroundColor: '#f2edff',
  },
  publicCardKicker: {
    color: '#7c3aed',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  publicCardTitle: {
    color: '#17121f',
    fontSize: 23,
    lineHeight: 26,
    fontWeight: '900',
    marginTop: 16,
  },
  publicCardBody: {
    color: '#736b80',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 13,
  },
  publicMiniWave: {
    height: 82,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginTop: 28,
  },
  publicMiniBar: {
    flex: 1,
    minHeight: 8,
    backgroundColor: '#8b5cf6',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  publicCardStamp: {
    alignSelf: 'flex-start',
    color: '#ec4899',
    borderWidth: 1,
    borderColor: '#f0abfc',
    padding: 10,
    marginTop: 26,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
  publicTrustLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  publicTrustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ec4899',
  },
  publicTrustText: {
    color: '#5b21b6',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#faf9ff',
  },
  atmosphere: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  innerAurora: {
    position: 'absolute',
    width: 640,
    height: 340,
    borderRadius: 320,
    right: -160,
    top: 80,
    backgroundColor: 'rgba(196, 181, 253, 0.22)',
    shadowColor: '#ec4899',
    shadowOpacity: 0.2,
    shadowRadius: 90,
  },
  innerGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.08)',
  },
  magmaGlow: {
    position: 'absolute',
    width: 560,
    height: 330,
    borderRadius: 280,
    right: -140,
    top: 70,
    backgroundColor: 'rgba(123, 32, 92, 0.22)',
    shadowColor: '#ff315d',
    shadowOpacity: 0.55,
    shadowRadius: 90,
  },
  magmaGlowSecondary: {
    position: 'absolute',
    width: 430,
    height: 250,
    borderRadius: 220,
    left: -180,
    bottom: 20,
    backgroundColor: 'rgba(84, 36, 150, 0.2)',
    shadowColor: '#9747ff',
    shadowOpacity: 0.5,
    shadowRadius: 80,
  },
  ember: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#ff5577',
    shadowColor: '#ff315d',
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  dragonFlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 180,
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  dragonSymbol: {
    fontSize: 104,
    textShadowColor: '#ff315d',
    textShadowRadius: 22,
  },
  dragonTrail: {
    position: 'absolute',
    width: 110,
    height: 22,
    borderRadius: 50,
    right: 44,
    backgroundColor: 'rgba(255, 49, 93, 0.18)',
    shadowColor: '#9747ff',
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  cyberAnimal: {
    position: 'absolute',
    zIndex: 0,
  },
  cyberAnimalSymbol: {
    textShadowColor: '#9747ff',
    textShadowRadius: 28,
  },
  gridLines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
    borderWidth: 1,
    borderColor: 'rgba(219, 230, 205, 0.04)',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      minHeight: '100vh',
    }),
  },
  shell: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    ...(Platform.OS === 'web' && {
      cursor: 'url("data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2224%22 height=%2224%22 viewBox=%220 0 24 24%22%3E%3Cpath d=%22M4 3l5 14 3-5 5 4 2-2-5-4 5-3z%22 fill=%22%23ff5577%22 stroke=%22%23ffffff%22 stroke-width=%221.3%22 stroke-linejoin=%22round%22/%3E%3C/svg%3E") 4 3, auto',
    }),
  },
  sidebar: {
    width: 276,
    padding: 24,
    borderRightWidth: 1,
    borderRightColor: '#e3dcef',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4b123e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ff5577',
    shadowColor: '#ff315d',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  wolfSymbol: {
    fontSize: 21,
    lineHeight: 27,
  },
  magmaRim: {
    position: 'absolute',
    width: 58,
    height: 12,
    borderRadius: 30,
    bottom: -6,
    backgroundColor: 'rgba(255, 49, 93, 0.7)',
  },
  brandMarkText: {
    color: '#6b21a8',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandName: {
    color: '#17121f',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  brandSub: {
    color: '#8d779e',
    fontSize: 8,
    marginTop: 2,
    letterSpacing: 0.8,
  },
  sidebarRule: {
    height: 1,
    backgroundColor: '#e3dcef',
    marginBottom: 18,
  },
  sidebarKicker: {
    color: '#8d779e',
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  navList: {
    marginTop: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  navButtonActive: {
    backgroundColor: '#f0e8ff',
    borderColor: '#c4a4f5',
  },
  navIndex: {
    color: '#9b8aa8',
    width: 32,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  navIndexActive: {
    color: '#ff5577',
  },
  navLabel: {
    color: '#625c70',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  navLabelActive: {
    color: '#5b21b6',
  },
  deployCard: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: '#e3dcef',
    borderRadius: 4,
    padding: 14,
  },
  deployTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deployTitle: {
    color: '#8d779e',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  deploySignal: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#ff5577',
  },
  deployValue: {
    color: '#ff5577',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 6,
    letterSpacing: 1.2,
  },
  deploySub: {
    color: '#8d779e',
    fontSize: 11,
    marginTop: 4,
  },
  sidebarFooter: {
    color: '#566257',
    fontSize: 8,
    letterSpacing: 1,
    marginTop: 'auto',
  },
  mainPanel: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e3dcef',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  breadcrumb: {
    color: '#8d779e',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 7,
  },
  breadcrumbSlash: {
    color: '#ff5577',
  },
  topTitle: {
    color: '#17121f',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  connectionGuide: {
    marginHorizontal: 30,
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.66)',
    borderWidth: 1,
    borderColor: '#e3dcef',
    borderRadius: 4,
    padding: 14,
  },
  connectionGuideTitle: {
    color: '#17121f',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  connectionGuideBody: {
    color: '#736b80',
    fontSize: 12,
    marginTop: 2,
  },
  refreshButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  refreshButtonText: {
    color: '#11170f',
    fontWeight: '700',
    fontSize: 11,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(207, 160, 255, 0.3)',
    borderRadius: 3,
  },
  connSuccess: {
    backgroundColor: 'rgba(151, 71, 255, 0.16)',
  },
  connOffline: {
    backgroundColor: 'rgba(244, 201, 93, 0.1)',
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 8,
  },
  connText: {
    color: '#5b21b6',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContent: {
    padding: 30,
    paddingBottom: 36,
  },
  heroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderWidth: 1,
    borderColor: '#e3dcef',
    borderRadius: 4,
    padding: 20,
    marginBottom: 18,
  },
  eyebrow: {
    color: '#a78bbd',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: '#17121f',
    fontSize: 31,
    fontWeight: '900',
    marginTop: 8,
    maxWidth: 520,
  },
  primaryAction: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 3,
    shadowColor: '#ff5577',
    shadowRadius: 14,
    shadowOpacity: 0.35,
  },
  primaryActionText: {
    color: '#4c123f',
    fontWeight: '900',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  summaryCard: {
    width: '23%',
    minWidth: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.62)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e3dcef',
    padding: 14,
    marginBottom: 10,
  },
  summaryLabel: {
    color: '#a78bbd',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  summaryValue: {
    color: '#17121f',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 8,
  },
  summarySub: {
    color: '#ff5577',
    fontSize: 10,
    marginTop: 4,
    fontWeight: '700',
  },
  mainGrid: {
    flexDirection: 'row',
    gap: 18,
  },
  largePanel: {
    flex: 1.8,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e3dcef',
    padding: 18,
  },
  panel: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e3dcef',
    padding: 18,
    marginBottom: 16,
  },
  sideStack: {
    flex: 1,
  },
  panelTitle: {
    color: '#17121f',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  feedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee9f5',
  },
  feedDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#ff5577',
    marginRight: 10,
  },
  feedTextWrap: {
    flex: 1,
  },
  feedTag: {
    color: '#ff8aa1',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  feedLabel: {
    color: '#33243f',
    fontSize: 12,
    marginTop: 2,
  },
  feedMetaBlock: {
    alignItems: 'flex-end',
  },
  feedTime: {
    color: '#736b80',
    fontSize: 9,
  },
  feedLevel: {
    marginTop: 4,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  highLevel: {
    color: '#be123c',
  },
  normalLevel: {
    color: '#ff8aa1',
  },
  lowLevel: {
    color: '#625c70',
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee9f5',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5b21b6',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  operatorMeta: {
    flex: 1,
    marginLeft: 10,
  },
  operatorName: {
    color: '#17121f',
    fontWeight: '700',
    fontSize: 12,
  },
  operatorRole: {
    color: '#736b80',
    fontSize: 10,
    marginTop: 2,
  },
  operatorStatus: {
    color: '#ff8aa1',
    fontSize: 10,
    fontWeight: '700',
  },
});

