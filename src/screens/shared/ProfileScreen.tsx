import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';

const SECTIONS = [
  { title: 'Personal Details',        icon: 'user' },
  { title: 'Products & Subproducts',  icon: 'fish' },
  { title: 'Regions & Areas',         icon: 'mapPin' },
  { title: 'KYC & Documents',         icon: 'shield' },
  { title: 'Bank Account Details',    icon: 'receipt' },
  { title: 'Security',               icon: 'shield' },
  { title: 'Preferences',            icon: 'globe' },
];

export const ProfileScreen: React.FC = () => {
  const nav = useNavigation<any>();

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title="Profile"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity>
            <Icon name="edit" size={20} color={T.navy} />
          </TouchableOpacity>
        }
      />
      <ScrollView>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Avatar name="Ravi Kumar" size={72} bg="rgba(255,255,255,0.2)" />
            <View style={styles.cameraBadge}>
              <Icon name="camera" size={11} color="#fff" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>Ravi Kumar</Text>
            <View style={styles.heroBadges}>
              <View style={styles.badgeSeller}><Text style={styles.badgeSellerText}>Seller</Text></View>
              <View style={styles.badgeType}><Text style={styles.badgeTypeText}>Individual</Text></View>
              <View style={styles.badgeKyc}><Text style={styles.badgeKycText}>✓ KYC Verified</Text></View>
            </View>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[['43', 'Deals'], ['4.8 ★', 'Rating'], ['Nov 2023', 'Member since']].map(([v, l], i) => (
            <View key={l} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* Sections */}
        <View style={styles.sectionList}>
          {SECTIONS.map((s, i) => (
            <TouchableOpacity key={i} style={styles.sectionRow} activeOpacity={0.7}>
              <View style={styles.sectionIcon}>
                <Icon name={s.icon} size={18} color={T.navy} />
              </View>
              <Text style={styles.sectionTitle}>{s.title}</Text>
              <Icon name="chevronR" size={16} color={T.text3} />
            </TouchableOpacity>
          ))}

          {/* Danger zone */}
          <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7}>
            <Icon name="trash" size={18} color={T.danger} />
            <Text style={styles.deleteText}>Delete my account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  hero: { backgroundColor: T.navy, padding: 24, paddingBottom: 28, flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: T.amber, borderWidth: 2, borderColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroBadges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badgeSeller: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${T.amber}30` },
  badgeSellerText: { fontSize: 11, fontWeight: '700', color: T.amber },
  badgeType: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeTypeText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  badgeKyc: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${T.green}40` },
  badgeKycText: { fontSize: 11, fontWeight: '700', color: '#7EDB8B' },
  statsRow: { backgroundColor: T.card, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.hairline },
  statCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: T.hairline },
  statVal: { fontSize: 18, fontWeight: '900', color: T.navy },
  statLabel: { fontSize: 11, color: T.text3, marginTop: 2 },
  sectionList: { padding: 16, gap: 8 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.hairline },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: T.text1 },
  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: `${T.danger}08`, borderRadius: 12, borderWidth: 1, borderColor: `${T.danger}25`, marginTop: 8 },
  deleteText: { fontSize: 14, fontWeight: '600', color: T.danger },
});
