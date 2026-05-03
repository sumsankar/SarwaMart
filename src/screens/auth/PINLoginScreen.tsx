import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Avatar } from '../../components/ui/Avatar';
import { PINDots } from '../../components/ui/PINDots';
import { Keypad } from '../../components/ui/Keypad';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'PINLogin'>;

export const PINLoginScreen: React.FC<Props> = ({ navigation }) => {
  const [pin, setPin] = useState('');
  const { role, setLoggedIn } = useAppStore();

  const handleKey = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    if (next.length === 4) {
      setTimeout(() => {
        setLoggedIn(true);
        navigation.replace(role === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
      }, 200);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.top}>
        <Avatar name="Ravi Kumar" size={72} bg={T.green} />
        <Text style={styles.name}>Ravi Kumar</Text>
        <Text style={styles.phone}>+91 98765 43210</Text>
        <View style={styles.dotsWrap}><PINDots value={pin} /></View>
        <Text style={styles.bio}>Face ID / Fingerprint</Text>
      </View>
      <View style={styles.bottom}>
        <Keypad onKey={handleKey} />
        <View style={styles.links}>
          <TouchableOpacity onPress={() => navigation.navigate('MobileEntry')}>
            <Text style={styles.link}>Forgot PIN? Login with OTP</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MobileEntry')}>
            <Text style={styles.link}>Different number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  top: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  name: { fontSize: 20, fontWeight: '800', color: T.text1, marginTop: 12 },
  phone: { fontSize: 14, color: T.text2 },
  dotsWrap: { marginVertical: 24 },
  bio: { fontSize: 13, color: T.text3 },
  bottom: { paddingHorizontal: 24, paddingBottom: 40, gap: 24 },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: T.navy, fontSize: 13, fontWeight: '600' },
});
