import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS, BUYER_REQUESTS, PUBLIC_BANNERS, productIcon } from '../../constants/mockData';

type Props = NativeStackScreenProps<RootStackParams, 'PublicLanding'>;
type PromptAction = 'bid' | 'proposal' | 'browseItems' | 'browseRequests' | 'detail';

const PROMPT_COPY: Record<PromptAction, { emoji: string; title: string; sub: string; primary: string }> = {
  bid:            { emoji: '🔨', title: 'Register to Place a Bid',         sub: 'Join SarwaMart free to bid on fresh aqua products directly from verified farmers.',          primary: "Register as Buyer — It's Free" },
  proposal:       { emoji: '📋', title: 'Register to Submit a Proposal',   sub: 'Join SarwaMart free to submit proposals on buyer requests and grow your aqua business.',     primary: "Register as Seller — It's Free" },
  browseItems:    { emoji: '🔍', title: 'Sign in to browse all items',     sub: 'Create a free account to see the full live catalog of fresh aqua products from verified sellers.', primary: 'Create free account' },
  browseRequests: { emoji: '🔍', title: 'Sign in to browse all requests',  sub: 'Create a free account to see every active buyer request and respond with a proposal.',         primary: 'Create free account' },
  detail:         { emoji: '🔐', title: 'Sign in to view full details',    sub: 'Create a free account to see seller verification, region, grade, and place a bid in seconds.', primary: 'Create free account' },
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

  const liveItems = SELLER_ITEMS.filter(i => i.status === 'live');
  const q = search.trim().toLowerCase();
  const filteredItems = q
    ? liveItems.filter(i => i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q) || i.region.toLowerCase().includes(q))
    : liveItems;
  const filteredRequests = q
    ? BUYER_REQUESTS.filter(r => r.product.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.loc.toLowerCase().includes(q))
    : BUYER_REQUESTS;

  const showPrompt = (action: PromptAction) => { setPromptAction(action); setPromptOpen(true); };

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: T.navy }}>
        <View style={styles.header}>
          <Logo width={120} dark />
          <View style={styles.headerBtns}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginChip}>
              <Text style={styles.loginChipText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('RolePicker')} style={styles.registerChip}>
              <Text style={styles.registerChipText}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Pinned region — banner + stats + search + chips stay visible while sections scroll */}
      <View style={styles.pinned}>
        <BannerCarousel banners={PUBLIC_BANNERS} />

        {/* Stats */}
        <View style={styles.stats}>
          {[{ v: '12,000+', l: 'Verified Farmers' }, { v: '8,500+', l: 'Active Buyers' }, { v: '₹42Cr+', l: 'Traded Monthly' }].map((s, i) => (
            <View key={s.l} style={[styles.stat, i < 2 && styles.statBorder]}>
              <Text style={styles.statVal}>{s.v}</Text>
              <Text style={styles.statLabel}>{s.l}</Text>
            </View>
          ))}
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.text3} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search fish, prawn, region…"
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

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{ l: 'All', e: '🌊' }, { l: 'Fish', e: '🐟' }, { l: 'Prawn', e: '🦐' }, { l: 'Crab', e: '🦀' }, { l: 'Lobster', e: '🦞' }, { l: 'Squid', e: '🦑' }].map((c, i) => (
            <View key={c.l} style={[styles.chip, i === 0 && styles.chipActive]}>
              <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{c.e} {c.l}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Items for Bid — navy theme */}
        <SectionHeader
          title="Items for Bid"
          accent="navy"
          badge={{ label: 'Live now', color: 'navy' }}
          onSeeAll={() => showPrompt('browseItems')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {filteredItems.length === 0 && (
            <View style={styles.emptyCarousel}>
              <Text style={styles.emptyText}>No items match “{search}”</Text>
            </View>
          )}
          {filteredItems.slice(0, 10).map(item => (
            <TouchableOpacity key={item.id} onPress={() => showPrompt('detail')} style={styles.itemCard} activeOpacity={0.85}>
              <View style={styles.itemAccent} />
              <View style={styles.itemImg}>
                <Text style={styles.itemEmoji}>{item.img}</Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Verified</Text>
                </View>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSub}>{item.sub} · {item.qty}</Text>
                <View style={styles.itemLocRow}>
                  <Icon name="mapPin" size={11} color={T.text3} />
                  <Text style={styles.itemLocText} numberOfLines={1}>{item.region}</Text>
                </View>
                <View style={styles.itemPriceRow}>
                  <Text style={styles.itemPrice}>{item.price}</Text>
                  <CountdownTimer seedSeconds={item.id * 7823 + 3601} compact />
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
                  <Text style={styles.placeBidBtnText}>Place a Bid</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buyer Requests — amber theme */}
        <SectionHeader
          title="Buyer Requests"
          accent="amber"
          badge={{ label: 'Looking to buy', color: 'amber' }}
          onSeeAll={() => showPrompt('browseRequests')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {filteredRequests.length === 0 && (
            <View style={styles.emptyCarousel}>
              <Text style={styles.emptyText}>No requests match “{search}”</Text>
            </View>
          )}
          {filteredRequests.slice(0, 10).map(req => {
            const initials = req.buyer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            return (
              <TouchableOpacity key={req.id} onPress={() => showPrompt('detail')} style={styles.reqCard} activeOpacity={0.85}>
                <View style={styles.reqAccent} />
                <View style={styles.reqHeader}>
                  <View style={styles.reqAvatar}><Text style={styles.reqAvatarText}>{initials}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqBuyer} numberOfLines={1}>{req.buyer}</Text>
                    <View style={styles.reqMetaRow}>
                      <Icon name="mapPin" size={10} color={T.text3} />
                      <Text style={styles.reqLocText} numberOfLines={1}>{req.loc}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reqProductRow}>
                  <View style={styles.reqIconBox}>
                    <Text style={styles.reqIconText}>{productIcon(req.sub)}</Text>
                  </View>
                  <View style={styles.reqProductInfo}>
                    <Text style={styles.reqProduct} numberOfLines={1}>{req.product}</Text>
                    <Text style={styles.reqProductMeta} numberOfLines={1}>{req.sub} · {req.qty}</Text>
                  </View>
                  <Text style={styles.reqPriceRight} numberOfLines={1}>{req.price}</Text>
                </View>
                <Text style={styles.reqNote} numberOfLines={2}>{req.note}</Text>
                <View style={styles.reqFooter}>
                  <CountdownTimer seedSeconds={req.id * 4127 + 5400} compact />
                  <TouchableOpacity onPress={() => showPrompt('proposal')} style={styles.proposeBtn} activeOpacity={0.85}>
                    <Icon name="send" size={12} color="#fff" />
                    <Text style={styles.proposeBtnText}>Propose</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* CTA banner */}
        <View style={styles.ctaBanner}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaTitle}>Start Trading on SarwaMart Today</Text>
            <Text style={styles.ctaSub}>Join 12,000+ verified farmers and buyers. Free to register.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RolePicker')} style={styles.ctaBtn}>
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
        onRegister={() => { setPromptOpen(false); navigation.navigate('RolePicker'); }}
        onLogin={() => { setPromptOpen(false); navigation.navigate('Login'); }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  loginChip: { height: 34, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)', alignItems: 'center', justifyContent: 'center' },
  loginChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  registerChip: { height: 34, paddingHorizontal: 14, borderRadius: 10, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  registerChipText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  pinned: { backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.hairline },
  stats: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.hairline, backgroundColor: T.card },
  stat: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: T.hairline },
  statVal: { fontSize: 15, fontWeight: '900', color: T.navy },
  statLabel: { fontSize: 10, color: T.text3, fontWeight: '500', marginTop: 2 },

  searchRow: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },

  chips: { paddingHorizontal: 16, paddingBottom: 14, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  chipTextActive: { color: '#fff' },

  hScroll: { paddingLeft: 16, paddingRight: 4, paddingBottom: 16, gap: 12 },

  emptyCarousel: { width: 280, height: 200, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, borderStyle: 'dashed', backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', padding: 14 },
  emptyText: { fontSize: 13, color: T.text3, textAlign: 'center' },

  // Items for Bid card — navy theme
  itemCard: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImg: { height: 100, backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center', position: 'relative' },
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

  // Buyer Request card — amber theme
  reqCard: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  reqAccent: { height: 3, backgroundColor: T.amber },
  reqHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12 },
  reqAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${T.amber}20`, alignItems: 'center', justifyContent: 'center' },
  reqAvatarText: { fontSize: 12, fontWeight: '800', color: T.amber },
  reqBuyer: { fontSize: 12, fontWeight: '700', color: T.text1 },
  reqMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  reqLocText: { fontSize: 10, color: T.text3, flexShrink: 1 },
  reqProductRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12 },
  reqIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  reqIconText: { fontSize: 26 },
  reqProductInfo: { flex: 1, gap: 2 },
  reqProduct: { fontSize: 15, fontWeight: '900', color: T.text1 },
  reqProductMeta: { fontSize: 11, color: T.text2, fontWeight: '600' },
  reqPriceRight: { fontSize: 14, fontWeight: '900', color: T.amber },
  reqNote: { fontSize: 11, color: T.text2, lineHeight: 15, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, minHeight: 30 },
  reqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: T.hairline, marginTop: 4 },
  proposeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: T.amber },
  proposeBtnText: { fontSize: 11, fontWeight: '800', color: '#fff' },

  ctaBanner: { margin: 16, borderRadius: 16, backgroundColor: T.navy, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  ctaContent: { flex: 1, gap: 6 },
  ctaTitle: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  ctaBtn: { backgroundColor: T.amber, alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  ctaBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },

  // Register prompt sheet
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
});
