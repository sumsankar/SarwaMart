import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { StatusPill } from '../../components/ui/StatusPill';
import { T } from '../../constants/tokens';
import { getMyBidForItem } from '../../constants/mockData';
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

const productIcon = (nameStr?: string) => {
  const n = String(nameStr || '').toLowerCase();
  if (n.includes('prawn') || n.includes('shrimp') || n.includes('vannamei')) return '🦐';
  if (n.includes('crab')) return '🦀';
  if (n.includes('lobster')) return '🦞';
  if (n.includes('squid')) return '🦑';
  return '🐟';
};

export const ItemDetailBuyerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem, token, apiBaseUrl, setSelectedItem, showToast } = useAppStore();
  const [detailedItem, setDetailedItem] = useState<any>(selectedItem);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const item = detailedItem || selectedItem;
  const myBid = item ? getMyBidForItem(item.id) : null;
  const imgUri = getItemImageUri(item);

  // GET listing details by listing ID: GET /api/v1/listings/{id}
  useEffect(() => {
    const fetchListingDetail = async () => {
      const listingId = selectedItem?.id || selectedItem?.listingId;
      if (!listingId) return;

      setLoadingDetail(true);
      try {
        const activeToken = token ||
          (await AsyncStorage.getItem('sm_access_token')) ||
          (await AsyncStorage.getItem('sm_auth_token'));
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        let url = getApiUrl(`/api/v1/listings/${listingId}`, apiBaseUrl);
        console.log(`[ItemDetailBuyerScreen] 🚀 GET LISTING BY ID: ${url}`);
        let res = await fetch(url, { headers });

        if (!res.ok) {
          url = getApiUrl(`/api/v1/listings/public/${listingId}`, apiBaseUrl);
          console.log(`[ItemDetailBuyerScreen] 🔄 Fallback GET public listing BY ID: ${url}`);
          res = await fetch(url);
        }

        if (res.ok) {
          const data = await res.json();
          console.log('[ItemDetailBuyerScreen] GET listing by ID success payload:', data);
          const merged = { ...selectedItem, ...data };
          setDetailedItem(merged);
          setSelectedItem(merged);
        } else {
          console.warn(`[ItemDetailBuyerScreen] GET listing by ID returned status ${res.status}`);
        }
      } catch (err) {
        console.warn('[ItemDetailBuyerScreen] Error fetching listing by ID:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchListingDetail();
  }, [selectedItem?.id, selectedItem?.listingId]);

  const acceptBid = () => {
    showToast(`Accepted at ${myBid?.price}. Invoice generated.`, 'success');
    nav.navigate('InvoiceList');
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title={item?.name || item?.title || 'Listing Detail'}
        onBack={() => nav.goBack()}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity><Icon name="heart" size={20} color={T.text2} /></TouchableOpacity>
            <TouchableOpacity><Icon name="share" size={20} color={T.text2} /></TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: myBid ? 24 : 100 }}>
        {/* Gallery */}
        <View style={styles.gallery}>
          {imgUri ? (
            <Image source={{ uri: imgUri }} style={styles.galleryImg} resizeMode="cover" />
          ) : (
            <Text style={styles.galleryEmoji}>{productIcon(item?.subcategoryName || item?.categoryName || item?.subcategory || item?.name)}</Text>
          )}
        </View>

        <View style={styles.body}>
          {/* Status & Sale Type Row */}
          {(() => {
            const saleTypeVal = item?.saleType || item?.tradeType || item?.listingType || item?.type || 'Auction';
            const categoryVal = item?.categoryName || item?.category || 'Shrimp & Prawns';
            const subcategoryVal = item?.subcategoryName || item?.subcategory || item?.sub || 'Vannamei Shrimp';

            return (
              <>
                <View style={styles.compactStatusRow}>
                  <StatusPill status={item?.status || item?.listingStatus || item?.approvalStatus || 'Live'} />
                  <View style={styles.saleTypeBadge}>
                    <Text style={styles.saleTypeBadgeText}>⚡ {saleTypeVal}</Text>
                  </View>
                </View>

                {/* Title + price */}
                <View style={styles.titleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item?.name || item?.title || 'Seafood Listing'}</Text>
                    <View style={styles.categorySubRow}>
                      <Text style={styles.categorySubText}>
                        {categoryVal} <Text style={styles.dotSeparator}>•</Text> <Text style={styles.subTextBold}>{subcategoryVal}</Text>
                      </Text>
                    </View>
                  </View>
                  <View style={styles.priceBlock}>
                    <Text style={styles.priceLabel}>Starting at</Text>
                    <Text style={styles.price}>₹{item?.priceNum || item?.pricePerUnit || '145'}</Text>
                    <Text style={styles.uom}>per {formatUom(item?.uom)}</Text>
                  </View>
                </View>
              </>
            );
          })()}

          {/* Live bids strip */}
          <View style={styles.bidStrip}>
            <Text style={styles.bidStripText}>Currently <Text style={styles.bidCount}>{item?.bids || 6} bids</Text></Text>
            <CountdownTimer seedSeconds={item ? item.id * 9341 + 2700 : 28800} compact />
          </View>

          {/* Your bid */}
          {myBid && (
            <View style={styles.myBidCard}>
              <View style={styles.myBidAccent} />
              <View style={styles.myBidBody}>
                <View style={styles.myBidHeader}>
                  <Text style={styles.myBidLabel}>Your Latest Bid</Text>
                  <StatusPill status={myBid.status} />
                </View>
                <View style={styles.myBidPriceRow}>
                  <Text style={styles.myBidPrice}>{myBid.price}</Text>
                  <View style={styles.myBidQtyChip}>
                    <Icon name="package" size={12} color={T.amber} />
                    <Text style={styles.myBidQtyText}>{myBid.qty}</Text>
                  </View>
                </View>
                <View style={styles.myBidMetaRow}>
                  <Icon name="clock" size={12} color={T.text3} />
                  <Text style={styles.myBidMetaText}>Placed {myBid.placedAt}</Text>
                </View>
                {myBid.exchanges > 0 && (
                  <View style={styles.myBidThreadRow}>
                    <Icon name="msgCircle" size={12} color={T.navy} />
                    <Text style={styles.myBidThreadText}>
                      <Text style={styles.myBidThreadNum}>{myBid.exchanges}</Text> {myBid.exchanges === 1 ? 'message' : 'messages'} in thread
                    </Text>
                  </View>
                )}
                <View style={styles.myBidActions}>
                  <TouchableOpacity onPress={() => nav.navigate('Negotiation')} style={styles.threadBtn} activeOpacity={0.85}>
                    <Icon name="msgCircle" size={14} color={T.navy} />
                    <Text style={styles.threadBtnText}>View Thread</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => nav.navigate('PlaceBid')} style={styles.updateBtn} activeOpacity={0.85}>
                    <Icon name="edit" size={13} color="#fff" />
                    <Text style={styles.updateBtnText}>Update Bid</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={acceptBid} style={styles.acceptBtn} activeOpacity={0.85}>
                  <Icon name="check" size={15} color="#fff" />
                  <Text style={styles.acceptBtnText}>Accept at {myBid.price}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Specs & Attributes Grid */}
          {(() => {
            const getParsedSpecifications = (itemData: any) => {
              const specs: [string, string][] = [];

              // 1. Quantity
              const qtyStr = itemData?.quantity ? `${itemData.quantity} ${itemData.uom || 'kg'}` : (itemData?.quantityRemaining ? `${itemData.quantityRemaining} ${itemData.uom || 'kg'}` : (itemData?.qty || 'N/A'));
              specs.push(['Quantity Available', String(qtyStr)]);

              // 2. Count / Size
              if (itemData?.countSize || itemData?.count || itemData?.size) {
                specs.push(['Count / Size', String(itemData.countSize || itemData.count || itemData.size)]);
              }

              // 3. Processing & Packaging
              if (itemData?.processing || itemData?.processingType) {
                specs.push(['Processing', String(itemData.processing || itemData.processingType)]);
              }
              if (itemData?.packaging || itemData?.packagingType) {
                specs.push(['Packaging', String(itemData.packaging || itemData.packagingType)]);
              }

              // 6. Dynamic API Specifications Array/Object
              const rawSpecs = itemData?.specifications || itemData?.specs || itemData?.attributes;
              if (Array.isArray(rawSpecs)) {
                rawSpecs.forEach((s: any) => {
                  if (s && typeof s === 'object') {
                    const k = s.name || s.key || s.title || s.specKey;
                    const v = s.value || s.val || s.specValue;
                    if (k && v) specs.push([String(k), String(v)]);
                  }
                });
              } else if (rawSpecs && typeof rawSpecs === 'object') {
                Object.entries(rawSpecs).forEach(([k, v]) => {
                  if (k && v !== undefined && v !== null) {
                    specs.push([String(k), typeof v === 'object' ? JSON.stringify(v) : String(v)]);
                  }
                });
              }

              return specs;
            };

            const specList = getParsedSpecifications(item);

            return (
              <>
                {specList.length > 0 && (
                  <Card style={styles.infoCard}>
                    <Text style={styles.specsHeaderTitle}>Item Specifications</Text>
                    <View style={styles.infoGrid}>
                      {specList.map(([k, v], i) => (
                        <View key={`${k}_${i}`} style={styles.infoCell}>
                          <Text style={styles.infoCellKey}>{k}</Text>
                          <Text style={styles.infoCellVal}>{v}</Text>
                        </View>
                      ))}
                    </View>
                  </Card>
                )}
              </>
            );
          })()}

          {/* Dimensions Section */}
          {(() => {
            const getParsedDimensions = (itemData: any): [string, string][] => {
              const dims: [string, string][] = [];
              const rawDims = itemData?.dimensions || itemData?.dimension || itemData?.dimensionValues || itemData?.listingDimensions;

              if (!rawDims) return dims;

              if (Array.isArray(rawDims)) {
                rawDims.forEach((d: any) => {
                  if (typeof d === 'string' || typeof d === 'number') {
                    dims.push(['Dimension', String(d)]);
                  } else if (d && typeof d === 'object') {
                    const k = d.name || d.dimensionName || d.key || d.title || d.label || d.specKey || 'Dimension';
                    const v = d.value || d.val || d.dimensionValue || d.size || d.specValue;
                    const unit = d.uom || d.unit ? ` ${d.uom || d.unit}` : '';
                    if (k && v !== undefined && v !== null) {
                      dims.push([String(k), `${v}${unit}`]);
                    }
                  }
                });
              } else if (typeof rawDims === 'object') {
                Object.entries(rawDims).forEach(([k, v]) => {
                  if (k && v !== undefined && v !== null && typeof v !== 'function') {
                    const keyFormatted = k.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    dims.push([keyFormatted, typeof v === 'object' ? JSON.stringify(v) : String(v)]);
                  }
                });
              } else if (typeof rawDims === 'string' || typeof rawDims === 'number') {
                dims.push(['Dimensions', String(rawDims)]);
              }

              return dims;
            };

            const dimList = getParsedDimensions(item);
            if (dimList.length === 0) return null;

            return (
              <Card style={styles.infoCard}>
                <Text style={styles.specsHeaderTitle}>Product Dimensions</Text>
                <View style={styles.infoGrid}>
                  {dimList.map(([k, v], i) => (
                    <View key={`${k}_${i}`} style={styles.infoCell}>
                      <Text style={styles.infoCellKey}>{k}</Text>
                      <Text style={styles.infoCellVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })()}

          {/* Seller card — anonymized: buyer never sees seller's real identity */}
          <Card style={styles.sellerCard}>
            <View style={styles.sellerInner}>
              <Avatar name={`Seller ${item?.id ?? ''}`} size={44} bg={T.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>Seller #{2030 + (item?.id ?? 0)}</Text>
                <View style={styles.sellerMeta}>
                  <Text style={styles.sellerRating}>★ 4.8</Text>
                  <Text style={styles.sellerDeals}>43 deals</Text>
                  <Text style={styles.sellerVerified}>✓ Verified</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.sellerProfileBtn}>
                <Text style={styles.sellerProfileText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Location */}
          <Card>
            <View style={styles.locInner}>
              <Icon name="mapPin" size={20} color={T.navy} />
              <View>
                <Text style={styles.locName}>{item?.region || 'West Godavari, AP'}</Text>
                <Text style={styles.locDelivery}>Delivery available up to 120 km</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky CTA — only when no bid placed yet */}
      {!myBid && (
        <View style={styles.cta}>
          <Button label="Place a Bid" fullWidth onPress={() => nav.navigate('PlaceBid')} style={styles.ctaBtn} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  headerRight: { flexDirection: 'row', gap: 8 },
  gallery: { height: 220, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  galleryImg: { width: '100%', height: '100%' },
  galleryEmoji: { fontSize: 90 },
  body: { padding: 16, gap: 14 },
  compactStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  saleTypeBadge: { backgroundColor: `${T.navy}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: `${T.navy}20` },
  saleTypeBadgeText: { fontSize: 11, fontWeight: '800', color: T.navy },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 20, fontWeight: '900', color: T.text1 },
  categorySubRow: { marginTop: 2, marginBottom: 2 },
  categorySubText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  dotSeparator: { color: T.text3, marginHorizontal: 2 },
  subTextBold: { color: T.navy, fontWeight: '800' },
  itemSub: { fontSize: 14, color: T.text2, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: T.text3 },
  price: { fontSize: 28, fontWeight: '900', color: T.navy },
  uom: { fontSize: 12, color: T.text2 },
  bidStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.amber}12`, borderWidth: 1, borderColor: `${T.amber}30` },
  bidStripText: { fontSize: 13, color: T.text2 },
  bidCount: { fontWeight: '700', color: T.text1 },
  infoCard: { marginBottom: 0, padding: 14 },
  specsHeaderTitle: { fontSize: 13, fontWeight: '800', color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoCell: { width: '47%' },
  infoCellKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3 },
  infoCellVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },
  sellerCard: { marginBottom: 0 },
  sellerInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  sellerName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  sellerMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  sellerRating: { fontSize: 12, color: T.amber },
  sellerDeals: { fontSize: 12, color: T.text3 },
  sellerVerified: { fontSize: 12, color: T.green, fontWeight: '600' },
  sellerProfileBtn: { borderWidth: 1.5, borderColor: T.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sellerProfileText: { fontSize: 12, fontWeight: '700', color: T.navy },
  locInner: { padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  locName: { fontSize: 14, fontWeight: '700', color: T.text1 },
  locDelivery: { fontSize: 12, color: T.green },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  ctaBtn: { height: 52, borderRadius: 14 },

  // Your Latest Bid card
  myBidCard: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  myBidAccent: { height: 3, backgroundColor: T.amber },
  myBidBody: { padding: 14, gap: 8 },
  myBidHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  myBidLabel: { fontSize: 11, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  myBidPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  myBidPrice: { fontSize: 24, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },
  myBidQtyChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, backgroundColor: `${T.amber}15` },
  myBidQtyText: { fontSize: 12, fontWeight: '800', color: T.amber },
  myBidMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  myBidMetaText: { fontSize: 12, color: T.text3 },
  myBidThreadRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  myBidThreadText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  myBidThreadNum: { color: T.navy, fontWeight: '900' },
  myBidActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  threadBtn: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: T.navy, backgroundColor: `${T.navy}06` },
  threadBtnText: { fontSize: 13, fontWeight: '800', color: T.navy },
  updateBtn: { flex: 1, height: 40, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: T.amber },
  updateBtnText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  acceptBtn: { height: 46, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: T.green, marginTop: 6, shadowColor: T.green, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3 },
  acceptBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
});
