import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const ItemDetailBuyerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem: item } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title=""
        onBack={() => nav.goBack()}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity><Icon name="heart" size={20} color={T.text2} /></TouchableOpacity>
            <TouchableOpacity><Icon name="share" size={20} color={T.text2} /></TouchableOpacity>
          </View>
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Gallery */}
        <View style={styles.gallery}>
          <Text style={styles.galleryEmoji}>{item?.img || '🐟'}</Text>
        </View>

        <View style={styles.body}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item?.name || 'Fresh Rohu'}</Text>
              <Text style={styles.itemSub}>{item?.sub || 'Fish'}</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Starting at</Text>
              <Text style={styles.price}>₹{item?.priceNum || '145'}</Text>
              <Text style={styles.uom}>per {item?.uom || 'kg'}</Text>
            </View>
          </View>

          {/* Live bids strip */}
          <View style={styles.bidStrip}>
            <Text style={styles.bidStripText}>Currently <Text style={styles.bidCount}>{item?.bids || 6} bids</Text></Text>
            <CountdownTimer seedSeconds={item ? item.id * 9341 + 2700 : 28800} compact />
          </View>

          {/* Info grid */}
          <Card style={styles.infoCard}>
            <View style={styles.infoGrid}>
              {[
                ['Quantity', item?.qty || '500 kg'],
                ['Min Order', '50 kg'],
                ['Grade', `Grade ${item?.grade || 'A'}`],
                ['Freshness', item?.freshness || 'Fresh on ice'],
                ['Harvest Date', '12 Nov 2025'],
                ['Valid Until', '14 Nov, 6 PM'],
              ].map(([k, v]) => (
                <View key={k} style={styles.infoCell}>
                  <Text style={styles.infoCellKey}>{k}</Text>
                  <Text style={styles.infoCellVal}>{v}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Seller card */}
          <Card style={styles.sellerCard}>
            <View style={styles.sellerInner}>
              <Avatar name={item?.name || 'Ravi Kumar'} size={44} bg={T.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>Ravi Aqua Farms</Text>
                <View style={styles.sellerMeta}>
                  <Text style={styles.sellerRating}>★ 4.8</Text>
                  <Text style={styles.sellerDeals}>43 deals</Text>
                  <Text style={styles.sellerVerified}>✓ Verified</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.sellerProfileBtn}>
                <Text style={styles.sellerProfileText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Location */}
          <Card>
            <View style={styles.locInner}>
              <Icon name="mapPin" size={20} color={T.navy} />
              <View>
                <Text style={styles.locName}>{item?.region || 'West Godavari, AP'}</Text>
                <Text style={styles.locDelivery}>Delivery available up to 120 km</Text>
              </View>
            </View>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <Button label="Place a Bid" fullWidth onPress={() => nav.navigate('PlaceBid')} style={styles.ctaBtn} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  headerRight: { flexDirection: 'row', gap: 8 },
  gallery: { height: 220, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  galleryEmoji: { fontSize: 90 },
  body: { padding: 16, gap: 14 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  itemName: { fontSize: 22, fontWeight: '900', color: T.text1 },
  itemSub: { fontSize: 14, color: T.text2, marginTop: 2 },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: T.text3 },
  price: { fontSize: 28, fontWeight: '900', color: T.navy },
  uom: { fontSize: 12, color: T.text2 },
  bidStrip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.amber}12`, borderWidth: 1, borderColor: `${T.amber}30` },
  bidStripText: { fontSize: 13, color: T.text2 },
  bidCount: { fontWeight: '700', color: T.text1 },
  infoCard: { marginBottom: 0 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 },
  infoCell: { width: '47%' },
  infoCellKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3 },
  infoCellVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },
  sellerCard: { marginBottom: 0 },
  sellerInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  sellerName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  sellerMeta: { flexDirection: 'row', gap: 8, marginTop: 2 },
  sellerRating: { fontSize: 12, color: T.amber },
  sellerDeals: { fontSize: 12, color: T.text3 },
  sellerVerified: { fontSize: 12, color: T.green, fontWeight: '600' },
  sellerProfileBtn: { borderWidth: 1.5, borderColor: T.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sellerProfileText: { fontSize: 12, fontWeight: '700', color: T.navy },
  locInner: { padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
  locName: { fontSize: 14, fontWeight: '700', color: T.text1 },
  locDelivery: { fontSize: 12, color: T.green },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline },
  ctaBtn: { height: 52, borderRadius: 14 },
});
