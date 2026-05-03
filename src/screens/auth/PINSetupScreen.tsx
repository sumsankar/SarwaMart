import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Switch } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { PINDots } from '../../components/ui/PINDots';
import { Keypad } from '../../components/ui/Keypad';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'PINSetup'>;

export const PINSetupScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState<'set' | 'confirm'>('set');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [biometric, setBiometric] = useState(false);
  const [error, setError] = useState('');
  const { role, setLoggedIn } = useAppStore();

  const current = step === 'set' ? pin : confirmPin;
  const setter = step === 'set' ? setPin : setConfirmPin;

  const handleKey = (k: string) => {
    setError('');
    if (k === '⌫') { setter(p => p.slice(0, -1)); return; }
    if (current.length >= 4) return;
    const next = current + k;
    setter(next);
    if (next.length === 4) {
      setTimeout(() => {
        if (step === 'set') { setStep('confirm'); }
        else {
          if (next === pin) {
            setLoggedIn(true);
            navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
          } else {
            setError("PINs don't match. Try again.");
            setConfirmPin('');
          }
        }
      }, 200);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>{step === 'set' ? 'Set your PIN' : 'Confirm PIN'}</Text>
        <Text style={styles.sub}>{step === 'set' ? 'Create a 4-digit PIN for faster logins.' : 'Re-enter your PIN to confirm'}</Text>
        <View style={styles.dotsWrap}><PINDots value={step === 'set' ? pin : confirmPin} /></View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
      <View style={styles.bottom}>
        <View style={styles.biometricRow}>
          <View>
            <Text style={styles.bioLabel}>Enable biometric login</Text>
            <Text style={styles.bioSub}>Face ID / Fingerprint</Text>
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: T.text1 },
  sub: { fontSize: 14, color: T.text2, textAlign: 'center' },
  dotsWrap: { marginVertical: 32 },
  error: { color: T.danger, fontSize: 13 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40, gap: 24 },
  biometricRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: T.card, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: T.hairline },
  bioLabel: { fontSize: 14, fontWeight: '600', color: T.text1 },
  bioSub: { fontSize: 12, color: T.text3, marginTop: 2 },
});
