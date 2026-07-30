import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'MobileEntry'>;

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

const getErrorMessage = async (response: Response, defaultMsg: string): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) return defaultMsg;
    
    try {
      const json = JSON.parse(text);
      if (json.detail) return json.detail;
      if (json.message) return json.message;
      if (json.error) return json.error;
      
      if (json.errors && typeof json.errors === 'object') {
        const firstKey = Object.keys(json.errors)[0];
        if (firstKey) {
          const keyErrors = json.errors[firstKey];
          if (Array.isArray(keyErrors) && keyErrors.length > 0) {
            return keyErrors[0];
          } else if (typeof keyErrors === 'string') {
            return keyErrors;
          }
        }
      }
      if (json.title) return json.title;
    } catch {
      const trimmed = text.trim();
      if (trimmed.length > 0 && trimmed.length < 150) {
        return trimmed;
      }
    }
  } catch (e) {
    console.warn('Could not extract error response:', e);
  }
  return defaultMsg;
};

export const MobileEntryScreen: React.FC<Props> = ({ navigation, route }) => {
  const mode = route.params?.mode ?? 'login';
  const { apiBaseUrl } = useAppStore();
  
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = /^[6-9]\d{9}$/.test(phone);

  const title = mode === 'register' ? 'Create Account' : 'Welcome back';
  const sub = mode === 'register' ? 'Enter your mobile number to register and get started.' : 'Enter your mobile number to continue to your dashboard.';

  const handleSendOTP = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/auth/otp/send', apiBaseUrl);
    console.log(`Sending OTP to: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phone,
          phoneNumber: phone,
          mobileNumber: phone,
        }),
      });

      if (response.ok) {
        let otpCode = '';
        try {
          const text = await response.text();
          if (text) {
            try {
              const json = JSON.parse(text);
              otpCode = json.devOtp || json.DevOtp || json.otp || json.code || json.value || (json.data && (json.data.otp || json.data.code || json.data.devOtp || json.data.DevOtp)) || '';
            } catch {
              const trimmed = text.trim();
              if (/^\d{4,6}$/.test(trimmed)) {
                otpCode = trimmed;
              }
            }
          }
        } catch (e) {
          console.warn('Could not extract OTP code from response:', e);
        }
        setLoading(false);
        navigation.navigate('OTP', { phone, mode, sentOtp: otpCode || undefined });
      } else {
        let fallbackMsg = "Unable to send OTP. Please try again later.";
        if (response.status === 429) {
          fallbackMsg = "Too many requests. Please wait a few minutes and try again.";
        } else if (response.status === 400 || response.status === 422) {
          fallbackMsg = "This mobile number is invalid. Please check and try again.";
        }
        const apiErrorMsg = await getErrorMessage(response, fallbackMsg);
        setError(apiErrorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Network error details:', err);
      setError("Unable to connect to the server. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient
            colors={['#EAEFF8', '#F1F5FC']}
            style={styles.topBanner}
          >
            <Logo width={170} dark />
          </LinearGradient>

          <View style={styles.cardContainer}>
            <View style={styles.formCard}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.sub}>{sub}</Text>

              <Input
                label="Mobile Number"
                prefix="🇮🇳 +91  |  "
                value={phone}
                onChangeText={(val) => {
                  setPhone(val);
                  setError('');
                }}
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                maxLength={10}
                disabled={loading}
                helper={isValid && !error ? "✓ Valid number format" : undefined}
                error={error || undefined}
              />

              <Button
                label={loading ? "Sending..." : "Send OTP"}
                onPress={handleSendOTP}
                disabled={!isValid || loading}
                fullWidth
                variant="navy"
                style={styles.btn}
              />

              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center} disabled={loading}>
                <Text style={styles.link}>← Go back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1 },
  topBanner: { height: 180, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: T.hairline },
  cardContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  formCard: {
    marginTop: -30,
    padding: 24,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    ...T.shadowSoft,
  },
  title: { fontSize: 22, fontWeight: '900', color: T.text1, marginBottom: 8 },
  sub: { fontSize: 13, color: T.text2, lineHeight: 19, marginBottom: 20 },
  btn: { marginTop: 24 },
  center: { alignItems: 'center', marginTop: 18 },
  link: { color: T.navy, fontSize: 14, fontWeight: '700' },
  errorBox: { backgroundColor: '#FFF5F5', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#FED7D7', gap: 6, marginTop: 10 },
  errorText: { color: T.danger, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  errorActions: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 6 },
  errorActionBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  errorActionText: { color: T.navy, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  actionDivider: { width: 1, height: 14, backgroundColor: '#FEB2B2' },
  configContainer: { marginTop: 12, padding: 14, backgroundColor: T.bg, borderRadius: 12, borderWidth: 1, borderColor: T.hairline },
  configLabel: { fontSize: 11, fontWeight: '700', color: T.text2, textTransform: 'uppercase', marginBottom: 6 },
  configRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  configInput: { flex: 1, height: 40, backgroundColor: T.card, borderRadius: 8, borderWidth: 1, borderColor: T.cardBorder, paddingHorizontal: 10, fontSize: 12, color: T.text1 },
  configSaveBtn: { height: 40, paddingHorizontal: 16, backgroundColor: T.navy, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  configSaveText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
