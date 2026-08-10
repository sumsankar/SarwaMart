import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Platform, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
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
import { SegTabs } from '../../components/ui/SegTabs';
import { T } from '../../constants/tokens';
import { getMyBidForItem, bidsForItem, ItemBid } from '../../constants/mockData';
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

// Same shape/status vocabulary as ItemBid (seller's ItemDetailSellerScreen), but buyerName is always
// an anonymized "Buyer #XXXXX" label — other buyers' identities are never shown to a buyer.
interface ListingBid {
  id: string;
  buyerName: string;
  buyerRegion: string;
  buyerRating: number;
  buyerDeals: number;
  buyerVerified: boolean;
  price: string;
  priceNum: number;
  qty: string;
  totalAmount: string;
  note: string;
  time: string;
  status: ItemBid['status'];
  exchanges: number;
}

const NEGOTIATION_STATUS_MAP: Record<string, ItemBid['status']> = {
  pending: 'pending', open: 'pending', new: 'pending',
  negotiating: 'negotiating', inprogress: 'negotiating', 'in-progress': 'negotiating', active: 'negotiating',
  countered: 'countered', counteroffer: 'countered',
  accepted: 'accepted', approved: 'accepted', won: 'accepted',
  declined: 'declined', rejected: 'declined', closed: 'declined', expired: 'declined',
};

const STATUS_COLOR: Record<ItemBid['status'], { bg: string; fg: string; label: string }> = {
  pending:     { bg: '#FFF3E0', fg: '#BA7517', label: 'Pending' },
  negotiating: { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Negotiating' },
  countered:   { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Countered' },
  accepted:    { bg: '#E6F4EC', fg: '#2D7A35', label: 'Accepted' },
  declined:    { bg: '#FDECEA', fg: '#A32D2D', label: 'Declined' },
};

const extractNegotiationList = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.negotiations)) return payload.negotiations;
    if (Array.isArray(payload.bids)) return payload.bids;
    if (Array.isArray(payload.content)) return payload.content;
  }
  return [];
};

// Swagger only documents request DTOs (SendOfferBody, PlaceBidCommand, CounterBidBody) — no response
// schema is published for GET /listings/{id}/negotiation. Those DTOs establish the API's naming
// convention (pricePerUnit, quantity/quantityRequested, uuid ids), which this mapper follows first,
// with looser fallbacks kept for resilience since the actual response shape is unconfirmed.
const shortId = (uuid: any, idx: number): string => {
  const s = String(uuid || '');
  return s.length >= 6 ? s.slice(0, 6).toUpperCase() : String(2000 + idx);
};

const mapNegotiationToListingBid = (raw: any, idx: number, uomFallback: string): ListingBid => {
  const priceNum = Number(raw.pricePerUnit ?? raw.price ?? raw.bidPrice ?? raw.offerPrice ?? raw.amount ?? 0);
  const qtyNum = Number(raw.quantity ?? raw.quantityRequested ?? raw.qty ?? raw.bidQuantity ?? raw.offerQuantity ?? 0);
  const totalAmountNum = Number(raw.totalAmount ?? raw.total ?? (priceNum * qtyNum)) || 0;
  const uom = formatUom(raw.uom || raw.unit || uomFallback);
  const rawStatus = String(raw.status || raw.negotiationStatus || raw.bidStatus || 'pending').toLowerCase().replace(/\s+/g, '');

  return {
    id: String(raw.id ?? raw.negotiationId ?? raw.bidId ?? idx),
    buyerName: `Buyer #${shortId(raw.buyerId, idx)}`,
    buyerRegion: raw.buyerRegion || raw.region || 'India',
    buyerRating: Number(raw.buyerRating ?? 4.5),
    buyerDeals: Number(raw.buyerDeals ?? 0),
    buyerVerified: !!raw.buyerVerified,
    price: raw.priceDisplay ? formatUom(raw.priceDisplay) : `₹${priceNum.toLocaleString('en-IN')}/${uom}`,
    priceNum,
    qty: raw.qtyDisplay ? formatUom(raw.qtyDisplay) : `${qtyNum.toLocaleString('en-IN')} ${uom}`,
    totalAmount: raw.totalAmountDisplay || `₹${totalAmountNum.toLocaleString('en-IN')}`,
    note: raw.note || '',
    time: raw.time || raw.placedAt || raw.createdAt || '',
    status: NEGOTIATION_STATUS_MAP[rawStatus] || 'pending',
    exchanges: Number(raw.exchanges ?? raw.messageCount ?? raw.threadCount ?? 0),
  };
};

