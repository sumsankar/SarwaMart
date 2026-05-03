import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { tabs: string[]; active: string; onSelect: (t: string) => void; }

export const SegTabs: React.FC<Props> = ({ tabs, active, onSelect }) => (
  <View style={styles.wrapper}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.inner}>
      {tabs.map(t => (
        <TouchableOpacity key={t} onPress={() => onSelect(t)} style={[styles.tab, active === t && styles.tabActive]}>
          <Text style={[styles.label, active === t && styles.labelActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.hairline, flexShrink: 0 },
  inner: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  tabActive: { backgroundColor: T.navy },
  label: { fontSize: 13, fontWeight: '500', color: T.text2 },
  labelActive: { fontWeight: '700', color: '#fff' },
});
