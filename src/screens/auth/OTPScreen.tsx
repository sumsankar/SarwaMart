import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'OTP'>;

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

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const { phone, mode } = route.params ?? { phone: '', mode: 'login' };
  const { apiBaseUrl, setToken } = useAppStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    const v = val.replace(/\D/g, '').slice(0, 1);
    const arr = otp.split('');
    arr[idx] = v;
    const next = arr.join('').slice(0, 6);
    setOtp(next);
    setError('');
    if (v && idx < 5) inputs.current[idx + 1]?.focus();
    if (!v && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter the complete OTP');
      return;
    }

    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/auth/otp/verify', apiBaseUrl);
    console.log(`Verifying OTP at: ${targetUrl}`);

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
          otp: otp,
          code: otp,
        }),
      });

      if (response.ok) {
        let extractedToken = '';
        try {
          const text = await response.text();
          console.log('Verify OTP response body:', text);
          if (text) {
            try {
              const json = JSON.parse(text);
              extractedToken =
                json.otpToken ||
                json.accessToken ||
                json.access_token ||
                json.jwt ||
                json.jwtToken ||
                json.authToken ||
                json.auth_token ||
                json.value ||
                json.data?.token ||
                json.data?.accessToken ||
                json.data?.access_token ||
                json.data?.jwt ||
                json.result?.token ||
                json.result?.accessToken ||
                json.result?.access_token ||
                '';
            } catch {
              const trimmed = text.trim();
              if (trimmed.length > 15) {
                extractedToken = trimmed;
              }
            }
          }
        } catch (e) {
          console.warn('Could not parse verify OTP response body:', e);
        }

        if (!extractedToken) {
          const authHeader = response.headers.get('Authorization') || response.headers.get('authorization') || response.headers.get('x-auth-token');
          if (authHeader) {
            extractedToken = authHeader.replace(/^Bearer\s+/i, '');
          }
        }

        console.log('====================================');
        console.log('✅ OTP VERIFICATION SUCCESSFUL!');
        console.log('🔑 RECEIVED TOKEN:', extractedToken || '(No token string found in response body/headers)');
        console.log('====================================');
        if (extractedToken) {
          await setToken(extractedToken);
        }

        setLoading(false);
        if (mode === 'register') {
          navigation.replace('RolePicker', { token: extractedToken });
        } else {
          navigation.replace('PINSetup');
        }
      } else {
        let fallbackMsg = "Verification failed. Please try again later.";
        if (response.status === 400 || response.status === 422) {
          fallbackMsg = "The OTP code you entered is incorrect. Please check and try again.";
        } else if (response.status === 429) {
          fallbackMsg = "Too many attempts. Please try again in a few minutes.";
        }
        const apiErrorMsg = await getErrorMessage(response, fallbackMsg);
        setError(apiErrorMsg);
        setLoading(false);
      }
    } catch (err: any) {
      console.warn('Verification error details:', err);
      setError("Unable to connect to the server. Please check your internet connection and try again.");
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    setError('');
    setOtp('');

    const targetUrl = getApiUrl('/api/v1/auth/otp/send', apiBaseUrl);
    console.log(`Resending OTP to: ${targetUrl}`);

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
      setLoading(false);
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

        if (otpCode) {
          navigation.setParams({ sentOtp: otpCode });
        }

        setError('New OTP sent successfully!');
      } else {
        const apiErrorMsg = await getErrorMessage(response, "Unable to resend OTP. Please try again later.");
        setError(apiErrorMsg);
      }
    } catch (err) {
      setLoading(false);
      setError("Unable to connect. Please check your internet connection and try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Verify OTP"
        onBack={() => navigation.reset({ index: 0, routes: [{ name: 'PublicLanding' }] })}
      />
      <View style={styles.body}>
        <Text style={styles.title}>OTP sent to</Text>
        <Text style={styles.phone}>+91 {phone ?? '***** *****'}</Text>
        <Text style={styles.sub}>
          Enter the 6-digit code we sent you
          {route.params?.sentOtp ? ` (For testing: ${route.params.sentOtp})` : ''}
        </Text>

        <View style={styles.boxes}>
          {Array.from({ length: 6 }).map((_, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              value={otp[i] || ''}
              onChangeText={v => handleChange(v, i)}
              maxLength={1}
              keyboardType="numeric"
              style={[styles.box, otp[i] && styles.boxFilled]}
              autoFocus={i === 0}
              editable={!loading}
            />
          ))}
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Button
          label={loading ? "Verifying..." : "Verify"}
          onPress={handleVerify}
          disabled={otp.length < 6 || loading}
          fullWidth
          style={styles.btn}
        />

        <View style={styles.row}>
          <Text style={styles.link}>Didn't receive? </Text>
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={styles.resend}>Resend OTP</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center} disabled={loading}>
          <Text style={styles.link}>Change number</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'PublicLanding' }] })}
          style={styles.homeLink}
          disabled={loading}
        >
          <Text style={styles.homeLinkText}>🏠 Go to Home Marketplace</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  body: { flex: 1, padding: 24, gap: 16, alignItems: 'center' },
  title: { fontSize: 16, color: T.text2, marginTop: 16 },
  phone: { fontSize: 20, fontWeight: '800', color: T.text1 },
  sub: { fontSize: 14, color: T.text2 },
  boxes: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  box: { width: 44, height: 52, textAlign: 'center', fontSize: 22, fontWeight: '700', borderWidth: 2, borderColor: T.hairline, borderRadius: 10, backgroundColor: T.card, color: T.text1 },
  boxFilled: { borderColor: T.navy },
  errorSimple: { color: T.danger, fontSize: 13, textAlign: 'center' },
  errorBox: { backgroundColor: '#ffebe9', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ffc1bd', gap: 8, alignItems: 'center', width: '100%' },
  errorText: { color: T.danger, fontSize: 13, lineHeight: 18, textAlign: 'center' },
  bypassBtn: { marginTop: 4, paddingVertical: 4 },
  bypassText: { color: T.navy, fontSize: 13, fontWeight: '700', textDecorationLine: 'underline', textAlign: 'center' },
  btn: { height: 52, borderRadius: 14, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  link: { color: T.text2, fontSize: 14 },
  resend: { color: T.amber, fontSize: 14, fontWeight: '700' },
  center: { alignItems: 'center' },
  homeLink: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: `${T.navy}08`, borderRadius: 12, borderWidth: 1, borderColor: `${T.navy}15` },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
  apiEditLabel: { fontSize: 11, fontWeight: '700', color: T.text2, marginTop: 4, textTransform: 'uppercase', textAlign: 'center' },
  apiEditRow: { flexDirection: 'row', gap: 8, alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  apiInput: { flex: 1, height: 36, backgroundColor: T.card, borderRadius: 8, borderWidth: 1, borderColor: '#ffc1bd', paddingHorizontal: 10, fontSize: 12, color: T.text1 },
  apiSaveBtn: { height: 36, paddingHorizontal: 14, backgroundColor: T.navy, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  apiSaveText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
