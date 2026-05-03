import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { SegTabs } from '../../components/ui/SegTabs';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { T } from '../../constants/tokens';
import { MOCK_INVOICES } from '../../constants/mockData';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const InvoiceListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [seg, setSeg] = useState('All');

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Invoices" onBack={() => nav.goBack()} />

      {/* Totals strip */}
      <View style={styles.totals}>
        {[
          { label: 'Total Receivable', value: '₹1,24,500' },
          { label: 'Settled This Month', value: '₹3,40,000' },
        ].map((s, i) => (
          <View key={s.label} style={[styles.totalCell, i > 0 && styles.totalCellBorder]}>
            <Text style={styles.totalLabel}>{s.label}</Text>
            <Text style={styles.totalVal}>{s.value}</Text>
          </View>
        ))}
      </View>

      <SegTabs tabs={['All', 'Awaiting payment', 'Paid', 'Disputed']} active={seg} onSelect={setSeg} />

      <ScrollView contentContainerStyle={styles.list}>
        {MOCK_INVOICES.map(inv => (
          <Card key={inv.id} onPress={() => nav.navigate('InvoiceDetail')}>
            <View style={styles.invInner}>
              <View style={styles.invTop}>
                <Text style={styles.invId}>{inv.id}</Text>
                <StatusPill status={inv.status} />
              </View>
              <Text style={styles.invParty}>{inv.party}</Text>
              <Text style={styles.invProduct}>{inv.product}</Text>
              <View style={styles.invBottom}>
                <Text style={styles.invAmount}>{inv.amount}</Text>
                <Text style={styles.invDate}>{inv.date}</Text>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  totals: { flexDirection: 'row', margin: 12, marginHorizontal: 16, padding: 14, backgroundColor: T.navy, borderRadius: 14 },
  totalCell: { flex: 1 },
  totalCellBorder: { paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  totalVal: { fontSize: 18, fontWeight: '900', color: '#fff' },
  list: { padding: 16, paddingTop: 12, gap: 10 },
  invInner: { padding: 14 },
  invTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  invId: { fontSize: 12, fontWeight: '700', color: T.text3, fontVariant: ['tabular-nums'] },
  invParty: { fontSize: 15, fontWeight: '700', color: T.text1 },
  invProduct: { fontSize: 12, color: T.text2, marginTop: 2 },
  invBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  invAmount: { fontSize: 20, fontWeight: '900', color: T.navy },
  invDate: { fontSize: 12, color: T.text3 },
});
