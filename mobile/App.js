import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import {
  getSystemStatus,
  sendControlCommand,
  updateSettings,
} from './src/services/jammerApi';
import { ControlDashboard } from './src/components/ControlDashboard';
import { SpectrumVisualizer } from './src/components/SpectrumVisualizer';
import { SettingsPanel } from './src/components/SettingsPanel';

// Default mock state for demo visualization when offline/unconnected
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
};

export default function App() {
  const [status, setStatus] = useState(DEFAULT_DEMO_STATUS);
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'spectrum' | 'settings'
  const [isConnected, setIsConnected] = useState(false);

  // Poll status from ESP32 every 1 second
  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      const data = await getSystemStatus();
      if (isMounted) {
        if (data) {
          setStatus(data);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      }
    };

    poll();
    const interval = setInterval(poll, 1200);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleJamming = async () => {
    if (isConnected) {
      const res = await sendControlCommand('toggle');
      if (res) setStatus(res);
    } else {
      setStatus((prev) => ({ ...prev, isJamming: !prev.isJamming }));
    }
  };

  const handleSelectMode = async (modeId) => {
    if (isConnected) {
      const res = await sendControlCommand('start', modeId);
      if (res) setStatus(res);
    } else {
      setStatus((prev) => ({ ...prev, jammerMode: modeId }));
    }
  };

  const handleEmergencyStop = async () => {
    if (isConnected) {
      const res = await sendControlCommand('stop');
      if (res) setStatus(res);
    } else {
      setStatus((prev) => ({ ...prev, isJamming: false }));
    }
  };

  const handleUpdateSettings = async (dwell, pa) => {
    if (isConnected) {
      const res = await updateSettings(dwell, pa);
      if (res) setStatus(res);
    } else {
      setStatus((prev) => ({ ...prev, dwellTimeUs: dwell, paLevel: pa }));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ WiSARD CONTROL</Text>
        <View
          style={[
            styles.connBadge,
            isConnected ? styles.connSuccess : styles.connOffline,
          ]}
        >
          <View
            style={[
              styles.connDot,
              { backgroundColor: isConnected ? '#10b981' : '#f59e0b' },
            ]}
          />
          <Text style={styles.connText}>
            {isConnected ? 'ESP32 CONNECTED' : 'DEMO MODE (OFFLINE)'}
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'dashboard' && (
          <ControlDashboard
            status={status}
            onToggleJamming={handleToggleJamming}
            onSelectMode={handleSelectMode}
            onEmergencyStop={handleEmergencyStop}
          />
        )}

        {activeTab === 'spectrum' && <SpectrumVisualizer status={status} />}

        {activeTab === 'settings' && (
          <SettingsPanel status={status} onUpdateSettings={handleUpdateSettings} />
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'dashboard' && styles.navItemActive]}
          onPress={() => setActiveTab('dashboard')}
        >
          <Text style={styles.navIcon}>⚡</Text>
          <Text
            style={[styles.navText, activeTab === 'dashboard' && styles.navTextActive]}
          >
            Control
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'spectrum' && styles.navItemActive]}
          onPress={() => setActiveTab('spectrum')}
        >
          <Text style={styles.navIcon}>📊</Text>
          <Text
            style={[styles.navText, activeTab === 'spectrum' && styles.navTextActive]}
          >
            Spectrum
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => setActiveTab('settings')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text
            style={[styles.navText, activeTab === 'settings' && styles.navTextActive]}
          >
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    ...(Platform.OS === 'web' && {
      height: '100vh',
      minHeight: '100vh',
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connSuccess: {
    backgroundColor: '#064e3b',
  },
  connOffline: {
    backgroundColor: '#78350f',
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connText: {
    color: '#f8fafc',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  navBar: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  navItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#3b82f6',
  },
  navIcon: {
    fontSize: 18,
  },
  navText: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  navTextActive: {
    color: '#60a5fa',
    fontWeight: 'bold',
  },
});

