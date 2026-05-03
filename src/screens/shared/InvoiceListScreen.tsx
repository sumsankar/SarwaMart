import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { SegTabs } from '../../components/ui/SegTabs';
import { StatusPill } from '../../components/ui/StatusPill';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { invoicesForRole, Invoice } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const PAGE_SIZE = 10;
const LOAD_DELAY_MS = 600;

const fmtINR = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const SEG_FILTERS: Record<string, (i: Invoice) => boolean> = {
  All: () => true,
  Pending: i => i.status === 'pending' || i.status === 'payment pending',
  Settled: i => i.status === 'settled',
  Disputed: i => i.status === 'disputed',
};

const sourceLabel = (inv: Invoice): string => {
  if (inv.direction === 'payable') return inv.source === 'bid' ? 'Won bid' : 'Request fulfilled';
  return inv.source === 'bid' ? 'Item sold' : 'Request fulfilled';
};

const sourceIcon = (inv: Invoice): string => (inv.source === 'bid' ? 'gavel' : 'edit');

export const InvoiceListScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { role } = useAppStore();
  const [seg, setSeg] = useState('All');
  const [items, setItems] = useState<Invoice[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isBuyer = role === 'buyer';
  const directionLabel = isBuyer ? 'You owe' : 'You receive';
  const accentColor = isBuyer ? T.amber : T.navy;

  const myInvoices = useMemo(() => invoicesForRole(role), [role]);
  const all = useMemo(() => myInvoices.filter(SEG_FILTERS[seg] ?? SEG_FILTERS.All), [myInvoices, seg]);
  const hasMore = items.length < all.length;

  const totalOpen = useMemo(
    () => myInvoices.filter(i => i.status === 'pending' || i.status === 'payment pending').reduce((s, i) => s + i.amountNum, 0),
    [myInvoices],
  );
  const totalSettled = useMemo(
    () => myInvoices.filter(i => i.status === 'settled').reduce((s, i) => s + i.amountNum, 0),
    [myInvoices],
  );

  useEffect(() => {
    setItems(all.slice(0, PAGE_SIZE));
  }, [seg, role]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    setTimeout(() => {
      setItems(prev => all.slice(0, prev.length + PAGE_SIZE));
      setLoadingMore(false);
    }, LOAD_DELAY_MS);
  }, [loadingMore, hasMore, all]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      setItems(all.slice(0, PAGE_SIZE));
      setRefreshing(false);
    }, LOAD_DELAY_MS);
  }, [all]);

  const renderItem = useCallback(({ item: inv }: { item: Invoice }) => {
    const isPaid = inv.status === 'settled';
    const isDisputed = inv.status === 'disputed';
    const isOverdue = inv.dueIn.toLowerCase().startsWith('overdue');
    const dueColor = isOverdue ? T.danger : isPaid ? T.green : isDisputed ? T.danger : T.amber;
    const dueIcon = isOverdue ? 'alert' : isPaid ? 'checkCircle' : isDisputed ? 'alert' : 'clock';
    const stripColor = isPaid ? T.green : isDisputed ? T.danger : (inv.direction === 'payable' ? T.amber : T.navy);
    const partyLabel = inv.direction === 'payable' ? 'Pay to' : 'Received from';
    const amountLabel = inv.direction === 'payable' ? 'AMOUNT TO PAY' : 'AMOUNT TO RECEIVE';
    const amountColor = inv.direction === 'payable' ? T.amber : T.navy;

    return (
      <TouchableOpacity onPress={() => nav.navigate('InvoiceDetail')} style={styles.card} activeOpacity={0.85}>
        <View style={[styles.accent, { backgroundColor: stripColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View style={styles.idCol}>
              <Text style={styles.idLabel}>INVOICE</Text>
              <Text style={styles.idText}>{inv.id}</Text>
            </View>
            <StatusPill status={inv.status} />
          </View>

          <View style={styles.sourceRow}>
            <View style={[styles.sourceChip, { backgroundColor: `${stripColor}12`, borderColor: `${stripColor}35` }]}>
              <Icon name={sourceIcon(inv)} size={11} color={stripColor} />
              <Text style={[styles.sourceText, { color: stripColor }]}>{sourceLabel(inv)}</Text>
            </View>
            <Text style={styles.directionText}>{directionLabel}</Text>
          </View>

          <Text style={styles.partyLabel}>{partyLabel}</Text>
          <Text style={styles.party} numberOfLines={1}>{inv.party}</Text>
          <Text style={styles.product} numberOfLines={1}>{inv.product}</Text>

          <View style={styles.amountRow}>
            <View>
              <Text style={styles.amountLabel}>{amountLabel}</Text>
              <Text style={[styles.amount, { color: amountColor }]}>{inv.amount}</Text>
            </View>
            <View style={styles.dueBlock}>
              <View style={[styles.dueChip, { backgroundColor: `${dueColor}15`, borderColor: `${dueColor}40` }]}>
                <Icon name={dueIcon} size={11} color={dueColor} />
                <Text style={[styles.dueText, { color: dueColor }]}>{inv.dueIn}</Text>
              </View>
              <Text style={styles.dateText}>{inv.date}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.footer}>
            <View style={styles.footerLeft}>
              {!isPaid && !isDisputed && inv.direction === 'payable' && (
                <View style={styles.payBtn}>
                  <Icon name="send" size={12} color="#fff" />
                  <Text style={styles.payBtnText}>Pay Now</Text>
                </View>
              )}
              {!isPaid && !isDisputed && inv.direction === 'receivable' && (
                <View style={styles.awaitNote}>
                  <Icon name="clock" size={12} color={T.amber} />
                  <Text style={styles.awaitText}>Awaiting payout</Text>
                </View>
              )}
              {isDisputed && (
                <View style={styles.disputeNote}>
                  <Icon name="alert" size={12} color={T.danger} />
                  <Text style={styles.disputeText}>Resolution pending</Text>
                </View>
              )}
              {isPaid && (
                <View style={styles.paidNote}>
                  <Icon name="checkCircle" size={12} color={T.green} />
                  <Text style={styles.paidText}>{inv.direction === 'payable' ? 'Paid in full' : 'Settled in full'}</Text>
                </View>
              )}
            </View>
            <View style={styles.viewRow}>
              <Text style={styles.viewText}>View</Text>
              <Icon name="chevronR" size={14} color={T.navy} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [nav, directionLabel]);

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="My Invoices" onBack={() => nav.goBack()} />

      {/* Totals strip — labels flip based on role */}
      <View style={[styles.totals, { backgroundColor: accentColor }]}>
        <View style={styles.totalCell}>
          <Text style={styles.totalLabel}>{isBuyer ? 'Total Payable' : 'Total Receivable'}</Text>
          <Text style={styles.totalVal}>{fmtINR(totalOpen)}</Text>
        </View>
        <View style={[styles.totalCell, styles.totalCellBorder]}>
          <Text style={styles.totalLabel}>{isBuyer ? 'Paid' : 'Settled'}</Text>
          <Text style={styles.totalVal}>{fmtINR(totalSettled)}</Text>
        </View>
      </View>

      <View style={styles.subtitleRow}>
        <Icon name={isBuyer ? 'send' : 'download'} size={13} color={accentColor} />
        <Text style={styles.subtitle}>
          {isBuyer
            ? 'Invoices you owe SarwaMart for goods received'
            : 'Invoices SarwaMart owes you for delivered goods'}
        </Text>
      </View>

      <SegTabs tabs={['All', 'Pending', 'Settled', 'Disputed']} active={seg} onSelect={setSeg} />

      <Text style={styles.countText}>
        Showing {items.length} of {all.length} {all.length === 1 ? 'invoice' : 'invoices'}
      </Text>

      <FlatList
        data={items}
        keyExtractor={i => i.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accentColor} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIconWrap, { backgroundColor: `${accentColor}15` }]}>
              <Icon name="invoice" size={26} color={accentColor} />
            </View>
            <Text style={styles.emptyTitle}>
              No {seg === 'All' ? '' : `${seg.toLowerCase()} `}invoices
            </Text>
            <Text style={styles.emptySub}>
              {isBuyer
                ? 'Invoices appear here once a bid you placed is accepted or your request is fulfilled.'
                : 'Invoices appear here once a deal closes.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <ActivityIndicator color={accentColor} />
              <Text style={styles.footerText}>Loading more…</Text>
            </View>
          ) : !hasMore && items.length > 0 ? (
            <View style={styles.footerEnd}>
              <Text style={styles.footerEndText}>You're all caught up</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  totals: { flexDirection: 'row', margin: 12, marginHorizontal: 16, marginBottom: 4, padding: 14, borderRadius: 14 },
  totalCell: { flex: 1 },
  totalCellBorder: { paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
  totalLabel: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4, fontWeight: '600' },
  totalVal: { fontSize: 18, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] },

  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8 },
  subtitle: { fontSize: 11, color: T.text3, flex: 1, fontWeight: '600' },

  countText: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4, fontSize: 12, color: T.text3, fontWeight: '600' },
  list: { padding: 16, paddingTop: 8, gap: 12 },

  card: { borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  accent: { height: 3 },
  cardBody: { padding: 14, gap: 6 },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idCol: { gap: 2 },
  idLabel: { fontSize: 10, fontWeight: '800', color: T.text3, letterSpacing: 0.4 },
  idText: { fontSize: 13, fontWeight: '800', color: T.navy, fontVariant: ['tabular-nums'] },

  sourceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sourceChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  sourceText: { fontSize: 11, fontWeight: '800' },
  directionText: { fontSize: 11, color: T.text3, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },

  partyLabel: { fontSize: 10, fontWeight: '800', color: T.text3, letterSpacing: 0.4, marginTop: 6 },
  party: { fontSize: 16, fontWeight: '800', color: T.text1 },
  product: { fontSize: 12, color: T.text2, fontWeight: '600' },

  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 10, backgroundColor: T.bg, marginTop: 6 },
  amountLabel: { fontSize: 10, fontWeight: '800', color: T.text3, letterSpacing: 0.4 },
  amount: { fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'], marginTop: 2 },
  dueBlock: { alignItems: 'flex-end', gap: 4 },
  dueChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  dueText: { fontSize: 11, fontWeight: '800' },
  dateText: { fontSize: 11, color: T.text3, fontWeight: '600' },

  divider: { height: 1, backgroundColor: T.hairline, marginTop: 4 },

  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footerLeft: { flex: 1 },
  payBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: T.amber, alignSelf: 'flex-start' },
  payBtnText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  awaitNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  awaitText: { fontSize: 11, color: T.amber, fontWeight: '700' },
  disputeNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  disputeText: { fontSize: 11, color: T.danger, fontWeight: '700' },
  paidNote: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  paidText: { fontSize: 11, color: T.green, fontWeight: '700' },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewText: { fontSize: 12, fontWeight: '800', color: T.navy },

  footerLoading: { paddingVertical: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  footerText: { fontSize: 13, color: T.text3 },
  footerEnd: { paddingVertical: 24, alignItems: 'center' },
  footerEndText: { fontSize: 12, color: T.text3 },

  empty: { alignItems: 'center', paddingVertical: 56, paddingHorizontal: 24, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', lineHeight: 19, maxWidth: 280 },
});
