import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
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
import { MY_PROPOSALS, BUYER_REQUESTS, productIcon, MyProposal } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;
type Request = (typeof BUYER_REQUESTS)[number];

const PAGE_SIZE = 10;
const LOAD_DELAY_MS = 600;

const findRequest = (id: number): Request | undefined => BUYER_REQUESTS.find(r => r.id === id);

const parsePriceNum = (price: string): number => {
  const m = price.match(/[\d,]+/);
  return m ? Number(m[0].replace(/,/g, '')) : 0;
};

export const MyProposalsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedRequest } = useAppStore();
  const [seg, setSeg] = useState('All');
  const [items, setItems] = useState<MyProposal[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const all = useMemo(() => {
    if (seg === 'All') return MY_PROPOSALS;
    return MY_PROPOSALS.filter(p => p.status.toLowerCase() === seg.toLowerCase());
  }, [seg]);
  const hasMore = items.length < all.length;

  // Stat strip across whole dataset
  const acceptedCount = useMemo(() => MY_PROPOSALS.filter(p => p.status === 'accepted').length, []);
  const activeCount = useMemo(() => MY_PROPOSALS.filter(p => p.status === 'pending' || p.status === 'negotiating' || p.status === 'countered').length, []);

  useEffect(() => {
    setItems(all.slice(0, PAGE_SIZE));
  }, [seg]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setItems(prev => all.slice(0, prev.length + PAGE_SIZE));
      setLoadingMore(false);
    }, LOAD_DELAY_MS);
  }, [loadingMore, hasMore, all]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setItems(all.slice(0, PAGE_SIZE));
      setRefreshing(false);
    }, LOAD_DELAY_MS);
  }, [all]);

  const openRequest = (req: Request) => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); };

  const renderItem = useCallback(({ item: prop }: { item: MyProposal }) => {
    const req = findRequest(prop.requestId);
    if (!req) return null;
    const expectedNum = parsePriceNum(req.price);
    const diff = expectedNum > 0 ? Math.round(((prop.priceNum - expectedNum) / expectedNum) * 100) : 0;
    const diffColor = diff > 0 ? T.danger : diff < 0 ? T.green : T.text3;
    const diffLabel = diff > 0 ? `+${diff}% vs expected` : diff < 0 ? `${diff}% vs expected` : 'matches expected';
    const isLive = prop.status === 'pending' || prop.status === 'negotiating' || prop.status === 'countered';

    return (
      <TouchableOpacity onPress={() => openRequest(req)} style={styles.card} activeOpacity={0.85}>
        <View style={styles.accent} />
        <View style={styles.cardBody}>
          {/* Buyer + product header */}
          <View style={styles.topRow}>
            <View style={styles.imgBox}>
              <Text style={styles.emoji}>{productIcon(req.sub)}</Text>
            </View>
            <View style={styles.topInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.product} numberOfLines={1}>{req.product}</Text>
                <StatusPill status={prop.status} />
              </View>
              <Text style={styles.sub}>{req.sub} · Expected {req.price}</Text>
              <Text style={styles.buyer} numberOfLines={1}>{req.buyer}</Text>
              <View style={styles.locRow}>
                <Icon name="mapPin" size={11} color={T.text3} />
                <Text style={styles.locText} numberOfLines={1}>{req.loc}</Text>
              </View>
            </View>
          </View>

          {/* Your proposal block */}
          <View style={styles.propBlock}>
            <View style={styles.propLabelRow}>
              <Text style={styles.propLabel}>YOUR PROPOSAL</Text>
              <Text style={[styles.propDiff, { color: diffColor }]}>{diffLabel}</Text>
            </View>
            <View style={styles.propPriceRow}>
              <Text style={styles.propPrice}>{prop.price}</Text>
              <View style={styles.qtyChip}>
                <Icon name="package" size={11} color={T.navy} />
                <Text style={styles.qtyChipText}>{prop.qty}</Text>
              </View>
            </View>
            <Text style={styles.propMeta}>
              Submitted {prop.time}{prop.exchanges > 0 && (
                <Text style={styles.propMetaThread}> · {prop.exchanges} {prop.exchanges === 1 ? 'message' : 'messages'}</Text>
              )}
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {isLive ? (
              <CountdownTimer seedSeconds={req.id * 4127 + 5400} compact />
            ) : prop.status === 'accepted' ? (
              <View style={styles.acceptedNote}>
                <Icon name="checkCircle" size={12} color={T.green} />
                <Text style={styles.acceptedText}>Accepted</Text>
              </View>
            ) : prop.status === 'declined' ? (
              <Text style={styles.closedText}>Declined by buyer</Text>
            ) : (
              <Text style={styles.closedText}>Request closed</Text>
            )}
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View request</Text>
              <Icon name="chevronR" size={14} color={T.amber} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [setSelectedRequest, nav]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="My Proposals" onBack={() => nav.goBack()} />

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Active</Text>
          <Text style={styles.statVal}>{activeCount}</Text>
        </View>
        <View style={[styles.statCell, styles.statCellBorder]}>
          <Text style={styles.statLabel}>Accepted</Text>
          <Text style={styles.statVal}>{acceptedCount}</Text>
        </View>
        <View style={[styles.statCell, styles.statCellBorder]}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statVal}>{MY_PROPOSALS.length}</Text>
        </View>
      </View>

      <SegTabs tabs={['All', 'Pending', 'Negotiating', 'Countered', 'Accepted', 'Declined']} active={seg} onSelect={setSeg} />

      <Text style={styles.countText}>
        Showing {items.length} of {all.length} {all.length === 1 ? 'proposal' : 'proposals'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={p => String(p.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.amber} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="send" size={26} color={T.amber} />
            </View>
            <Text style={styles.emptyTitle}>
              No {seg === 'All' ? '' : `${seg.toLowerCase()} `}proposals
            </Text>
            <Text style={styles.emptySub}>
              Browse buyer requests and submit your first proposal.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => nav.navigate('BuyerRequestsList')}>
              <Text style={styles.emptyBtnText}>Browse Requests</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={T.amber} />
              <Text style={styles.footerText}>Loading more…</Text>
            </View>
          ) : !hasMore && items.length > 0 ? (
            <View style={styles.footerEnd}>
              <Text style={styles.footerEndText}>You're all caught up</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  statsStrip: { flexDirection: 'row', margin: 12, marginHorizontal: 16, padding: 14, backgroundColor: T.amber, borderRadius: 12 },
  statCell: { flex: 1 },
  statCellBorder: { paddingLeft: 14, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.3)' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginBottom: 2, fontWeight: '600' },
  statVal: { fontSize: 22, fontWeight: '900', color: '#fff' },

  countText: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 4, fontSize: 12, color: T.text3, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8, gap: 12 },

  card: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  accent: { height: 3, backgroundColor: T.amber },
  cardBody: { padding: 14, gap: 10 },

  topRow: { flexDirection: 'row', gap: 12 },
  imgBox: { width: 64, height: 64, borderRadius: 12, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 36 },
  topInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  product: { fontSize: 16, fontWeight: '800', color: T.text1, flex: 1 },
  sub: { fontSize: 12, color: T.text2, fontWeight: '600' },
  buyer: { fontSize: 12, color: T.text2, fontWeight: '600', marginTop: 2 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locText: { fontSize: 11, color: T.text3, flexShrink: 1 },

  propBlock: { padding: 12, borderRadius: 10, backgroundColor: `${T.navy}06`, borderWidth: 1, borderColor: `${T.navy}20`, gap: 6 },
  propLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  propLabel: { fontSize: 10, fontWeight: '900', color: T.navy, letterSpacing: 0.6 },
  propDiff: { fontSize: 11, fontWeight: '800' },
  propPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  propPrice: { fontSize: 22, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  qtyChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, backgroundColor: `${T.navy}10` },
  qtyChipText: { fontSize: 12, fontWeight: '800', color: T.navy },
  propMeta: { fontSize: 12, color: T.text2, fontWeight: '600' },
  propMetaThread: { color: T.amber, fontWeight: '800' },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  acceptedNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  acceptedText: { fontSize: 12, color: T.green, fontWeight: '700' },
  closedText: { fontSize: 12, color: T.text3, fontWeight: '600' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontSize: 12, fontWeight: '800', color: T.amber },

  footerLoading: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerText: { fontSize: 13, color: T.text3 },
  footerEnd: { paddingVertical: 24, alignItems: 'center' },
  footerEndText: { fontSize: 12, color: T.text3 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19 },
  emptyBtn: { marginTop: 10, height: 44, paddingHorizontal: 24, backgroundColor: T.amber, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
