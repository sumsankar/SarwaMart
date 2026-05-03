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
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS, BUYER_REQUESTS, SELLER_BANNERS } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

// Drawer component
const Drawer = ({ open, onClose, nav }: { open: boolean; onClose: () => void; nav: Nav }) => {
  const { logout } = useAppStore();
  const items = [
    { icon: 'home', label: 'Home', action: () => {} },
    { icon: 'package', label: 'My Items', action: () => nav.navigate('MyItems') },
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
          <Avatar name="Ravi Kumar" size={60} bg="rgba(255,255,255,0.2)" />
          <Text style={styles.drawerName}>Ravi Kumar</Text>
          <View style={styles.drawerBadges}>
            <View style={styles.sellerBadge}><Text style={styles.sellerBadgeText}>Seller</Text></View>
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

export const SellerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

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
              <Avatar name="Ravi Kumar" size={32} bg="rgba(255,255,255,0.2)" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <BannerCarousel banners={SELLER_BANNERS} />

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.text3} />
            <TextInput placeholder="Search products, buyers, regions…" placeholderTextColor={T.text3} style={styles.searchInput} />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Icon name="filter" size={16} color={T.navy} />
          </TouchableOpacity>
        </View>

        {/* My Items carousel */}
        <SectionHeader title="My Items for Bid" onSeeAll={() => nav.navigate('MyItems')} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {/* Add new tile */}
          <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.addTile}>
            <View style={styles.addCircle}><Icon name="plus" size={20} color={T.navy} /></View>
            <Text style={styles.addText}>Add new{'\n'}item</Text>
          </TouchableOpacity>
          {SELLER_ITEMS.map(item => (
            <TouchableOpacity key={item.id} onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }} style={styles.itemCard}>
              <View style={styles.itemImg}>
                <Text style={styles.itemEmoji}>{item.img}</Text>
                <View style={styles.statusPillWrap}><StatusPill status={item.status} /></View>
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.itemQty}>{item.qty}</Text>
                <Text style={styles.itemPrice}>{item.price}</Text>
                <CountdownTimer seedSeconds={item.id * 7823 + 3601} compact />
                {item.bids > 0 && (
                  <View style={styles.bidBadge}>
                    <Icon name="gavel" size={10} color={T.amber} />
                    <Text style={styles.bidBadgeText}>{item.bids} bids</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buyer Requests */}
        <SectionHeader title="Buyer Requests" />
        <View style={styles.reqList}>
          {BUYER_REQUESTS.map(req => (
            <Card key={req.id} onPress={() => nav.navigate('Negotiation')} style={styles.reqCard}>
              <View style={styles.reqInner}>
                <View style={styles.reqTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqBuyer}>{req.buyer}</Text>
                    <View style={styles.reqMeta}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.reqLoc}>{req.loc} · {req.time}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reqDetails}>
                  <Text style={styles.reqProduct}>{req.product} <Text style={styles.reqQtyText}>· {req.qty}</Text></Text>
                  <Text style={styles.reqPrice}>{req.price}</Text>
                </View>
                <Text style={styles.reqNote} numberOfLines={2}>{req.note}</Text>
                <Button label="Submit Proposal" onPress={() => nav.navigate('Negotiation')} fullWidth size="sm" style={styles.propBtn} />
              </View>
            </Card>
          ))}
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
  hScroll: { paddingLeft: 16, paddingBottom: 8, gap: 12 },
  addTile: { width: 160, height: 200, borderRadius: 12, borderWidth: 2, borderColor: `${T.navy}40`, borderStyle: 'dashed', backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center', gap: 8 },
  addCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: `${T.navy}15`, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 13, fontWeight: '700', color: T.navy, textAlign: 'center' },
  itemCard: { width: 160, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  itemImg: { height: 110, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 48 },
  statusPillWrap: { position: 'absolute', top: 8, right: 8 },
  itemBody: { padding: 10, gap: 4 },
  itemName: { fontSize: 13, fontWeight: '700', color: T.text1 },
  itemQty: { fontSize: 11, color: T.text2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: T.navy },
  bidBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${T.amber}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, alignSelf: 'flex-start', marginTop: 4 },
  bidBadgeText: { fontSize: 11, fontWeight: '700', color: T.amber },
  reqList: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  reqCard: {},
  reqInner: { padding: 14, gap: 8 },
  reqTop: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  reqBuyer: { fontSize: 14, fontWeight: '700', color: T.text1 },
  reqMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  reqLoc: { fontSize: 11, color: T.text3 },
  reqDetails: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reqProduct: { fontSize: 15, fontWeight: '800', color: T.text1 },
  reqQtyText: { fontSize: 13, color: T.text2, fontWeight: '400' },
  reqPrice: { fontSize: 15, fontWeight: '800', color: T.navy },
  reqNote: { fontSize: 12, color: T.text2, lineHeight: 18 },
  propBtn: { borderRadius: 8 },
  drawerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.overlay },
  drawerPanel: { position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', backgroundColor: T.card, flexDirection: 'column' },
  drawerHeader: { backgroundColor: T.navy, padding: 20, paddingTop: 56, gap: 6 },
  drawerName: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 10 },
  drawerBadges: { flexDirection: 'row', gap: 6 },
  sellerBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: `${T.amber}30` },
  sellerBadgeText: { fontSize: 11, fontWeight: '700', color: T.amber },
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
