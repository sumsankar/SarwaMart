import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
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

  const saleTypeVal = item.saleType || item.tradeType || item.listingType || item.type || 'Auction';
  const isDirectSale = saleTypeVal === 'DirectSale';

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title={item.name || item.title || 'Listing Detail'}
        onBack={() => nav.goBack()}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity hitSlop={8}><Icon name="heart" size={20} color={T.text2} /></TouchableOpacity>
            <TouchableOpacity hitSlop={8}><Icon name="share" size={20} color={T.text2} /></TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: myBid ? 24 : 100 }} showsVerticalScrollIndicator={false}>
        {/* Compact Hero Card */}
        <View style={styles.heroCardContainer}>
          <View style={styles.compactHeroCard}>
            {/* Left Image Box */}
            <View style={styles.compactImgBox}>
              {imgUri ? (
                <Image source={{ uri: imgUri }} style={styles.compactImg} resizeMode="cover" />
              ) : (
                <Text style={styles.compactEmoji}>{productIcon(item.subcategoryName || item.categoryName || item.subcategory || item.name)}</Text>
              )}
              <View style={styles.verifiedStamp}>
                <Icon name="shield" size={10} color="#fff" />
                <Text style={styles.verifiedStampText}>Verified</Text>
              </View>
            </View>

            {/* Right Info Box */}
            {(() => {
              const categoryVal = item.categoryName || item.category || 'Shrimp & Prawns';
              const subcategoryVal = item.subcategoryName || item.subcategory || item.sub || 'Vannamei Shrimp';

              return (
                <View style={styles.compactHeroInfo}>
                  {/* Status & Sale Type Row */}
                  <View style={styles.compactStatusRow}>
                    <StatusPill status={item.status || item.listingStatus || item.approvalStatus || 'Live'} />
                    <View style={styles.saleTypeBadge}>
                      <Text style={styles.saleTypeBadgeText}>⚡ {saleTypeVal}</Text>
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <CountdownTimer seedSeconds={item.id * 9341 + 2700} compact />
                    </View>
                  </View>

                  {/* Listing Name */}
                  <Text style={styles.itemName} numberOfLines={1}>{item.name || item.title || 'Seafood Listing'}</Text>

                  {/* Category & Subcategory below Listing Name */}
                  <View style={styles.categorySubRow}>
                    <Text style={styles.categorySubText}>
                      {categoryVal} <Text style={styles.dotSeparator}>•</Text> <Text style={styles.subTextBold}>{subcategoryVal}</Text>
                    </Text>
                  </View>

                  {/* Grade, Freshness & Location Tag Row */}
                  <View style={styles.tagRow}>
                    {item.grade && (
                      <View style={styles.gradeTag}>
                        <Text style={styles.gradeTagText}>{item.grade.startsWith('Gr') ? item.grade : `Gr. ${item.grade}`}</Text>
                      </View>
                    )}
                    {item.freshness && (
                      <View style={styles.freshnessTag}>
                        <Text style={styles.freshnessTagText}>❄️ {item.freshness === 'FreshOnIce' ? 'Fresh on Ice' : item.freshness}</Text>
                      </View>
                    )}
                    <View style={styles.locRow}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.locText} numberOfLines={1}>{item.region || item.branchName || item.port || 'Kakinada Port'}</Text>
                    </View>
                  </View>
                </View>
              );
            })()}
          </View>
        </View>

        <View style={styles.body}>
          {/* Executive Financial Metrics Bar */}
          {(() => {
            const cleanUom = formatUom(item.uom || item.unit);
            const rawQtyStr = item.quantity ? `${item.quantity} ${cleanUom}` : (item.quantityRemaining ? `${item.quantityRemaining} ${cleanUom}` : (item.qty ? String(item.qty).replace(/kilograms|\((?:kg|kgs)\)/gi, 'kg') : `100 ${cleanUom}`));
            const qtyStr = rawQtyStr.replace(/kilograms/gi, 'kg').replace(/\(kg\)/gi, 'kg');
            const qtyNum = parseFloat(String(item.quantity || item.quantityRemaining || item.qty || '0').replace(/[^0-9.]/g, '')) || 0;
            const unitPriceNum = item.pricePerUnit ?? (item.priceNum ?? (item.price ? parseFloat(String(item.price).replace(/[^0-9.]/g, '')) : 0));
            const totalVal = qtyNum * unitPriceNum;
            const displayTotal = totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 'N/A';
            const priceDisplay = item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}/${cleanUom}` : (item.priceNum ? `₹${item.priceNum}/${cleanUom}` : (item.price ? String(item.price).replace(/kilograms/gi, 'kg').replace(/\(kg\)/gi, 'kg') : '₹0.00'));

            return (
              <View style={styles.metricsBar}>
                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Order Quantity</Text>
                  <Text style={styles.metricValQty}>{qtyStr}</Text>
                </View>

                <View style={[styles.metricCell, styles.metricBorder]}>
                  <Text style={styles.metricLabel}>Starting Price</Text>
                  <Text style={styles.metricValPrice}>{priceDisplay}</Text>
                </View>

                <View style={styles.metricCell}>
                  <Text style={styles.metricLabel}>Est. Total Value</Text>
                  <Text style={styles.metricValGreen}>{displayTotal}</Text>
                </View>
              </View>
            );
          })()}

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
              <Card style={styles.cardNoMargin}>
                <Text style={styles.specsHeaderTitle}>Product Dimensions</Text>
                <View style={styles.grid}>
                  {dimList.map(([k, v], i) => (
                    <View key={`${k}_${i}`} style={styles.gridCell}>
                      <Text style={styles.gridKey}>{k}</Text>
                      <Text style={styles.gridVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })()}

        </View>
      </ScrollView>

      {/* Sticky CTA — only when no bid placed yet */}
      {!myBid && (
        <View style={styles.cta}>
          <Button
            label={isDirectSale ? 'Buy Now' : 'Place a Bid'}
            icon={isDirectSale ? 'basket' : 'gavel'}
            variant={isDirectSale ? 'secondary' : 'primary'}
            fullWidth
            onPress={() => nav.navigate('PlaceBid')}
            style={styles.ctaBtn}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { fontSize: 14, color: T.text3 },
  headerRight: { flexDirection: 'row', gap: 8 },

  // COMPACT HERO CARD
  heroCardContainer: { paddingHorizontal: 16, paddingTop: 14 },
  compactHeroCard: { flexDirection: 'row', backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.hairline, padding: 12, gap: 14, alignItems: 'center', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  compactImgBox: { width: 104, height: 104, borderRadius: 12, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}15`, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  verifiedStamp: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, paddingVertical: 3, backgroundColor: 'rgba(0, 122, 32, 0.9)' },
  verifiedStampText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  compactImg: { width: '100%', height: '100%' },
  compactEmoji: { fontSize: 48 },
  compactHeroInfo: { flex: 1, gap: 4 },
  compactStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  saleTypeBadge: { backgroundColor: `${T.navy}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: `${T.navy}20` },
  saleTypeBadgeText: { fontSize: 11, fontWeight: '800', color: T.navy },

  itemName: { fontSize: 16, fontWeight: '900', color: T.text1, lineHeight: 21 },
  categorySubRow: { marginTop: 1, marginBottom: 2 },
  categorySubText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  dotSeparator: { color: T.text3, marginHorizontal: 2 },
  subTextBold: { color: T.navy, fontWeight: '800' },

  tagRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 2 },
  gradeTag: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  gradeTagText: { fontSize: 11, fontWeight: '700', color: T.text2 },
  freshnessTag: { backgroundColor: '#3B82F615', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#3B82F635' },
  freshnessTagText: { fontSize: 11, fontWeight: '700', color: '#1D4ED8' },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  locText: { fontSize: 11, color: T.text3, fontWeight: '600', flexShrink: 1 },

  body: { padding: 16, gap: 14 },

  // METRICS BAR
  metricsBar: { flexDirection: 'row', backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, paddingVertical: 12, paddingHorizontal: 8, marginBottom: 2 },
  metricCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  metricBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: T.hairline },
  metricLabel: { fontSize: 10, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 2 },
  metricValQty: { fontSize: 15, fontWeight: '900', color: T.navy },
  metricValPrice: { fontSize: 15, fontWeight: '900', color: T.navy },
  metricValGreen: { fontSize: 15, fontWeight: '900', color: T.green },

  cardNoMargin: { marginBottom: 0, padding: 14 },
  specsHeaderTitle: { fontSize: 12, fontWeight: '800', color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '48%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  gridKey: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 13, fontWeight: '800', color: T.text1, marginTop: 3 },

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
