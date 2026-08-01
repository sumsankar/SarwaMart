import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, Platform, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { PINDots } from '../../components/ui/PINDots';
import { Keypad } from '../../components/ui/Keypad';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'PINSetup'>;

const getApiUrl = (endpoint: string, base: string) => {
  let resolvedBase = base.trim();
  if (resolvedBase.endsWith('/')) {
    resolvedBase = resolvedBase.slice(0, -1);
  }
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
};

export const PINSetupScreen: React.FC<Props> = ({ navigation, route }) => {
  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometric, setBiometric] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { role, token: storeToken, apiBaseUrl, setLoggedIn } = useAppStore();
  const tokenFromParams = route.params?.token;
  const mode = route.params?.mode || 'register';

  const current = step === 'set' ? pin : confirmPin;
  const setter = step === 'set' ? setPin : setConfirmPin;

  const submitPinSetup = async (finalPin: string) => {
    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/auth/pin/setup', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

    const payload = {
      pin: finalPin,
      Pin: finalPin,
    };

    console.log(`Setting up 6-digit PIN at ${targetUrl} with token:`, activeToken, payload);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
      }

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      setLoading(false);

      if (response.ok || response.status === 200 || response.status === 204) {
        console.log('✅ 6-Digit PIN configured successfully via API');
        if (mode === 'login') {
          setLoggedIn(true);
          navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
        } else {
          navigation.replace('RolePicker', { token: activeToken });
        }
      } else {
        console.warn('PIN setup API status:', response.status);
        if (mode === 'login') {
          setLoggedIn(true);
          navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
        } else {
          navigation.replace('RolePicker', { token: activeToken });
        }
      }
    } catch (err) {
      console.warn('Error calling auth/pin/setup POST API:', err);
      setLoading(false);
      if (mode === 'login') {
        setLoggedIn(true);
        navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
      } else {
        navigation.replace('RolePicker', { token: activeToken });
      }
    }
  };

  const handleKey = (k: string) => {
    if (loading) return;
    setError('');
    if (k === '⌫') {
      setter(p => p.slice(0, -1));
      return;
    }
    if (current.length >= 6) return;
    const next = current + k;
    setter(next);

    if (next.length === 6) {
      setTimeout(() => {
        if (step === 'set') {
          setStep('confirm');
        } else {
          if (next === pin) {
            submitPinSetup(next);
          } else {
            setError("PINs don't match. Please re-enter your 6-digit PIN.");
            setConfirmPin('');
          }
        }
      }, 150);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Hero Banner Header */}
      <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.topHeader}>
        <View style={styles.headerRow}>
          <Logo width={120} dark />
          <View style={styles.securityBadge}>
            <Text style={styles.securityBadgeText}>🔒 Security Setup</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <Text style={styles.title}>
          {step === 'set' ? 'Setup Secure PIN' : 'Confirm 6-Digit PIN'}
        </Text>
        <Text style={styles.sub}>
          {step === 'set'
            ? 'Configure a 6-digit PIN to access your account quickly on return.'
            : 'Re-enter your 6-digit PIN to confirm secure access.'}
        </Text>

        <View style={styles.dotsWrap}>
          <PINDots value={step === 'set' ? pin : confirmPin} length={6} />
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={T.navy} style={{ marginVertical: 8 }} />
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : null}
      </View>

      <View style={styles.bottom}>
        <View style={styles.biometricRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.bioLabel}>Enable biometric login</Text>
            <Text style={styles.bioSub}>Face ID / Fingerprint fast entry</Text>
          </View>
          <Switch value={biometric} onValueChange={setBiometric} trackColor={{ true: T.green }} />
        </View>

        <Keypad onKey={handleKey} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.hairline },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  securityBadge: { backgroundColor: `${T.navy}12`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  securityBadgeText: { color: T.navy, fontSize: 11, fontWeight: '800' },

  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1, textAlign: 'center' },
  sub: { fontSize: 14, color: T.text2, textAlign: 'center', lineHeight: 20 },
  dotsWrap: { marginVertical: 24 },
  error: { color: T.danger, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  bottom: { paddingHorizontal: 24, paddingBottom: 30, gap: 16 },
  biometricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, ...T.shadowSoft },
  bioLabel: { fontSize: 14, fontWeight: '700', color: T.text1 },
  bioSub: { fontSize: 12, color: T.text3, marginTop: 2 },
});
