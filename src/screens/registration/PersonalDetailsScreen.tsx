import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';

type Props = NativeStackScreenProps<RootStackParams, 'PersonalDetails'>;

const POPULAR_STATES = [
  { name: 'Andhra Pradesh', emoji: '🌾' },
  { name: 'West Bengal', emoji: '🌊' },
  { name: 'Tamil Nadu', emoji: '⚓' },
  { name: 'Kerala', emoji: '🛥️' },
  { name: 'Odisha', emoji: '🐟' },
  { name: 'Gujarat', emoji: '🦐' },
];

export const PersonalDetailsScreen: React.FC<Props> = ({ navigation }) => {
  const [form, setForm] = useState({ name: '', email: '', state: '', city: '', address: '' });
  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.name.trim().length > 0 && form.state.trim().length > 0;

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
            <Text style={styles.stepPillText}>Step 3 of 4</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '75%' }]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.body}>
            <Text style={styles.title}>Personal & Business Info</Text>
            <Text style={styles.sub}>Enter your details for official trade identity & KYC verification</Text>

            <View style={styles.formCard}>
              <Input
                label="Full Name / Authorized Signatory *"
                value={form.name}
                onChangeText={v => set('name', v)}
                placeholder="e.g. Ravi Kumar"
              />

              <Input
                label="Email Address (for order receipts)"
                value={form.email}
                onChangeText={v => set('email', v)}
                placeholder="e.g. ravi@example.com"
                keyboardType="email-address"
              />

              {/* State Field & Quick Select Chips */}
              <View style={{ gap: 6 }}>
                <Input
                  label="State / Region *"
                  value={form.state}
                  onChangeText={v => set('state', v)}
                  placeholder="Select or type State name"
                />
                <Text style={styles.chipHint}>Quick Select Major Aqua Hubs:</Text>
                <View style={styles.chipsRow}>
                  {POPULAR_STATES.map(s => {
                    const isSelected = form.state === s.name;
                    return (
                      <TouchableOpacity
                        key={s.name}
                        onPress={() => set('state', s.name)}
                        style={[styles.stateChip, isSelected && styles.stateChipSelected]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.stateEmoji}>{s.emoji}</Text>
                        <Text style={[styles.stateChipText, isSelected && styles.stateChipTextSelected]}>{s.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Input
                label="City / District / Mandi *"
                value={form.city}
                onChangeText={v => set('city', v)}
                placeholder="e.g. West Godavari / Kakinada"
              />

              <Input
                label="Farm / Factory / Office Address"
                value={form.address}
                onChangeText={v => set('address', v)}
                placeholder="Village, Mandal, Street address…"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label="Continue to Products →"
          onPress={valid ? () => navigation.navigate('Products') : undefined}
          disabled={!valid}
          fullWidth
          style={styles.continueBtn}
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
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2, lineHeight: 20 },

  formCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 18,
    gap: 16,
    marginTop: 8,
    ...T.shadowSoft,
  },
  chipHint: { fontSize: 11, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stateChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: T.hairline },
  stateChipSelected: { backgroundColor: `${T.navy}14`, borderColor: T.navy },
  stateEmoji: { fontSize: 13 },
  stateChipText: { fontSize: 12, fontWeight: '600', color: T.text2 },
  stateChipTextSelected: { color: T.navy, fontWeight: '800' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, ...T.shadowSoft },
  continueBtn: { height: 52, borderRadius: 14, backgroundColor: T.amber },
});
