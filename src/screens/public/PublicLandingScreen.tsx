import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { PUBLIC_BANNERS, productIcon } from '../../constants/mockData';
import { NotificationConsentModal } from '../../components/ui/NotificationConsentModal';

type Props = NativeStackScreenProps<RootStackParams, 'PublicLanding'>;
type PromptAction = 'bid' | 'proposal' | 'browseItems' | 'browseRequests' | 'detail';

const PROMPT_COPY: Record<PromptAction, { emoji: string; title: string; sub: string; primary: string }> = {
  bid: { emoji: '🔨', title: 'Register to Place a Bid', sub: 'Join SarwaMart free to bid on fresh aqua products directly from verified farmers.', primary: "Register as Buyer — It's Free" },
  proposal: { emoji: '📋', title: 'Register to Submit a Proposal', sub: 'Join SarwaMart free to submit proposals on buyer requests and grow your aqua business.', primary: "Register as Seller — It's Free" },
  browseItems: { emoji: '🔍', title: 'Sign in to browse all items', sub: 'Create a free account to see the full live catalog of fresh aqua products from verified sellers.', primary: 'Create free account' },
  browseRequests: { emoji: '🔍', title: 'Sign in to browse all requests', sub: 'Create a free account to see every active buyer request and respond with a proposal.', primary: 'Create free account' },
  detail: { emoji: '🔐', title: 'Sign in to view full details', sub: 'Create a free account to see seller verification, region, grade, and place a bid in seconds.', primary: 'Create free account' },
};

const getSeedSeconds = (guid: string) => {
  if (!guid) return 3600;
  let code = 0;
  for (let i = 0; i < guid.length; i++) {
    code += guid.charCodeAt(i);
  }
  return (code % 3600) + 1200; // deterministic between 20 mins and 80 mins
};

