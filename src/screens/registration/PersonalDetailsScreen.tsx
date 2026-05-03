import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'PersonalDetails'>;

export const PersonalDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', state: '', city: '', address: '' });
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name && form.email && form.state;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Personal Details" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.body}>
            <Text style={styles.step}>Step 1 of 2</Text>
            <View style={styles.progress}><View style={[styles.bar, { width: '50%' }]} /></View>
            <Input label="Full Name *" value={form.name} onChangeText={v => set('name', v)} placeholder="Ravi Kumar" />
            <Input label="Email Address" value={form.email} onChangeText={v => set('email', v)} placeholder="ravi@example.com" keyboardType="email-address" />
            <Input label="State *" value={form.state} onChangeText={v => set('state', v)} placeholder="Andhra Pradesh" />
            <Input label="City / District" value={form.city} onChangeText={v => set('city', v)} placeholder="West Godavari" />
            <Input label="Address" value={form.address} onChangeText={v => set('address', v)} placeholder="Village, Mandal…" multiline numberOfLines={3} />
            <Button label="Continue" onPress={valid ? () => navigation.navigate('Products') : undefined} disabled={!valid} fullWidth style={styles.btn} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { flexGrow: 1 },
  body: { padding: 20, gap: 14 },
  step: { fontSize: 12, color: T.text3, fontWeight: '600' },
  progress: { height: 4, backgroundColor: T.hairline, borderRadius: 2, marginBottom: 8 },
  bar: { height: 4, backgroundColor: T.amber, borderRadius: 2 },
  btn: { height: 52, borderRadius: 14, marginTop: 8 },
});
