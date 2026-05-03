import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { StatusPill } from '../../components/ui/StatusPill';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { SegTabs } from '../../components/ui/SegTabs';
import { T } from '../../constants/tokens';
import { productIcon, proposalsForRequest, Proposal } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const STATUS_COLOR: Record<Proposal['status'], { bg: string; fg: string; label: string }> = {
  pending:   { bg: '#FFF3E0', fg: '#BA7517', label: 'Pending' },
  accepted:  { bg: '#E6F4EC', fg: '#2D7A35', label: 'Accepted' },
  declined:  { bg: '#FDECEA', fg: '#A32D2D', label: 'Declined' },
  countered: { bg: '#E8F0FE', fg: '#1B5E9C', label: 'Countered' },
};

export const MyRequestDetailScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { selectedRequest: req } = useAppStore();
  const [seg, setSeg] = useState('All');

  const proposals = useMemo(() => (req ? proposalsForRequest(req) : []), [req]);
  const filtered = useMemo(() => {
    if (seg === 'All') return proposals;
    return proposals.filter(p => p.status === seg.toLowerCase());
  }, [seg, proposals]);

  if (!req) {
    return (
      <View style={styles.container}>
        <AppBar />
        <Header noSafeArea title="Request Detail" onBack={() => nav.goBack()} />
        <View style={styles.fallback}>
          <Text style={styles.fallbackText}>This request is no longer available.</Text>
        </View>
      </View>
    );
  }

  const expectedNum = Number(req.price.replace(/[^\d]/g, '')) || 0;

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea
        title="Request Detail"
        onBack={() => nav.goBack()}
        right={
          <View style={styles.headerRight}>
            <TouchableOpacity hitSlop={8}><Icon name="edit" size={20} color={T.text2} /></TouchableOpacity>
            <TouchableOpacity hitSlop={8}><Icon name="share" size={20} color={T.text2} /></TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>{productIcon(req.sub)}</Text>
        </View>

        <View style={styles.body}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.product}>{req.product}</Text>
              <Text style={styles.sub}>{req.sub} · You're looking to buy</Text>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.priceLabel}>Expected</Text>
              <Text style={styles.price}>{req.price}</Text>
            </View>
          </View>

          {/* Status strip */}
          <View style={styles.strip}>
            <StatusPill status={req.status} />
            {req.status === 'live' && (
              <View style={styles.stripRight}>
                <Icon name="clock" size={13} color={T.amber} />
                <Text style={styles.stripText}>Closes in</Text>
                <CountdownTimer seedSeconds={req.id * 4127 + 5400} compact />
              </View>
            )}
            {req.status === 'sold' && (
              <Text style={styles.soldText}>✓ Closed deal</Text>
            )}
            {req.status === 'expired' && (
              <Text style={styles.expiredText}>Expired on {req.expiry}</Text>
            )}
          </View>

          {/* Specs grid */}
          <Card style={styles.cardNoMargin}>
            <View style={styles.grid}>
              {[
                ['Quantity needed', req.qty],
                ['Expected price', req.price],
                ['Category', req.sub],
                ['Posted', req.time],
                ['Location', req.loc],
                ['Expires', req.expiry],
              ].map(([k, v]) => (
                <View key={k} style={styles.gridCell}>
                  <Text style={styles.gridKey}>{k}</Text>
                  <Text style={styles.gridVal}>{v}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Note */}
          <View style={styles.noteWrap}>
            <Text style={styles.sectionLabel}>Your Requirements</Text>
            <View style={styles.noteCard}>
              <Icon name="info" size={16} color={T.amber} />
              <Text style={styles.noteText}>
                You posted this request {req.time}. Sellers can submit proposals matching your specs.
              </Text>
            </View>
          </View>
        </View>

        {/* Proposals section */}
        <View style={styles.proposalsHeader}>
          <View style={styles.proposalsTitleRow}>
            <View style={styles.titleAccent} />
            <Text style={styles.proposalsTitle}>Proposals from Sellers</Text>
            <View style={styles.proposalsCountBadge}>
              <Text style={styles.proposalsCountText}>{proposals.length}</Text>
            </View>
          </View>
        </View>

        {proposals.length > 0 && (
          <SegTabs tabs={['All', 'Pending', 'Countered', 'Accepted', 'Declined']} active={seg} onSelect={setSeg} />
        )}

        <View style={styles.proposalsList}>
          {proposals.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <Icon name="send" size={26} color={T.amber} />
              </View>
              <Text style={styles.emptyTitle}>No proposals yet</Text>
              <Text style={styles.emptySub}>
                {req.status === 'live'
                  ? "You'll see seller proposals here as they come in. We'll notify you on each one."
                  : 'This request closed without proposals.'}
              </Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>No {seg.toLowerCase()} proposals</Text>
            </View>
          ) : (
            filtered.map(p => <ProposalCard key={p.id} p={p} expectedNum={expectedNum} onView={() => nav.navigate('Negotiation')} />)
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const ProposalCard: React.FC<{ p: Proposal; expectedNum: number; onView: () => void }> = ({ p, expectedNum, onView }) => {
  const initials = p.sellerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const status = STATUS_COLOR[p.status];
  const diff = expectedNum > 0 ? Math.round(((p.priceNum - expectedNum) / expectedNum) * 100) : 0;
  const diffColor = diff > 0 ? T.danger : diff < 0 ? T.green : T.text3;
  const diffLabel = diff > 0 ? `+${diff}% vs expected` : diff < 0 ? `${diff}% vs expected` : 'matches expected';

  return (
    <TouchableOpacity onPress={onView} style={styles.pCard} activeOpacity={0.85}>
      <View style={styles.pHeader}>
        <View style={styles.pAvatar}><Text style={styles.pAvatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <View style={styles.pNameRow}>
            <Text style={styles.pName} numberOfLines={1}>{p.sellerName}</Text>
            {p.sellerVerified && <Text style={styles.pVerified}>✓</Text>}
          </View>
          <View style={styles.pMetaRow}>
            <Text style={styles.pRating}>★ {p.sellerRating}</Text>
            <Text style={styles.pDeals}>· {p.sellerDeals} deals</Text>
            <Text style={styles.pTime}>· {p.time}</Text>
          </View>
        </View>
        <View style={[styles.pStatus, { backgroundColor: status.bg }]}>
          <Text style={[styles.pStatusText, { color: status.fg }]}>{status.label}</Text>
        </View>
      </View>

      <View style={styles.pPriceRow}>
        <View style={styles.pPriceBlock}>
          <Text style={styles.pPriceLabel}>OFFER</Text>
          <Text style={styles.pPrice}>{p.price}</Text>
          <Text style={[styles.pDiff, { color: diffColor }]}>{diffLabel}</Text>
        </View>
        <View style={styles.pQtyBlock}>
          <Text style={styles.pPriceLabel}>QUANTITY</Text>
          <Text style={styles.pQty}>{p.qty}</Text>
          <Text style={styles.pDelivery}>{p.delivery}</Text>
        </View>
      </View>

      <View style={styles.pLocRow}>
        <Icon name="mapPin" size={11} color={T.text3} />
        <Text style={styles.pLoc}>{p.sellerRegion}</Text>
      </View>

      <Text style={styles.pNote} numberOfLines={2}>{p.note}</Text>

      {p.status === 'pending' && (
        <View style={styles.pActions}>
          <TouchableOpacity style={styles.pActionDecline} onPress={onView}>
            <Text style={styles.pActionDeclineText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pActionCounter} onPress={onView}>
            <Text style={styles.pActionCounterText}>Counter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pActionAccept} onPress={onView}>
            <Icon name="check" size={13} color="#fff" />
            <Text style={styles.pActionAcceptText}>Accept</Text>
          </TouchableOpacity>
        </View>
      )}
      {p.status === 'countered' && (
        <View style={styles.pActions}>
          <TouchableOpacity style={styles.pActionView} onPress={onView}>
            <Icon name="msgCircle" size={13} color={T.navy} />
            <Text style={styles.pActionViewText}>View thread</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  headerRight: { flexDirection: 'row', gap: 12 },

  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  fallbackText: { fontSize: 14, color: T.text3 },

  hero: { height: 180, backgroundColor: `${T.amber}10`, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: T.hairline },
  heroEmoji: { fontSize: 84 },

  body: { padding: 16, gap: 14 },

  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  product: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, marginTop: 2, fontWeight: '600' },
  priceBlock: { alignItems: 'flex-end' },
  priceLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  price: { fontSize: 22, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },

  strip: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: `${T.amber}10`, borderWidth: 1, borderColor: `${T.amber}25` },
  stripRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripText: { fontSize: 12, color: T.text2, fontWeight: '600' },
  soldText: { fontSize: 12, fontWeight: '700', color: T.green },
  expiredText: { fontSize: 12, fontWeight: '700', color: T.danger },

  cardNoMargin: { marginBottom: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', padding: 14, gap: 12 },
  gridCell: { width: '47%' },
  gridKey: { fontSize: 11, color: T.text3, fontWeight: '600', letterSpacing: 0.3, textTransform: 'uppercase' },
  gridVal: { fontSize: 14, fontWeight: '700', color: T.text1, marginTop: 2 },

  noteWrap: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  noteCard: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, borderLeftWidth: 4, borderLeftColor: T.amber },
  noteText: { flex: 1, fontSize: 13, color: T.text1, lineHeight: 19 },

  proposalsHeader: { paddingHorizontal: 16, paddingTop: 6 },
  proposalsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titleAccent: { width: 4, height: 18, borderRadius: 2, backgroundColor: T.navy },
  proposalsTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  proposalsCountBadge: { minWidth: 24, height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  proposalsCountText: { fontSize: 12, fontWeight: '900', color: T.navy },

  proposalsList: { paddingHorizontal: 16, paddingTop: 6, gap: 12 },

  empty: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24, gap: 8, backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, borderStyle: 'dashed' },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 17, maxWidth: 260 },

  // Proposal card
  pCard: { padding: 14, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, gap: 10 },
  pHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  pAvatarText: { fontSize: 13, fontWeight: '800', color: T.navy },
  pNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pName: { fontSize: 14, fontWeight: '800', color: T.text1, flexShrink: 1 },
  pVerified: { fontSize: 12, color: T.green, fontWeight: '900' },
  pMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  pRating: { fontSize: 11, color: T.amber, fontWeight: '700' },
  pDeals: { fontSize: 11, color: T.text3 },
  pTime: { fontSize: 11, color: T.text3 },
  pStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  pStatusText: { fontSize: 11, fontWeight: '800' },

  pPriceRow: { flexDirection: 'row', borderRadius: 10, backgroundColor: T.bg, padding: 12, gap: 12 },
  pPriceBlock: { flex: 1, gap: 2 },
  pQtyBlock: { flex: 1, gap: 2, borderLeftWidth: 1, borderLeftColor: T.hairline, paddingLeft: 12 },
  pPriceLabel: { fontSize: 10, color: T.text3, fontWeight: '700', letterSpacing: 0.4 },
  pPrice: { fontSize: 18, fontWeight: '900', color: T.amber, fontVariant: ['tabular-nums'] },
  pQty: { fontSize: 16, fontWeight: '800', color: T.text1 },
  pDiff: { fontSize: 11, fontWeight: '700' },
  pDelivery: { fontSize: 11, color: T.text3, fontWeight: '600' },

  pLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pLoc: { fontSize: 11, color: T.text3 },
  pNote: { fontSize: 12, color: T.text2, lineHeight: 17 },

  pActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  pActionDecline: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.hairline },
  pActionDeclineText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  pActionCounter: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: `${T.navy}10`, borderWidth: 1.5, borderColor: `${T.navy}30` },
  pActionCounterText: { fontSize: 12, fontWeight: '800', color: T.navy },
  pActionAccept: { flex: 1.4, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: T.green, flexDirection: 'row', gap: 4 },
  pActionAcceptText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  pActionView: { flex: 1, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.navy, flexDirection: 'row', gap: 6 },
  pActionViewText: { fontSize: 12, fontWeight: '800', color: T.navy },
});
