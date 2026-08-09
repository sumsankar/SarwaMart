import React, { useCallback, useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image, ScrollView } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { SegTabs } from '../../components/ui/SegTabs';
import { CategoryFilterBar } from '../../components/ui/CategoryFilterBar';
import { StatusPill } from '../../components/ui/StatusPill';
import { Icon } from '../../components/ui/Icon';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SELLER_ITEMS, productIcon } from '../../constants/mockData';

const getApiUrl = (endpoint: string, base: string) => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${cleanBase}${cleanEndpoint}`;
};

const getItemImageUri = (item: any): string | null => {
  if (!item) return null;

  if (typeof item.imageUrl === 'string' && item.imageUrl) return item.imageUrl;
  if (typeof item.defaultImageThumbnailUrl === 'string' && item.defaultImageThumbnailUrl) return item.defaultImageThumbnailUrl;
  if (typeof item.thumbnailUrl === 'string' && item.thumbnailUrl) return item.thumbnailUrl;
  if (typeof item.defaultImageUrl === 'string' && item.defaultImageUrl) return item.defaultImageUrl;
  if (typeof item.coverImageUrl === 'string' && item.coverImageUrl) return item.coverImageUrl;

  if (Array.isArray(item.images) && item.images.length > 0) {
    const coverObj = item.images.find((img: any) => img && (img.isCover || img.isDefault || img.isPrimary));
    const targetObj = coverObj || item.images[0];

    if (typeof targetObj === 'string') {
      return targetObj.startsWith('data:') || targetObj.startsWith('http')
        ? targetObj
        : `data:image/jpeg;base64,${targetObj}`;
    }

    if (targetObj && typeof targetObj === 'object') {
      const url = targetObj.imageUrl || targetObj.url || targetObj.thumbnailUrl || targetObj.defaultImageUrl || targetObj.imagePath;
      if (url && typeof url === 'string') return url;

      const base64 = targetObj.base64Data || targetObj.base64 || targetObj.data;
      if (base64 && typeof base64 === 'string') {
        return base64.startsWith('data:') ? base64 : `data:image/jpeg;base64,${base64}`;
      }
    }
  }

  return null;
};

type Nav = NativeStackNavigationProp<RootStackParams>;

const PAGE_SIZE = 15;

export const MyItemsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { apiBaseUrl, token, setSelectedItem } = useAppStore();
  const [seg, setSeg] = useState('All');
  
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchListings = async (pageNum: number, isRefresh = false) => {
    if (pageNum === 1 && !isRefresh) {
      setLoading(true);
    }
    try {
      const authToken = token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
      const statusParam = seg !== 'All' ? `&status=${encodeURIComponent(seg.toLowerCase())}` : '';
      const url = getApiUrl(`/api/v1/listings/mine?page=${pageNum}&pageSize=${PAGE_SIZE}${statusParam}`, apiBaseUrl);
      
      console.log(`Fetching seller listings page ${pageNum} from: ${url}`);
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const rawItems = Array.isArray(data) ? data : (data.items || data.data || data.listings || []);
        const total = data.totalCount || data.total || rawItems.length;

        setTotalCount(total);
        if (pageNum === 1) {
          setItems(rawItems);
        } else {
          setItems(prev => [...prev, ...rawItems]);
        }

        setHasMore(rawItems.length >= PAGE_SIZE && items.length + rawItems.length < total);
      } else {
        console.warn(`Failed to fetch seller listings (HTTP ${res.status})`);
      }
    } catch (err) {
      console.warn('Error fetching seller listings:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  // Reload when screen gains focus or status tab changes
  useFocusEffect(
    useCallback(() => {
      setPage(1);
      fetchListings(1, true);
    }, [seg, apiBaseUrl, token])
  );

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore || loading || refreshing) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchListings(nextPage, false);
  }, [loadingMore, hasMore, loading, refreshing, page, seg, apiBaseUrl, token]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchListings(1, true);
  }, [seg, apiBaseUrl, token]);

  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      if (seg !== 'All' && String(i.status || '').toLowerCase() !== seg.toLowerCase()) {
        return false;
      }
      if (selectedCategory !== 'All') {
        const catStr = (i.subcategoryName || i.categoryName || i.category || i.subcategory || i.name || '').toLowerCase();
        if (!catStr.includes(selectedCategory.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, seg, selectedCategory]);

  const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
    const statusStr = String(item.status || 'Pending').toLowerCase();
    const isLive = statusStr === 'live' || statusStr === 'active';
    const isPending = statusStr === 'pending' || statusStr === 'submitted';

    const priceText = item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}` : (item.price || '₹0.00');
    const qtyText = item.quantity ? `${item.quantity} ${item.uom || 'kg'}` : (item.qty || '0 kg');
    const subText = item.subcategoryName || item.categoryName || item.sub || 'Seafood';
    const regionText = item.region || item.branchName || item.port || 'Kakinada Port';
    const gradeText = item.grade ? (item.grade.startsWith('Grade') ? item.grade : `Grade ${item.grade}`) : 'Grade A';
    const freshnessText = item.freshness === 'FreshOnIce' ? 'Fresh on Ice' : (item.freshness || 'Fresh on Ice');

    const qtyNum = parseFloat(String(item.quantity || item.qty || '0').replace(/[^0-9.]/g, '')) || 0;
    const unitPriceNum = item.pricePerUnit ?? (item.priceNum ?? (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : 0));
    const totalVal = qtyNum * unitPriceNum;
    const displayTotal = totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;

    const imgUri = getItemImageUri(item);

    return (
      <TouchableOpacity
        onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }}
        style={styles.card}
        activeOpacity={0.85}
      >
        <View style={[styles.cardAccent, isPending && { backgroundColor: T.amber }]} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View style={styles.imgBox}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.cardImg} resizeMode="cover" />
              ) : (
                <Text style={styles.emoji}>{productIcon(subText || item.name)}</Text>
              )}
            </View>
            <View style={styles.topInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.name || 'Seafood Listing'}</Text>
                <StatusPill status={isPending ? 'Pending' : (item.status || 'Live')} />
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tag}>
                  <Icon name="shield" size={10} color={T.navy} />
                  <Text style={styles.tagText}>{gradeText}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{freshnessText}</Text>
                </View>
              </View>
              <Text style={styles.sub}>{subText} · {qtyText}</Text>
              <View style={styles.locRow}>
                <Icon name="mapPin" size={12} color={T.text3} />
                <Text style={styles.locText} numberOfLines={1}>{regionText}</Text>
              </View>
            </View>
          </View>

          {/* Clean Price & Total Container */}
          <View style={styles.priceContainer}>
            <View style={styles.priceCol}>
              <Text style={styles.priceLabel}>Unit Price</Text>
              <Text style={styles.price}>{priceText}</Text>
            </View>
            {displayTotal && (
              <View style={styles.totalCol}>
                <Text style={styles.totalLabel}>Total Value</Text>
                <Text style={styles.totalText}>{displayTotal}</Text>
              </View>
            )}
            {isLive && (
              <View style={styles.timerWrap}>
                <CountdownTimer seedSeconds={(index + 1) * 7823 + 3601} compact />
              </View>
            )}
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            {(item.bidsCount || item.bids || 0) > 0 ? (
              <View style={styles.bidsWrap}>
                <Icon name="gavel" size={13} color={T.amber} />
                <Text style={styles.bidsText}>
                  <Text style={styles.bidsNum}>{item.bidsCount || item.bids}</Text>{' '}
                  {(item.bidsCount || item.bids) === 1 ? 'bid received' : 'bids received'}
                </Text>
              </View>
            ) : (
              <Text style={styles.noBidsText}>No bids yet</Text>
            )}
            <Icon name="chevronR" size={16} color={T.text3} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [nav, setSelectedItem]);

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="My Items" onBack={() => nav.goBack()}
        right={
          <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.addBtn}>
            <Icon name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />
      <SegTabs tabs={['All', 'Live', 'Pending', 'Sold', 'Expired']} active={seg} onSelect={setSeg} />

      {/* Reusable Category Filter Bar */}
      <CategoryFilterBar
        selectedCategory={selectedCategory}
        onSelectCategory={(c) => setSelectedCategory(c)}
        title="CATEGORY:"
        containerStyle={styles.catFilterContainer}
      />

      <Text style={styles.countText}>
        Showing {filteredItems.length} {totalCount > 0 ? `of ${totalCount}` : ''} {filteredItems.length === 1 ? 'item' : 'items'}
      </Text>

      {loading ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={T.navy} />
          <Text style={styles.loaderText}>Loading your items...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(i, idx) => i.id || `item_${idx}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={T.navy} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="package" size={26} color={T.navy} />
              </View>
              <Text style={styles.emptyTitle}>No {seg.toLowerCase() === 'all' ? '' : `${seg.toLowerCase()} `}items yet</Text>
              <Text style={styles.emptySub}>Tap the + button to list your first catch.</Text>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator color={T.navy} />
                <Text style={styles.footerText}>Loading more…</Text>
              </View>
            ) : !hasMore && filteredItems.length > 0 ? (
              <View style={styles.footerEnd}>
                <Text style={styles.footerEndText}>You're all caught up</Text>
              </View>
            ) : null
          }
        />
      )}

      <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.fab}>
        <Icon name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  countText: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, fontSize: 12, color: T.text3, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8, gap: 12 },

  card: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  cardAccent: { height: 3, backgroundColor: T.navy },
  cardBody: { padding: 14, gap: 10 },

  topRow: { flexDirection: 'row', gap: 12 },
  catFilterContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catSectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: T.text3,
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  catFilterBar: { paddingHorizontal: 16, gap: 8 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: T.navy,
    borderColor: T.navy,
    shadowColor: T.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  catEmoji: { fontSize: 13 },
  catText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  catTextActive: { color: '#FFFFFF', fontWeight: '800' },
  imgBox: { width: 72, height: 72, borderRadius: 12, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardImg: { width: '100%', height: '100%' },
  emoji: { fontSize: 36 },
  topInfo: { flex: 1, gap: 3, justifyContent: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 16, fontWeight: '800', color: T.text1, flex: 1 },
  sub: { fontSize: 12, color: T.text2, fontWeight: '600' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  locText: { fontSize: 11, color: T.text3, flexShrink: 1 },

  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginVertical: 4,
  },
  priceCol: { gap: 1 },
  priceLabel: { fontSize: 10, fontWeight: '700', color: T.text3, textTransform: 'uppercase' },
  price: { fontSize: 16, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  totalCol: { gap: 1, alignItems: 'flex-start' },
  totalLabel: { fontSize: 10, fontWeight: '800', color: T.green, textTransform: 'uppercase' },
  totalText: { fontSize: 15, fontWeight: '900', color: T.green, fontVariant: ['tabular-nums'] },
  timerWrap: { alignItems: 'flex-end' },

  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  tagText: { fontSize: 11, fontWeight: '700', color: T.navy },

  divider: { height: 1, backgroundColor: T.hairline },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bidsWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bidsText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  bidsNum: { color: T.amber, fontWeight: '900' },
  noBidsText: { fontSize: 12, color: T.text3, fontStyle: 'italic' },

  addBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center', shadowColor: T.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },

  centerLoader: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontSize: 13, color: T.text3, fontWeight: '600' },

  footerLoading: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerText: { fontSize: 13, color: T.text3 },
  footerEnd: { paddingVertical: 24, alignItems: 'center' },
  footerEndText: { fontSize: 12, color: T.text3 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19 },
});
