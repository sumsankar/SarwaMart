import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Header } from '../../components/ui/Header';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { BUYER_REQUESTS, productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;
type Request = (typeof BUYER_REQUESTS)[number];

const PAGE_SIZE = 10;
const LOAD_DELAY_MS = 600;

export const BuyerRequestsListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedRequest } = useAppStore();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Request[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const q = search.trim().toLowerCase();
  const all = q
    ? BUYER_REQUESTS.filter(r =>
        r.product.toLowerCase().includes(q) ||
        r.sub.toLowerCase().includes(q) ||
        r.buyer.toLowerCase().includes(q) ||
        r.loc.toLowerCase().includes(q),
      )
    : BUYER_REQUESTS;
  const hasMore = items.length < all.length;

  // Reset visible window whenever the search query changes
  useEffect(() => {
    setItems(all.slice(0, PAGE_SIZE));
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const renderItem = useCallback(({ item: req }: { item: Request }) => {
    const initials = req.buyer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const openDetail = () => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); };
    return (
      <TouchableOpacity onPress={openDetail} style={styles.card} activeOpacity={0.85}>
        <View style={styles.accent} />
        <View style={styles.cardBody}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.buyer} numberOfLines={1}>{req.buyer}</Text>
              <View style={styles.metaRow}>
                <Icon name="mapPin" size={11} color={T.text3} />
                <Text style={styles.meta} numberOfLines={1}>{req.loc} · {req.time}</Text>
              </View>
            </View>
          </View>
          <View style={styles.productRow}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>{productIcon(req.sub)}</Text>
            </View>
            <View style={styles.productInfo}>
              <Text style={styles.product} numberOfLines={1}>{req.product}</Text>
              <Text style={styles.productMeta}>{req.sub} · {req.qty}</Text>
            </View>
            <Text style={styles.priceRight} numberOfLines={1}>{req.price}</Text>
          </View>
          <Text style={styles.note} numberOfLines={3}>{req.note}</Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerLabel}>Closes in</Text>
            <CountdownTimer seedSeconds={req.id * 4127 + 5400} />
          </View>
          <Button label="View Details →" onPress={openDetail} fullWidth size="sm" style={styles.proposeBtn} />
        </View>
      </TouchableOpacity>
    );
  }, [nav, setSelectedRequest]);

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="Buyer Requests" onBack={() => nav.goBack()} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={T.text3} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, buyers, regions…"
            placeholderTextColor={T.text3}
            style={styles.searchInput}
            returnKeyType="search"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.countText}>
        Showing {items.length} of {all.length} {all.length === 1 ? 'request' : 'requests'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={r => String(r.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.navy} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="search" size={26} color={T.navy} />
            </View>
            <Text style={styles.emptyTitle}>{q ? `No requests match “${search}”` : 'No buyer requests yet'}</Text>
            <Text style={styles.emptySub}>{q ? 'Try a broader search.' : 'Check back soon — new requests come in throughout the day.'}</Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={T.navy} />
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
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchBox: { height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },
  countText: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, fontSize: 12, color: T.text3, fontWeight: '600' },
  listContent: { padding: 16, paddingTop: 8, gap: 12 },

  card: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  accent: { height: 3, backgroundColor: T.amber },
  cardBody: { padding: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${T.amber}20`, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontWeight: '800', color: T.amber },
  buyer: { fontSize: 13, fontWeight: '700', color: T.text1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontSize: 11, color: T.text3, flexShrink: 1 },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 56, height: 56, borderRadius: 12, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 32 },
  productInfo: { flex: 1, gap: 2 },
  product: { fontSize: 17, fontWeight: '900', color: T.text1 },
  productMeta: { fontSize: 12, color: T.text2, fontWeight: '600' },
  priceRight: { fontSize: 16, fontWeight: '900', color: T.amber },
  note: { fontSize: 12, color: T.text2, lineHeight: 17 },
  timerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 },
  timerLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  proposeBtn: { borderRadius: 10, marginTop: 2 },

  footerLoading: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerText: { fontSize: 13, color: T.text3 },
  footerEnd: { paddingVertical: 24, alignItems: 'center' },
  footerEndText: { fontSize: 12, color: T.text3 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19 },
});
