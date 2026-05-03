import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { StatusPill } from '../../components/ui/StatusPill';
import { SegTabs } from '../../components/ui/SegTabs';
import { T } from '../../constants/tokens';
import { bidsForItem, ItemBid } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const STATUS_COLOR: Record<ItemBid['status'], { bg: string; fg: string; label: string }> = {
  pending:     { bg: '#FFF3E0', fg: '#BA7517', label: 'Pending' },
  negotiating: { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Negotiating' },
  countered:   { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Countered' },
  accepted:    { bg: '#E6F4EC', fg: '#2D7A35', label: 'Accepted' },
  declined:    { bg: '#FDECEA', fg: '#A32D2D', label: 'Declined' },
};

export const ItemDetailSellerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem: item, showToast } = useAppStore();
  const [seg, setSeg] = useState('All');

  const bids = useMemo(() => (item ? bidsForItem(item) : []), [item]);
  const filtered = useMemo(() => {
    if (seg === 'All') return bids;
    return bids.filter(b => b.status.toLowerCase() === seg.toLowerCase());
  }, [seg, bids]);

  const highestBid = bids[0];

  if (!item) {
    return (
      <View style={styles.container}>
        <AppBar />
        <Header noSafeArea title="Item" onBack={() => nav.goBack()} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>This item is no longer available.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title={item.name} onBack={() => nav.goBack()} right={
        <TouchableOpacity hitSlop={8}><Icon name="more" size={20} color={T.text1} /></TouchableOpacity>
      } />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{item.img}</Text>
          <View style={styles.statusPillWrap}><StatusPill status={item.status} /></View>
        </View>

        <View style={styles.body}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemSub}>{item.sub} · {item.qty}</Text>
              <View style={styles.locRow}>
                <Icon name="mapPin" size={12} color={T.text3} />
                <Text style={styles.locText}>{item.region}</Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Starting</Text>
              <Text style={styles.price}>{item.price}</Text>
            </View>
          </View>

          {/* Status / countdown strip */}
          {item.status === 'live' && (
            <View style={styles.strip}>
              <View style={styles.stripLeft}>
                <Icon name="clock" size={14} color={T.green} />
                <Text style={styles.stripText}>Closes in</Text>
              </View>
              <CountdownTimer seedSeconds={item.id * 7823 + 3601} compact />
            </View>
          )}

          {/* Specs grid */}
          <Card style={styles.cardNoMargin}>
            <View style={styles.grid}>
              {[
                ['Quantity', item.qty],
                ['Starting Price', item.price],
                ['Grade', `Grade ${item.grade}`],
                ['Freshness', item.freshness],
                ['Region', item.region],
                ['Total bids', String(item.bids)],
              ].map(([k, v]) => (
                <View key={k} style={styles.gridCell}>
                  <Text style={styles.gridKey}>{k}</Text>
                  <Text style={styles.gridVal}>{v}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Bids Received */}
        <View style={styles.bidsHeaderWrap}>
          <View style={styles.bidsTitleRow}>
            <View style={styles.titleAccent} />
            <Text style={styles.bidsTitle}>Bids Received</Text>
            <View style={styles.bidsCountBadge}>
              <Text style={styles.bidsCountText}>{bids.length}</Text>
            </View>
          </View>
          {highestBid && (
            <Text style={styles.highest}>
              Highest <Text style={styles.highestPrice}>{highestBid.price}</Text>
            </Text>
          )}
        </View>

        {bids.length > 0 && (
          <SegTabs tabs={['All', 'Pending', 'Negotiating', 'Countered', 'Accepted']} active={seg} onSelect={setSeg} />
        )}

        <View style={styles.bidsList}>
          {bids.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="gavel" size={26} color={T.amber} />
              </View>
              <Text style={styles.emptyTitle}>No bids yet</Text>
              <Text style={styles.emptySub}>You'll be notified the moment a buyer places a bid on this item.</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No {seg.toLowerCase()} bids</Text>
            </View>
          ) : (
            filtered.map(b => (
              <BidCard
                key={b.id}
                bid={b}
                startingPriceNum={item.priceNum}
                onView={() => nav.navigate('Negotiation')}
                onAccept={() => { showToast(`Accepted ${b.buyerName} at ${b.price}`, 'success'); nav.navigate('InvoiceList'); }}
                onCounter={() => nav.navigate('Negotiation')}
                onDecline={() => showToast('Bid declined', 'info')}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

interface BidCardProps {
  bid: ItemBid;
  startingPriceNum: number;
  onView: () => void;
  onAccept: () => void;
  onCounter: () => void;
  onDecline: () => void;
}

const BidCard: React.FC<BidCardProps> = ({ bid, startingPriceNum, onView, onAccept, onCounter, onDecline }) => {
  const initials = bid.buyerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const status = STATUS_COLOR[bid.status];
  const diff = startingPriceNum > 0 ? Math.round(((bid.priceNum - startingPriceNum) / startingPriceNum) * 100) : 0;
  const diffColor = diff > 0 ? T.green : diff < 0 ? T.danger : T.text3;
  const diffLabel = diff > 0 ? `+${diff}% over starting` : diff < 0 ? `${diff}% below starting` : 'matches starting';

  return (
    <TouchableOpacity onPress={onView} style={styles.bCard} activeOpacity={0.85}>
      <View style={styles.bAccent} />
      <View style={styles.bBody}>
        {/* Buyer header */}
        <View style={styles.bHeader}>
          <View style={styles.bAvatar}><Text style={styles.bAvatarText}>{initials}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={styles.bNameRow}>
              <Text style={styles.bName} numberOfLines={1}>{bid.buyerName}</Text>
              {bid.buyerVerified && <Text style={styles.bVerified}>✓</Text>}
            </View>
            <View style={styles.bMetaRow}>
              <Text style={styles.bRating}>★ {bid.buyerRating}</Text>
              <Text style={styles.bDeals}>· {bid.buyerDeals} deals</Text>
              <Text style={styles.bTime}>· {bid.time}</Text>
            </View>
          </View>
          <View style={[styles.bStatus, { backgroundColor: status.bg }]}>
            <Text style={[styles.bStatusText, { color: status.fg }]}>{status.label}</Text>
          </View>
        </View>

        {/* Offer block */}
        <View style={styles.bOfferRow}>
          <View style={styles.bPriceBlock}>
            <Text style={styles.bColLabel}>BID</Text>
            <Text style={styles.bPrice}>{bid.price}</Text>
            <Text style={[styles.bDiff, { color: diffColor }]}>{diffLabel}</Text>
          </View>
          <View style={styles.bQtyBlock}>
            <Text style={styles.bColLabel}>QTY · TOTAL</Text>
            <Text style={styles.bQty}>{bid.qty}</Text>
            <Text style={styles.bTotal}>{bid.totalAmount}</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.bLocRow}>
          <Icon name="mapPin" size={11} color={T.text3} />
          <Text style={styles.bLoc}>{bid.buyerRegion}</Text>
        </View>

        <Text style={styles.bNote} numberOfLines={2}>{bid.note}</Text>

        {/* Actions */}
        {bid.status === 'pending' && (
          <View style={styles.bActions}>
            <TouchableOpacity style={styles.bDecline} onPress={onDecline}>
              <Text style={styles.bDeclineText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bCounter} onPress={onCounter}>
              <Icon name="edit" size={13} color={T.navy} />
              <Text style={styles.bCounterText}>Update</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bAccept} onPress={onAccept}>
              <Icon name="check" size={13} color="#fff" />
              <Text style={styles.bAcceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
        {(bid.status === 'negotiating' || bid.status === 'countered') && (
          <View style={styles.bActions}>
            <TouchableOpacity style={styles.bThread} onPress={onView}>
              <Icon name="msgCircle" size={13} color={T.navy} />
              <Text style={styles.bThreadText}>View thread{bid.exchanges > 0 ? ` · ${bid.exchanges}` : ''}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bAccept} onPress={onAccept}>
              <Icon name="check" size={13} color="#fff" />
              <Text style={styles.bAcceptText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { fontSize: 14, color: T.text3 },

  hero: { height: 200, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: T.hairline, position: 'relative' },
  heroEmoji: { fontSize: 96 },
  statusPillWrap: { position: 'absolute', top: 12, right: 12 },

  body: { padding: 16, gap: 14 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  itemName: { fontSize: 22, fontWeight: '900', color: T.text1 },
  itemSub: { fontSize: 13, color: T.text2, fontWeight: '600', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  locText: { fontSize: 12, color: T.text3 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  price: { fontSize: 22, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },

  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.green}10`, borderWidth: 1, borderColor: `${T.green}25` },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripText: { fontSize: 13, color: T.text2, fontWeight: '600' },

  cardNoMargin: { marginBottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 },
  gridCell: { width: '47%' },
  gridKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },

  bidsHeaderWrap: { paddingHorizontal: 16, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  titleAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: T.amber },
  bidsTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  bidsCountBadge: { minWidth: 24, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  bidsCountText: { fontSize: 12, fontWeight: '900', color: T.amber },
  highest: { fontSize: 12, color: T.text3, fontWeight: '600' },
  highestPrice: { color: T.green, fontWeight: '900' },

  bidsList: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },

  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 8, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, borderStyle: 'dashed' },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 17, maxWidth: 260 },

  // Bid card
  bCard: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  bAccent: { height: 3, backgroundColor: T.amber },
  bBody: { padding: 14, gap: 10 },
  bHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  bAvatarText: { fontSize: 13, fontWeight: '800', color: T.amber },
  bNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bName: { fontSize: 14, fontWeight: '800', color: T.text1, flexShrink: 1 },
  bVerified: { fontSize: 12, color: T.green, fontWeight: '900' },
  bMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bRating: { fontSize: 11, color: T.amber, fontWeight: '700' },
  bDeals: { fontSize: 11, color: T.text3 },
  bTime: { fontSize: 11, color: T.text3 },
  bStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  bStatusText: { fontSize: 11, fontWeight: '800' },

  bOfferRow: { flexDirection: 'row', borderRadius: 10, backgroundColor: T.bg, padding: 12, gap: 12 },
  bPriceBlock: { flex: 1, gap: 2 },
  bQtyBlock: { flex: 1, gap: 2, borderLeftWidth: 1, borderLeftColor: T.hairline, paddingLeft: 12 },
  bColLabel: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.4 },
  bPrice: { fontSize: 18, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  bQty: { fontSize: 16, fontWeight: '800', color: T.text1 },
  bTotal: { fontSize: 11, color: T.green, fontWeight: '800' },
  bDiff: { fontSize: 11, fontWeight: '700' },

  bLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bLoc: { fontSize: 11, color: T.text3 },
  bNote: { fontSize: 12, color: T.text2, lineHeight: 17 },

  bActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  bDecline: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.hairline },
  bDeclineText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  bCounter: { flex: 1, height: 36, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: `${T.navy}10`, borderWidth: 1.5, borderColor: `${T.navy}30` },
  bCounterText: { fontSize: 12, fontWeight: '800', color: T.navy },
  bAccept: { flex: 1.4, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: T.green, flexDirection: 'row', gap: 4 },
  bAcceptText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  bThread: { flex: 1.6, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.navy, flexDirection: 'row', gap: 6, backgroundColor: `${T.navy}06` },
  bThreadText: { fontSize: 12, fontWeight: '800', color: T.navy },
});
