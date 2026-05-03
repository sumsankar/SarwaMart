import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, SafeAreaView, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { Card } from '../../components/ui/Card';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { BUYER_BANNERS, SELLER_ITEMS, MY_REQUESTS } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const Drawer = ({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: Nav }) => {
  const { logout } = useAppStore();
  const items = [
    { icon: 'home', label: 'Home', action: () => {} },
    { icon: 'gavel', label: 'My Bids', action: () => nav.navigate('MyBids') },
    { icon: 'edit', label: 'My Requests', action: () => nav.navigate('MyRequests') },
    { icon: 'invoice', label: 'Invoices', action: () => nav.navigate('InvoiceList') },
    { icon: 'bell', label: 'Notifications', action: () => nav.navigate('Notifications') },
    { icon: 'globe', label: 'Language', action: () => nav.navigate('Language') },
    { icon: 'help', label: 'Help & Support', action: () => {} },
  ];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.drawerOverlay} onPress={onClose} activeOpacity={1} />
      <View style={styles.drawerPanel}>
        <View style={styles.drawerHeader}>
          <Avatar name="Priya Nair" size={60} bg="rgba(255,255,255,0.2)" />
          <Text style={styles.drawerName}>Priya Nair</Text>
          <View style={styles.drawerBadges}>
            <View style={styles.buyerBadge}><Text style={styles.buyerBadgeText}>Buyer</Text></View>
            <View style={styles.indBadge}><Text style={styles.indBadgeText}>Individual</Text></View>
          </View>
          <TouchableOpacity onPress={() => { onClose(); nav.navigate('Profile'); }}>
            <Text style={styles.viewProfile}>View profile →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {items.map(item => (
            <TouchableOpacity key={item.label} onPress={() => { item.action(); onClose(); }} style={styles.drawerItem}>
              <Icon name={item.icon} size={20} color={T.navy} />
              <Text style={styles.drawerItemLabel}>{item.label}</Text>
              <Icon name="chevronR" size={14} color={T.text3} />
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.drawerFooter}>
          <Text style={styles.version}>v1.0.0 · SarwaMart India</Text>
          <TouchableOpacity onPress={async () => { onClose(); await logout(); nav.replace('PublicLanding'); }} style={styles.logoutBtn}>
            <Icon name="logout" size={16} color={T.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export const BuyerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const liveItems = SELLER_ITEMS.filter(i => i.status === 'live');

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ backgroundColor: T.navy }}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)}>
            <Icon name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <Logo width={110} dark />
          <View style={styles.appBarRight}>
            <TouchableOpacity onPress={() => nav.navigate('Notifications')} style={{ position: 'relative' }}>
              <Icon name="bell" size={22} color="#fff" />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate('Profile')}>
              <Avatar name="Priya Nair" size={32} bg="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <BannerCarousel banners={BUYER_BANNERS} />

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.text3} />
            <TextInput placeholder="Search products, sellers, regions…" placeholderTextColor={T.text3} style={styles.searchInput} />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter" size={16} color={T.navy} />
          </TouchableOpacity>
        </View>

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

        {/* Items for Bid carousel */}
        <SectionHeader title="Items for Bid" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {liveItems.map(item => (
            <TouchableOpacity key={item.id} onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailBuyer'); }} style={styles.itemCard}>
              <View style={styles.itemImg}>
                <Text style={styles.itemEmoji}>{item.img}</Text>
                {item.bids > 0 && (
                  <View style={styles.bidBadge}>
                    <Text style={styles.bidBadgeText}>🔨 {item.bids}</Text>
                  </View>
                )}
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemSeller} numberOfLines={1}>Ravi Aqua Farms</Text>
                <View style={styles.itemPriceRow}>
                  <View>
                    <Text style={styles.itemPrice}>₹{item.priceNum}</Text>
                    <Text style={styles.itemUom}>per {item.uom}</Text>
                  </View>
                  <TouchableOpacity style={styles.bidSmallBtn} onPress={() => { setSelectedItem(item); nav.navigate('PlaceBid'); }}>
                    <Text style={styles.bidSmallText}>Bid</Text>
                  </TouchableOpacity>
                </View>
                <CountdownTimer seedSeconds={item.id * 9341 + 2700} compact />
                <View style={styles.tagRow}>
                  <View style={styles.freshnessTag}><Text style={styles.freshnessText}>{item.freshness}</Text></View>
                  <View style={styles.gradeTag}><Text style={styles.gradeText}>Gr.{item.grade}</Text></View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* My Requests */}
        <SectionHeader title="My Requests" onSeeAll={() => nav.navigate('MyRequests')} />
        <View style={styles.reqList}>
          {MY_REQUESTS.slice(0, 2).map(req => (
            <Card key={req.id} onPress={() => nav.navigate('MyRequests')} style={styles.reqCard}>
              <View style={styles.reqInner}>
                <View style={styles.reqRow}>
                  <View style={styles.reqImgBox}><Text style={styles.reqEmoji}>{req.img}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.reqTitleRow}>
                      <Text style={styles.reqProduct}>{req.product} · {req.sub}</Text>
                      <StatusPill status={req.status} />
                    </View>
                    <Text style={styles.reqMeta}>{req.qty} · Expected {req.price}</Text>
                    <View style={styles.reqBottom}>
                      <View style={styles.reqLocRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.reqLoc}>{req.loc}</Text>
                      </View>
                      {req.proposals > 0 && (
                        <View style={styles.proposalBadge}>
                          <Text style={styles.proposalText}>{req.proposals} proposals</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </Card>
          ))}
          <TouchableOpacity style={styles.postReqBtn} onPress={() => nav.navigate('CreateRequest')}>
            <Icon name="plus" size={16} color={T.navy} />
            <Text style={styles.postReqText}>Post a New Request</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} nav={nav} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  appBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  appBarRight: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: T.amber, borderWidth: 1.5, borderColor: T.navy },
  searchRow: { padding: 16, paddingTop: 0, flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1 },
  filterBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  quickActions: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  quickBtn: { flex: 1, height: 52, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center', gap: 4 },
  quickLabel: { fontSize: 11, fontWeight: '700', color: T.navy },
  hScroll: { paddingLeft: 16, paddingBottom: 8, gap: 12 },
  itemCard: { width: 180, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  itemImg: { height: 120, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemEmoji: { fontSize: 54 },
  bidBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: `${T.amber}E8`, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  bidBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  itemBody: { paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, gap: 4 },
  itemName: { fontSize: 13, fontWeight: '800', color: T.text1 },
  itemSeller: { fontSize: 11, color: T.text2 },
  itemPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  itemPrice: { fontSize: 16, fontWeight: '900', color: T.navy },
  itemUom: { fontSize: 10, color: T.text3 },
  bidSmallBtn: { height: 30, paddingHorizontal: 10, borderRadius: 8, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  bidSmallText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  tagRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  freshnessTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: `${T.green}15` },
  freshnessText: { fontSize: 10, fontWeight: '600', color: T.green },
  gradeTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: `${T.amber}15` },
  gradeText: { fontSize: 10, fontWeight: '600', color: T.amber },
  reqList: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  reqCard: {},
  reqInner: { padding: 14 },
  reqRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reqImgBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reqEmoji: { fontSize: 28 },
  reqTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqProduct: { fontSize: 15, fontWeight: '800', color: T.text1, flex: 1 },
  reqMeta: { fontSize: 12, color: T.text2, marginTop: 2 },
  reqBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  reqLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqLoc: { fontSize: 11, color: T.text3 },
  proposalBadge: { backgroundColor: `${T.amber}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  proposalText: { fontSize: 11, fontWeight: '700', color: T.amber },
  postReqBtn: { height: 48, borderRadius: 12, borderWidth: 2, borderColor: `${T.navy}40`, borderStyle: 'dashed', backgroundColor: `${T.navy}06`, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  postReqText: { fontSize: 13, fontWeight: '700', color: T.navy },
  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.overlay },
  drawerPanel: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', backgroundColor: T.card, flexDirection: 'column' },
  drawerHeader: { backgroundColor: T.navy, padding: 20, paddingTop: 56, gap: 6 },
  drawerName: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 10 },
  drawerBadges: { flexDirection: 'row', gap: 6 },
  buyerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: `${T.green}30` },
  buyerBadgeText: { fontSize: 11, fontWeight: '700', color: T.green },
  indBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  indBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  viewProfile: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  drawerItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: T.hairline },
  drawerItemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: T.text1 },
  drawerFooter: { padding: 20, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10 },
  version: { fontSize: 11, color: T.text3 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: T.danger },
  logoutText: { color: T.danger, fontSize: 14, fontWeight: '700' },
});
