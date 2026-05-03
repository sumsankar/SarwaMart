import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { PINDots } from '../../components/ui/PINDots';
import { Keypad } from '../../components/ui/Keypad';
import { Avatar } from '../../components/ui/Avatar';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<'phone' | 'pin'>('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const { role, setLoggedIn } = useAppStore();

  const isPhoneValid = /^[6-9]\d{9}$/.test(phone);

  const handleKey = (k: string) => {
    if (k === '⌫') setPin(p => p.slice(0, -1));
    else if (pin.length < 4) {
      const next = pin + k;
      setPin(next);
      if (next.length === 4) {
        setTimeout(() => {
          setLoggedIn(true);
          navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
        }, 300);
      }
    }
  };

  if (step === 'pin') {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => { setStep('phone'); setPin(''); }} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.pinCenter}>
          <Avatar name="User" size={72} bg={T.green} />
          <Text style={styles.pinTitle}>Welcome Back!</Text>
          <Text style={styles.pinSub}>+91 {phone.replace(/(\d{5})(\d{5})/, '$1 $2')}</Text>
          <View style={styles.pinDotsWrap}>
            <PINDots value={pin} />
          </View>
          <Text style={styles.biometric}>Face ID / Fingerprint</Text>
        </View>
        <View style={styles.keypadWrap}>
          <Keypad onKey={handleKey} />
          <TouchableOpacity onPress={() => navigation.navigate('MobileEntry')}>
            <Text style={styles.forgot}>Forgot PIN? Login with OTP</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[T.navy, '#2D5FA8']} style={styles.topBanner}>
            <Logo width={160} dark />
          </LinearGradient>

          <View style={styles.form}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.sub}>Login with your registered mobile number</Text>

            <View style={styles.phoneRow}>
              <View style={styles.countryChip}>
                <Text style={styles.countryText}>🇮🇳 +91</Text>
              </View>
              <View style={styles.phoneInput}>
                <Input
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="10-digit mobile number"
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <Button
              label="Continue with PIN →"
              onPress={isPhoneValid ? () => setStep('pin') : undefined}
              disabled={!isPhoneValid}
              fullWidth
              style={styles.continueBtn}
            />

            <TouchableOpacity onPress={() => navigation.navigate('MobileEntry')} style={styles.otpLink}>
              <Text style={styles.otpLinkText}>Login with OTP instead</Text>
            </TouchableOpacity>

            <View style={styles.divider}><View style={styles.divLine} /><Text style={styles.divText}>OR</Text><View style={styles.divLine} /></View>

            <TouchableOpacity onPress={() => navigation.navigate('RolePicker')} style={styles.registerLink}>
              <Text style={styles.registerLinkText}>New to SarwaMart? <Text style={{ color: T.amber, fontWeight: '700' }}>Register free →</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1 },
  topBanner: { height: 160, alignItems: 'center', justifyContent: 'center' },
  form: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2 },
  phoneRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  countryChip: { height: 52, paddingHorizontal: 14, backgroundColor: T.card, borderRadius: 10, borderWidth: 1.5, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  countryText: { fontSize: 15, color: T.text1, fontWeight: '600' },
  phoneInput: { flex: 1 },
  continueBtn: { height: 52, borderRadius: 14, marginTop: 4 },
  otpLink: { alignItems: 'center' },
  otpLinkText: { color: T.navy, fontSize: 14, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divLine: { flex: 1, height: 1, backgroundColor: T.hairline },
  divText: { color: T.text3, fontSize: 12 },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: T.text2 },
  backBtn: { padding: 16 },
  backText: { color: T.navy, fontSize: 16, fontWeight: '600' },
  pinCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  pinTitle: { fontSize: 22, fontWeight: '800', color: T.text1, marginTop: 16 },
  pinSub: { fontSize: 14, color: T.text2 },
  pinDotsWrap: { marginVertical: 24 },
  biometric: { fontSize: 13, color: T.text3 },
  keypadWrap: { paddingHorizontal: 24, paddingBottom: 40, gap: 20, alignItems: 'center' },
  forgot: { color: T.navy, fontSize: 14, fontWeight: '600' },
});
