import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const BIDS = [
  { buyer: 'Sri Venkateswara Traders', loc: 'Vijayawada', price: '₹245/kg', qty: '200 kg', total: '₹49,000', rating: 4.8 },
  { buyer: 'Coastal Foods Pvt Ltd',   loc: 'Chennai',    price: '₹238/kg', qty: '300 kg', total: '₹71,400', rating: 4.5 },
  { buyer: 'Verified Buyer #4821',    loc: 'Hyderabad',  price: '₹230/kg', qty: '500 kg', total: '₹1,15,000', rating: null },
];

export const ItemDetailSellerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedItem: item } = useAppStore();

  return (
    <SafeAreaView style={styles.container}>
      <Header title={item?.name || 'Item Detail'} onBack={() => nav.goBack()} right={
        <TouchableOpacity><Icon name="more" size={20} color={T.text1} /></TouchableOpacity>
      } />
      <ScrollView>
        <View style={styles.imgBox}>
          <Text style={styles.imgEmoji}>{item?.img || '🐟'}</Text>
        </View>
        <View style={styles.statusBanner}>
          <Icon name="checkCircle" size={18} color={T.green} />
          <Text style={styles.statusText}>Live until 14 Nov, 6:00 PM</Text>
          <CountdownTimer seedSeconds={43200} compact />
        </View>
        <View style={styles.factGrid}>
          {[
            ['Quantity', item?.qty || '500 kg'],
            ['Starting Price', item?.price || '₹145/kg'],
            ['Grade', `Grade ${item?.grade || 'A'}`],
            ['Harvest Date', '12 Nov 2025'],
            ['Freshness', item?.freshness || 'Fresh on ice'],
            ['Region', item?.region || 'West Godavari, AP'],
          ].map(([k, v]) => (
            <View key={k} style={styles.fact}>
              <Text style={styles.factKey}>{k}</Text>
              <Text style={styles.factVal}>{v}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bidsSection}>
          <View style={styles.bidsHeader}>
            <Text style={styles.bidsTitle}>Bids Received</Text>
            <Text style={styles.highest}>Highest: ₹245/kg</Text>
          </View>
          {BIDS.map((bid, i) => (
            <Card key={i} onPress={() => nav.navigate('Negotiation')} style={styles.bidCard}>
              <View style={styles.bidInner}>
                <View style={styles.bidTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bidBuyer}>{bid.buyer}</Text>
                    <View style={styles.bidMeta}>
                      <Icon name="mapPin" size={10} color={T.text3} />
                      <Text style={styles.bidLoc}>{bid.loc}</Text>
                      {bid.rating && <Text style={styles.bidRating}>★ {bid.rating}</Text>}
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.bidPrice}>{bid.price}</Text>
                    <Text style={styles.bidQty}>{bid.qty}</Text>
                  </View>
                </View>
                <View style={styles.bidBottom}>
                  <Text style={styles.bidTotal}>Total: {bid.total}</Text>
                  <View style={styles.viewThread}>
                    <Icon name="msgCircle" size={14} color={T.navy} />
                    <Text style={styles.viewThreadText}>View thread</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  imgBox: { height: 200, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  imgEmoji: { fontSize: 80 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, padding: 12, borderRadius: 10, backgroundColor: `${T.green}15`, borderWidth: 1, borderColor: `${T.green}40` },
  statusText: { flex: 1, fontSize: 13, color: T.green, fontWeight: '600' },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: 16, padding: 14, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.cardBorder, gap: 12 },
  fact: { width: '47%' },
  factKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3 },
  factVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },
  bidsSection: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  bidsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidsTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  highest: { fontSize: 13, fontWeight: '700', color: T.amber },
  bidCard: { marginBottom: 0 },
  bidInner: { padding: 14, gap: 8 },
  bidTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  bidBuyer: { fontSize: 14, fontWeight: '700', color: T.text1 },
  bidMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  bidLoc: { fontSize: 11, color: T.text3 },
  bidRating: { fontSize: 11, color: T.amber },
  bidPrice: { fontSize: 18, fontWeight: '900', color: T.navy },
  bidQty: { fontSize: 12, color: T.text2 },
  bidBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bidTotal: { fontSize: 13, fontWeight: '700', color: T.green },
  viewThread: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewThreadText: { fontSize: 12, fontWeight: '600', color: T.navy },
});