export const ItemDetailBuyerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem, token, apiBaseUrl, setSelectedItem, showToast } = useAppStore();
  const [detailedItem, setDetailedItem] = useState<any>(selectedItem);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listingBids, setListingBids] = useState<ListingBid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [bidSeg, setBidSeg] = useState('All');

  // Popup Modal State for Bid Messages
  const [selectedBidForModal, setSelectedBidForModal] = useState<any>(null);
  const [showBidModal, setShowBidModal] = useState(false);
  const [modalMessages, setModalMessages] = useState<any[]>([]);
  const [modalReply, setModalReply] = useState('');

  const openBidMessagesModal = (bid: any) => {
    if (!bid) return;
    const buyerName = bid.buyerName || 'Your Active Bid';
    const price = bid.price || '₹0';
    const qty = bid.qty || '0 kg';
    const totalAmount = bid.totalAmount || bid.total || `₹${((bid.priceNum || 0) * 100).toLocaleString('en-IN')}`;
    const status = bid.status || 'pending';
    const time = bid.time || bid.placedAt || 'Today, 10:15 AM';
    const note = bid.note;
    const exchanges = bid.exchanges || 0;

    const normalizedBid = {
      ...bid,
      buyerName,
      price,
      qty,
      totalAmount,
      status,
      time,
      note,
      exchanges,
    };

    setSelectedBidForModal(normalizedBid);
    const msgs: any[] = [
      { id: '1', type: 'system', text: `Bid submitted by ${buyerName} · ${time}` },
      { id: '2', type: 'offer', price, qty, total: totalAmount, time },
    ];
    if (note) {
      msgs.push({ id: '3', type: 'bubble', from: 'buyer', text: `Note: ${note}`, time });
    }
    if (exchanges > 0) {
      msgs.push({ id: '4', type: 'system', text: 'Seller responded to bid' });
      msgs.push({ id: '5', type: 'bubble', from: 'seller', text: `Thanks for your bid! We can fulfill ${qty} at your requested price.`, time: '10:20 AM' });
    }
    setModalMessages(msgs);
    setModalReply('');
    setShowBidModal(true);
  };

  const sendModalMessage = () => {
    if (!modalReply.trim()) return;
    const newMsg = {
      id: String(Date.now()),
      type: 'bubble',
      from: 'buyer',
      text: modalReply.trim(),
      time: 'Just now',
    };
    setModalMessages(prev => [...prev, newMsg]);
    setModalReply('');
    showToast('Message sent to seller', 'success');
  };

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

  // GET bids/negotiations for this listing: GET /api/v1/listings/{id}/negotiation
  useEffect(() => {
    const fetchNegotiations = async () => {
      const listingId = selectedItem?.id || selectedItem?.listingId;
      if (!listingId) return;

      setLoadingBids(true);
      try {
        const activeToken = token ||
          (await AsyncStorage.getItem('sm_access_token')) ||
          (await AsyncStorage.getItem('sm_auth_token'));
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (activeToken) headers['Authorization'] = `Bearer ${activeToken}`;

        const url = getApiUrl(`/api/v1/listings/${listingId}/negotiation`, apiBaseUrl);
        console.log(`[ItemDetailBuyerScreen] 🚀 GET NEGOTIATION BIDS: ${url}`);
        const res = await fetch(url, { headers });

        if (res.ok) {
          const data = await res.json();
          console.log('[ItemDetailBuyerScreen] GET negotiation bids success payload:', data);
          const list = extractNegotiationList(data);
          setListingBids(list.map((raw, idx) => mapNegotiationToListingBid(raw, idx, selectedItem?.uom || 'kg')));
        } else {
          console.warn(`[ItemDetailBuyerScreen] GET negotiation bids returned status ${res.status}`);
        }
      } catch (err) {
        console.warn('[ItemDetailBuyerScreen] Error fetching negotiation bids:', err);
      } finally {
        setLoadingBids(false);
      }
    };

    fetchNegotiations();
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

  // Fall back to deterministic mock bids if the negotiation API returned nothing (e.g. no backend configured)
  const fallbackBidSourceItem = {
    ...item,
    bids: item.bids ?? item.bidCount ?? 0,
    qty: item.qty || (item.quantity ? `${item.quantity} ${formatUom(item.uom || item.unit)}` : (item.quantityRemaining ? `${item.quantityRemaining} ${formatUom(item.uom || item.unit)}` : '100 kg')),
    priceNum: item.priceNum ?? item.pricePerUnit ?? 0,
  };
  const visibleBids: ListingBid[] = (listingBids.length > 0
    ? listingBids
    : bidsForItem(fallbackBidSourceItem).map((b, idx): ListingBid => ({
        ...b,
        id: String(b.id),
        buyerName: `Buyer #${2000 + idx}`,
      }))
  ).slice().sort((a, b) => b.priceNum - a.priceNum);

  const filteredBids = bidSeg === 'All' ? visibleBids : visibleBids.filter(b => b.status.toLowerCase() === bidSeg.toLowerCase());
  const highestBid = visibleBids[0];
  const startingPriceNum = item.priceNum ?? item.pricePerUnit ?? 0;

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
              <View style={styles.saleTypeImgBadge}>
                <Text style={styles.saleTypeImgBadgeText}>⚡ {saleTypeVal}</Text>
              </View>
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
                  {/* Status Row */}
                  <View style={styles.compactStatusRow}>
                    <StatusPill status={item.status || item.listingStatus || item.approvalStatus || 'Live'} />
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
                    {item.allowPartialBids && item.minBidQuantity != null && (
                      <View style={styles.partialFillTag}>
                        <Text style={styles.partialFillTagText}>Partial Fill (Min {item.minBidQuantity} {formatUom(item.uom || item.unit)})</Text>
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
                    <Icon name="package" size={11} color={T.amber} />
                    <Text style={styles.myBidQtyText}>{myBid.qty}</Text>
                  </View>
                </View>

                <View style={styles.myBidMetaRow}>
                  <Icon name="clock" size={11} color={T.text3} />
                  <Text style={styles.myBidMetaText}>Placed {myBid.placedAt}</Text>
                  {myBid.exchanges > 0 && (
                    <Text style={styles.myBidThreadText}>
                      • <Text style={styles.myBidThreadNum}>{myBid.exchanges}</Text> {myBid.exchanges === 1 ? 'msg' : 'msgs'}
                    </Text>
                  )}
                </View>

                <View style={styles.myBidActions}>
                  <TouchableOpacity onPress={() => myBid && openBidMessagesModal(myBid)} style={styles.threadBtn} activeOpacity={0.85}>
                    <Icon name="msgCircle" size={12} color={T.navy} />
                    <Text style={styles.threadBtnText}>Thread</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => nav.navigate('PlaceBid')} style={styles.updateBtn} activeOpacity={0.85}>
                    <Icon name="edit" size={12} color="#fff" />
                    <Text style={styles.updateBtnText}>Update</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={acceptBid} style={styles.acceptBtn} activeOpacity={0.85}>
                    <Icon name="check" size={13} color="#fff" />
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
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
                    const unit = d.uom || d.unit ? ` ${formatUom(d.uom || d.unit)}` : '';
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

        {/* Live Bids on this listing */}
        <View style={styles.bidsHeaderWrap}>
          <View style={styles.bidsTitleRow}>
            <View style={styles.titleAccent} />
            <Text style={styles.bidsTitle}>Live Bids</Text>
            <View style={styles.bidsCountBadge}>
              <Text style={styles.bidsCountText}>{visibleBids.length}</Text>
            </View>
          </View>
          {highestBid && (
            <Text style={styles.highest}>
              Highest <Text style={styles.highestPrice}>{highestBid.price}</Text>
            </Text>
          )}
        </View>

        {visibleBids.length > 0 && (
          <SegTabs tabs={['All', 'Pending', 'Negotiating', 'Countered', 'Accepted']} active={bidSeg} onSelect={setBidSeg} />
        )}

        <View style={styles.bidsList}>
          {loadingBids && visibleBids.length === 0 ? (
            <View style={styles.empty}>
              <ActivityIndicator size="small" color={T.navy} />
              <Text style={styles.emptySub}>Loading bids…</Text>
            </View>
          ) : visibleBids.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="gavel" size={26} color={T.amber} />
              </View>
              <Text style={styles.emptyTitle}>No bids yet</Text>
              <Text style={styles.emptySub}>Be the first to place a bid on this listing.</Text>
            </View>
          ) : filteredBids.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No {bidSeg.toLowerCase()} bids</Text>
            </View>
          ) : (
            filteredBids.map(b => (
              <ListingBidCard key={b.id} bid={b} startingPriceNum={startingPriceNum} onPress={() => openBidMessagesModal(b)} />
            ))
          )}
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

      {/* Bid Messages Popup Modal */}
      <Modal
        visible={showBidModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowBidModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowBidModal(false)}
          />
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon name="msgCircle" size={18} color={T.navy} />
                <View>
                  <Text style={styles.modalTitle}>Bid Messages</Text>
                  <Text style={styles.modalSubtitle}>{selectedBidForModal?.buyerName || 'Negotiation Thread'}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowBidModal(false)}
                style={styles.modalCloseBtn}
                hitSlop={8}
              >
                <Icon name="x" size={16} color={T.text2} />
              </TouchableOpacity>
            </View>

            {/* Pinned Bid Info Banner */}
            {selectedBidForModal && (
              <View style={styles.modalBidBanner}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalBidPrice}>{selectedBidForModal.price}</Text>
                  <Text style={styles.modalBidQty}>{selectedBidForModal.qty} · Total: {selectedBidForModal.totalAmount}</Text>
                </View>
                <StatusPill status={selectedBidForModal.status} />
              </View>
            )}

            {/* Messages Scroll Area */}
            <ScrollView style={styles.modalMessagesList} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
              {modalMessages.map(m => {
                if (m.type === 'system') {
                  return (
                    <View key={m.id} style={styles.modalSystemMsg}>
                      <Text style={styles.modalSystemText}>{m.text}</Text>
                    </View>
                  );
                }
                if (m.type === 'offer') {
                  return (
                    <View key={m.id} style={styles.modalOfferCard}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.modalOfferLabel}>OFFER DETAILS</Text>
                        <Text style={styles.modalTimeText}>{m.time}</Text>
                      </View>
                      <Text style={styles.modalOfferPrice}>{m.price}</Text>
                      <Text style={styles.modalOfferQty}>{m.qty} (Total: {m.total})</Text>
                    </View>
                  );
                }
                const isUser = m.from === 'buyer';
                return (
                  <View key={m.id} style={[styles.modalBubbleRow, isUser ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
                    <View style={[styles.modalBubble, isUser ? styles.modalBubbleUser : styles.modalBubbleOther]}>
                      <Text style={[styles.modalBubbleText, isUser ? styles.modalBubbleTextUser : styles.modalBubbleTextOther]}>{m.text}</Text>
                      <Text style={[styles.modalBubbleTime, isUser ? styles.modalBubbleTimeUser : styles.modalBubbleTimeOther]}>{m.time}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            {/* Modal Reply Bar */}
            <View style={styles.modalReplyBar}>
              <TextInput
                style={styles.modalInput}
                placeholder="Type a message or response..."
                placeholderTextColor={T.text3}
                value={modalReply}
                onChangeText={setModalReply}
                onSubmitEditing={sendModalMessage}
              />
              <TouchableOpacity style={styles.modalSendBtn} onPress={sendModalMessage} activeOpacity={0.8}>
                <Icon name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

interface ListingBidCardProps {
  bid: ListingBid;
  startingPriceNum: number;
  onPress: () => void;
}

// Read-only counterpart of the seller's BidCard — no Accept/Decline/Counter actions, since a buyer
// cannot act on another buyer's bid, and no name is shown (anonymized "Buyer #XXXXX" label).
const ListingBidCard: React.FC<ListingBidCardProps> = ({ bid, startingPriceNum, onPress }) => {
  const initials = bid.buyerName.replace('Buyer #', '#').slice(0, 3).toUpperCase();
  const status = STATUS_COLOR[bid.status];
  const diff = startingPriceNum > 0 ? Math.round(((bid.priceNum - startingPriceNum) / startingPriceNum) * 100) : 0;
  const diffColor = diff > 0 ? T.green : diff < 0 ? T.danger : T.text3;
  const diffLabel = diff > 0 ? `+${diff}%` : diff < 0 ? `${diff}%` : '0%';

  return (
    <TouchableOpacity style={styles.bCard} activeOpacity={0.85} onPress={onPress}>
      <View style={styles.bAccent} />
      <View style={styles.bBody}>
        {/* Buyer header */}
        <View style={styles.bHeader}>
          <View style={styles.bAvatar}><Text style={styles.bAvatarText}>{initials}</Text></View>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View style={styles.bNameRow}>
              <Text style={styles.bName} numberOfLines={1}>{bid.buyerName}</Text>
              {bid.buyerVerified && <Text style={styles.bVerified}>✓</Text>}
              <Text style={styles.bMetaInline}>• ★ {bid.buyerRating}</Text>
            </View>
            <View style={styles.bMetaRow}>
              <Icon name="mapPin" size={10} color={T.text3} />
              <Text style={styles.bLoc}>{bid.buyerRegion}</Text>
              {bid.time ? <Text style={styles.bTime}> · {bid.time}</Text> : null}
            </View>
          </View>
          <View style={[styles.bStatus, { backgroundColor: status.bg }]}>
            <Text style={[styles.bStatusText, { color: status.fg }]}>{status.label}</Text>
          </View>
        </View>

        {/* Offer Row */}
        <View style={styles.bOfferRow}>
          <View style={styles.bPriceBlock}>
            <Text style={styles.bColLabel}>BID</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={styles.bPrice}>{bid.price}</Text>
              {diff !== 0 && <Text style={[styles.bDiff, { color: diffColor }]}>({diffLabel})</Text>}
            </View>
          </View>
          <View style={styles.bQtyBlock}>
            <Text style={styles.bColLabel}>QTY · TOTAL</Text>
            <Text style={styles.bQty}>{bid.qty} <Text style={styles.bTotal}>({bid.totalAmount})</Text></Text>
          </View>
        </View>

        {bid.note ? <Text style={styles.bNote} numberOfLines={1}>{bid.note}</Text> : null}
      </View>
    </TouchableOpacity>
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
  saleTypeImgBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(15, 23, 42, 0.85)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  saleTypeImgBadgeText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  compactImg: { width: '100%', height: '100%' },
  compactEmoji: { fontSize: 48 },
  compactHeroInfo: { flex: 1, gap: 4 },
  compactStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },

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
  partialFillTag: { backgroundColor: `${T.amber}15`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: `${T.amber}35` },
  partialFillTagText: { fontSize: 11, fontWeight: '700', color: T.amber },
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

  // Bids Received-style section (mirrors ItemDetailSellerScreen)
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

  // Bid card - compact & small
  bCard: { borderRadius: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  bAccent: { height: 2, backgroundColor: T.amber },
  bBody: { padding: 10, gap: 6 },
  bHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  bAvatarText: { fontSize: 11, fontWeight: '800', color: T.amber },
  bNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bName: { fontSize: 13, fontWeight: '800', color: T.text1, flexShrink: 1 },
  bVerified: { fontSize: 11, color: T.green, fontWeight: '900' },
  bMetaInline: { fontSize: 10, color: T.text3, fontWeight: '600' },
  bMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  bRating: { fontSize: 10, color: T.amber, fontWeight: '700' },
  bDeals: { fontSize: 10, color: T.text3 },
  bTime: { fontSize: 10, color: T.text3 },
  bStatus: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  bStatusText: { fontSize: 10, fontWeight: '800' },

  bOfferRow: { flexDirection: 'row', borderRadius: 8, backgroundColor: T.bg, paddingHorizontal: 10, paddingVertical: 6, gap: 8, alignItems: 'center' },
  bPriceBlock: { flex: 1, gap: 1 },
  bQtyBlock: { flex: 1, gap: 1, borderLeftWidth: 1, borderLeftColor: T.hairline, paddingLeft: 8 },
  bColLabel: { fontSize: 9, color: T.text3, fontWeight: '800', letterSpacing: 0.4 },
  bPrice: { fontSize: 14, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  bQty: { fontSize: 12, fontWeight: '800', color: T.text1 },
  bTotal: { fontSize: 10, color: T.green, fontWeight: '800' },
  bDiff: { fontSize: 10, fontWeight: '700' },

  bLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bLoc: { fontSize: 10, color: T.text3 },
  bNote: { fontSize: 11, color: T.text2, lineHeight: 15 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCell: { width: '48%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  gridKey: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 13, fontWeight: '800', color: T.text1, marginTop: 3 },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  ctaBtn: { height: 52, borderRadius: 14 },

  // Your Latest Bid card - compact
  myBidCard: { borderRadius: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  myBidAccent: { height: 2, backgroundColor: T.amber },
  myBidBody: { padding: 10, gap: 6 },
  myBidHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  myBidLabel: { fontSize: 10, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  myBidPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  myBidPrice: { fontSize: 18, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },
  myBidQtyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.amber}15` },
  myBidQtyText: { fontSize: 11, fontWeight: '800', color: T.amber },
  myBidMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  myBidMetaText: { fontSize: 11, color: T.text3 },
  myBidThreadRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  myBidThreadText: { fontSize: 11, color: T.text2, fontWeight: '600' },
  myBidThreadNum: { color: T.navy, fontWeight: '900' },
  myBidActions: { flexDirection: 'row', gap: 6, marginTop: 2 },
  threadBtn: { flex: 1, height: 34, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: T.navy, backgroundColor: `${T.navy}06` },
  threadBtnText: { fontSize: 11, fontWeight: '800', color: T.navy },
  updateBtn: { flex: 1, height: 34, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: T.amber },
  updateBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  acceptBtn: { flex: 1, height: 34, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: T.green },
  acceptBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  // Modal Popup Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  modalSheet: { backgroundColor: T.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: T.hairline },
  modalTitle: { fontSize: 15, fontWeight: '800', color: T.text1 },
  modalSubtitle: { fontSize: 11, color: T.text3, fontWeight: '600' },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },

  modalBidBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: `${T.navy}08`, borderRadius: 10, padding: 10, marginVertical: 10, borderWidth: 1, borderColor: `${T.navy}15` },
  modalBidPrice: { fontSize: 16, fontWeight: '900', color: T.navy },
  modalBidQty: { fontSize: 11, color: T.text2, fontWeight: '600' },

  modalMessagesList: { flexGrow: 0, maxHeight: 300 },
  modalSystemMsg: { alignSelf: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginVertical: 4 },
  modalSystemText: { fontSize: 10, fontWeight: '700', color: T.text3 },

  modalOfferCard: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginVertical: 4 },
  modalOfferLabel: { fontSize: 9, fontWeight: '800', color: T.text3, letterSpacing: 0.4 },
  modalOfferPrice: { fontSize: 15, fontWeight: '900', color: T.navy, marginTop: 2 },
  modalOfferQty: { fontSize: 11, color: T.text2, fontWeight: '600' },
  modalTimeText: { fontSize: 10, color: T.text3 },

  modalBubbleRow: { flexDirection: 'row', marginVertical: 3 },
  modalBubble: { maxWidth: '82%', padding: 10, borderRadius: 12 },
  modalBubbleUser: { backgroundColor: T.navy, borderBottomRightRadius: 2 },
  modalBubbleOther: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#E2E8F0' },
  modalBubbleText: { fontSize: 12, lineHeight: 17 },
  modalBubbleTextUser: { color: '#fff' },
  modalBubbleTextOther: { color: T.text1 },
  modalBubbleTime: { fontSize: 9, marginTop: 4, textAlign: 'right' },
  modalBubbleTimeUser: { color: 'rgba(255,255,255,0.7)' },
  modalBubbleTimeOther: { color: T.text3 },

  modalReplyBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: T.hairline },
  modalInput: { flex: 1, height: 40, backgroundColor: T.bg, borderRadius: 20, borderWidth: 1, borderColor: T.hairline, paddingHorizontal: 14, fontSize: 13, color: T.text1 },
  modalSendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
});
