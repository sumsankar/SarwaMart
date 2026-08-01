import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'Products'>;

const PRODUCTS = [
  { id: 'p1', name: 'Fish', emoji: '🐟', desc: 'Rohu, Catla, Pomfret, Seer, Tilapia, Salmon', subs: ['Rohu','Catla','Pomfret','Seer','Tilapia','Salmon'] },
  { id: 'p2', name: 'Prawn / Shrimp', emoji: '🦐', desc: 'Vannamei, Tiger Prawn, Black Tiger, Freshwater', subs: ['Vannamei','Tiger Prawn','Black Tiger','Freshwater'] },
  { id: 'p3', name: 'Crab', emoji: '🦀', desc: 'Mud Crab, Blue Swimmer, Rock Crab', subs: ['Mud Crab','Blue Swimmer','Rock Crab'] },
  { id: 'p4', name: 'Lobster', emoji: '🦞', desc: 'Spiny, Rock, Painted Spiny', subs: ['Spiny','Rock','Painted Spiny'] },
  { id: 'p5', name: 'Squid / Cutttle', emoji: '🦑', desc: 'Indian Squid, Reef, Arrow', subs: ['Indian','Reef','Arrow'] },
  { id: 'p6', name: 'Shellfish & Others', emoji: '🐚', desc: 'Oyster, Clam, Mussel, Scallop', subs: ['Oyster','Clam','Mussel','Scallop'] },
];

export const ProductsScreen: React.FC<Props> = ({ navigation }) => {
  const [selectedCat, setSelectedCat] = useState<string[]>(['p1', 'p2']);
  const [selectedSub, setSelectedSub] = useState<string[]>(['Rohu', 'Vannamei']);

  const toggleCat = (id: string) => setSelectedCat(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleSub = (s: string) => setSelectedSub(arr => arr.includes(s) ? arr.filter(x => x !== s) : [...arr, s]);

  const selectAllSub = () => {
    const allSubs = PRODUCTS.filter(p => selectedCat.includes(p.id)).flatMap(p => p.subs);
    setSelectedSub(allSubs);
  };

  const clearAllSub = () => setSelectedSub([]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Hero Banner Header */}
      <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircleBtn}>
            <Icon name="chevronL" size={16} color={T.navy} />
          </TouchableOpacity>
          <Logo width={120} dark />
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step 5 of 5</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.titleHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Products & Specialities</Text>
              <Text style={styles.sub}>Choose the aqua categories and species you harvest or buy</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{selectedCat.length} Selected</Text>
            </View>
          </View>

          {/* Category Grid Cards */}
          <Text style={styles.sectionHeaderLabel}>1. Select Main Aqua Categories</Text>
          <View style={styles.catGrid}>
            {PRODUCTS.map(p => {
              const isSelected = selectedCat.includes(p.id);
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => toggleCat(p.id)}
                  style={[styles.catCard, isSelected && styles.catCardSelected]}
                  activeOpacity={0.85}
                >
                  <View style={styles.catCardTop}>
                    <View style={[styles.emojiCircle, isSelected && styles.emojiCircleSelected]}>
                      <Text style={styles.emojiText}>{p.emoji}</Text>
                    </View>
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </View>
                  <Text style={[styles.catName, isSelected && styles.catNameSelected]}>{p.name}</Text>
                  <Text style={styles.catDesc} numberOfLines={1}>{p.desc}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Species / Varieties Chip Selection */}
          {selectedCat.length > 0 && (
            <View style={styles.subSectionCard}>
              <View style={styles.subSectionHeader}>
                <Text style={styles.subSectionTitle}>2. Target Species / Varieties</Text>
                <View style={styles.quickActionBtns}>
                  <TouchableOpacity onPress={selectAllSub} hitSlop={6}>
                    <Text style={styles.actionLinkText}>Select All</Text>
                  </TouchableOpacity>
                  <Text style={{ color: T.hairline }}>|</Text>
                  <TouchableOpacity onPress={clearAllSub} hitSlop={6}>
                    <Text style={styles.actionLinkText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.chipsCloud}>
                {PRODUCTS.filter(p => selectedCat.includes(p.id)).flatMap(p => p.subs).map(s => {
                  const isSubSelected = selectedSub.includes(s);
                  return (
                    <TouchableOpacity
                      key={s}
                      onPress={() => toggleSub(s)}
                      style={[styles.speciesChip, isSubSelected && styles.speciesChipSelected]}
                      activeOpacity={0.8}
                    >
                      {isSubSelected && <Text style={styles.chipCheck}>✓</Text>}
                      <Text style={[styles.speciesText, isSubSelected && styles.speciesTextSelected]}>{s}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label="Submit Application for Review →"
          onPress={selectedCat.length > 0 ? () => navigation.navigate('UnderReview') : undefined}
          disabled={selectedCat.length === 0}
          fullWidth
          style={styles.submitBtn}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.hairline },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backCircleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  stepPill: { backgroundColor: T.amber, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: T.amber, borderRadius: 2 },

  scrollContent: { paddingBottom: 100 },
  body: { padding: 20, gap: 16 },
  titleHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 26, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, lineHeight: 18, marginTop: 2 },
  countBadge: { backgroundColor: `${T.navy}12`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: `${T.navy}20` },
  countBadgeText: { fontSize: 11, fontWeight: '800', color: T.navy },

  sectionHeaderLabel: { fontSize: 12, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  catCard: {
    width: '48%',
    backgroundColor: T.card,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: T.cardBorder,
    padding: 14,
    gap: 8,
    ...T.shadowSoft,
  },
  catCardSelected: {
    borderColor: T.navy,
    backgroundColor: '#F8FAFC',
  },
  catCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emojiCircle: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  emojiCircleSelected: { backgroundColor: `${T.navy}14` },
  emojiText: { fontSize: 22 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  checkCircleSelected: { backgroundColor: T.navy, borderColor: T.navy },
  checkMark: { color: '#fff', fontSize: 11, fontWeight: '900' },
  catName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  catNameSelected: { color: T.navy },
  catDesc: { fontSize: 11, color: T.text3 },

  subSectionCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 16,
    gap: 12,
    marginTop: 8,
    ...T.shadowSoft,
  },
  subSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subSectionTitle: { fontSize: 13, fontWeight: '800', color: T.text1 },
  quickActionBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLinkText: { fontSize: 12, fontWeight: '700', color: T.navy },

  chipsCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: T.hairline },
  speciesChipSelected: { backgroundColor: T.green, borderColor: T.green },
  chipCheck: { color: '#fff', fontSize: 11, fontWeight: '900' },
  speciesText: { fontSize: 12, fontWeight: '600', color: T.text2 },
  speciesTextSelected: { color: '#fff', fontWeight: '800' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, ...T.shadowSoft },
  submitBtn: { height: 52, borderRadius: 14, backgroundColor: T.navy },
});
