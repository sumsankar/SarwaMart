import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Splash'>;

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const opacity = new Animated.Value(0);
  const scale = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => navigation.replace('PublicLanding'), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <LinearGradient colors={[T.navy, '#0E2554']} style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Logo width={200} dark />
        <Text style={styles.tagline}>Fresh From The Source</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { alignItems: 'center', gap: 24 },
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.5)', letterSpacing: 2.5, textTransform: 'uppercase' },
});
