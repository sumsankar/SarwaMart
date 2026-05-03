import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'RolePicker'>;

export const RolePickerScreen: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState<'seller' | 'buyer' | null>(null);
  const { setRole } = useAppStore();

  const options = [
    { key: 'seller' as const, emoji: '🎣', title: "I'm a Seller", desc: 'Farmers, aggregators, fisheries who want to list catch and harvest for bidding.' },
    { key: 'buyer' as const, emoji: '🛒', title: "I'm a Buyer", desc: 'Wholesalers, processors, exporters, retailers who want to source aqua products.' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[T.navy, '#2D5FA8']} style={styles.top}>
        <Logo width={140} dark />
      </LinearGradient>
      <View style={styles.body}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.sub}>How will you use SarwaMart?</Text>
        <Text style={styles.hint}>Choose your role to get started</Text>
        {options.map(o => (
          <TouchableOpacity key={o.key} onPress={() => setSelected(o.key)} style={[styles.card, selected === o.key && styles.cardSelected]}>
            <Text style={styles.emoji}>{o.emoji}</Text>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, selected === o.key && styles.cardTitleSelected]}>{o.title}</Text>
              <Text style={styles.cardDesc}>{o.desc}</Text>
            </View>
            <View style={[styles.radio, selected === o.key && styles.radioSelected]}>
              {selected === o.key && <View style={styles.radioDot} />}
            </View>
          </TouchableOpacity>
        ))}
        <Button
          label="Continue"
          onPress={selected ? () => { setRole(selected); navigation.navigate('AccountType'); } : undefined}
          disabled={!selected}
          fullWidth
          style={styles.btn}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center}>
          <Text style={styles.link}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  top: { height: 120, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, padding: 24, gap: 14 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 16, color: T.text2 },
  hint: { fontSize: 13, color: T.text3 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: T.card, borderRadius: 14, borderWidth: 2, borderColor: T.hairline },
  cardSelected: { borderColor: T.navy, backgroundColor: `${T.navy}08` },
  emoji: { fontSize: 36 },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T.text1 },
  cardTitleSelected: { color: T.navy },
  cardDesc: { fontSize: 12, color: T.text2, marginTop: 4, lineHeight: 17 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: T.navy },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.navy },
  btn: { height: 52, borderRadius: 14, marginTop: 8 },
  center: { alignItems: 'center' },
  link: { color: T.navy, fontSize: 14, fontWeight: '600' },
});
