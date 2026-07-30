import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { T } from '../../constants/tokens';

interface Badge { label: string; color: 'navy' | 'amber' | 'green'; }
interface Props { 
  title: string; 
  onSeeAll?: () => void; 
  badge?: Badge; 
  accent?: 'navy' | 'amber' | 'green'; 
  onRefresh?: () => void;
  loading?: boolean;
}

const COLOR_MAP = { navy: T.navy, amber: T.amber, green: T.green } as const;

export const SectionHeader: React.FC<Props> = ({ title, onSeeAll, badge, accent, onRefresh, loading }) => (
  <View style={styles.row}>
    <View style={styles.titleWrap}>
      {accent && <View style={[styles.accent, { backgroundColor: COLOR_MAP[accent] }]} />}
      <Text style={styles.title}>{title}</Text>
      {badge && (
        <View style={[styles.badge, { backgroundColor: `${COLOR_MAP[badge.color]}15`, borderColor: `${COLOR_MAP[badge.color]}40` }]}>
          <Text style={[styles.badgeText, { color: COLOR_MAP[badge.color] }]}>{badge.label}</Text>
        </View>
      )}
    </View>
    <View style={styles.rightWrap}>
      {onRefresh && (
        <TouchableOpacity onPress={onRefresh} disabled={loading} style={styles.refreshIcon} hitSlop={12}>
          <Text style={[styles.refreshText, { color: accent ? COLOR_MAP[accent] : T.text3 }]}>
            {loading ? "Refreshing..." : "Refresh"}
          </Text>
        </TouchableOpacity>
      )}
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
          <Text style={styles.seeAll}>See all →</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 18, paddingBottom: 10 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rightWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accent: { width: 4, height: 18, borderRadius: 2 },
  title: { fontSize: 16, fontWeight: '800', color: T.text1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  seeAll: { fontSize: 13, color: T.amber, fontWeight: '600' },
  refreshIcon: { padding: 4, alignItems: 'center', justifyContent: 'center' },
  refreshText: { fontSize: 13, fontWeight: '700' },
});
