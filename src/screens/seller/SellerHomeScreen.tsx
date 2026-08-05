import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, ActivityIndicator, Image, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Icon } from '../../components/ui/Icon';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { SELLER_BANNERS, productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

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

const getSeedSeconds = (guid: string) => {
  if (!guid) return 3600;
  let code = 0;
  for (let i = 0; i < guid.length; i++) {
    code += guid.charCodeAt(i);
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

export const SellerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { apiBaseUrl, token, setSelectedItem, setSelectedRequest } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  // API Data states
  const [topListings, setTopListings] = useState<any[]>([]);
  const [topRequests, setTopRequests] = useState<any[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const activeFilterCount =
    (filters.status !== 'All' ? 1 : 0) +
    (filters.category !== 'All' ? 1 : 0) +
    (filters.grade !== 'All' ? 1 : 0) +
    (filters.freshness !== 'All' ? 1 : 0);

  const openFilter = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilter = () => { setFilters(draft); setFilterOpen(false); };
  const resetFilter = () => setDraft(DEFAULT_FILTERS);

  // Fetch top 10 seller listings via /api/v1/listings/mine/top
  const fetchTopListings = async () => {
    setLoadingListings(true);
    try {
      const storedToken = token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
      const targetUrl = getApiUrl('/api/v1/listings/mine/top', apiBaseUrl);
      console.log(`Fetching seller top listings from: ${targetUrl}`);

      const res = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const data = await res.json();
        setTopListings(Array.isArray(data) ? data.slice(0, 10) : (data.items || []).slice(0, 10));
      } else {
        // Fallback to public listings if mine/top is empty or fails
        const pubRes = await fetch(getApiUrl('/api/v1/listings/public?pageSize=10', apiBaseUrl));
        if (pubRes.ok) {
          const pubData = await pubRes.json();
          setTopListings((pubData.items || []).slice(0, 10));
        }
      }
    } catch (err) {
      console.warn('Error fetching top seller listings:', err);
    } finally {
      setLoadingListings(false);
    }
  };

  // Fetch top 10 buyer requests via /api/v1/requests/mine/top or /api/v1/requests/public?pageSize=10
  const fetchTopRequests = async () => {
    setLoadingRequests(true);
    try {
      const storedToken = token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
      const targetUrl = getApiUrl('/api/v1/requests/mine/top', apiBaseUrl);
      console.log(`Fetching top buyer requests from: ${targetUrl}`);

      let res = await fetch(targetUrl, {
        headers: {
          'Authorization': `Bearer ${storedToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        // Fallback to public requests endpoint
        res = await fetch(getApiUrl('/api/v1/requests/public?pageSize=10', apiBaseUrl));
      }

      if (res.ok) {
        const data = await res.json();
        setTopRequests(Array.isArray(data) ? data.slice(0, 10) : (data.items || []).slice(0, 10));
      }
    } catch (err) {
      console.warn('Error fetching top buyer requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchTopListings();
    fetchTopRequests();
  }, []);

  const q = search.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    return topListings.filter(i => {
      const nameStr = (i.name || i.title || '').toLowerCase();
      const catStr = (i.category || i.subcategory || '').toLowerCase();
      const regStr = (i.region || i.branchName || '').toLowerCase();

      if (q && !(nameStr.includes(q) || catStr.includes(q) || regStr.includes(q))) return false;
      if (filters.status !== 'All' && (i.status || 'Live').toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.category !== 'All' && !catStr.includes(filters.category.toLowerCase())) return false;
      return true;
    });
  }, [topListings, q, filters]);

  const filteredRequests = useMemo(() => {
    return topRequests.filter(r => {
      const prodStr = (r.subcategory || r.category || r.product || '').toLowerCase();
      const locStr = (r.destinationRegion || r.branchName || r.loc || '').toLowerCase();

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
            {filteredItems.slice(0, 10).map(item => (
              <TouchableOpacity
                key={item.id}
                onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }}
                style={styles.itemCardCarousel}
                activeOpacity={0.88}
              >
                <View style={styles.itemAccent} />
                <View style={styles.itemImgBox}>
                  {item.images && item.images.length > 0 ? (
                    <Image
                      source={{ uri: item.images.find((img: any) => img.isCover)?.imageUrl || item.images[0].imageUrl }}
                      style={styles.itemCardImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.itemEmoji}>{productIcon(item.subcategory || item.category || item.name)}</Text>
                  )}
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedText}>✓ Verified</Text>
                  </View>
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name || item.title || 'Aqua Produce'}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    {item.subcategory || item.category || 'Seafood'} • {item.quantityRemaining || item.quantity || 100} {item.uom || 'kg'}
                  </Text>

                  <View style={styles.itemLocRow}>
                    <Icon name="mapPin" size={11} color={T.text3} />
                    <Text style={styles.itemLocText} numberOfLines={1}>
                      {item.region || item.branchName || 'Kakinada Hub'}
                    </Text>
                  </View>

                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>
                      {item.saleType === 'Auction' ? 'Auction' : (item.startingPrice ? `₹${item.startingPrice}/${item.uom || 'kg'}` : 'Direct Sale')}
                    </Text>
                    <CountdownTimer seedSeconds={getSeedSeconds(item.id)} compact />
                  </View>

                  <View style={styles.itemTagsRow}>
                    <View style={styles.itemTag}>
                      <Icon name="shield" size={10} color={T.navy} />
                      <Text style={styles.itemTagText}>Gr. {item.grade || 'A'}</Text>
                    </View>
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{item.freshness || 'Iced Fresh'}</Text>
                    </View>
                  </View>

                  <TouchableOpacity onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }} style={styles.placeBidBtn} activeOpacity={0.85}>
                    <Icon name="package" size={13} color="#fff" />
                    <Text style={styles.placeBidBtnText}>Manage Listing</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
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
            {filteredRequests.slice(0, 10).map(req => (
              <TouchableOpacity
                key={req.id}
                onPress={() => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); }}
                style={styles.itemCardCarousel}
                activeOpacity={0.88}
              >
                <View style={[styles.itemAccent, { backgroundColor: T.amber }]} />
                <View style={[styles.itemImgBox, { backgroundColor: `${T.amber}10` }]}>
                  {req.images && req.images.length > 0 ? (
                    <Image
                      source={{ uri: req.images.find((img: any) => img.isCover)?.imageUrl || req.images[0].imageUrl }}
                      style={styles.itemCardImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <Text style={styles.itemEmoji}>{productIcon(req.subcategory || req.category || req.product)}</Text>
                  )}
                  <View style={[styles.verifiedBadge, { backgroundColor: T.amber }]}>
                    <Text style={styles.verifiedText}>Buying Demand</Text>
                  </View>
                </View>

                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>{req.subcategory || req.category || req.product || 'Bulk Demand'}</Text>
                  <Text style={styles.itemSub} numberOfLines={1}>
                    Target Qty: {req.targetQuantity || req.quantity || 500} {req.uom || 'kg'}
                  </Text>

                  <View style={styles.itemLocRow}>
                    <Icon name="mapPin" size={11} color={T.text3} />
                    <Text style={styles.itemLocText} numberOfLines={1}>
                      {req.destinationRegion || req.branchName || req.loc || 'Kakinada Hub'}
                    </Text>
                  </View>

                  <View style={styles.itemPriceRow}>
                    <Text style={[styles.itemPrice, { color: T.amber }]}>
                      {req.targetPricePerUnit ? `₹${req.targetPricePerUnit}/${req.uom || 'kg'}` : 'Open Offer'}
                    </Text>
                    <CountdownTimer seedSeconds={getSeedSeconds(req.id)} compact />
                  </View>

                  <TouchableOpacity onPress={() => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); }} style={[styles.placeBidBtn, { backgroundColor: T.navy }]} activeOpacity={0.85}>
                    <Icon name="fileText" size={13} color="#fff" />
                    <Text style={styles.placeBidBtnText}>Submit Proposal</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
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
  itemCardCarousel: { width: 215, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImgBox: { height: 95, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemCardImg: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 48 },
  verifiedBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: T.green, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  verifiedText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  itemBody: { padding: 12, gap: 5 },
  itemName: { fontSize: 14, fontWeight: '900', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },
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
