import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Toast } from '../../components/ui/Toast';
import { T } from '../../constants/tokens';

export const CreateRequestScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const [form, setForm] = useState({
    product: 'Fish', sub: 'Pomfret', grade: 'Any',
    qty: '', uom: 'kg', price: '', delivery: 'either', desc: '',
  });
  const [openToCounter, setOpenToCounter] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const valid = form.qty && form.price;

  const handlePost = () => {
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); nav.goBack(); }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Post a Request" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Product */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WHAT ARE YOU LOOKING FOR?</Text>
            <View style={styles.chips}>
              {['Fish', 'Prawn', 'Crab', 'Lobster', 'Squid'].map(p => (
                <TouchableOpacity key={p} style={[styles.chip, form.product === p && styles.chipActive]} onPress={() => set('product', p)}>
                  <Text style={[styles.chipText, form.product === p && styles.chipTextActive]}>{p}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Variety */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>Variety / Subproduct</Text>
            <View style={styles.chips}>
              {['Pomfret', 'Rohu', 'Catla', 'Seer', 'Tilapia', 'Any'].map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.sub === s && { backgroundColor: T.green, borderColor: T.green }]} onPress={() => set('sub', s)}>
                  <Text style={[styles.chipText, form.sub === s && styles.chipTextActive]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Grade */}
          <View style={styles.section}>
            <Text style={styles.subLabel}>Grade Preference</Text>
            <View style={styles.chips}>
              {[['Any', 'Any Grade'], ['A', 'Grade A'], ['B', 'Grade B']].map(([k, label]) => (
                <TouchableOpacity key={k} style={[styles.gradeChip, form.grade === k && { backgroundColor: T.amber, borderColor: T.amber }]} onPress={() => set('grade', k)}>
                  <Text style={[styles.chipText, form.grade === k && styles.chipTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Quantity & Price */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUANTITY & PRICE</Text>
            <View style={styles.row}>
              <View style={{ flex: 2 }}>
                <Input label="Required Quantity *" value={form.qty} onChangeText={v => set('qty', v.replace(/\D/g, ''))} placeholder="500" keyboardType="numeric" />
              </View>
              <View style={styles.uomBox}>
                <Text style={styles.uomLabel}>UOM</Text>
                <View style={styles.uomField}><Text style={styles.uomText}>{form.uom} ▾</Text></View>
              </View>
            </View>
            <Input label="Expected Price per kg (₹) *" value={form.price} onChangeText={v => set('price', v.replace(/\D/g, ''))} placeholder="380" prefix="₹" keyboardType="numeric" />

            {/* Counter toggle */}
            <View style={styles.counterRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.counterTitle}>Open to counter offers</Text>
                <Text style={styles.counterSub}>Sellers can negotiate the price</Text>
              </View>
              <Switch value={openToCounter} onValueChange={setOpenToCounter} trackColor={{ false: T.hairline, true: T.green }} thumbColor="#fff" />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Delivery */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DELIVERY & TIMELINE</Text>
            <Input label="Needed By" value="" onChangeText={() => {}} placeholder="Select date (DD/MM/YYYY)" />
            <Text style={styles.subLabel}>Pickup / Delivery</Text>
            <View style={styles.chips}>
              {(['pickup', 'delivery', 'either'] as const).map(d => (
                <TouchableOpacity key={d} style={[styles.chip, { flex: 1 }, form.delivery === d && styles.chipActive]} onPress={() => set('delivery', d)}>
                  <Text style={[styles.chipText, form.delivery === d && styles.chipTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>REQUIREMENTS</Text>
            <Text style={styles.subLabel}>Description</Text>
            <View style={styles.noteBox}>
              <TextInput
                value={form.desc}
                onChangeText={v => set('desc', v.slice(0, 500))}
                placeholder="Grade A only, morning delivery preferred…"
                placeholderTextColor={T.text3}
                multiline
                style={styles.noteInput}
              />
            </View>
            <Text style={styles.charCount}>{form.desc.length}/500</Text>

            <Text style={styles.subLabel}>Reference Images (optional)</Text>
            <View style={styles.photoRow}>
              {[0, 1].map(i => (
                <View key={i} style={styles.photoBox}>
                  <Icon name="camera" size={20} color={T.text3} />
                  <Text style={styles.photoLabel}>Add photo</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          label="Post Request"
          fullWidth
          onPress={handlePost}
          disabled={!valid}
          style={styles.postBtn}
        />
      </View>
      <Toast message="📢 Request posted! Sellers will be notified." visible={toastVisible} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 4 },
  section: { marginBottom: 16, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: T.text3, letterSpacing: 1, textTransform: 'uppercase' },
  subLabel: { fontSize: 12, fontWeight: '700', color: T.text2, letterSpacing: 0.5, textTransform: 'uppercase' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  chipTextActive: { color: '#fff' },
  gradeChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, alignItems: 'center' },
  divider: { height: 1, backgroundColor: T.hairline, marginVertical: 4 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  uomBox: { flex: 1 },
  uomLabel: { fontSize: 12, fontWeight: '700', color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  uomField: { height: 52, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  uomText: { fontSize: 14, color: T.text1 },
  counterRow: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: T.card, borderRadius: 10, borderWidth: 1, borderColor: T.hairline },
  counterTitle: { fontSize: 14, fontWeight: '600', color: T.text1 },
  counterSub: { fontSize: 12, color: T.text3, marginTop: 2 },
  noteBox: { backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, borderRadius: 10, padding: 12 },
  noteInput: { fontSize: 14, color: T.text1, minHeight: 90, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: T.text3, textAlign: 'right' },
  photoRow: { flexDirection: 'row', gap: 10 },
  photoBox: { flex: 1, height: 80, borderRadius: 10, borderWidth: 2, borderColor: T.hairline, borderStyle: 'dashed', backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoLabel: { fontSize: 11, color: T.text3 },
  footer: { padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  postBtn: { height: 52, borderRadius: 14 },
});
