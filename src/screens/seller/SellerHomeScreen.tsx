import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, ActivityIndicator, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Icon } from '../../components/ui/Icon';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { CategoryFilterBar } from '../../components/ui/CategoryFilterBar';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { SELLER_BANNERS, SELLER_ITEMS, BUYER_REQUESTS, productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';
import { StatusPill } from '../../components/ui/StatusPill';

type Nav = NativeStackNavigationProp<RootStackParams>;

const STATUS_OPTIONS = ['All', 'Live', 'Pending', 'Sold', 'Expired'];
const CATEGORY_OPTIONS = ['All', 'Fish', 'Prawn', 'Crab', 'Lobster', 'Squid'];
const GRADE_OPTIONS = ['All', 'A', 'B'];
const FRESHNESS_OPTIONS = ['All', 'Live', 'Fresh on ice'];

interface Filters {
  status: string;
  category: string;
  grade: string;
  freshness: string;
}

const DEFAULT_FILTERS: Filters = { status: 'All', category: 'All', grade: 'All', freshness: 'All' };

const getSeedSeconds = (guid: any) => {
  if (!guid) return 3600;
  const str = String(guid);
  let code = 0;
  for (let i = 0; i < str.length; i++) {
    code += str.charCodeAt(i);
  }
  return (code % 3600) + 1200;
};

const getApiUrl = (endpoint: string, base: string) => {
  let resolvedBase = base.trim();
  if (resolvedBase.endsWith('/')) {
    resolvedBase = resolvedBase.slice(0, -1);
  }
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
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

export const SellerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { apiBaseUrl, token, setSelectedItem, setSelectedRequest } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  // API Data states - initialized with default 10 items for guaranteed display
  const [topListings, setTopListings] = useState<any[]>(SELLER_ITEMS.slice(0, 10));
  const [topRequests, setTopRequests] = useState<any[]>(BUYER_REQUESTS.slice(0, 10));
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const activeFilterCount =
    (filters.status !== 'All' ? 1 : 0) +
    (filters.category !== 'All' ? 1 : 0) +
    (filters.grade !== 'All' ? 1 : 0) +
    (filters.freshness !== 'All' ? 1 : 0);

  const openFilter = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilter = () => { setFilters(draft); setFilterOpen(false); };
  const resetFilter = () => setDraft(DEFAULT_FILTERS);

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
        if (Array.isArray(val) && val.length > 0) {
          return val;
        }
        if (val && typeof val === 'object') {
          if (Array.isArray(val.items)) return val.items;
          if (Array.isArray(val.data)) return val.data;
          if (Array.isArray(val.listings)) return val.listings;
        }
      }
    }
    return [];
  };

  // Fetch top 10 seller listings for logged in seller via /api/v1/listings/mine
  const fetchTopListings = async () => {
    try {
      const storedToken = token ||
        (await AsyncStorage.getItem('sm_access_token')) ||
        (await AsyncStorage.getItem('sm_auth_token')) ||
        (await AsyncStorage.getItem('sm_token'));
      
      let itemsList: any[] = [];
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      // 1. Try GET /api/v1/listings/mine?page=1&pageSize=10
      try {
        const mineUrl = getApiUrl('/api/v1/listings/mine?page=1&pageSize=10', apiBaseUrl);
        console.log(`[SellerHomeScreen] 🚀 GET SELLER LISTINGS (mine): ${mineUrl}`);
        const mineRes = await fetch(mineUrl, { headers });
        if (mineRes.ok) {
          const mineData = await mineRes.json().catch(() => null);
          itemsList = extractItemsList(mineData);
          console.log(`[SellerHomeScreen] Extracted ${itemsList.length} seller listings from /listings/mine`);
        }
      } catch (e) {
        console.warn('[SellerHomeScreen] Error fetching /api/v1/listings/mine:', e);
      }

      // 2. Fallback to GET /api/v1/listings/mine/top
      if (itemsList.length === 0) {
        try {
          const topUrl = getApiUrl('/api/v1/listings/mine/top', apiBaseUrl);
          const topRes = await fetch(topUrl, { headers });
          if (topRes.ok) {
            const topData = await topRes.json().catch(() => null);
            itemsList = extractItemsList(topData);
          }
        } catch (e) {
          console.warn('[SellerHomeScreen] Error fetching /api/v1/listings/mine/top:', e);
        }
      }

      // 3. Fallback to public listings if seller has 0 listings
      if (itemsList.length === 0) {
        try {
          const pubUrl = getApiUrl('/api/v1/listings/public?pageSize=10', apiBaseUrl);
          const pubRes = await fetch(pubUrl);
          if (pubRes.ok) {
            const pubData = await pubRes.json().catch(() => null);
            itemsList = extractItemsList(pubData);
          }
        } catch (e) {
          console.warn('[SellerHomeScreen] Error fetching /api/v1/listings/public:', e);
        }
      }

      console.log(`[SellerHomeScreen] ✅ Final loaded top seller listings count: ${itemsList.length}`);
      if (itemsList.length > 0) {
        setTopListings(itemsList.slice(0, 10));
      }
    } catch (err) {
      console.warn('[SellerHomeScreen] Exception in fetchTopListings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch top 10 buyer requests posted by ALL buyers across SarwaMart (bypasses mine endpoint)
  const fetchTopRequests = async () => {
    try {
      const storedToken = token ||
        (await AsyncStorage.getItem('sm_access_token')) ||
        (await AsyncStorage.getItem('sm_auth_token')) ||
        (await AsyncStorage.getItem('sm_token'));

      let reqList: any[] = [];
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (storedToken) headers['Authorization'] = `Bearer ${storedToken}`;

      // 1. Fetch public buyer requests across platform: GET /api/v1/requests/public?pageSize=10
      try {
        const pubUrl = getApiUrl('/api/v1/requests/public?pageSize=10', apiBaseUrl);
        console.log(`[SellerHomeScreen] 🚀 GET ALL BUYER REQUESTS (public): ${pubUrl}`);
        const pubRes = await fetch(pubUrl);
        if (pubRes.ok) {
          const pubData = await pubRes.json().catch(() => null);
          reqList = extractItemsList(pubData);
          console.log(`[SellerHomeScreen] Extracted ${reqList.length} requests from /requests/public`);
        }
      } catch (e) {
        console.warn('[SellerHomeScreen] Error fetching /api/v1/requests/public:', e);
      }

      // 2. Fallback to GET /api/v1/requests?page=1&pageSize=10
      if (reqList.length === 0) {
        try {
          const genUrl = getApiUrl('/api/v1/requests?page=1&pageSize=10', apiBaseUrl);
          console.log(`[SellerHomeScreen] 🚀 GET ALL BUYER REQUESTS (all): ${genUrl}`);
          const genRes = await fetch(genUrl, { headers });
          if (genRes.ok) {
            const genData = await genRes.json().catch(() => null);
            reqList = extractItemsList(genData);
            console.log(`[SellerHomeScreen] Extracted ${reqList.length} requests from /requests`);
          }
        } catch (e) {
          console.warn('[SellerHomeScreen] Error fetching /api/v1/requests:', e);
        }
      }

      console.log(`[SellerHomeScreen] ✅ Final loaded top buyer requests count: ${reqList.length}`);
      if (reqList.length > 0) {
        setTopRequests(reqList.slice(0, 10));
      }
    } catch (err) {
      console.warn('[SellerHomeScreen] Error fetching top buyer requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Re-fetch top 10 listings & requests after seller login or whenever returning to Seller Landing screen
  useFocusEffect(
    useCallback(() => {
      fetchTopListings();
      fetchTopRequests();
    }, [apiBaseUrl, token])
  );

  const q = search.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    if (!topListings || topListings.length === 0) return [];
    
    // Default: if no search query and filters are 'All', return topListings directly
    if (!q && filters.status === 'All' && filters.category === 'All' && filters.grade === 'All' && filters.freshness === 'All') {
      return topListings;
    }

    return topListings.filter(i => {
      const nameStr = (i.name || i.title || i.description || '').toLowerCase();
      const catStr = (i.subcategoryName || i.categoryName || i.category || i.subcategory || '').toLowerCase();
      const regStr = (i.region || i.branchName || i.port || '').toLowerCase();

      if (q && !(nameStr.includes(q) || catStr.includes(q) || regStr.includes(q))) return false;
      if (filters.status !== 'All') {
        const itemStatus = (i.status || '').toLowerCase();
        if (itemStatus && !itemStatus.includes(filters.status.toLowerCase())) return false;
      }
      if (filters.category !== 'All') {
        if (catStr && !catStr.includes(filters.category.toLowerCase())) return false;
      }
      return true;
    });
  }, [topListings, q, filters]);

  const filteredRequests = useMemo(() => {
    if (!topRequests || topRequests.length === 0) return [];

    if (!q && filters.category === 'All') {
      return topRequests;
    }

    return topRequests.filter(r => {
      const prodStr = (r.subcategoryName || r.categoryName || r.productName || r.subcategory || r.category || r.product || r.title || r.name || '').toLowerCase();
      const locStr = (r.destinationRegion || r.region || r.branchName || r.loc || '').toLowerCase();

      if (q && !(prodStr.includes(q) || locStr.includes(q))) return false;
      if (filters.category !== 'All' && !prodStr.includes(filters.category.toLowerCase())) return false;
      return true;
    });
  }, [topRequests, q, filters]);

  return (
    <View style={styles.container}>
      <AppBar />

      {/* Pinned region — banner carousel + search bar stay visible while the lists scroll */}
      <View style={styles.pinned}>
        <BannerCarousel banners={SELLER_BANNERS} />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.navy} />
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
          <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
            <Icon name="filter" size={16} color={T.navy} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Top Category Filter Bar */}
        <CategoryFilterBar
          selectedCategory={filters.category}
          onSelectCategory={(c) => setFilters(f => ({ ...f, category: c }))}
          title=""
        />
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* CAROUSEL 1: My Items for Bid — Public Dashboard Card Styling */}
        <SectionHeader
          title="My Items for Bid"
          accent="navy"
          badge={{ label: 'Your listings (Top 10)', color: 'navy' }}
          onSeeAll={() => nav.navigate('MyItems')}
        />
        {loadingListings ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={T.navy} />
            <Text style={styles.loaderText}>Loading top listings...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollBox}>
            {!q && (
              <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.addTileCard}>
                <View style={styles.addCircle}><Icon name="plus" size={20} color={T.navy} /></View>
                <Text style={styles.addText}>Add new{'\n'}item</Text>
              </TouchableOpacity>
            )}
            {filteredItems.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No listings found</Text>
              </View>
            )}
            {filteredItems.slice(0, 10).map((item, idx) => {
              const itemImgUri = getItemImageUri(item);
              const displaySub = item.subcategoryName || item.categoryName || item.subcategory || item.category || 'Seafood';
              const displayQty = item.quantity ? `${item.quantity} ${item.uom || 'kg'}` : (item.quantityRemaining || item.qty || '100 kg');
              const displayRegion = item.region || item.branchName || item.port || 'Kakinada Port';
              const displayPrice = item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}/${item.uom || 'kg'}` : (item.price || (item.startingPrice ? `₹${item.startingPrice}` : '₹0.00'));
              const displayGrade = item.grade ? (item.grade.startsWith('Grade') || item.grade.startsWith('Gr.') ? item.grade : `Gr. ${item.grade}`) : 'Gr. A';
              const displayFreshness = item.freshness === 'FreshOnIce' ? 'Fresh on Ice' : (item.freshness || 'Fresh on Ice');

              const qtyNum = parseFloat(String(item.quantity || item.quantityRemaining || item.qty || '0').replace(/[^0-9.]/g, '')) || 0;
              const unitPriceNum = item.pricePerUnit ?? (item.priceNum ?? (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : 0));
              const totalVal = qtyNum * unitPriceNum;
              const displayTotal = totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : null;

              const getAccentColor = (statusVal: any) => {
                const s = String(statusVal || '').toLowerCase().replace(/[\s_-]/g, '');
                if (s === '1' || s === 'draft') return '#9CA3AF'; // Draft = 1 (Neutral Gray)
                if (s === '2' || s.includes('pending') || s.includes('submitted')) return '#F59E0B'; // PendingApproval = 2 (Warm Amber)
                if (s === '3' || s.includes('live') || s.includes('active') || s.includes('published')) return '#16A34A'; // Live = 3 (Forest Green)
                if (s === '4' || s.includes('reject')) return '#EF4444'; // Rejected = 4 (Red Alert)
                if (s === '5' || s.includes('partiallyallocated')) return '#14B8A6'; // PartiallyAllocated = 5 (Teal / Cyan)
                if (s === '6' || s.includes('sold')) return '#64748B'; // SoldOut = 6 (Cool Slate)
                if (s === '7' || s.includes('expired')) return '#E11D48'; // Expired = 7 (Rose Red)
                if (s === '8' || s.includes('cancel')) return '#DC2626'; // Cancelled = 8 (Muted Red)
                return T.navy;
              };

              const itemStatus = item.status ?? item.listingStatus ?? item.approvalStatus ?? item.statusName ?? item.state ?? (item.isPending ? 'PendingApproval' : 'Live');

              return (
                <TouchableOpacity
                  key={item.id || `seller_item_${idx}`}
                  onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }}
                  style={styles.itemCardCarousel}
                  activeOpacity={0.88}
                >
                  <View style={[styles.itemAccent, { backgroundColor: getAccentColor(itemStatus) }]} />
                  <View style={styles.itemImgBox}>
                    {itemImgUri ? (
                      <Image source={{ uri: itemImgUri }} style={styles.itemCardImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.itemEmoji}>{productIcon(displaySub || item.name)}</Text>
                    )}
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verified</Text>
                    </View>
                  </View>

                  <View style={styles.itemBody}>
                    <View style={styles.itemHeaderRow}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name || item.title || 'Aqua Produce'}</Text>
                      <StatusPill status={itemStatus} />
                    </View>

                    <View style={styles.itemTagsRow}>
                      <View style={styles.itemTag}>
                        <Icon name="shield" size={10} color={T.navy} />
                        <Text style={styles.itemTagText}>{displayGrade}</Text>
                      </View>
                      <View style={styles.itemTag}>
                        <Text style={styles.itemTagText}>{displayFreshness}</Text>
                      </View>
                    </View>

                    <Text style={styles.itemSub} numberOfLines={1}>
                      {displaySub} • {displayQty}
                    </Text>

                    <View style={styles.itemLocRow}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.itemLocText} numberOfLines={1}>
                        {displayRegion}
                      </Text>
                    </View>

                    <View style={styles.cardPriceBox}>
                      <View style={styles.cardPriceRow}>
                        <Text style={styles.cardPriceUnitLabel}>Unit:</Text>
                        <Text style={styles.cardPriceUnit}>{displayPrice}</Text>
                      </View>
                      {displayTotal && (
                        <View style={styles.cardPriceRow}>
                          <Text style={styles.cardTotalLabel}>Total:</Text>
                          <Text style={styles.cardTotalVal}>{displayTotal}</Text>
                        </View>
                      )}
                    </View>

                    <TouchableOpacity onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }} style={styles.placeBidBtn} activeOpacity={0.85}>
                      <Icon name="package" size={13} color="#fff" />
                      <Text style={styles.placeBidBtnText}>Manage Listing</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* CAROUSEL 2: Buyer Requests — Public Dashboard Card Styling */}
        <SectionHeader
          title="Buyer Requests"
          accent="amber"
          badge={{ label: 'Top 10 Buyer Demands', color: 'amber' }}
          onSeeAll={() => nav.navigate('BuyerRequestsList')}
        />
        {loadingRequests ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={T.amber} />
            <Text style={styles.loaderText}>Loading buyer requests...</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollBox}>
            {filteredRequests.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No buyer requests found</Text>
              </View>
            )}
            {filteredRequests.slice(0, 10).map((req, idx) => {
              const reqImgUri = req.imageUrl || req.defaultImageThumbnailUrl || req.thumbnailUrl ||
                (Array.isArray(req.images) && req.images.length > 0
                  ? (typeof req.images[0] === 'string' ? req.images[0] : (req.images[0].imageUrl || req.images[0].url))
                  : null);

              const displayProd = req.subcategoryName || req.categoryName || req.productName || req.subcategory || req.category || req.product || req.title || req.name || 'Seafood Demand';
              const displayQty = req.targetQuantity ? `${req.targetQuantity} ${req.uom || 'kg'}` : (req.quantity ? `${req.quantity} ${req.uom || 'kg'}` : (req.qty || '500 kg'));
              const displayLoc = req.destinationRegion || req.region || req.branchName || req.loc || 'Kakinada Hub';

              const rawPrice = req.targetPricePerUnit || req.maxPricePerUnit || req.pricePerUnit || req.price || req.targetPrice;
              const displayPrice = rawPrice ? `₹${typeof rawPrice === 'number' ? rawPrice.toFixed(2) : rawPrice}/${req.uom || 'kg'}` : 'Open Offer';

              return (
                <TouchableOpacity
                  key={req.id || `buyer_req_${idx}`}
                  onPress={() => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); }}
                  style={styles.itemCardCarousel}
                  activeOpacity={0.88}
                >
                  <View style={[styles.itemAccent, { backgroundColor: T.amber }]} />
                  <View style={[styles.itemImgBox, { backgroundColor: `${T.amber}10` }]}>
                    {reqImgUri ? (
                      <Image source={{ uri: reqImgUri }} style={styles.itemCardImg} resizeMode="cover" />
                    ) : (
                      <Text style={styles.itemEmoji}>{productIcon(displayProd)}</Text>
                    )}
                    <View style={[styles.verifiedBadge, { backgroundColor: T.amber }]}>
                      <Text style={styles.verifiedText}>Buying Demand</Text>
                    </View>
                  </View>

                  <View style={styles.itemBody}>
                    <Text style={styles.itemName} numberOfLines={1}>{displayProd}</Text>
                    <Text style={styles.itemSub} numberOfLines={1}>
                      Target Qty: {displayQty}
                    </Text>

                    <View style={styles.itemLocRow}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.itemLocText} numberOfLines={1}>
                        {displayLoc}
                      </Text>
                    </View>

                    <View style={styles.itemPriceRow}>
                      <Text style={[styles.itemPrice, { color: T.amber }]}>{displayPrice}</Text>
                      <CountdownTimer seedSeconds={getSeedSeconds(req.id || `seed_req_${idx}`)} compact />
                    </View>

                    <TouchableOpacity onPress={() => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); }} style={[styles.placeBidBtn, { backgroundColor: T.navy }]} activeOpacity={0.85}>
                      <Icon name="fileText" size={13} color="#fff" />
                      <Text style={styles.placeBidBtnText}>Submit Proposal</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Filter modal */}
      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Listings & Requests</Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 16, color: T.text3 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Status</Text>
              <View style={styles.chipRow}>
                {STATUS_OPTIONS.map(s => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setDraft(d => ({ ...d, status: s }))}
                    style={[styles.chip, draft.status === s && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, draft.status === s && styles.chipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.chipRow}>
                {CATEGORY_OPTIONS.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setDraft(d => ({ ...d, category: c }))}
                    style={[styles.chip, draft.category === c && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, draft.category === c && styles.chipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Grade</Text>
              <View style={styles.chipRow}>
                {GRADE_OPTIONS.map(g => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setDraft(d => ({ ...d, grade: g }))}
                    style={[styles.chip, draft.grade === g && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, draft.grade === g && styles.chipTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Freshness</Text>
              <View style={styles.chipRow}>
                {FRESHNESS_OPTIONS.map(f => (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setDraft(d => ({ ...d, freshness: f }))}
                    style={[styles.chip, draft.freshness === f && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, draft.freshness === f && styles.chipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button label="Reset All" variant="secondary" onPress={resetFilter} style={{ flex: 1 }} />
              <Button label="Apply Filters" variant="primary" onPress={applyFilter} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  pinned: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 6, gap: 10, backgroundColor: '#F1F5F9' },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 13, color: T.text1, paddingVertical: 0 },
  clearText: { fontSize: 14, color: T.text3, paddingHorizontal: 4 },
  filterBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: T.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  topCatBar: { paddingBottom: 2, paddingTop: 4, gap: 8 },
  topCatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  topCatChipActive: {
    backgroundColor: T.navy,
    borderColor: T.navy,
  },
  topCatEmoji: { fontSize: 13 },
  topCatText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  topCatTextActive: { color: '#FFFFFF', fontWeight: '800' },

  loaderBox: { paddingVertical: 24, alignItems: 'center', gap: 8 },
  loaderText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  emptyBox: { paddingHorizontal: 20, paddingVertical: 20 },
  emptyText: { fontSize: 13, color: T.text3 },

  hScrollBox: { paddingLeft: 16, paddingRight: 16, gap: 12, paddingVertical: 6 },
  addTileCard: {
    width: 140,
    height: 245,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: `${T.navy}30`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  addCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${T.navy}12`, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 12, fontWeight: '800', color: T.navy, textAlign: 'center', lineHeight: 16 },

  // Public Dashboard Card Styling
  itemCardCarousel: { width: 225, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImgBox: { height: 95, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemCardImg: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 48 },
  verifiedBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: T.green, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  verifiedText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  itemBody: { padding: 12, gap: 5 },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  itemName: { flex: 1, fontSize: 14, fontWeight: '900', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },

  cardPriceBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 2,
  },
  cardPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardPriceUnitLabel: { fontSize: 10, fontWeight: '700', color: T.text3 },
  cardPriceUnit: { fontSize: 13, fontWeight: '900', color: T.navy },
  cardTotalLabel: { fontSize: 10, fontWeight: '800', color: T.green },
  cardTotalVal: { fontSize: 13, fontWeight: '900', color: T.green },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: T.navy },
  itemTagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  itemTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  itemTagText: { fontSize: 9, fontWeight: '700', color: T.navy },
  placeBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 10, backgroundColor: T.amber, marginTop: 4 },
  placeBidBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '900', color: T.text1 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  filterLabel: { fontSize: 11, fontWeight: '800', color: T.text3, textTransform: 'uppercase', marginTop: 10, marginBottom: 6 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  chipTextActive: { color: '#FFFFFF', fontWeight: '800' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 14 },
});
