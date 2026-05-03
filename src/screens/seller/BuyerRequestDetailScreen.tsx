import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { Button } from '../../components/ui/Button';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { T } from '../../constants/tokens';
import { productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const BuyerRequestDetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedRequest: req } = useAppStore();

  if (!req) {
    return (
      <View style={styles.container}>
        <AppBar />
        <Header noSafeArea title="Buyer Request" onBack={() => nav.goBack()} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>This request is no longer available.</Text>
        </View>
      </View>
    );
  }

  const initials = req.buyer.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  const isVerified = req.verified === true;

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title="Buyer Request"
        onBack={() => nav.goBack()}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity hitSlop={8}><Icon name="heart" size={20} color={T.text2} /></TouchableOpacity>
            <TouchableOpacity hitSlop={8}><Icon name="share" size={20} color={T.text2} /></TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{productIcon(req.sub)}</Text>
        </View>

        <View style={styles.body}>
          {/* Title + price */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.product}>{req.product}</Text>
              <Text style={styles.sub}>{req.sub} · Looking to buy</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Expected</Text>
              <Text style={styles.price}>{req.price}</Text>
            </View>
          </View>

          {/* Closes-in strip */}
          <View style={styles.strip}>
            <View style={styles.stripLeft}>
              <Icon name="clock" size={14} color={T.amber} />
              <Text style={styles.stripText}>Closes in</Text>
            </View>
            <CountdownTimer seedSeconds={req.id * 4127 + 5400} compact />
          </View>

          {/* Specs grid */}
          <Card style={styles.cardNoMargin}>
            <View style={styles.grid}>
              {[
                ['Quantity needed', req.qty],
                ['Expected price', req.price],
                ['Category', req.sub],
                ['Posted', req.time],
              ].map(([k, v]) => (
                <View key={k} style={styles.gridCell}>
                  <Text style={styles.gridKey}>{k}</Text>
                  <Text style={styles.gridVal}>{v}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Buyer card */}
          <Card style={styles.cardNoMargin}>
            <View style={styles.buyerInner}>
              <View style={styles.buyerAvatar}>
                <Text style={styles.buyerAvatarText}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.buyerName}>{req.buyer}</Text>
                <View style={styles.buyerMeta}>
                  {isVerified && <Text style={styles.buyerVerified}>✓ Verified</Text>}
                  <Text style={styles.buyerRating}>★ 4.6</Text>
                  <Text style={styles.buyerDeals}>28 deals</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.profileBtn}>
                <Text style={styles.profileBtnText}>Profile</Text>
              </TouchableOpacity>
            </View>
          </Card>

          {/* Location */}
          <Card style={styles.cardNoMargin}>
            <View style={styles.locInner}>
              <View style={styles.locIconWrap}><Icon name="mapPin" size={18} color={T.navy} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.locName}>{req.loc}</Text>
                <Text style={styles.locDelivery}>Cold-chain delivery to buyer's location</Text>
              </View>
            </View>
          </Card>

          {/* Note / requirements */}
          <View style={styles.noteWrap}>
            <Text style={styles.sectionLabel}>Buyer's Requirements</Text>
            <View style={styles.noteCard}>
              <Icon name="info" size={16} color={T.amber} />
              <Text style={styles.noteText}>{req.note}</Text>
            </View>
          </View>

          {/* Action hint */}
          <View style={styles.hint}>
            <Icon name="send" size={14} color={T.navy} />
            <Text style={styles.hintText}>
              Submit a proposal with your price, quantity, and delivery timeline. The buyer will review and may negotiate.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={styles.cta}>
        <Avatar name={req.buyer} size={36} bg={`${T.amber}30`} />
        <View style={{ flex: 1 }}>
          <Text style={styles.ctaSub}>Best fit for sellers in</Text>
          <Text style={styles.ctaCat}>{req.sub} · {req.qty}</Text>
        </View>
        <Button label="Submit Proposal" onPress={() => nav.navigate('Negotiation')} style={styles.ctaBtn} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  headerRight: { flexDirection: 'row', gap: 12 },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { fontSize: 14, color: T.text3 },

  hero: { height: 200, backgroundColor: `${T.amber}10`, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: T.hairline },
  heroEmoji: { fontSize: 96 },

  body: { padding: 16, gap: 14 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  product: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, marginTop: 2, fontWeight: '600' },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  price: { fontSize: 22, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },

  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.amber}12`, borderWidth: 1, borderColor: `${T.amber}30` },
  stripLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripText: { fontSize: 13, color: T.text2, fontWeight: '600' },

  cardNoMargin: { marginBottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 },
  gridCell: { width: '47%' },
  gridKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },

  buyerInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  buyerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${T.amber}25`, alignItems: 'center', justifyContent: 'center' },
  buyerAvatarText: { fontSize: 14, fontWeight: '800', color: T.amber },
  buyerName: { fontSize: 15, fontWeight: '700', color: T.text1 },
  buyerMeta: { flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' },
  buyerVerified: { fontSize: 12, color: T.green, fontWeight: '700' },
  buyerRating: { fontSize: 12, color: T.amber, fontWeight: '700' },
  buyerDeals: { fontSize: 12, color: T.text3 },
  profileBtn: { borderWidth: 1.5, borderColor: T.navy, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  profileBtnText: { fontSize: 12, fontWeight: '700', color: T.navy },

  locInner: { padding: 14, flexDirection: 'row', gap: 12, alignItems: 'center' },
  locIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  locName: { fontSize: 14, fontWeight: '700', color: T.text1 },
  locDelivery: { fontSize: 12, color: T.text3, marginTop: 2 },

  noteWrap: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  noteCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, borderLeftWidth: 4, borderLeftColor: T.amber },
  noteText: { flex: 1, fontSize: 13, color: T.text1, lineHeight: 19 },

  hint: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, backgroundColor: `${T.navy}06`, borderWidth: 1, borderColor: `${T.navy}15`, alignItems: 'flex-start' },
  hintText: { flex: 1, fontSize: 12, color: T.text2, lineHeight: 17 },

  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.hairline, flexDirection: 'row', alignItems: 'center', gap: 12 },
  ctaSub: { fontSize: 11, color: T.text3, fontWeight: '600' },
  ctaCat: { fontSize: 13, fontWeight: '800', color: T.text1 },
  ctaBtn: { height: 48, borderRadius: 12, paddingHorizontal: 18 },
});
