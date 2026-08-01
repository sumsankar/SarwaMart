import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
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
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isValid = /^[6-9]\d{9}$/.test(phone);
  const canSubmit = isValid && acceptedTerms;

  const title = mode === 'register' ? 'Register Account' : 'Welcome to SarwaMart';
  const sub = mode === 'register' ? 'Enter your mobile number to register as a Farmer or Buyer.' : 'Enter your mobile number to sign in with OTP.';

  const handleSendOTP = async () => {
    if (!canSubmit) return;
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
            colors={['#F8FAFC', '#FFFFFF']}
            style={styles.topBanner}
          >
            <View style={styles.bannerHeader}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircleBtn}>
                <Icon name="chevronL" size={16} color={T.navy} />
              </TouchableOpacity>
              <Logo width={150} dark />
              <View style={{ width: 32 }} />
            </View>

            <View style={styles.trustBadgesRow}>
              <View style={styles.trustChip}>
                <Text style={styles.trustChipText}>⚡ Instant Verification</Text>
              </View>
              <View style={styles.trustChip}>
                <Text style={styles.trustChipText}>🔒 Verified Marketplace</Text>
              </View>
            </View>
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
                helper={isValid && !error ? "✓ Valid mobile format" : undefined}
                error={error || undefined}
              />

              {/* Terms of Service & Privacy Policy Checkbox */}
              <TouchableOpacity
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                style={styles.termsRow}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}>
                  {acceptedTerms && <Text style={styles.checkboxCheckmark}>✓</Text>}
                </View>
                <Text style={styles.termsText}>
                  I agree to the <Text style={styles.termsLink}>Terms of Service</Text> and <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>

              <Button
                label={loading ? "Sending OTP..." : "Get OTP Code →"}
                onPress={handleSendOTP}
                disabled={!canSubmit || loading}
                fullWidth
                style={styles.btn}
              />

              <View style={styles.benefitBox}>
                <Text style={styles.benefitTitle}>Why register on SarwaMart?</Text>
                <View style={styles.benefitRow}>
                  <Icon name="checkCircle" size={12} color={T.green} />
                  <Text style={styles.benefitText}>Direct bidding on 1,000+ daily aqua listings</Text>
                </View>
                <View style={styles.benefitRow}>
                  <Icon name="checkCircle" size={12} color={T.green} />
                  <Text style={styles.benefitText}>Post buyer trade requirements & get competitive proposals</Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center} disabled={loading}>
                <Text style={styles.link}>← Return to Home</Text>
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
  topBanner: { height: 210, paddingHorizontal: 20, paddingTop: 16, alignItems: 'center', justifyContent: 'flex-start', gap: 14 },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  backCircleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  trustBadgesRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  trustChip: { backgroundColor: `${T.navy}08`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: `${T.navy}15` },
  trustChipText: { color: T.navy, fontSize: 11, fontWeight: '700' },

  cardContainer: { paddingHorizontal: 16, paddingBottom: 30 },
  formCard: {
    marginTop: -36,
    padding: 24,
    borderRadius: 20,
    backgroundColor: T.card,
    borderWidth: 1,
    borderColor: T.cardBorder,
    gap: 14,
    ...T.shadowSoft,
  },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, lineHeight: 19 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, paddingVertical: 2 },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: T.text3, alignItems: 'center', justifyContent: 'center', backgroundColor: T.card },
  checkboxChecked: { backgroundColor: T.navy, borderColor: T.navy },
  checkboxCheckmark: { color: '#fff', fontSize: 11, fontWeight: '900' },
  termsText: { flex: 1, fontSize: 12, color: T.text2, lineHeight: 17 },
  termsLink: { color: T.navy, fontWeight: '700', textDecorationLine: 'underline' },
  btn: { height: 52, borderRadius: 14, backgroundColor: T.amber },

  benefitBox: { backgroundColor: '#F8FAFC', padding: 14, borderRadius: 14, gap: 8, borderWidth: 1, borderColor: T.hairline, marginTop: 4 },
  benefitTitle: { fontSize: 12, fontWeight: '800', color: T.text1 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 11, color: T.text2, fontWeight: '600', flex: 1 },

  center: { alignItems: 'center', marginTop: 4 },
  link: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
