import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'MobileEntry'>;

export const MobileEntryScreen: React.FC<Props> = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const isValid = /^[6-9]\d{9}$/.test(phone);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={[T.navy, '#2D5FA8']} style={styles.top}>
            <Logo width={160} dark />
          </LinearGradient>
          <View style={styles.body}>
            <Text style={styles.title}>Welcome to SarwaMart</Text>
            <Text style={styles.sub}>Enter your mobile number to continue</Text>
            <View style={styles.row}>
              <View style={styles.code}><Text style={styles.codeText}>🇮🇳 +91</Text></View>
              <View style={{ flex: 1 }}>
                <Input value={phone} onChangeText={setPhone} placeholder="10-digit number" keyboardType="phone-pad" maxLength={10} />
              </View>
            </View>
            {isValid && <Text style={styles.valid}>✓ Valid number</Text>}
            <Button label="Send OTP" onPress={() => navigation.navigate('OTP', { phone })} disabled={!isValid} fullWidth style={styles.btn} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center}>
              <Text style={styles.link}>← Go back</Text>
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
  top: { height: 160, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 24, gap: 16 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  code: { height: 52, paddingHorizontal: 14, backgroundColor: T.card, borderRadius: 10, borderWidth: 1.5, borderColor: T.hairline, justifyContent: 'center' },
  codeText: { fontSize: 15, fontWeight: '600', color: T.text1 },
  valid: { color: T.green, fontSize: 13, fontWeight: '600' },
  btn: { height: 52, borderRadius: 14 },
  center: { alignItems: 'center' },
  link: { color: T.navy, fontSize: 14, fontWeight: '600' },
});
