import React, { useEffect, useRef } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';

export const SignalArtifact = ({ size = 64 }) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const baseRotation = useRef(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: true })
    );
    animation.start();
    return () => animation.stop();
  }, [spin]);

  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      spin.stopAnimation();
      rotation.stopAnimation((value) => {
        baseRotation.current = value;
      });
    },
    onPanResponderMove: (_, gesture) => {
      rotation.setValue(baseRotation.current + gesture.dx * 1.5);
    },
    onPanResponderRelease: () => {
      baseRotation.current = baseRotation.current % 360;
      Animated.spring(rotation, { toValue: baseRotation.current, useNativeDriver: true, friction: 8 }).start();
      const animation = Animated.loop(
        Animated.timing(spin, { toValue: 1, duration: 9000, useNativeDriver: true })
      );
      animation.start();
    },
  })).current;

  const autoRotation = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const manualRotation = rotation.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] });

  return (
    <View {...responder.panHandlers} style={[styles.touchSurface, { width: size + 22, height: size + 22 }]}>
      <Animated.View style={[styles.artifact, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate: autoRotation }, { rotate: manualRotation }] }]}>
        <View style={[styles.orbit, { width: size * 0.86, height: size * 0.36, borderRadius: size, transform: [{ rotate: '28deg' }] }]} />
        <View style={[styles.orbit, styles.orbitSecondary, { width: size * 0.86, height: size * 0.36, borderRadius: size, transform: [{ rotate: '-52deg' }] }]} />
        <View style={styles.core} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  touchSurface: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  artifact: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3edff',
    borderWidth: 1,
    borderColor: '#d8b4ff',
    shadowColor: '#7c3aed',
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  orbit: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  orbitSecondary: {
    borderColor: '#ec4899',
    borderWidth: 1,
  },
  core: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#5b21b6',
  },
});
