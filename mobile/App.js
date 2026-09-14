import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import {
  getSystemStatus,
  sendControlCommand,
  updateSettings,
} from './src/services/jammerApi';
import { ControlDashboard } from './src/components/ControlDashboard';
import { SpectrumVisualizer } from './src/components/SpectrumVisualizer';
import { SettingsPanel } from './src/components/SettingsPanel';

export default function App() {
  const [status, setStatus] = useState(null);
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
    const interval = setInterval(poll, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleJamming = async () => {
    const res = await sendControlCommand('toggle');
    if (res) setStatus(res);
  };

  const handleSelectMode = async (modeId) => {
    const res = await sendControlCommand('start', modeId);
    if (res) setStatus(res);
  };

  const handleEmergencyStop = async () => {
    const res = await sendControlCommand('stop');
    if (res) setStatus(res);
  };

  const handleUpdateSettings = async (dwell, pa) => {
    const res = await updateSettings(dwell, pa);
    if (res) setStatus(res);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🛡️ ANTI-JAMMER CONTROL</Text>
        <View
          style={[
            styles.connBadge,
            isConnected ? styles.connSuccess : styles.connOffline,
          ]}
        >
          <View
            style={[
              styles.connDot,
              { backgroundColor: isConnected ? '#10b981' : '#ef4444' },
            ]}
          />
          <Text style={styles.connText}>
            {isConnected ? 'ESP32 CONNECTED' : 'OFFLINE (192.168.4.1)'}
          </Text>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView style={styles.content}>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  connSuccess: {
    backgroundColor: '#064e3b',
  },
  connOffline: {
    backgroundColor: '#7f1d1d',
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  connText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
