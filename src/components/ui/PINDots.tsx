import React from 'react';
import { View, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { value: string; length?: number; }

export const PINDots: React.FC<Props> = ({ value, length = 4 }) => (
  <View style={styles.row}>
    {Array.from({ length }).map((_, i) => (
      <View key={i} style={[styles.dot, i < value.length && styles.dotFilled]} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: T.text3, backgroundColor: 'transparent' },
  dotFilled: { backgroundColor: T.navy, borderColor: T.navy },
});
