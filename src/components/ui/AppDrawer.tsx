import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Animated, useWindowDimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

interface Props {
  open: boolean;
  onClose: () => void;
}

const SELLER_ITEMS = [
  { icon: 'home', label: 'Home', route: 'SellerTabs' as const },
  { icon: 'package', label: 'My Items', route: 'MyItems' as const },
  { icon: 'invoice', label: 'Invoices', route: 'InvoiceList' as const },
  { icon: 'bell', label: 'Notifications', route: 'Notifications' as const },
  { icon: 'globe', label: 'Language', route: 'Language' as const },
];

const BUYER_ITEMS = [
  { icon: 'home', label: 'Home', route: 'BuyerTabs' as const },
  { icon: 'gavel', label: 'My Bids', route: 'MyBids' as const },
  { icon: 'edit', label: 'My Requests', route: 'MyRequests' as const },
  { icon: 'invoice', label: 'Invoices', route: 'InvoiceList' as const },
  { icon: 'bell', label: 'Notifications', route: 'Notifications' as const },
  { icon: 'globe', label: 'Language', route: 'Language' as const },
];

export const AppDrawer: React.FC<Props> = ({ open, onClose }) => {
  const nav = useNavigation<Nav>();
  const { role, logout } = useAppStore();
  const isSeller = role === 'seller';
  const items = isSeller ? SELLER_ITEMS : BUYER_ITEMS;
  const userName = isSeller ? 'Ravi Kumar' : 'Priya Nair';

  const { width: screenW } = useWindowDimensions();
  const panelW = screenW * 0.8;
  const translateX = useRef(new Animated.Value(-panelW)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: open ? 0 : -panelW,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: open ? 1 : 0,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, panelW, translateX, overlayOpacity]);

  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} activeOpacity={1} />
      </Animated.View>
      <Animated.View style={[styles.panel, { width: panelW, transform: [{ translateX }] }]}>
        <View style={styles.header}>
          <Avatar name={userName} size={60} bg="rgba(255,255,255,0.2)" />
          <Text style={styles.name}>{userName}</Text>
          <View style={styles.badges}>
            <View style={[styles.roleBadge, { backgroundColor: isSeller ? `${T.amber}30` : `${T.green}30` }]}>
              <Text style={[styles.roleBadgeText, { color: isSeller ? T.amber : T.green }]}>
                {isSeller ? 'Seller' : 'Buyer'}
              </Text>
            </View>
            <View style={styles.indBadge}><Text style={styles.indBadgeText}>Individual</Text></View>
          </View>
          <TouchableOpacity onPress={() => { onClose(); nav.navigate('Profile'); }}>
            <Text style={styles.viewProfile}>View profile →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          {items.map(item => (
            <TouchableOpacity
              key={item.label}
              onPress={() => { onClose(); nav.navigate(item.route as any); }}
              style={styles.item}
            >
              <Icon name={item.icon} size={20} color={T.navy} />
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Icon name="chevronR" size={14} color={T.text3} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.item} onPress={onClose}>
            <Icon name="help" size={20} color={T.navy} />
            <Text style={styles.itemLabel}>Help & Support</Text>
            <Icon name="chevronR" size={14} color={T.text3} />
          </TouchableOpacity>
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.version}>v1.0.0 · SarwaMart India</Text>
          <TouchableOpacity
            onPress={async () => { onClose(); await logout(); nav.reset({ index: 0, routes: [{ name: 'PublicLanding' }] }); }}
            style={styles.logoutBtn}
          >
            <Icon name="logout" size={16} color={T.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: T.overlay },
  panel: { position: 'absolute', top: 0, left: 0, bottom: 0, backgroundColor: T.card, flexDirection: 'column', shadowColor: '#000', shadowOffset: { width: 2, height: 0 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 16 },
  header: { backgroundColor: T.navy, padding: 20, paddingTop: 56, gap: 6 },
  name: { fontSize: 18, fontWeight: '800', color: '#fff', marginTop: 10 },
  badges: { flexDirection: 'row', gap: 6 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  indBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.12)' },
  indBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  viewProfile: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: T.hairline },
  itemLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: T.text1 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10 },
  version: { fontSize: 11, color: T.text3 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: T.danger },
  logoutText: { color: T.danger, fontSize: 14, fontWeight: '700' },
});
