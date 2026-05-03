import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { title: string; onSeeAll?: () => void; }

export const SectionHeader: React.FC<Props> = ({ title, onSeeAll }) => (
  <View style={styles.row}>
    <Text style={styles.title}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>See all →</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: '800', color: T.text1 },
  seeAll: { fontSize: 13, color: T.amber, fontWeight: '600' },
});
