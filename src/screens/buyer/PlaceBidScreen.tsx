import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

export const PlaceBidScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { selectedItem: item } = useAppStore();
  const [qtyType, setQtyType] = useState<'full' | 'partial'>('full');
  const [partialQty, setPartialQty] = useState('');
  const [price, setPrice] = useState('');
  const [delivery, setDelivery] = useState<'pickup' | 'delivery' | 'either'>('either');
  const [note, setNote] = useState('');
  const [toastVisible, setToastVisible] = useState(false);

  const startingPrice = item?.priceNum || 145;
  const numPrice = parseFloat(price) || 0;
  const diff = numPrice - startingPrice;
  const qty = qtyType === 'full' ? (item?.qty?.replace(' kg', '') || '500') : partialQty;
  const total = numPrice && qty ? (numPrice * parseFloat(qty)).toLocaleString('en-IN') : null;

  const handleSubmit = () => {
    setToastVisible(true);
    setTimeout(() => { setToastVisible(false); nav.goBack(); }, 2000);
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="Place a Bid" onBack={() => nav.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll}>
          {/* Item summary */}
          <Card style={styles.summaryCard}>
            <View style={styles.summaryInner}>
              <Text style={styles.summaryEmoji}>{item?.img || '🐟'}</Text>
              <View>
                <Text style={styles.summaryTitle}>{item?.name || 'Fresh Rohu'} · {item?.qty || '500 kg'} available</Text>
                <Text style={styles.summaryPrice}>Starting at <Text style={styles.summaryPriceVal}>₹{startingPrice}/kg</Text></Text>
              </View>
            </View>
          </Card>

          {/* Quantity */}
          <View style={styles.section}>
            <Text style={styles.label}>QUANTITY</Text>
            <View style={styles.segRow}>
              {[
                { key: 'full', label: `Full Qty (${item?.qty || '500 kg'})` },
                { key: 'partial', label: 'Partial Qty' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.segBtn, qtyType === opt.key && styles.segBtnActive]}
                  onPress={() => setQtyType(opt.key as any)}
                >
                  <Text style={[styles.segText, qtyType === opt.key && styles.segTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {qtyType === 'partial' && (
              <View style={styles.inputWrap}>
                <Text style={styles.inputLabel}>How much do you want? *</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    value={partialQty}
                    onChangeText={setPartialQty}
                    placeholder="Enter kg"
                    placeholderTextColor={T.text3}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <Text style={styles.helper}>Min order: 50 kg</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.inputLabel}>Your Price per kg (₹) *</Text>
            <View style={[styles.inputBox, styles.prefixBox]}>
              <Text style={styles.prefix}>₹</Text>
              <TextInput
                value={price}
                onChangeText={v => setPrice(v.replace(/\D/g, ''))}
                placeholder={String(startingPrice)}
                placeholderTextColor={T.text3}
                keyboardType="numeric"
                style={[styles.input, { flex: 1 }]}
              />
            </View>
            {price ? (
              <Text style={[styles.diffText, { color: diff >= 0 ? T.green : T.danger }]}>
                {diff >= 0 ? `+₹${diff} above` : `-₹${Math.abs(diff)} below`} starting price
              </Text>
            ) : null}
          </View>

          {/* Total estimate */}
          {total && (
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Estimated Total</Text>
              <Text style={styles.totalVal}>₹{total}</Text>
            </View>
          )}

          {/* Delivery preference */}
          <View style={styles.section}>
            <Text style={styles.label}>DELIVERY PREFERENCE</Text>
            <View style={styles.chipRow}>
              {(['pickup', 'delivery', 'either'] as const).map(d => (
                <TouchableOpacity
                  key={d}
                  style={[styles.chip, delivery === d && styles.chipActive]}
                  onPress={() => setDelivery(d)}
                >
                  <Text style={[styles.chipText, delivery === d && styles.chipTextActive]}>
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Note */}
          <View style={styles.section}>
            <Text style={styles.label}>NOTE TO SELLER (OPTIONAL)</Text>
            <View style={styles.noteBox}>
              <TextInput
                value={note}
                onChangeText={v => setNote(v.slice(0, 200))}
                placeholder="Any specific requirements…"
                placeholderTextColor={T.text3}
                multiline
                style={styles.noteInput}
              />
            </View>
            <Text style={styles.charCount}>{note.length}/200</Text>
          </View>

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <Button
          label="Submit Bid"
          fullWidth
          onPress={handleSubmit}
          disabled={!price}
          style={styles.submitBtn}
        />
      </View>
      <Toast message="🔨 Bid placed successfully!" visible={toastVisible} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 16 },
  summaryCard: { marginBottom: 0 },
  summaryInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  summaryEmoji: { fontSize: 36, width: 44, textAlign: 'center' },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: T.text1 },
  summaryPrice: { fontSize: 13, color: T.text3, marginTop: 2 },
  summaryPriceVal: { fontWeight: '800', color: T.navy },
  section: { gap: 8 },
  label: { fontSize: 12, fontWeight: '700', color: T.text2, letterSpacing: 0.5, textTransform: 'uppercase' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: T.text2, letterSpacing: 0.5, textTransform: 'uppercase' },
  segRow: { flexDirection: 'row', backgroundColor: T.bg, borderRadius: 10, padding: 3, borderWidth: 1, borderColor: T.hairline },
  segBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  segBtnActive: { backgroundColor: T.navy },
  segText: { fontSize: 13, fontWeight: '700', color: T.text2 },
  segTextActive: { color: '#fff' },
  inputWrap: { gap: 4 },
  inputBox: { height: 52, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, borderRadius: 10, paddingHorizontal: 14, justifyContent: 'center' },
  prefixBox: { flexDirection: 'row', alignItems: 'center' },
  prefix: { fontSize: 16, fontWeight: '600', color: T.text2, marginRight: 4 },
  input: { fontSize: 15, color: T.text1 },
  helper: { fontSize: 11, color: T.text3 },
  diffText: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  totalBox: { padding: 14, borderRadius: 10, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  totalLabel: { fontSize: 12, color: T.text3 },
  totalVal: { fontSize: 24, fontWeight: '900', color: T.navy },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, alignItems: 'center' },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  chipTextActive: { color: '#fff' },
  noteBox: { backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline, borderRadius: 10, padding: 12 },
  noteInput: { fontSize: 14, color: T.text1, minHeight: 80, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: T.text3, textAlign: 'right' },
  footer: { padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  submitBtn: { height: 52, borderRadius: 14 },
});
