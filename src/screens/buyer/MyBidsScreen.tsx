import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { SegTabs } from '../../components/ui/SegTabs';
import { StatusPill } from '../../components/ui/StatusPill';
import { Icon } from '../../components/ui/Icon';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { MY_BIDS, SELLER_ITEMS } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

type MyBid = (typeof MY_BIDS)[number];

const findItem = (itemId: number) => SELLER_ITEMS.find(i => i.id === itemId);

export const MyBidsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem } = useAppStore();
  const [seg, setSeg] = useState('All');

  const filtered = seg === 'All' ? MY_BIDS : MY_BIDS.filter(b => b.status.toLowerCase() === seg.toLowerCase());

  const openItem = (bid: MyBid) => {
    const item = findItem(bid.itemId);
    if (item) setSelectedItem(item);
    nav.navigate('ItemDetailBuyer');
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="My Bids" onBack={() => nav.goBack()} />
      <SegTabs tabs={['All', 'Pending', 'Negotiating', 'Live', 'Accepted']} active={seg} onSelect={setSeg} />

      <Text style={styles.countText}>
        {filtered.length} {filtered.length === 1 ? 'bid' : 'bids'}
      </Text>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map(bid => {
          const item = findItem(bid.itemId);
          return (
            <TouchableOpacity key={bid.id} onPress={() => openItem(bid)} style={styles.card} activeOpacity={0.85}>
              <View style={styles.accent} />
              <View style={styles.body}>
                <View style={styles.topRow}>
                  <View style={styles.imgBox}>
                    <Text style={styles.emoji}>{bid.img}</Text>
                  </View>
                  <View style={styles.topInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name} numberOfLines={1}>{bid.item}</Text>
                      <StatusPill status={bid.status} />
                    </View>
                    <Text style={styles.seller} numberOfLines={1}>{bid.seller}</Text>
                    {item?.region && (
                      <View style={styles.locRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.locText} numberOfLines={1}>{item.region}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Bid summary block */}
                <View style={styles.bidBlock}>
                  <View style={styles.bidLabelRow}>
                    <Text style={styles.bidLabel}>YOUR BID</Text>
                    {item && <Text style={styles.startingAt}>Starts at {item.price}</Text>}
                  </View>
                  <View style={styles.bidPriceRow}>
                    <Text style={styles.bidPrice}>{bid.price}</Text>
                    <View style={styles.qtyChip}>
                      <Icon name="package" size={11} color={T.amber} />
                      <Text style={styles.qtyChipText}>{bid.qty}</Text>
                    </View>
                  </View>
                  <Text style={styles.bidMeta}>
                    Placed {bid.time}{bid.exchanges > 0 && (
                      <Text style={styles.bidMetaThread}> · {bid.exchanges} {bid.exchanges === 1 ? 'message' : 'messages'}</Text>
                    )}
                  </Text>
                </View>

                <View style={styles.footer}>
                  {item?.status === 'live' && bid.status !== 'accepted' ? (
                    <CountdownTimer seedSeconds={bid.itemId * 9341 + 2700} compact />
                  ) : (
                    <Text style={styles.footerNote}>{bid.status === 'accepted' ? '✓ Deal accepted' : 'Bidding closed'}</Text>
                  )}
                  <View style={styles.viewRow}>
                    <Text style={styles.viewText}>View item</Text>
                    <Icon name="chevronR" size={14} color={T.navy} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="gavel" size={26} color={T.amber} />
            </View>
            <Text style={styles.emptyTitle}>
              No {seg.toLowerCase() === 'all' ? '' : `${seg.toLowerCase()} `}bids yet
            </Text>
            <Text style={styles.emptySub}>Browse the catalog and place your first bid.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => nav.navigate('BuyerTabs')}>
              <Text style={styles.emptyBtnText}>Browse Items</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  countText: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, fontSize: 12, color: T.text3, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8, gap: 12 },

  card: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  accent: { height: 3, backgroundColor: T.navy },
  body: { padding: 14, gap: 12 },

  topRow: { flexDirection: 'row', gap: 12 },
  imgBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 36 },
  topInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '800', color: T.text1, flex: 1 },
  seller: { fontSize: 12, color: T.text2, fontWeight: '600' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 11, color: T.text3, flexShrink: 1 },

  bidBlock: { padding: 12, borderRadius: 10, backgroundColor: `${T.amber}08`, borderWidth: 1, borderColor: `${T.amber}25`, gap: 6 },
  bidLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidLabel: { fontSize: 10, fontWeight: '900', color: T.amber, letterSpacing: 0.6 },
  startingAt: { fontSize: 11, color: T.text3, fontWeight: '600' },
  bidPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bidPrice: { fontSize: 22, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },
  qtyChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, backgroundColor: `${T.amber}18` },
  qtyChipText: { fontSize: 12, fontWeight: '800', color: T.amber },
  bidMeta: { fontSize: 12, color: T.text2, fontWeight: '600' },
  bidMetaThread: { color: T.navy, fontWeight: '800' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerNote: { fontSize: 12, color: T.text3, fontWeight: '600' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontSize: 12, fontWeight: '800', color: T.navy },

  empty: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 10, height: 44, paddingHorizontal: 24, backgroundColor: T.amber, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
