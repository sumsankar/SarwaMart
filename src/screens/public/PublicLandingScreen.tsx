import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS, BUYER_REQUESTS, PUBLIC_BANNERS } from '../../constants/mockData';

type Props = NativeStackScreenProps<RootStackParams, 'PublicLanding'>;

const RegisterPrompt = ({ open, onClose, onRegister, onLogin, action }: any) => {
  const isBid = action === 'bid';
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.promptIcon}>
          <Text style={{ fontSize: 34 }}>{isBid ? '🔨' : '📋'}</Text>
        </View>
        <Text style={styles.promptTitle}>{isBid ? 'Register to Place a Bid' : 'Register to Submit a Proposal'}</Text>
        <Text style={styles.promptSub}>{isBid ? 'Join SarwaMart free to bid on fresh aqua products directly from verified farmers.' : 'Join SarwaMart free to submit proposals on buyer requests and grow your aqua business.'}</Text>
        <View style={styles.benefits}>
          {['✅ Verified sellers & buyers only','🔒 Secure OTP + PIN login','📦 Direct farm-to-buyer transactions','💰 Best prices through competitive bidding'].map((b, i) => (
            <Text key={i} style={styles.benefit}>{b}</Text>
          ))}
        </View>
        <Button label={isBid ? "Register as Buyer — It's Free" : "Register as Seller — It's Free"} onPress={onRegister} fullWidth style={styles.registerBtn} />
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
  const [promptAction, setPromptAction] = useState<'bid' | 'proposal'>('bid');
  const [search, setSearch] = useState('');

  const liveItems = SELLER_ITEMS.filter(i => i.status === 'live');
  const filtered = search ? liveItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sub.toLowerCase().includes(search.toLowerCase())) : liveItems;

  const showPrompt = (action: 'bid' | 'proposal') => { setPromptAction(action); setPromptOpen(true); };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: T.navy }}>
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

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <BannerCarousel banners={PUBLIC_BANNERS} />

        {/* Stats */}
        <View style={styles.stats}>
          {[{v:'12,000+',l:'Verified Farmers'},{v:'8,500+',l:'Active Buyers'},{v:'₹42Cr+',l:'Traded Monthly'}].map((s,i) => (
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
            <TextInput value={search} onChangeText={setSearch} placeholder="Search fish, prawn, region…" placeholderTextColor={T.text3} style={styles.searchInput} />
            {search ? <TouchableOpacity onPress={() => setSearch('')}><Text style={{ color: T.text3, fontSize: 16 }}>✕</Text></TouchableOpacity> : null}
          </View>
        </View>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {[{l:'All',e:'🌊'},{l:'Fish',e:'🐟'},{l:'Prawn',e:'🦐'},{l:'Crab',e:'🦀'},{l:'Lobster',e:'🦞'},{l:'Squid',e:'🦑'}].map((c,i) => (
            <View key={c.l} style={[styles.chip, i === 0 && styles.chipActive]}>
              <Text style={[styles.chipText, i === 0 && styles.chipTextActive]}>{c.e} {c.l}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Items for Bid */}
        <SectionHeader title="Items for Bid" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {filtered.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemImg}>
                <Text style={styles.itemEmoji}>{item.img}</Text>
                <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>
                <View style={styles.gradeBadge}><Text style={styles.gradeText}>Grade {item.grade} · {item.freshness}</Text></View>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemSeller} numberOfLines={1}>{item.region}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>₹{item.priceNum}</Text>
                  <Text style={styles.uom}>/{item.uom}</Text>
                  <Text style={styles.qty}>{item.qty}</Text>
                </View>
                <CountdownTimer seedSeconds={item.id * 7823 + 3601} />
                <TouchableOpacity onPress={() => showPrompt('bid')} style={styles.bidBtn}>
                  <Text style={styles.bidBtnText}>🔨 Place a Bid</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Buyer Requests */}
        <SectionHeader title="Buyer Requests" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {BUYER_REQUESTS.map(req => (
            <View key={req.id} style={styles.reqCard}>
              <View style={styles.reqAccent} />
              <View style={styles.reqBody}>
                <View style={styles.reqHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqBuyer} numberOfLines={1}>{req.buyer}</Text>
                    <Text style={styles.reqLoc}>{req.loc}</Text>
                  </View>
                  <Text style={styles.reqTime}>{req.time}</Text>
                </View>
                <Text style={styles.reqProduct}>{req.product}</Text>
                <View style={styles.reqChips}>
                  <View style={styles.qtyChip}><Text style={styles.qtyChipText}>{req.qty}</Text></View>
                  <View style={styles.priceChip}><Text style={styles.priceChipText}>{req.price}</Text></View>
                </View>
                <Text style={styles.reqNote} numberOfLines={2}>{req.note}</Text>
                <TouchableOpacity onPress={() => showPrompt('proposal')} style={styles.proposalBtn}>
                  <Text style={styles.proposalBtnText}>📤 Submit Proposal</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
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
        open={promptOpen} onClose={() => setPromptOpen(false)} action={promptAction}
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
  stats: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: T.hairline, backgroundColor: T.card },
  stat: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  statBorder: { borderRightWidth: 1, borderRightColor: T.hairline },
  statVal: { fontSize: 15, fontWeight: '900', color: T.navy },
  statLabel: { fontSize: 10, color: T.text3, fontWeight: '500', marginTop: 2 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, height: 44, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1 },
  chips: { paddingHorizontal: 16, paddingBottom: 14, gap: 8, flexDirection: 'row' },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline },
  chipActive: { backgroundColor: T.navy, borderColor: T.navy },
  chipText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  chipTextActive: { color: '#fff' },
  hScroll: { paddingLeft: 16, paddingBottom: 12, gap: 14, flexDirection: 'row' },
  itemCard: { width: 190, borderRadius: 16, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  itemImg: { height: 118, backgroundColor: `${T.navy}15`, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemEmoji: { fontSize: 58 },
  verifiedBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: T.green, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  gradeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  gradeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  itemBody: { padding: 12, gap: 6 },
  itemName: { fontSize: 14, fontWeight: '800', color: T.text1 },
  itemSeller: { fontSize: 11, color: T.text2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, backgroundColor: `${T.navy}08`, padding: 6, borderRadius: 8 },
  price: { fontSize: 22, fontWeight: '900', color: T.navy },
  uom: { fontSize: 11, color: T.text3 },
  qty: { marginLeft: 'auto', fontSize: 11, color: T.text2 },
  bidBtn: { backgroundColor: T.amber, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: T.amber, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 5, elevation: 3 },
  bidBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  reqCard: { width: 220, borderRadius: 16, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  reqAccent: { height: 6, backgroundColor: T.navy },
  reqBody: { padding: 14, gap: 8 },
  reqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  reqBuyer: { fontSize: 12, fontWeight: '700', color: T.text1 },
  reqLoc: { fontSize: 10, color: T.text3, marginTop: 2 },
  reqTime: { fontSize: 10, color: T.text3 },
  reqProduct: { fontSize: 16, fontWeight: '900', color: T.text1 },
  reqChips: { flexDirection: 'row', gap: 8 },
  qtyChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.navy}12` },
  qtyChipText: { fontSize: 11, fontWeight: '700', color: T.navy },
  priceChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.amber}18` },
  priceChipText: { fontSize: 11, fontWeight: '800', color: T.amber },
  reqNote: { fontSize: 11, color: T.text2, lineHeight: 16, padding: 8, backgroundColor: T.bg, borderLeftWidth: 3, borderLeftColor: `${T.navy}40`, borderRadius: 4 },
  proposalBtn: { backgroundColor: T.navy, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', shadowColor: T.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 3 },
  proposalBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ctaBanner: { margin: 16, borderRadius: 16, backgroundColor: T.navy, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 40 },
  ctaContent: { flex: 1, gap: 6 },
  ctaTitle: { fontSize: 18, fontWeight: '900', color: '#fff', lineHeight: 24 },
  ctaSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  ctaBtn: { backgroundColor: T.amber, alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 4 },
  ctaBtnText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,28,46,0.65)' },
  sheet: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 14, alignItems: 'center' },
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
