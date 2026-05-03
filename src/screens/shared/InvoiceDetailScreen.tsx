import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

const STEPS = [
  { label: 'Deal confirmed',      done: true,  time: '12 Nov, 10:42 AM' },
  { label: 'Invoice generated',   done: true,  time: '12 Nov, 10:42 AM' },
  { label: 'Under admin review',  done: true,  time: '12 Nov, 11:05 AM' },
  { label: 'Payment initiated',   done: true,  time: '12 Nov, 2:30 PM' },
  { label: 'Payment settled',     done: true,  time: '12 Nov, 4:32 PM · UTR 3456728901' },
];

const LINE_ITEMS = [
  { item: 'Fresh Rohu (Grade A)', detail: '200 kg × ₹245', amount: '₹49,000', negative: false },
  { item: 'Platform commission (2%)', detail: '', amount: '−₹980', negative: true },
  { item: 'GST (5%)', detail: '', amount: '₹2,401', negative: false },
];

export const InvoiceDetailScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { role } = useAppStore();
  // Counterparty is anonymized — sellers see a Buyer #, buyers see a Seller #.
  const counterparty = role === 'seller' ? 'Buyer #4837' : 'Seller #2031';
  const counterpartyLabel = role === 'seller' ? 'Verified Buyer' : 'Verified Seller';

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title="INV-2025-00412"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.pdfBtn}>
            <Icon name="download" size={16} color={T.navy} />
            <Text style={styles.pdfText}>PDF</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Status banner */}
        <View style={styles.statusBanner}>
          <Icon name="checkCircle" size={22} color={T.green} />
          <View>
            <Text style={styles.statusTitle}>Payment Settled</Text>
            <Text style={styles.statusSub}>Paid on 12 Nov, 4:32 PM · UTR 3456728901</Text>
          </View>
        </View>

        {/* Counterparty — anonymized so neither side sees the other's real identity */}
        <Card>
          <View style={styles.partyInner}>
            <Avatar name={counterparty} size={44} bg={T.amber} />
            <View style={{ flex: 1 }}>
              <Text style={styles.partyName}>{counterparty}</Text>
              <View style={styles.partyMeta}>
                <Text style={styles.partyVerified}>✓ {counterpartyLabel}</Text>
                <Text style={styles.partyRating}>★ 4.8</Text>
                <Text style={styles.partyDeals}>43 deals</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.contactBtn}>
              <Text style={styles.contactText}>Contact</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Line items */}
        <Card>
          <View style={styles.lineSection}>
            <Text style={styles.lineTitle}>Line Items</Text>
            {LINE_ITEMS.map((li, i) => (
              <View key={i} style={[styles.lineRow, styles.lineRowBorder]}>
                <View>
                  <Text style={styles.lineItem}>{li.item}</Text>
                  {li.detail ? <Text style={styles.lineDetail}>{li.detail}</Text> : null}
                </View>
                <Text style={[styles.lineAmount, li.negative && { color: T.danger }]}>{li.amount}</Text>
              </View>
            ))}
            <View style={styles.lineTotal}>
              <Text style={styles.lineTotalLabel}>Final Total</Text>
              <Text style={styles.lineTotalVal}>₹50,421</Text>
            </View>
          </View>
        </Card>

        {/* Payment timeline */}
        <Card>
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>Payment Timeline</Text>
            {STEPS.map((step, i) => (
              <View key={i} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.dot, { backgroundColor: step.done ? T.green : T.hairline }]}>
                    {step.done && <Icon name="check" size={10} color="#fff" />}
                  </View>
                  {i < STEPS.length - 1 && (
                    <View style={[styles.line, { backgroundColor: step.done ? T.green : T.hairline }]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={[styles.stepLabel, { color: step.done ? T.text1 : T.text3 }]}>{step.label}</Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

        <TouchableOpacity style={styles.disputeBtn}>
          <Text style={styles.disputeText}>Raise a dispute</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16, gap: 12 },
  pdfBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pdfText: { fontSize: 13, fontWeight: '700', color: T.navy },
  statusBanner: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', padding: 16, borderRadius: 12, backgroundColor: `${T.green}15`, borderWidth: 1, borderColor: `${T.green}40` },
  statusTitle: { fontSize: 15, fontWeight: '800', color: T.green },
  statusSub: { fontSize: 12, color: T.text2, marginTop: 2 },
  partyInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  partyName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  partyMeta: { flexDirection: 'row', gap: 6, marginTop: 2 },
  partyVerified: { fontSize: 11, color: T.green, fontWeight: '700' },
  partyRating: { fontSize: 12, color: T.amber },
  partyDeals: { fontSize: 12, color: T.text3 },
  contactBtn: { borderWidth: 1.5, borderColor: T.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  contactText: { fontSize: 12, fontWeight: '700', color: T.navy },
  lineSection: { padding: 14 },
  lineTitle: { fontSize: 14, fontWeight: '800', color: T.text1, marginBottom: 12 },
  lineRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
  lineRowBorder: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  lineItem: { fontSize: 13, fontWeight: '600', color: T.text1 },
  lineDetail: { fontSize: 11, color: T.text3, marginTop: 2 },
  lineAmount: { fontSize: 14, fontWeight: '700', color: T.text1 },
  lineTotal: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12 },
  lineTotalLabel: { fontSize: 15, fontWeight: '800', color: T.text1 },
  lineTotalVal: { fontSize: 20, fontWeight: '900', color: T.navy },
  timelineSection: { padding: 14 },
  timelineTitle: { fontSize: 14, fontWeight: '800', color: T.text1, marginBottom: 14 },
  timelineRow: { flexDirection: 'row', gap: 12, marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 20 },
  dot: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  line: { width: 2, flex: 1, minHeight: 20, marginTop: 3 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  stepLabel: { fontSize: 13, fontWeight: '700' },
  stepTime: { fontSize: 11, color: T.text3, marginTop: 2 },
  disputeBtn: { paddingVertical: 8, alignItems: 'center' },
  disputeText: { fontSize: 13, fontWeight: '600', color: T.danger },
});
