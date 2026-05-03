import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Modal } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { AppBar } from '../../components/ui/AppBar';
import { Icon } from '../../components/ui/Icon';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { StatusPill } from '../../components/ui/StatusPill';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS, BUYER_REQUESTS, SELLER_BANNERS, productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

const STATUS_OPTIONS = ['All', 'Live', 'Pending', 'Sold', 'Expired'];
const CATEGORY_OPTIONS = ['All', 'Fish', 'Prawn', 'Crab', 'Lobster', 'Squid'];
const GRADE_OPTIONS = ['All', 'A', 'B'];
const FRESHNESS_OPTIONS = ['All', 'Live', 'Fresh on ice'];

interface Filters {
  status: string;
  category: string;
  grade: string;
  freshness: string;
}

const DEFAULT_FILTERS: Filters = { status: 'All', category: 'All', grade: 'All', freshness: 'All' };

export const SellerHomeScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem, setSelectedRequest } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<Filters>(DEFAULT_FILTERS);

  const activeFilterCount =
    (filters.status !== 'All' ? 1 : 0) +
    (filters.category !== 'All' ? 1 : 0) +
    (filters.grade !== 'All' ? 1 : 0) +
    (filters.freshness !== 'All' ? 1 : 0);

  const openFilter = () => { setDraft(filters); setFilterOpen(true); };
  const applyFilter = () => { setFilters(draft); setFilterOpen(false); };
  const resetFilter = () => setDraft(DEFAULT_FILTERS);

  const q = search.trim().toLowerCase();
  const filteredItems = useMemo(() => {
    return SELLER_ITEMS.filter(i => {
      if (q && !(i.name.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q) || i.region.toLowerCase().includes(q))) return false;
      if (filters.status !== 'All' && i.status.toLowerCase() !== filters.status.toLowerCase()) return false;
      if (filters.category !== 'All' && i.sub.toLowerCase() !== filters.category.toLowerCase()) return false;
      if (filters.grade !== 'All' && i.grade !== filters.grade) return false;
      if (filters.freshness !== 'All' && i.freshness !== filters.freshness) return false;
      return true;
    });
  }, [q, filters]);
  const filteredRequests = useMemo(() => {
    return BUYER_REQUESTS.filter(r => {
      if (q && !(r.product.toLowerCase().includes(q) || r.sub.toLowerCase().includes(q) || r.buyer.toLowerCase().includes(q) || r.loc.toLowerCase().includes(q))) return false;
      if (filters.category !== 'All' && r.sub.toLowerCase() !== filters.category.toLowerCase()) return false;
      return true;
    });
  }, [q, filters]);

  return (
    <View style={styles.container}>
      <AppBar />

      {/* Pinned region — banner carousel + search bar stay visible while the lists scroll */}
      <View style={styles.pinned}>
        <BannerCarousel banners={SELLER_BANNERS} />
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.text3} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search products, buyers, regions…"
              placeholderTextColor={T.text3}
              style={styles.searchInput}
              returnKeyType="search"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={openFilter}>
            <Icon name="filter" size={16} color={T.navy} />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* My Items carousel — navy/seller theme */}
        <SectionHeader
          title="My Items for Bid"
          accent="navy"
          badge={{ label: 'Your listings', color: 'navy' }}
          onSeeAll={() => nav.navigate('MyItems')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {!q && (
            <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.addTile}>
              <View style={styles.addCircle}><Icon name="plus" size={20} color={T.navy} /></View>
              <Text style={styles.addText}>Add new{'\n'}item</Text>
            </TouchableOpacity>
          )}
          {filteredItems.length === 0 && (
            <EmptyState
              compact
              title={q ? `No items match “${search}”` : 'No items match these filters'}
              subtitle="Try a different search or adjust your filters."
              showClear={!!q || activeFilterCount > 0}
              onClear={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }}
            />
          )}
          {filteredItems.slice(0, 10).map(item => {
            const isLive = item.status.toLowerCase() === 'live';
            return (
              <TouchableOpacity key={item.id} onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }} style={styles.itemCard} activeOpacity={0.85}>
                <View style={styles.itemAccent} />
                <View style={styles.itemImg}>
                  <Text style={styles.itemEmoji}>{item.img}</Text>
                  <View style={styles.statusPillWrap}><StatusPill status={item.status} /></View>
                </View>
                <View style={styles.itemBody}>
                  <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.itemSub}>{item.sub} · {item.qty}</Text>
                  <View style={styles.itemLocRow}>
                    <Icon name="mapPin" size={11} color={T.text3} />
                    <Text style={styles.itemLocText} numberOfLines={1}>{item.region}</Text>
                  </View>
                  <View style={styles.itemPriceRow}>
                    <Text style={styles.itemPrice}>{item.price}</Text>
                    {isLive && <CountdownTimer seedSeconds={item.id * 7823 + 3601} compact />}
                  </View>
                  <View style={styles.itemTagsRow}>
                    <View style={styles.itemTag}>
                      <Icon name="shield" size={10} color={T.navy} />
                      <Text style={styles.itemTagText}>Gr. {item.grade}</Text>
                    </View>
                    <View style={styles.itemTag}>
                      <Text style={styles.itemTagText}>{item.freshness}</Text>
                    </View>
                  </View>
                  <View style={styles.itemDivider} />
                  <View style={styles.itemFooter}>
                    {item.bids > 0 ? (
                      <View style={styles.itemBidsWrap}>
                        <Icon name="gavel" size={12} color={T.amber} />
                        <Text style={styles.itemBidsText}>
                          <Text style={styles.itemBidsNum}>{item.bids}</Text> bids
                        </Text>
                      </View>
                    ) : (
                      <Text style={styles.itemNoBidsText}>No bids yet</Text>
                    )}
                    <Icon name="chevronR" size={14} color={T.text3} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Buyer Requests — amber/incoming-demand theme, horizontal, latest 10 */}
        <SectionHeader
          title="Buyer Requests"
          accent="amber"
          badge={{ label: 'Looking to buy', color: 'amber' }}
          onSeeAll={() => nav.navigate('BuyerRequestsList')}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
          {filteredRequests.length === 0 && (
            <EmptyState
              compact
              title={q ? `No requests match “${search}”` : 'No requests match these filters'}
              subtitle="Try a broader search or change your filters."
              showClear={!!q || activeFilterCount > 0}
              onClear={() => { setSearch(''); setFilters(DEFAULT_FILTERS); }}
            />
          )}
          {filteredRequests.slice(0, 10).map(req => {
            const initials = req.buyer.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const openDetail = () => { setSelectedRequest(req); nav.navigate('BuyerRequestDetail'); };
            return (
              <TouchableOpacity key={req.id} onPress={openDetail} style={styles.reqCardH} activeOpacity={0.85}>
                <View style={styles.reqAccent} />
                <View style={styles.reqHeaderH}>
                  <View style={styles.reqAvatar}><Text style={styles.reqAvatarText}>{initials}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reqBuyerH} numberOfLines={1}>{req.buyer}</Text>
                    <View style={styles.reqMetaH}>
                      <Icon name="mapPin" size={10} color={T.text3} />
                      <Text style={styles.reqLocH} numberOfLines={1}>{req.loc}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.reqProductRow}>
                  <View style={styles.reqIconBox}>
                    <Text style={styles.reqIconText}>{productIcon(req.sub)}</Text>
                  </View>
                  <View style={styles.reqProductInfo}>
                    <Text style={styles.reqProductH} numberOfLines={1}>{req.product}</Text>
                    <Text style={styles.reqProductMeta} numberOfLines={1}>{req.sub} · {req.qty}</Text>
                  </View>
                  <Text style={styles.reqPriceRight} numberOfLines={1}>{req.price}</Text>
                </View>
                <Text style={styles.reqNoteH} numberOfLines={2}>{req.note}</Text>
                <View style={styles.reqFooter}>
                  <CountdownTimer seedSeconds={req.id * 4127 + 5400} compact />
                  <View style={styles.reqProposeBtn}>
                    <Icon name="send" size={12} color="#fff" />
                    <Text style={styles.reqProposeText}>Propose</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </ScrollView>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filter</Text>
            <TouchableOpacity onPress={resetFilter}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
            <FilterGroup label="Status" options={STATUS_OPTIONS} value={draft.status} onChange={v => setDraft(d => ({ ...d, status: v }))} />
            <FilterGroup label="Category" options={CATEGORY_OPTIONS} value={draft.category} onChange={v => setDraft(d => ({ ...d, category: v }))} />
            <FilterGroup label="Grade" options={GRADE_OPTIONS} value={draft.grade} onChange={v => setDraft(d => ({ ...d, grade: v }))} />
            <FilterGroup label="Freshness" options={FRESHNESS_OPTIONS} value={draft.freshness} onChange={v => setDraft(d => ({ ...d, freshness: v }))} />
          </ScrollView>
          <View style={styles.sheetFooter}>
            <Button label="Apply Filters" onPress={applyFilter} fullWidth />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const EmptyState: React.FC<{ title: string; subtitle: string; compact?: boolean; showClear?: boolean; onClear?: () => void }> = ({ title, subtitle, compact, showClear, onClear }) => (
  <View style={[styles.emptyState, compact && styles.emptyStateCompact]}>
    <View style={styles.emptyIconWrap}>
      <Icon name="search" size={compact ? 20 : 26} color={T.navy} />
    </View>
    <Text style={[styles.emptyTitle, compact && styles.emptyTitleCompact]} numberOfLines={2}>{title}</Text>
    <Text style={[styles.emptySubtitle, compact && styles.emptySubtitleCompact]} numberOfLines={compact ? 2 : 3}>{subtitle}</Text>
    {showClear && onClear && (
      <TouchableOpacity onPress={onClear} style={styles.emptyClearBtn} activeOpacity={0.7}>
        <Icon name="refresh" size={13} color={T.navy} />
        <Text style={styles.emptyClearText}>Clear all</Text>
      </TouchableOpacity>
    )}
  </View>
);

const FilterGroup: React.FC<{ label: string; options: string[]; value: string; onChange: (v: string) => void }> = ({ label, options, value, onChange }) => (
  <View style={styles.fgWrap}>
    <Text style={styles.fgLabel}>{label}</Text>
    <View style={styles.fgChips}>
      {options.map(opt => {
        const selected = opt === value;
        return (
          <TouchableOpacity key={opt} onPress={() => onChange(opt)} style={[styles.fgChip, selected && styles.fgChipSelected]}>
            <Text style={[styles.fgChipText, selected && styles.fgChipTextSelected]}>{opt}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  pinned: { backgroundColor: T.bg, borderBottomWidth: 1, borderBottomColor: T.hairline, paddingBottom: 12 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12, flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: T.card, borderRadius: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: T.hairline },
  searchInput: { flex: 1, fontSize: 14, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },
  filterBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: T.card, borderWidth: 1, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  filterBadge: { position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: T.bg },
  filterBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 24, borderRadius: 16, borderWidth: 1, borderColor: T.hairline, borderStyle: 'dashed', backgroundColor: T.card, gap: 6 },
  emptyStateCompact: { width: 280, height: 200, paddingVertical: 16, paddingHorizontal: 16, justifyContent: 'center' },
  emptyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: T.text1, textAlign: 'center' },
  emptyTitleCompact: { fontSize: 13 },
  emptySubtitle: { fontSize: 12, color: T.text3, textAlign: 'center', lineHeight: 18, maxWidth: 280 },
  emptySubtitleCompact: { fontSize: 11, lineHeight: 16 },
  emptyClearBtn: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: T.navy, backgroundColor: `${T.navy}08` },
  emptyClearText: { fontSize: 12, fontWeight: '700', color: T.navy },
  hScroll: { paddingLeft: 16, paddingRight: 4, paddingBottom: 16, gap: 12 },

  // My Items card — navy theme (your listings)
  addTile: { width: 120, borderRadius: 14, borderWidth: 2, borderColor: `${T.navy}40`, borderStyle: 'dashed', backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center', gap: 10 },
  addCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: `${T.navy}15`, alignItems: 'center', justifyContent: 'center' },
  addText: { fontSize: 13, fontWeight: '700', color: T.navy, textAlign: 'center' },
  itemCard: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImg: { height: 100, backgroundColor: `${T.navy}08`, alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 52 },
  statusPillWrap: { position: 'absolute', top: 8, right: 8 },
  itemBody: { padding: 12, gap: 6 },
  itemName: { fontSize: 15, fontWeight: '800', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  itemPrice: { fontSize: 17, fontWeight: '900', color: T.navy, fontVariant: ['tabular-nums'] },
  itemTagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  itemTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  itemTagText: { fontSize: 10, fontWeight: '700', color: T.navy },
  itemDivider: { height: 1, backgroundColor: T.hairline, marginTop: 2 },
  itemFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  itemBidsWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemBidsText: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemBidsNum: { color: T.amber, fontWeight: '900' },
  itemNoBidsText: { fontSize: 11, color: T.text3, fontStyle: 'italic' },

  // Buyer Request card — amber theme (incoming demand), horizontal
  reqCardH: { width: 240, borderRadius: 14, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, overflow: 'hidden' },
  reqAccent: { height: 3, backgroundColor: T.amber },
  reqHeaderH: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12 },
  reqAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: `${T.amber}20`, alignItems: 'center', justifyContent: 'center' },
  reqAvatarText: { fontSize: 12, fontWeight: '800', color: T.amber },
  reqBuyerH: { fontSize: 12, fontWeight: '700', color: T.text1 },
  reqMetaH: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  reqLocH: { fontSize: 10, color: T.text3, flexShrink: 1 },
  reqProductRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 12 },
  reqIconBox: { width: 44, height: 44, borderRadius: 10, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  reqIconText: { fontSize: 26 },
  reqProductInfo: { flex: 1, gap: 2 },
  reqProductH: { fontSize: 15, fontWeight: '900', color: T.text1 },
  reqProductMeta: { fontSize: 11, color: T.text2, fontWeight: '600' },
  reqPriceRight: { fontSize: 14, fontWeight: '900', color: T.amber },
  reqNoteH: { fontSize: 11, color: T.text2, lineHeight: 15, paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4, minHeight: 30 },
  reqFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 12, borderTopWidth: 1, borderTopColor: T.hairline, marginTop: 4 },
  reqProposeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: T.amber },
  reqProposeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  sheetOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(26,28,46,0.55)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: T.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 8, paddingBottom: 28 },
  sheetHandle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: T.hairline, marginBottom: 8 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 8 },
  sheetTitle: { fontSize: 18, fontWeight: '900', color: T.text1 },
  resetText: { fontSize: 13, fontWeight: '700', color: T.navy },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: T.hairline },
  fgWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  fgLabel: { fontSize: 12, fontWeight: '700', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  fgChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  fgChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: T.hairline, backgroundColor: T.card },
  fgChipSelected: { borderColor: T.navy, backgroundColor: `${T.navy}10` },
  fgChipText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  fgChipTextSelected: { color: T.navy, fontWeight: '700' },
});
