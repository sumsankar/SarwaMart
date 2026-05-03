import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'OTP'>;

export const OTPScreen: React.FC<Props> = ({ navigation, route }) => {
  const [otp, setOtp] = useState('');
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

  const handleVerify = () => {
    if (otp.length < 6) { setError('Please enter the complete OTP'); return; }
    navigation.navigate('PINSetup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Verify OTP" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>OTP sent to</Text>
        <Text style={styles.phone}>+91 {route.params?.phone ?? '***** *****'}</Text>
        <Text style={styles.sub}>Enter the 6-digit code we sent you</Text>

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
            />
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Verify" onPress={handleVerify} fullWidth style={styles.btn} />

        <View style={styles.row}>
          <Text style={styles.link}>Didn't receive? </Text>
          <TouchableOpacity><Text style={styles.resend}>Resend OTP</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center}>
          <Text style={styles.link}>Change number</Text>
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
  error: { color: T.danger, fontSize: 13 },
  btn: { height: 52, borderRadius: 14, width: '100%' },
  row: { flexDirection: 'row', alignItems: 'center' },
  link: { color: T.text2, fontSize: 14 },
  resend: { color: T.amber, fontSize: 14, fontWeight: '700' },
  center: { alignItems: 'center' },
});
