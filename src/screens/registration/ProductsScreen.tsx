import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Products'>;

const PRODUCTS = [
  { id: 'p1', name: 'Fish', emoji: '🐟', subs: ['Rohu','Catla','Pomfret','Seer','Tilapia','Salmon'] },
  { id: 'p2', name: 'Prawn', emoji: '🦐', subs: ['Tiger Prawn','Vannamei','Black Tiger','Freshwater'] },
  { id: 'p3', name: 'Crab', emoji: '🦀', subs: ['Mud Crab','Blue Swimmer','Rock Crab'] },
  { id: 'p4', name: 'Lobster', emoji: '🦞', subs: ['Spiny','Rock','Painted Spiny'] },
  { id: 'p5', name: 'Squid', emoji: '🦑', subs: ['Indian','Reef','Arrow'] },
  { id: 'p6', name: 'Shellfish', emoji: '🐚', subs: ['Oyster','Clam','Mussel','Scallop'] },
];

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCat, setSelectedCat] = useState<string[]>([]);
  const [selectedSub, setSelectedSub] = useState<string[]>([]);

  const toggleCat = (id: string) => setSelectedCat(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleSub = (s: string) => setSelectedSub(arr => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[T.navy, '#2D5FA8']} style={styles.top}>
        <Logo width={140} dark />
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.body}>
          <Text style={styles.title}>Products & Speciality</Text>
          <Text style={styles.sub}>What do you trade in?</Text>
          <View style={styles.stepRow}>
            <Text style={styles.step}>Step 2 of 2</Text>
          </View>
          <View style={styles.progress}><View style={[styles.bar, { width: '100%' }]} /></View>
          <Text style={styles.label}>Select product categories</Text>
          <View style={styles.chips}>
            {PRODUCTS.map(p => (
              <TouchableOpacity key={p.id} onPress={() => toggleCat(p.id)} style={[styles.chip, selectedCat.includes(p.id) && styles.chipActive]}>
                <Text style={styles.chipEmoji}>{p.emoji}</Text>
                <Text style={[styles.chipText, selectedCat.includes(p.id) && styles.chipTextActive]}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedCat.length > 0 && (
            <>
              <Text style={styles.label}>Select species / varieties</Text>
              <View style={styles.chips}>
                {PRODUCTS.filter(p => selectedCat.includes(p.id)).flatMap(p => p.subs).map(s => (
                  <TouchableOpacity key={s} onPress={() => toggleSub(s)} style={[styles.chip, selectedSub.includes(s) && styles.chipSub]}>
                    <Text style={[styles.chipText, selectedSub.includes(s) && { color: '#fff' }]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
          <Button
            label="Submit for Review"
            onPress={selectedCat.length > 0 ? () => navigation.navigate('UnderReview') : undefined}
            disabled={selectedCat.length === 0}
            fullWidth style={styles.btn}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.center}>
            <Text style={styles.link}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  top: { height: 120, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },
  body: { padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 16, color: T.text2 },
  stepRow: { marginTop: 4 },
  step: { fontSize: 12, color: T.text3, fontWeight: '600' },
  progress: { height: 4, backgroundColor: T.hairline, borderRadius: 2 },
  bar: { height: 4, backgroundColor: T.amber, borderRadius: 2 },
  label: { fontSize: 14, fontWeight: '700', color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipSub: { backgroundColor: T.green, borderColor: T.green },
  chipEmoji: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  chipTextActive: { color: '#fff' },
  btn: { height: 52, borderRadius: 14, marginTop: 8 },
  center: { alignItems: 'center' },
  link: { color: T.navy, fontSize: 14, fontWeight: '600' },
});
