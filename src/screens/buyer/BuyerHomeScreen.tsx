import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, Image, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Icon } from '../../components/ui/Icon';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { BUYER_BANNERS, SELLER_ITEMS, MY_REQUESTS, productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const getApiUrl = (endpoint: string, base: string) => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let resolvedBase = cleanBase;
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
};

const formatUom = (uomStr?: string): string => {
  if (!uomStr) return 'kg';
  let s = String(uomStr).trim();
  s = s.replace(/kilograms?\s*\((?:kg|kgs)\)/gi, 'kg');
  s = s.replace(/kilograms?/gi, 'kg');
  s = s.replace(/\((?:kg|kgs)\)/gi, 'kg');
  s = s.replace(/^\(|\)$/g, '').trim();
  if (s.toLowerCase() === 'kg' || s.toLowerCase() === 'kgs') return 'kg';
  if (s.toLowerCase() === 'tonnes' || s.toLowerCase() === 'tons' || s.toLowerCase() === 'tonne' || s.toLowerCase() === 'ton') return 'ton';
  if (s.toLowerCase() === 'quintals' || s.toLowerCase() === 'quintal') return 'quintal';
  return s || 'kg';
};

const getItemImageUri = (item: any): string | null => {
  if (!item) return null;
  if (typeof item.imageUrl === 'string' && item.imageUrl) return item.imageUrl;
  if (typeof item.defaultImageThumbnailUrl === 'string' && item.defaultImageThumbnailUrl) return item.defaultImageThumbnailUrl;
  if (typeof item.thumbnailUrl === 'string' && item.thumbnailUrl) return item.thumbnailUrl;
  if (typeof item.defaultImageUrl === 'string' && item.defaultImageUrl) return item.defaultImageUrl;
  if (typeof item.coverImageUrl === 'string' && item.coverImageUrl) return item.coverImageUrl;
  if (typeof item.primaryImageUrl === 'string' && item.primaryImageUrl) return item.primaryImageUrl;

  if (typeof item.img === 'string' && item.img) {
    if (item.img.startsWith('http') || item.img.startsWith('data:') || item.img.includes('/images/') || item.img.includes('.jpg') || item.img.includes('.png')) {
      return item.img;
    }
  }

  if (Array.isArray(item.images) && item.images.length > 0) {
    const coverObj = item.images.find((img: any) => img && (img.isCover || img.isDefault || img.isPrimary));
    const targetObj = coverObj || item.images[0];
    if (typeof targetObj === 'string') {
      return targetObj.startsWith('data:') || targetObj.startsWith('http') || targetObj.includes('/images/')
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

const STATUS_OPTIONS = ['All', 'Live', 'Sold', 'Expired'];
const CATEGORY_OPTIONS = ['All', 'Fish', 'Prawn', 'Crab', 'Lobster', 'Squid'];
const GRADE_OPTIONS = ['All', 'A', 'B'];
const FRESHNESS_OPTIONS = ['All', 'Live', 'Fresh on ice'];

interface Filters { status: string; category: string; grade: string; freshness: string; }
const DEFAULT_FILTERS: Filters = { status: 'All', category: 'All', grade: 'All', freshness: 'All' };

export const BuyerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { token, apiBaseUrl, setSelectedItem, setSelectedRequest } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  // API Data state for top 10 live seller listings across sellers
  const [topLiveListings, setTopLiveListings] = useState<any[]>(SELLER_ITEMS.slice(0, 10));
  const [loadingListings, setLoadingListings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const extractItemsList = (data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.listings)) return data.listings;
    if (Array.isArray(data.result)) return data.result;
    if (Array.isArray(data.value)) return data.value;
    if (Array.isArray(data.topListings)) return data.topListings;
    if (Array.isArray(data.top)) return data.top;

    if (typeof data === 'object') {
      if (data.id || data.name || data.title) return [data];
      for (const key of Object.keys(data)) {
        const val = data[key];
        if (Array.isArray(val) && val.length > 0) return val;
        if (val && typeof val === 'object') {
          if (Array.isArray(val.items)) return val.items;
          if (Array.isArray(val.data)) return val.data;
          if (Array.isArray(val.listings)) return val.listings;
        }
      }
    }
    return [];
  };

  // Fetch top 10 live seller listings across multiple sellers
  const fetchTopLiveListings = useCallback(async () => {
    setLoadingListings(true);
    try {
      const storedToken = token ||
        (await AsyncStorage.getItem('sm_access_token')) ||
        (await AsyncStorage.getItem('sm_auth_token')) ||
        (await AsyncStorage.getItem('sm_token'));

      let itemsList: any[] = [];
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      // 1. Try GET /api/v1/listings?page=1&pageSize=10&status=Live
      try {
        const liveUrl = getApiUrl('/api/v1/listings?page=1&pageSize=10&status=Live', apiBaseUrl);
        console.log(`[BuyerHomeScreen] 🚀 GET TOP LIVE LISTINGS: ${liveUrl}`);
        const liveRes = await fetch(liveUrl, { headers });
        if (liveRes.ok) {
          const liveData = await liveRes.json().catch(() => null);
          itemsList = extractItemsList(liveData);
          console.log(`[BuyerHomeScreen] Extracted ${itemsList.length} live listings from /api/v1/listings`);
        }
      } catch (e) {
        console.warn('[BuyerHomeScreen] Error fetching /api/v1/listings:', e);
      }

      // 2. Fallback to GET /api/v1/listings/public?page=1&pageSize=10
      if (itemsList.length === 0) {
        try {
          const pubUrl = getApiUrl('/api/v1/listings/public?page=1&pageSize=10', apiBaseUrl);
          console.log(`[BuyerHomeScreen] 🔄 GET PUBLIC LISTINGS: ${pubUrl}`);
          const pubRes = await fetch(pubUrl);
          if (pubRes.ok) {
            const pubData = await pubRes.json().catch(() => null);
            itemsList = extractItemsList(pubData);
            console.log(`[BuyerHomeScreen] Extracted ${itemsList.length} public listings`);
          }
        } catch (e) {
          console.warn('[BuyerHomeScreen] Error fetching public listings:', e);
        }
      }

      // 3. Fallback to GET /api/v1/listings/top
      if (itemsList.length === 0) {
        try {
          const topUrl = getApiUrl('/api/v1/listings/top', apiBaseUrl);
          const topRes = await fetch(topUrl, { headers });
          if (topRes.ok) {
            const topData = await topRes.json().catch(() => null);
            itemsList = extractItemsList(topData);
          }
        } catch (e) {}
      }

      if (itemsList.length > 0) {
        setTopLiveListings(itemsList.slice(0, 10));
      }
    } catch (err) {
      console.warn('[BuyerHomeScreen] Error fetching live listings across sellers:', err);
    } finally {
      setLoadingListings(false);
      setRefreshing(false);
    }
  }, [token, apiBaseUrl]);

  useEffect(() => {
    fetchTopLiveListings();
  }, [fetchTopLiveListings]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTopLiveListings();
  };

  const activeFilterCount =
    (filters.status !== 'All' ? 1 : 0) +
    (filters.category !== 'All' ? 1 : 0) +
    (filters.grade !== 'All' ? 1 : 0) +
    (filters.freshness !== 'All' ? 1 : 0);

  const openFilter = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilter = () => { setFilters(draft); setFilterOpen(false); };
  const resetFilter = () => setDraft(DEFAULT_FILTERS);

  const q = search.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return topLiveListings.filter(i => {
      const nameStr = String(i.name || i.title || '').toLowerCase();
      const subStr = String(i.subcategoryName || i.categoryName || i.subcategory || i.category || i.sub || '').toLowerCase();
      const regionStr = String(i.region || i.branchName || i.port || '').toLowerCase();

      if (q && !(nameStr.includes(q) || subStr.includes(q) || regionStr.includes(q))) return false;
      if (filters.category !== 'All' && !subStr.includes(filters.category.toLowerCase())) return false;
      if (filters.grade !== 'All' && String(i.grade || '').toLowerCase() !== filters.grade.toLowerCase()) return false;
      return true;
    });
  }, [topLiveListings, q, filters]);

  const filteredRequests = useMemo(() => {
    return MY_REQUESTS.filter(r => {
      if (q && !(r.product.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.loc.toLowerCase().includes(q))) return false;
      if (filters.status !== 'All' && r.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.category !== 'All' && r.sub.toLowerCase() !== filters.category.toLowerCase()) return false;
      return true;
    });
  }, [q, filters]);

  return (
    <View style={styles.container}>
      <AppBar />

      {/* Pinned region — banner + search stay visible while the lists scroll */}
      <View style={styles.pinned}>
        <BannerCarousel banners={BUYER_BANNERS} />
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
          <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
            <Icon name="filter" size={16} color={T.navy} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[T.navy]} tintColor={T.navy} />}
      >
        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'edit', label: 'Post Request', onPress: () => nav.navigate('CreateRequest') },
            { icon: 'gavel', label: 'My Bids', onPress: () => nav.navigate('MyBids') },
            { icon: 'receipt', label: 'My Requests', onPress: () => nav.navigate('MyRequests') },
          ].map(a => (
            <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress}>
              <Icon name={a.icon} size={18} color={T.navy} />
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items for Bid — top 10 live listings across sellers */}
        <SectionHeader
          title="Items for Bid (Top 10 Live)"
          accent="navy"
          badge={{ label: `${filteredItems.length} Live`, color: 'navy' }}
          onSeeAll={() => nav.navigate('ItemsForBidList')}
        />
        {loadingListings && topLiveListings.length === 0 ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={T.navy} />
            <Text style={{ fontSize: 12, color: T.text3, marginTop: 6 }}>Loading live listings...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
            {filteredItems.length === 0 && (
              <EmptyState
                compact
                title={q ? `No items match “${search}”` : 'No items match these filters'}
                subtitle="Try a different search or adjust your filters."
                showClear={!!q || activeFilterCount > 0}
                onClear={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }}
              />
            )}
            {filteredItems.slice(0, 10).map((item, idx) => {
              const imgUri = getItemImageUri(item);
              const nameStr = item.name || item.title || 'Seafood Listing';
              const subStr = item.subcategoryName || item.categoryName || item.subcategory || item.category || item.sub || 'Seafood';
              const saleTypeVal = item.saleType || item.tradeType || item.listingType || item.type || 'Auction';
              const isDirectSale = saleTypeVal === 'DirectSale';
              const cleanUom = formatUom(item.uom || item.unit);
              const qtyStr = item.quantity ? `${item.quantity} ${cleanUom}` : (item.quantityRemaining ? `${item.quantityRemaining} ${cleanUom}` : (item.qty || `100 ${cleanUom}`));
              const locStr = item.region || item.branchName || item.port || item.destinationRegion || 'Kakinada Port';
              const priceDisplay = item.pricePerUnit ? `₹${Number(item.pricePerUnit).toFixed(2)}/${cleanUom}` : (item.price || (item.startingPrice ? `₹${item.startingPrice}/${cleanUom}` : '₹0.00'));
              const bidCount = item.bids ?? item.bidCount ?? 0;
              const gradeStr = item.grade ? (item.grade.startsWith('Gr') ? item.grade : `Gr. ${item.grade}`) : 'Gr. A';
              const freshnessStr = item.freshness === 'FreshOnIce' ? 'Fresh on Ice' : (item.freshness || 'Fresh on ice');

              const qtyNum = parseFloat(String(item.quantity || item.quantityRemaining || item.qty || '0').replace(/[^0-9.]/g, '')) || 0;
              const unitPriceNum = item.pricePerUnit ?? (item.priceNum ?? (item.startingPrice ?? (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : 0)));
              const totalVal = qtyNum * unitPriceNum;
              const totalValDisplay = totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null;

              return (
                <TouchableOpacity
                  key={item.id || item.listingId || `item_${idx}`}
                  onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailBuyer'); }}
                  style={styles.itemCard}
                  activeOpacity={0.88}
                >
                  {/* Top Image Container */}
                  <View style={styles.itemImg}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <Text style={styles.itemEmoji}>{productIcon(subStr || nameStr)}</Text>
                    )}

                    {/* Sale Type Badge (Top Left) */}
                    <View style={styles.saleTypePill}>
                      <Text style={styles.saleTypePillText}>⚡ {saleTypeVal}</Text>
                    </View>

                    {/* Bids Count Badge (Top Right) */}
                    {bidCount > 0 && (
                      <View style={styles.itemBidsBadge}>
                        <Icon name="gavel" size={10} color="#fff" />
                        <Text style={styles.itemBidsBadgeText}>{bidCount} Bids</Text>
                      </View>
                    )}
                  </View>

                  {/* Card Content Body */}
                  <View style={styles.itemBody}>
                    {/* Title */}
                    <Text style={styles.itemName} numberOfLines={1}>{nameStr}</Text>

                    {/* Species & Quantity Subtitle */}
                    <Text style={styles.itemSub} numberOfLines={1}>{subStr} · {qtyStr}</Text>

                    {/* Operating Region / Location */}
                    <View style={styles.itemLocRow}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.itemLocText} numberOfLines={1}>{locStr}</Text>
                    </View>

                    {/* Financial Metrics Mini Ribbon */}
                    <View style={styles.cardMetricsBox}>
                      <View style={styles.cardMetricCell}>
                        <Text style={styles.cardMetricLabel}>Starting Rate</Text>
                        <Text style={styles.itemPrice}>{priceDisplay}</Text>
                      </View>

                      {totalValDisplay && (
                        <View style={[styles.cardMetricCell, styles.cardMetricBorder]}>
                          <Text style={styles.cardMetricLabel}>Est. Total</Text>
                          <Text style={styles.cardMetricTotalVal}>{totalValDisplay}</Text>
                        </View>
                      )}
                    </View>

                    {/* Tags & Timer Row */}
                    <View style={styles.itemTagsRow}>
                      <View style={styles.itemTag}>
                        <Text style={styles.itemTagText}>{gradeStr}</Text>
                      </View>
                      <View style={styles.freshTag}>
                        <Text style={styles.freshTagText}>{freshnessStr}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <CountdownTimer
                          expiresAt={item.expiresAt || item.expiryDate || item.expirationDate}
                          seedSeconds={item.id || item.listingId || idx}
                          compact
                        />
                      </View>
                    </View>

                    <View style={styles.itemDivider} />

                    {/* CTA Button */}
                    <TouchableOpacity
                      onPress={() => { setSelectedItem(item); nav.navigate('PlaceBid'); }}
                      style={[styles.placeBidBtn, isDirectSale && styles.buyNowBtn]}
                      activeOpacity={0.85}
                    >
                      <Icon name={isDirectSale ? 'basket' : 'gavel'} size={13} color={isDirectSale ? T.navy : '#fff'} />
                      <Text style={[styles.placeBidBtnText, isDirectSale && styles.buyNowBtnText]}>{isDirectSale ? 'Buy Now' : 'Place a Bid'}</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* My Requests — amber/your-posts theme, horizontal carousel */}
        <SectionHeader
          title="My Requests"
          accent="amber"
          badge={{ label: 'Your posts', color: 'amber' }}
          onSeeAll={() => nav.navigate('MyRequests')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          <TouchableOpacity onPress={() => nav.navigate('CreateRequest')} style={styles.addReqTile}>
            <View style={styles.addReqCircle}><Icon name="plus" size={20} color={T.amber} /></View>
            <Text style={styles.addReqText}>Post a{'\n'}request</Text>
          </TouchableOpacity>
          {filteredRequests.length === 0 && (
            <EmptyState
              compact
              title={q ? `No requests match “${search}”` : 'No requests match these filters'}
              subtitle="Try a different search or adjust your filters."
              showClear={!!q || activeFilterCount > 0}
              onClear={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }}
            />
          )}
          {filteredRequests.slice(0, 10).map(req => (
            <TouchableOpacity
              key={req.id}
              onPress={() => { setSelectedRequest(req); nav.navigate('MyRequestDetail'); }}
              style={styles.reqCardH}
              activeOpacity={0.85}
            >
              <View style={styles.reqAccent} />
              <View style={styles.reqImg}>
                <Text style={styles.reqEmoji}>{productIcon(req.sub)}</Text>
                <View style={styles.reqStatusWrap}><StatusPill status={req.status} /></View>
              </View>
              <View style={styles.reqBody}>
                <Text style={styles.reqProduct} numberOfLines={1}>{req.product}</Text>
                <Text style={styles.reqSub}>{req.sub} · {req.qty}</Text>
                <View style={styles.reqLocRow}>
                  <Icon name="mapPin" size={11} color={T.text3} />
                  <Text style={styles.reqLocText} numberOfLines={1}>{req.loc}</Text>
                </View>
                <View style={styles.reqPriceRow}>
                  <Text style={styles.reqPrice}>{req.price}</Text>
                  <Text style={styles.reqExpiry}>Exp · {req.expiry}</Text>
                </View>
                <View style={styles.reqDivider} />
                <View style={styles.reqFooter}>
                  {req.proposals > 0 ? (
                    <View style={styles.reqProposalsWrap}>
                      <Icon name="send" size={12} color={T.amber} />
                      <Text style={styles.reqProposalsText}>
                        <Text style={styles.reqProposalsNum}>{req.proposals}</Text> proposals
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.reqNoProposalsText}>Awaiting proposals</Text>
                  )}
                  <Icon name="chevronR" size={14} color={T.text3} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Filter bottom sheet */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter</Text>
            <TouchableOpacity onPress={resetFilter}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            <FilterGroup label="Status (My Requests)" options={STATUS_OPTIONS} value={draft.status} onChange={v => setDraft(d => ({ ...d, status: v }))} />
            <FilterGroup label="Category" options={CATEGORY_OPTIONS} value={draft.category} onChange={v => setDraft(d => ({ ...d, category: v }))} />
            <FilterGroup label="Grade (Items)" options={GRADE_OPTIONS} value={draft.grade} onChange={v => setDraft(d => ({ ...d, grade: v }))} />
            <FilterGroup label="Freshness (Items)" options={FRESHNESS_OPTIONS} value={draft.freshness} onChange={v => setDraft(d => ({ ...d, freshness: v }))} />
          </ScrollView>
          <View style={styles.sheetFooter}>
            <Button label="Apply Filters" onPress={applyFilter} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const EmptyState: React.FC<{ title: string; subtitle: string; compact?: boolean; showClear?: boolean; onClear?: () => void }> = ({ title, subtitle, compact, showClear, onClear }) => (
  <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
    <View style={styles.emptyIconWrap}>
      <Icon name="search" size={compact ? 20 : 26} color={T.navy} />
    </View>
    <Text style={[styles.emptyTitle, compact && styles.emptyTitleCompact]} numberOfLines={2}>{title}</Text>
    <Text style={[styles.emptySubtitle, compact && styles.emptySubtitleCompact]} numberOfLines={compact ? 2 : 3}>{subtitle}</Text>
    {showClear && onClear && (
      <TouchableOpacity onPress={onClear} style={styles.emptyClearBtn} activeOpacity={0.7}>
        <Icon name="refresh" size={13} color={T.navy} />
        <Text style={styles.emptyClearText}>Clear all</Text>
      </TouchableOpacity>
    )}
  </View>
);

const FilterGroup: React.FC<{ label: string; options: string[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <View style={styles.fgWrap}>
    <Text style={styles.fgLabel}>{label}</Text>
    <View style={styles.fgChips}>
      {options.map(opt => {
        const selected = opt === value;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={[styles.fgChip, selected && styles.fgChipSelected]}>
            <Text style={[styles.fgChipText, selected && styles.fgChipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  pinned: { backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.hairline, paddingBottom: 12 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },
  filterBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.bg },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  quickActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  quickBtn: { flex: 1, height: 52, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: T.navy },

  hScroll: { paddingLeft: 16, paddingRight: 16, paddingBottom: 16, gap: 12 },

  // Items for Bid card — navy theme
  itemCard: { width: 248, borderRadius: 16, backgroundColor: T.card, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...T.shadowSoft },
  itemImg: { height: 110, backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemEmoji: { fontSize: 52 },
  saleTypePill: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  saleTypePillText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  itemBidsBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: T.amber, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  itemBidsBadgeText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  itemBody: { padding: 12, gap: 6 },
  itemName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },

  cardMetricsBox: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 2 },
  cardMetricCell: { flex: 1 },
  cardMetricBorder: { borderLeftWidth: 1, borderColor: '#E2E8F0', paddingLeft: 8 },
  cardMetricLabel: { fontSize: 9, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.3 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: T.navy, marginTop: 1, fontVariant: ['tabular-nums'] },
  cardMetricTotalVal: { fontSize: 14, fontWeight: '900', color: T.green, marginTop: 1, fontVariant: ['tabular-nums'] },

  itemTagsRow: { flexDirection: 'row', gap: 5, alignItems: 'center', marginTop: 2 },
  itemTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  itemTagText: { fontSize: 10, fontWeight: '700', color: T.text2 },
  freshTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#3B82F615', borderWidth: 1, borderColor: '#3B82F635' },
  freshTagText: { fontSize: 10, fontWeight: '700', color: '#1D4ED8' },

  itemDivider: { height: 1, backgroundColor: T.hairline, marginVertical: 2 },
  placeBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 38, borderRadius: 10, backgroundColor: T.amber },
  placeBidBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  buyNowBtn: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: T.navy },
  buyNowBtnText: { color: T.navy },

  // My Requests card — amber theme
  addReqTile: { width: 120, borderRadius: 14, borderWidth: 2, borderColor: `${T.amber}50`, borderStyle: 'dashed', backgroundColor: `${T.amber}10`, alignItems: 'center', justifyContent: 'center', gap: 10 },
  addReqCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${T.amber}20`, alignItems: 'center', justifyContent: 'center' },
  addReqText: { fontSize: 13, fontWeight: '700', color: T.amber, textAlign: 'center' },
  reqCardH: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, ...T.shadowSoft },
  reqAccent: { height: 3, backgroundColor: T.amber, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  reqImg: { height: 100, backgroundColor: `${T.amber}10`, alignItems: 'center', justifyContent: 'center', position: 'relative', borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  reqEmoji: { fontSize: 48 },
  reqStatusWrap: { position: 'absolute', top: 8, right: 8 },
  reqBody: { padding: 12, gap: 6 },
  reqProduct: { fontSize: 15, fontWeight: '800', color: T.text1 },
  reqSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  reqLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },
  reqPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  reqPrice: { fontSize: 16, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },
  reqExpiry: { fontSize: 10, color: T.text3, fontWeight: '600' },
  reqDivider: { height: 1, backgroundColor: T.hairline, marginTop: 2 },
  reqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reqProposalsWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  reqProposalsText: { fontSize: 11, color: T.text2, fontWeight: '600' },
  reqProposalsNum: { color: T.amber, fontWeight: '900' },
  reqNoProposalsText: { fontSize: 11, color: T.text3, fontStyle: 'italic' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: T.hairline, borderStyle: 'dashed', backgroundColor: T.card, gap: 6 },
  emptyStateCompact: { width: 280, height: 200, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center' },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptyTitleCompact: { fontSize: 13 },
  emptySubtitle: { fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  emptySubtitleCompact: { fontSize: 11, lineHeight: 16 },
  emptyClearBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: T.navy, backgroundColor: `${T.navy}08` },
  emptyClearText: { fontSize: 12, fontWeight: '700', color: T.navy },

  // Filter sheet
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,28,46,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: T.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, paddingBottom: 28 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: T.hairline, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: T.text1 },
  resetText: { fontSize: 13, fontWeight: '700', color: T.navy },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.hairline },
  fgWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  fgLabel: { fontSize: 12, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fgChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fgChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: T.hairline, backgroundColor: T.card },
  fgChipSelected: { borderColor: T.navy, backgroundColor: `${T.navy}10` },
  fgChipText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  fgChipTextSelected: { color: T.navy, fontWeight: '700' },
});
