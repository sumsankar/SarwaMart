import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const STATUS_COLOR: Record<ItemBid['status'], { bg: string; fg: string; label: string }> = {
  pending:     { bg: '#FFF3E0', fg: '#BA7517', label: 'Pending' },
  negotiating: { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Negotiating' },
  countered:   { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Countered' },
  accepted:    { bg: '#E6F4EC', fg: '#2D7A35', label: 'Accepted' },
  declined:    { bg: '#FDECEA', fg: '#A32D2D', label: 'Declined' },
};

export const ItemDetailSellerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem, token, apiBaseUrl, setSelectedItem, showToast } = useAppStore();
  const [detailedItem, setDetailedItem] = useState<any>(selectedItem);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [seg, setSeg] = useState('All');

  const item = detailedItem || selectedItem;

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
        console.log(`[ItemDetailSellerScreen] 🚀 GET LISTING BY ID: ${url}`);
        let res = await fetch(url, { headers });

        if (!res.ok) {
          url = getApiUrl(`/api/v1/listings/public/${listingId}`, apiBaseUrl);
          console.log(`[ItemDetailSellerScreen] 🔄 Fallback GET public listing BY ID: ${url}`);
          res = await fetch(url);
        }

        if (res.ok) {
          const data = await res.json();
          console.log('[ItemDetailSellerScreen] GET listing by ID success payload:', data);
          const merged = { ...selectedItem, ...data };
          setDetailedItem(merged);
          setSelectedItem(merged);
        } else {
          console.warn(`[ItemDetailSellerScreen] GET listing by ID returned status ${res.status}`);
        }
      } catch (err) {
        console.warn('[ItemDetailSellerScreen] Error fetching listing by ID:', err);
      } finally {
        setLoadingDetail(false);
      }
    };

    fetchListingDetail();
  }, [selectedItem?.id, selectedItem?.listingId]);

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

  const imgUri = getItemImageUri(item);

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title={item.name || item.title || 'Item Detail'} onBack={() => nav.goBack()} right={
        <TouchableOpacity hitSlop={8}><Icon name="more" size={20} color={T.text1} /></TouchableOpacity>
      } />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
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
            </View>

            {/* Right Info Box */}
            {(() => {
              const saleTypeVal = item.saleType || item.tradeType || item.listingType || item.type || 'Auction';
              const categoryVal = item.categoryName || item.category || 'Shrimp & Prawns';
              const subcategoryVal = item.subcategoryName || item.subcategory || item.sub || 'Vannamei Shrimp';

              return (
                <View style={styles.compactHeroInfo}>
                  {/* Status & Sale Type Row */}
                  <View style={styles.compactStatusRow}>
                    <StatusPill status={item.status || item.listingStatus || item.approvalStatus} />
                    <View style={styles.saleTypeBadge}>
                      <Text style={styles.saleTypeBadgeText}>⚡ {saleTypeVal}</Text>
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
            const priceDisplay = item.pricePerUnit ? `₹${item.pricePerUnit.toFixed(2)}/${cleanUom}` : (item.price ? String(item.price).replace(/kilograms/gi, 'kg').replace(/\(kg\)/gi, 'kg') : '₹0.00');

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

          {/* Specs & Attributes Grid */}
          {(() => {
            const getParsedSpecifications = (itemData: any) => {
              const specs: [string, string][] = [];

              // 1. Count / Size
              if (itemData.countSize || itemData.count || itemData.size) {
                specs.push(['Count / Size', String(itemData.countSize || itemData.count || itemData.size)]);
              }

              // 2. Processing & Packaging
              if (itemData.processing || itemData.processingType) {
                specs.push(['Processing', String(itemData.processing || itemData.processingType)]);
              }
              if (itemData.packaging || itemData.packagingType) {
                specs.push(['Packaging', String(itemData.packaging || itemData.packagingType)]);
              }

              // 3. Dynamic API Specifications Array/Object
              const rawSpecs = itemData.specifications || itemData.specs || itemData.attributes;
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
            if (specList.length === 0) return null;

            return (
              <Card style={styles.cardNoMargin}>
                <Text style={styles.specsHeaderTitle}>Listing Specifications</Text>
                <View style={styles.grid}>
                  {specList.map(([k, v], i) => (
                    <View key={`${k}_${i}`} style={styles.gridCell}>
                      <Text style={styles.gridKey}>{k}</Text>
                      <Text style={styles.gridVal}>{v}</Text>
                    </View>
                  ))}
                </View>
              </Card>
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

  // COMPACT HERO CARD
  heroCardContainer: { paddingHorizontal: 16, paddingTop: 14 },
  compactHeroCard: { flexDirection: 'row', backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.hairline, padding: 12, gap: 14, alignItems: 'center', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
  compactImgBox: { width: 104, height: 104, borderRadius: 12, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}15`, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
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
  subTag: { backgroundColor: `${T.navy}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  subTagText: { fontSize: 11, fontWeight: '700', color: T.navy },
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
  metricValBids: { fontSize: 15, fontWeight: '900', color: T.amber },

  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.green}10`, borderWidth: 1, borderColor: `${T.green}25` },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripText: { fontSize: 13, color: T.text2, fontWeight: '600' },

  cardNoMargin: { marginBottom: 0, padding: 14 },
  specsHeaderTitle: { fontSize: 12, fontWeight: '800', color: T.navy, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '48%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  gridKey: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 13, fontWeight: '800', color: T.text1, marginTop: 3 },

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