const SectionPlaceholder: React.FC<{
  loading: boolean;
  title: string;
  sub: string;
  emoji: string;
  themeColor: string;
  onRefresh: () => void;
}> = ({ loading, title, sub, emoji, themeColor, onRefresh }) => {
  return (
    <View style={styles.placeholderCard}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={themeColor} />
          <Text style={styles.loaderText}>Loading live data...</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${themeColor}12` }]}>
            <Text style={[styles.emptyIconText, { color: themeColor }]}>{emoji}</Text>
          </View>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptySub}>{sub}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            activeOpacity={0.7}
            style={[styles.refreshBtn, { borderColor: themeColor }]}
          >
            <Icon name="refresh" size={12} color={themeColor} />
            <Text style={[styles.refreshBtnText, { color: themeColor }]}>Reload</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const RegisterPrompt: React.FC<{ open: boolean; onClose: () => void; onRegister: () => void; onLogin: () => void; action: PromptAction }> = ({ open, onClose, onRegister, onLogin, action }) => {
  const copy = PROMPT_COPY[action];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.promptIcon}>
          <Text style={{ fontSize: 34 }}>{copy.emoji}</Text>
        </View>
        <Text style={styles.promptTitle}>{copy.title}</Text>
        <Text style={styles.promptSub}>{copy.sub}</Text>
        <View style={styles.benefits}>
          {['✅ Verified sellers & buyers only', '🔒 Secure OTP + PIN login', '📦 Direct farm-to-buyer transactions', '💰 Best prices through competitive bidding'].map((b, i) => (
            <Text key={i} style={styles.benefit}>{b}</Text>
          ))}
        </View>
        <Button label={copy.primary} onPress={onRegister} fullWidth style={styles.registerBtn} />
        <Button label="Already have an account? Log in" onPress={onLogin} variant="secondary" fullWidth style={styles.loginBtn} />
        <TouchableOpacity onPress={onClose} style={styles.browseBtn}>
          <Text style={styles.browseBtnText}>Continue browsing</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export const PublicLandingScreen: React.FC<Props> = ({ navigation }) => {
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptAction, setPromptAction] = useState<PromptAction>('bid');
  const [search, setSearch] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const listingsScrollRef = useRef<ScrollView>(null);
  const requestsScrollRef = useRef<ScrollView>(null);
  const [listingsOffset, setListingsOffset] = useState(0);
  const [requestsOffset, setRequestsOffset] = useState(0);

  const scrollListings = (direction: 'left' | 'right') => {
    const step = 252; // 240 card width + 12 margin
    const newX = direction === 'left'
      ? Math.max(0, listingsOffset - step)
      : listingsOffset + step;
    listingsScrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  const scrollRequests = (direction: 'left' | 'right') => {
    const step = 252;
    const newX = direction === 'left'
      ? Math.max(0, requestsOffset - step)
      : requestsOffset + step;
    requestsScrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  const fetchListings = async (silent = false) => {
    if (!silent) setLoadingItems(true);
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/listings/public?pageSize=10');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch public listings:', err);
    } finally {
      if (!silent) setLoadingItems(false);
    }
  };

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoadingRequests(true);
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/requests/public?pageSize=10');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch public requests:', err);
    } finally {
      if (!silent) setLoadingRequests(false);
    }
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchRequests();
    fetchCategories();
  }, []);

  const getCategoryEmoji = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('fish')) return '🐟';
    if (n.includes('prawn') || n.includes('shrimp')) return '🦐';
    if (n.includes('crab')) return '🦀';
    if (n.includes('lobster')) return '🦞';
    if (n.includes('squid') || n.includes('octopus')) return '🦑';
    if (n.includes('shell')) return '🦪';
    return '🌊';
  };

  const q = search.trim().toLowerCase();

  const filteredItems = items.filter(i => {
    const matchesSearch = !q || (
      (i.name || '').toLowerCase().includes(q) ||
      ((i.subcategory || i.category) || '').toLowerCase().includes(q) ||
      ((i.region || i.branchName) || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (!selectedCategoryId) return true;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    if (!selectedCategory) return true;
    const itemCat = (i.category || '').toLowerCase();
    const targetCat = selectedCategory.name.toLowerCase();
    return itemCat === targetCat;
  });

  const filteredRequests = requests.filter(r => {
    const matchesSearch = !q || (
      (r.name || '').toLowerCase().includes(q) ||
      ((r.subcategory || r.category) || '').toLowerCase().includes(q) ||
      (r.branchName || '').toLowerCase().includes(q)
    );
    if (!matchesSearch) return false;
    if (!selectedCategoryId) return true;
    const selectedCategory = categories.find(c => c.id === selectedCategoryId);
    if (!selectedCategory) return true;
    const reqCat = (r.category || '').toLowerCase();
    const targetCat = selectedCategory.name.toLowerCase();
    return reqCat === targetCat;
  });

  const showPrompt = (action: PromptAction) => { setPromptAction(action); setPromptOpen(true); };

  return (
    <View style={styles.container}>
      {/* Fixed Top App Header — Always Frozen at Top */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.hairline, zIndex: 200 }}>
        <View style={styles.header}>
          <Logo width={120} dark />
          <View style={styles.headerBtns}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginChip}>
              <Text style={styles.loginChipText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('MobileEntry', { mode: 'register' })} style={styles.registerChip}>
              <Text style={styles.registerChipText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        stickyHeaderIndices={[1]}
      >
        {/* Child 0 — Hero Banner Carousel (Scrolls up with page scroll) */}
        <View style={{ backgroundColor: T.bg, paddingTop: 6 }}>
          <BannerCarousel banners={PUBLIC_BANNERS} />
        </View>

        {/* Child 1 — Sticky Search Bar & Category Icons Bar (Freezes under Header when scrolled) */}
        <View style={styles.pinned}>
          {/* Search Bar */}
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Icon name="search" size={18} color={T.text2} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search fish, prawn, region…"
                placeholderTextColor={T.text3}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
              />
              {search.length > 0 ? (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={styles.clearText}>✕</Text>
                </TouchableOpacity>
              ) : (
                <Icon name="more" size={18} color={T.text3} />
              )}
            </View>
          </View>

          {/* Category Icons Row with Active Underline */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            <TouchableOpacity
              onPress={() => setSelectedCategoryId(null)}
              style={styles.catItem}
            >
              <View style={[styles.catIconCircle, selectedCategoryId === null && styles.catIconCircleActive]}>
                <Text style={styles.catEmoji}>🌊</Text>
              </View>
              <Text style={[styles.catLabel, selectedCategoryId === null && styles.catLabelActive]}>
                All
              </Text>
              {selectedCategoryId === null && <View style={styles.catActiveIndicator} />}
            </TouchableOpacity>

            {categories.map(cat => {
              const isActive = selectedCategoryId === cat.id;
              const emoji = getCategoryEmoji(cat.name);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                  style={styles.catItem}
                >
                  <View style={[styles.catIconCircle, isActive && styles.catIconCircleActive]}>
                    <Text style={styles.catEmoji}>{emoji}</Text>
                  </View>
                  <Text style={[styles.catLabel, isActive && styles.catLabelActive]}>
                    {cat.name}
                  </Text>
                  {isActive && <View style={styles.catActiveIndicator} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Items for Bid Section — Soft Light-Navy Tinted Box Container */}
        <View style={styles.sectionContainerNavy}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitleNavy}>Live Seafood Listings</Text>
              <View style={styles.assuredBadgeNavy}>
                <Icon name="checkCircle" size={12} color={T.navy} />
                <Text style={styles.assuredTextNavy}>Verified Quality</Text>
              </View>
            </View>
            <View style={styles.headerRightBlock}>
              <TouchableOpacity onPress={() => showPrompt('browseItems')} style={styles.arrowCircleBtnNavy}>
                <Icon name="chevronR" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {filteredItems.length === 0 ? (
            <SectionPlaceholder
              loading={loadingItems}
              title="No Live Listings Found"
              sub="Aqua items from verified farmers are updated daily. Tap reload or register to place your own bid request."
              emoji="🎣"
              themeColor={T.navy}
              onRefresh={fetchListings}
            />
          ) : (
            <View style={{ position: 'relative' }}>
              <ScrollView 
                ref={listingsScrollRef}
                horizontal={true} 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.hScrollBox}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
                onScroll={(e) => setListingsOffset(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                {filteredItems.slice(0, 10).map(item => (
                  <TouchableOpacity key={item.id} onPress={() => showPrompt('detail')} style={styles.itemCard} activeOpacity={0.85}>
                    <View style={styles.itemAccent} />
                    <View style={styles.itemImg}>
                      {item.images && item.images.length > 0 ? (
                        <Image 
                          source={{ uri: item.images.find((img: any) => img.isCover)?.imageUrl || item.images[0].imageUrl }} 
                          style={styles.itemCardImg} 
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.itemEmoji}>{productIcon(item.subcategory || item.category)}</Text>
                      )}
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Verified</Text>
                      </View>
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemSub}>{item.subcategory || item.category} · {item.quantityRemaining} {item.uom}</Text>
                      <View style={styles.itemLocRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.itemLocText} numberOfLines={1}>{item.region || item.branchName}</Text>
                      </View>
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>
                          {item.saleType === 'Auction' ? 'Auction' : 'Direct Sale'}
                        </Text>
                        <CountdownTimer seedSeconds={getSeedSeconds(item.id)} compact />
                      </View>
                      <View style={styles.itemTagsRow}>
                        <View style={styles.itemTag}>
                          <Icon name="shield" size={10} color={T.navy} />
                          <Text style={styles.itemTagText}>Gr. {item.grade}</Text>
                        </View>
                        <View style={styles.itemTag}>
                          <Text style={styles.itemTagText}>{item.freshness}</Text>
                        </View>
                      </View>
                      <View style={styles.itemDivider} />
                      <TouchableOpacity onPress={() => showPrompt('bid')} style={styles.placeBidBtn} activeOpacity={0.85}>
                        <Icon name="gavel" size={13} color="#fff" />
                        <Text style={styles.placeBidBtnText}>
                          {item.saleType === 'Auction' ? 'Place a Bid' : 'Submit Proposal'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Floating Left Button */}
              {listingsOffset > 10 && (
                <TouchableOpacity 
                  onPress={() => scrollListings('left')} 
                  style={[styles.scrollBtn, styles.scrollBtnLeft]}
                  activeOpacity={0.8}
                >
                  <Icon name="chevronL" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              
              {/* Floating Right Button */}
              {filteredItems.length > 1 && (
                <TouchableOpacity 
                  onPress={() => scrollListings('right')} 
                  style={[styles.scrollBtn, styles.scrollBtnRight]}
                  activeOpacity={0.8}
                >
                  <Icon name="chevronR" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Buyer Requests Section — Soft Light-Amber Tinted Container Box */}
        <View style={styles.sectionContainerAmber}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitleAmber}>Buyer Demands</Text>
              <View style={styles.assuredBadgeAmber}>
                <Icon name="checkCircle" size={12} color={T.amber} />
                <Text style={styles.assuredTextAmber}>Active Demand</Text>
              </View>
            </View>
            <View style={styles.headerRightBlock}>
              <TouchableOpacity onPress={() => showPrompt('browseRequests')} style={styles.arrowCircleBtnAmber}>
                <Icon name="chevronR" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {filteredRequests.length === 0 ? (
            <SectionPlaceholder
              loading={loadingRequests}
              title="No Active Buyer Requests"
              sub="Buyers post active trade requirements here. Tap reload or register as a seller to send bid proposals."
              emoji="📋"
              themeColor={T.amber}
              onRefresh={fetchRequests}
            />
          ) : (
            <View style={{ position: 'relative' }}>
              <ScrollView 
                ref={requestsScrollRef}
                horizontal={true} 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.hScrollBox}
                nestedScrollEnabled={true}
                directionalLockEnabled={true}
                onScroll={(e) => setRequestsOffset(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                {filteredRequests.slice(0, 10).map(req => (
                  <TouchableOpacity key={req.id} onPress={() => showPrompt('detail')} style={styles.itemCard} activeOpacity={0.85}>
                    <View style={[styles.itemAccent, { backgroundColor: T.amber }]} />
                    <View style={styles.itemImg}>
                      {req.images && req.images.length > 0 ? (
                        <Image 
                          source={{ uri: req.images[0].imageUrl || req.images[0].thumbnailUrl }} 
                          style={styles.itemCardImg} 
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.itemEmoji}>{productIcon(req.subcategory || req.category)}</Text>
                      )}
                      <View style={[styles.verifiedBadge, { backgroundColor: T.amber }]}>
                        <Text style={styles.verifiedText}>✓ Buyer</Text>
                      </View>
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={1}>{req.name}</Text>
                      <Text style={styles.itemSub}>{req.subcategory || req.category} · {req.quantityRemaining} {req.uom}</Text>
                      <View style={styles.itemLocRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.itemLocText} numberOfLines={1}>{req.branchName}</Text>
                      </View>
                      <View style={styles.itemPriceRow}>
                        <Text style={[styles.itemPrice, { color: T.amber }]}>
                          {req.openToCounter ? "Negotiable" : "Fixed Price"}
                        </Text>
                        <CountdownTimer seedSeconds={getSeedSeconds(req.id)} compact />
                      </View>
                      <View style={styles.itemTagsRow}>
                        <View style={[styles.itemTag, { backgroundColor: `${T.amber}08`, borderColor: `${T.amber}20` }]}>
                          <Icon name="package" size={10} color={T.amber} />
                          <Text style={[styles.itemTagText, { color: T.amber }]}>Deliv: {req.deliveryPref}</Text>
                        </View>
                        <View style={[styles.itemTag, { backgroundColor: `${T.amber}08`, borderColor: `${T.amber}20` }]}>
                          <Text style={[styles.itemTagText, { color: T.amber }]}>Min: {req.minProposalQuantity} {req.uom}</Text>
                        </View>
                      </View>
                      <View style={styles.itemDivider} />
                      <TouchableOpacity onPress={() => showPrompt('proposal')} style={styles.placeBidBtn} activeOpacity={0.85}>
                        <Icon name="send" size={13} color="#fff" />
                        <Text style={styles.placeBidBtnText}>Submit Proposal</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              {/* Floating Left Button */}
              {requestsOffset > 10 && (
                <TouchableOpacity 
                  onPress={() => scrollRequests('left')} 
                  style={[styles.scrollBtn, styles.scrollBtnLeft]}
                  activeOpacity={0.8}
                >
                  <Icon name="chevronL" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              
              {/* Floating Right Button */}
              {filteredRequests.length > 1 && (
                <TouchableOpacity 
                  onPress={() => scrollRequests('right')} 
                  style={[styles.scrollBtn, styles.scrollBtnRight]}
                  activeOpacity={0.8}
                >
                  <Icon name="chevronR" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Bottom CTA Banner */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Start Trading on SarwaMart Today</Text>
            <Text style={styles.ctaSub}>Join 12,000+ verified farmers and buyers. Free to register.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('MobileEntry', { mode: 'register' })} style={styles.ctaBtn}>
              <Text style={styles.ctaBtnText}>Register Free →</Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 52 }}>🌊</Text>
        </View>
      </ScrollView>

      <RegisterPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        action={promptAction}
        onRegister={() => { setPromptOpen(false); navigation.navigate('MobileEntry', { mode: 'register' }); }}
        onLogin={() => { setPromptOpen(false); navigation.navigate('Login'); }}
      />
      <NotificationConsentModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  loginChip: { height: 32, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1.5, borderColor: T.navyAccent, alignItems: 'center', justifyContent: 'center' },
  loginChipText: { color: T.navyAccent, fontSize: 11, fontWeight: '700' },
  registerChip: { height: 32, paddingHorizontal: 12, borderRadius: 8, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  registerChipText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  topModeBar: { paddingHorizontal: 16, paddingBottom: 10, gap: 10, flexDirection: 'row' },
  modeTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: T.hairline },
  modeTabActive: { backgroundColor: T.navy, borderColor: T.navy },
  modeTabEmoji: { fontSize: 13 },
  modeTabText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  modeTabTextActive: { color: '#fff' },

  pinned: { backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.hairline, paddingTop: 10, zIndex: 100 },
  locationRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  locationPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: T.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: T.hairline, flex: 1, marginRight: 10 },
  locationText: { fontSize: 12, color: T.text2, flexShrink: 1 },
  locationBold: { fontWeight: '800', color: T.navy },
  expressBadge: { backgroundColor: T.navy, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  expressBadgeText: { color: '#fff', fontSize: 11, fontWeight: '900' },

  searchRow: { paddingHorizontal: 16, paddingBottom: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: T.card, borderRadius: 14, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: T.hairline, ...T.shadowSoft },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },

  categoryRow: { paddingHorizontal: 16, paddingBottom: 12, gap: 16 },
  catItem: { alignItems: 'center', gap: 6, paddingBottom: 6, position: 'relative' },
  catIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.cardBorder },
  catIconCircleActive: { backgroundColor: `${T.navy}12`, borderColor: T.navy },
  catEmoji: { fontSize: 22 },
  catLabel: { fontSize: 11, fontWeight: '700', color: T.text2 },
  catLabelActive: { color: T.navy, fontWeight: '800' },
  catActiveIndicator: { position: 'absolute', bottom: 0, height: 3, width: 24, borderRadius: 2, backgroundColor: T.navy },

  sectionContainerNavy: { marginHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: '#F0F4F8', borderRadius: 20, paddingTop: 16, paddingBottom: 16, borderWidth: 1, borderColor: 'rgba(15,23,42,0.06)' },
  sectionContainerAmber: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFBEB', borderRadius: 20, paddingTop: 16, paddingBottom: 16, borderWidth: 1, borderColor: 'rgba(217,119,6,0.1)' },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitleBlock: { gap: 4 },
  sectionTitleNavy: { fontSize: 18, fontWeight: '900', color: T.navy },
  sectionTitleAmber: { fontSize: 18, fontWeight: '900', color: T.amber },
  assuredBadgeNavy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assuredBadgeAmber: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assuredTextNavy: { fontSize: 11, fontWeight: '700', color: T.navy },
  assuredTextAmber: { fontSize: 11, fontWeight: '700', color: T.amber },
  headerRightBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  priceTagBadgeNavy: { backgroundColor: T.amber, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, transform: [{ rotate: '-2deg' }] },
  priceTagBadgeAmber: { backgroundColor: T.navy, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, transform: [{ rotate: '-2deg' }] },
  priceTagTextNavy: { fontSize: 11, fontWeight: '900', color: '#fff' },
  priceTagTextAmber: { fontSize: 11, fontWeight: '900', color: '#fff' },
  arrowCircleBtnNavy: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  arrowCircleBtnAmber: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },

  hScroll: { paddingLeft: 16, paddingRight: 16, paddingBottom: 16 },
  hScrollBox: { paddingLeft: 12, paddingRight: 12, paddingBottom: 4 },

  // Items for Bid & Buyer Requests card layout (width: 240)
  itemCard: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden', marginRight: 12, ...T.shadowSoft },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImg: { height: 100, backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemCardImg: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 52 },
  verifiedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: T.green, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedText: { fontSize: 10, fontWeight: '800', color: '#fff' },
  itemBody: { padding: 12, gap: 6 },
  itemName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  itemPrice: { fontSize: 17, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  itemTagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  itemTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  itemTagText: { fontSize: 10, fontWeight: '700', color: T.navy },
  itemDivider: { height: 1, backgroundColor: T.hairline, marginTop: 2 },
  placeBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 10, backgroundColor: T.amber },
  placeBidBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  placeholderCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.cardBorder, padding: 24, alignItems: 'center', justifyContent: 'center', ...T.shadowSoft },
  loaderContainer: { paddingVertical: 12, alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 13, color: T.text2, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', gap: 8, width: '100%' },
  emptyIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyIconText: { fontSize: 22 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 18, paddingHorizontal: 12, marginBottom: 10 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1.5, marginTop: 4 },
  refreshBtnText: { fontSize: 12, fontWeight: '800' },

  ctaBanner: { margin: 16, borderRadius: 16, backgroundColor: T.navy, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  ctaContent: { flex: 1, gap: 6 },
  ctaTitle: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  ctaBtn: { backgroundColor: T.amber, alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  ctaBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,28,46,0.65)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.hairline, marginBottom: 8 },
  promptIcon: { width: 72, height: 72, borderRadius: 22, backgroundColor: `${T.amber}18`, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { fontSize: 20, fontWeight: '900', color: T.text1, textAlign: 'center' },
  promptSub: { fontSize: 14, color: T.text2, lineHeight: 22, textAlign: 'center' },
  benefits: { width: '100%', gap: 8 },
  benefit: { fontSize: 13, color: T.text2, fontWeight: '500' },
  registerBtn: { height: 52, borderRadius: 14, width: '100%' },
  loginBtn: { height: 48, borderRadius: 14, width: '100%' },
  browseBtn: { padding: 8 },
  browseBtnText: { color: T.text3, fontSize: 13 },

  scrollBtn: {
    position: 'absolute',
    top: '32%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(26,28,46,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.22)',
    ...T.shadowSoft,
  },
  scrollBtnLeft: { left: 6 },
  scrollBtnRight: { right: 6 },
});
