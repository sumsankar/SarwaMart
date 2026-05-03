import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'AccountType'>;

export const AccountTypeScreen: React.FC<Props> = ({ navigation }) => {
  const [type, setType] = useState<'individual' | 'company' | null>(null);

  const options = [
    { key: 'individual' as const, emoji: '👤', title: 'Individual', desc: 'I trade under my own name.' },
    { key: 'company' as const, emoji: '🏢', title: 'Company', desc: "We trade as a registered business. I'll set up the team." },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Create Account" onBack={() => navigation.goBack()} />
      <View style={styles.body}>
        <Text style={styles.title}>Individual or Company?</Text>
        <Text style={styles.sub}>Choose your account type</Text>
        {options.map(o => (
          <TouchableOpacity key={o.key} onPress={() => setType(o.key)} style={[styles.card, type === o.key && styles.cardSelected]}>
            <Text style={styles.emoji}>{o.emoji}</Text>
            <View style={styles.text}>
              <Text style={[styles.cardTitle, type === o.key && { color: T.navy }]}>{o.title}</Text>
              <Text style={styles.cardDesc}>{o.desc}</Text>
            </View>
            <View style={[styles.radio, type === o.key && styles.radioFilled]}>
              {type === o.key && <View style={styles.dot} />}
            </View>
          </TouchableOpacity>
        ))}
        <Button label="Continue" onPress={type ? () => navigation.navigate('PersonalDetails') : undefined} disabled={!type} fullWidth style={styles.btn} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  body: { flex: 1, padding: 24, gap: 14 },
  title: { fontSize: 22, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, backgroundColor: T.card, borderRadius: 14, borderWidth: 2, borderColor: T.hairline },
  cardSelected: { borderColor: T.navy, backgroundColor: `${T.navy}06` },
  emoji: { fontSize: 36 },
  text: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T.text1 },
  cardDesc: { fontSize: 12, color: T.text2, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  radioFilled: { borderColor: T.navy },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.navy },
  btn: { height: 52, borderRadius: 14, marginTop: 8 },
});
