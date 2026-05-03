import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Toast } from '../../components/ui/Toast';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

export const CreateItemScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { showToast } = useAppStore();
  const [form, setForm] = useState({ product: 'Fish', qty: '500', uom: 'kg', price: '', freshness: 'Fresh on ice', grade: 'A', validity: '48h' });
  const [toastVisible, setToastVisible] = useState(false);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = () => {
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); nav.goBack(); }, 2000);
  };

  const Chip = ({ label, selected, onPress, bg }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.chip, selected && { backgroundColor: bg ?? T.navy, borderColor: bg ?? T.navy }]}>
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="New Bid Item" onBack={() => nav.goBack()} right={
        <TouchableOpacity><Text style={styles.draftText}>Save Draft</Text></TouchableOpacity>
      } />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUCT</Text>
            <View style={styles.chips}>
              {['Fish','Prawn','Crab','Lobster','Squid'].map(p => (
                <Chip key={p} label={p} selected={form.product === p} onPress={() => set('product', p)} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>QUANTITY & PRICING</Text>
            <View style={styles.row}>
              <View style={{ flex: 2 }}><Input label="Quantity *" value={form.qty} onChangeText={v => set('qty', v)} placeholder="500" keyboardType="numeric" /></View>
              <View style={styles.uomPicker}>
                <Text style={styles.uomLabel}>UOM</Text>
                <View style={styles.uomBox}><Text style={styles.uomText}>{form.uom} ▾</Text></View>
              </View>
            </View>
            <Input label="Starting Price (₹/kg) *" value={form.price} onChangeText={v => set('price', v)} placeholder="145" prefix="₹" keyboardType="numeric" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PRODUCT DETAILS</Text>
            <Text style={styles.subLabel}>Freshness</Text>
            <View style={styles.chips}>
              {['Live','Fresh on ice','Frozen','Processed'].map(f => (
                <Chip key={f} label={f} selected={form.freshness === f} onPress={() => set('freshness', f)} bg={T.green} />
              ))}
            </View>
            <Text style={styles.subLabel}>Grade</Text>
            <View style={styles.chips}>
              {['A','B','Mixed'].map(g => (
                <Chip key={g} label={`Grade ${g}`} selected={form.grade === g} onPress={() => set('grade', g)} bg={T.amber} />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PHOTOS (up to 4)</Text>
            <View style={styles.photoGrid}>
              {[0,1,2,3].map(i => (
                <View key={i} style={styles.photoBox}>
                  <Icon name="camera" size={22} color={T.text3} />
                  <Text style={styles.photoLabel}>{i === 0 ? 'Cover' : 'Add photo'}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>VALIDITY</Text>
            <View style={styles.validityRow}>
              {['24h','48h','72h','7 days'].map(v => (
                <TouchableOpacity key={v} onPress={() => set('validity', v)} style={[styles.valChip, form.validity === v && styles.valChipActive]}>
                  <Text style={[styles.valText, form.validity === v && styles.valTextActive]}>{v}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button label="Save Draft" variant="secondary" style={styles.draftBtn} onPress={() => nav.goBack()} />
        <Button label="Submit for Approval" onPress={handleSubmit} style={styles.submitBtn} />
      </View>
      <Toast message="✅ Sent for approval!" visible={toastVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 4 },
  section: { marginBottom: 20, gap: 10 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: T.text3, letterSpacing: 1, textTransform: 'uppercase' },
  subLabel: { fontSize: 12, fontWeight: '700', color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline },
  chipText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  uomPicker: { flex: 1 },
  uomLabel: { fontSize: 12, fontWeight: '700', color: T.text2, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 },
  uomBox: { height: 52, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, borderRadius: 10, paddingHorizontal: 10, justifyContent: 'center' },
  uomText: { fontSize: 14, color: T.text1 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoBox: { width: '47%', height: 90, borderRadius: 10, borderWidth: 2, borderColor: T.hairline, borderStyle: 'dashed', backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', gap: 4 },
  photoLabel: { fontSize: 11, color: T.text3 },
  validityRow: { flexDirection: 'row', gap: 8 },
  valChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, alignItems: 'center' },
  valChipActive: { backgroundColor: T.navy, borderColor: T.navy },
  valText: { fontSize: 13, fontWeight: '700', color: T.text2 },
  valTextActive: { color: '#fff' },
  footer: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  draftBtn: { flex: 1, borderRadius: 12 },
  submitBtn: { flex: 2, borderRadius: 12 },
  draftText: { color: T.amber, fontSize: 13, fontWeight: '700' },
});
