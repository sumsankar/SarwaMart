import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, RefreshControl } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Header } from '../../components/ui/Header';
import { Icon } from '../../components/ui/Icon';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;
type Item = (typeof SELLER_ITEMS)[number];

const PAGE_SIZE = 10;
const LOAD_DELAY_MS = 600;

export const ItemsForBidListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem } = useAppStore();
  const [search, setSearch] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const q = search.trim().toLowerCase();
  const all = SELLER_ITEMS
    .filter(i => i.status === 'live')
    .filter(i => !q || i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q) || i.region.toLowerCase().includes(q));
  const hasMore = items.length < all.length;

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

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <TouchableOpacity
      onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailBuyer'); }}
      style={styles.card}
      activeOpacity={0.85}
    >
      <View style={styles.accent} />
      <View style={styles.cardBody}>
        <View style={styles.topRow}>
          <View style={styles.imgBox}>
            <Text style={styles.emoji}>{item.img}</Text>
          </View>
          <View style={styles.topInfo}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.sub}>{item.sub} · {item.qty}</Text>
            <View style={styles.locRow}>
              <Icon name="mapPin" size={12} color={T.text3} />
              <Text style={styles.locText} numberOfLines={1}>{item.region}</Text>
            </View>
          </View>
          {item.bids > 0 && (
            <View style={styles.bidsBadge}>
              <Icon name="gavel" size={11} color="#fff" />
              <Text style={styles.bidsBadgeText}>{item.bids}</Text>
            </View>
          )}
        </View>

        <View style={styles.priceRow}>
          <Text style={styles.price}>{item.price}</Text>
          <CountdownTimer seedSeconds={item.id * 9341 + 2700} compact />
        </View>

        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Icon name="shield" size={10} color={T.navy} />
            <Text style={styles.tagText}>Grade {item.grade}</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.freshness}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <TouchableOpacity onPress={() => { setSelectedItem(item); nav.navigate('PlaceBid'); }} style={styles.bidBtn} activeOpacity={0.85}>
          <Icon name="gavel" size={14} color="#fff" />
          <Text style={styles.bidBtnText}>Place a Bid</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  ), [nav, setSelectedItem]);

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="Items for Bid" onBack={() => nav.goBack()} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Icon name="search" size={16} color={T.text3} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search products, sellers, regions…"
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
        Showing {items.length} of {all.length} {all.length === 1 ? 'item' : 'items'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
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
            <Text style={styles.emptyTitle}>{q ? `No items match “${search}”` : 'No live items right now'}</Text>
            <Text style={styles.emptySub}>{q ? 'Try a broader search.' : 'New items go live throughout the day — check back soon.'}</Text>
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
  accent: { height: 3, backgroundColor: T.navy },
  cardBody: { padding: 14, gap: 10 },
  topRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  imgBox: { width: 72, height: 72, borderRadius: 12, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40 },
  topInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: '800', color: T.text1 },
  sub: { fontSize: 12, color: T.text2, fontWeight: '600' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locText: { fontSize: 11, color: T.text3, flexShrink: 1 },
  bidsBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: T.amber },
  bidsBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  price: { fontSize: 20, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },

  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  tagText: { fontSize: 11, fontWeight: '700', color: T.navy },

  divider: { height: 1, backgroundColor: T.hairline },
  bidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 42, borderRadius: 10, backgroundColor: T.amber },
  bidBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  footerLoading: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerText: { fontSize: 13, color: T.text3 },
  footerEnd: { paddingVertical: 24, alignItems: 'center' },
  footerEndText: { fontSize: 12, color: T.text3 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19 },
});
