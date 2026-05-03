import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { SegTabs } from '../../components/ui/SegTabs';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { T } from '../../constants/tokens';
import { MY_BIDS } from '../../constants/mockData';

export const MyBidsScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const [seg, setSeg] = useState('All');

  const filtered = seg === 'All' ? MY_BIDS
    : MY_BIDS.filter(b => b.status.toLowerCase() === seg.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Bids" onBack={() => nav.goBack()} />
      <SegTabs tabs={['All', 'Pending', 'Negotiating', 'Accepted', 'Expired']} active={seg} onSelect={setSeg} />
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map(bid => (
          <Card key={bid.id} onPress={() => nav.navigate('Negotiation')} style={styles.bidCard}>
            <View style={styles.bidInner}>
              <View style={styles.imgBox}>
                <Text style={styles.emoji}>{bid.img}</Text>
              </View>
              <View style={styles.info}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemName}>{bid.item}</Text>
                  <StatusPill status={bid.status} />
                </View>
                <Text style={styles.seller}>{bid.seller}</Text>
                <View style={styles.priceRow}>
                  <View>
                    <Text style={styles.price}>{bid.price}</Text>
                    <Text style={styles.qty}>{bid.qty}</Text>
                  </View>
                  <Text style={styles.time}>{bid.time}</Text>
                </View>
              </View>
            </View>
          </Card>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎣</Text>
            <Text style={styles.emptyTitle}>No bids here</Text>
            <Text style={styles.emptySub}>Browse items and place your first bid.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  list: { padding: 16, gap: 10 },
  bidCard: { marginBottom: 0 },
  bidInner: { flexDirection: 'row', gap: 12, padding: 14 },
  imgBox: { width: 72, height: 72, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  emoji: { fontSize: 34 },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 15, fontWeight: '700', color: T.text1, flex: 1 },
  seller: { fontSize: 12, color: T.text2, marginTop: 2 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 6 },
  price: { fontSize: 16, fontWeight: '800', color: T.navy },
  qty: { fontSize: 12, color: T.text2 },
  time: { fontSize: 11, color: T.text3 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T.text1 },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center' },
});
