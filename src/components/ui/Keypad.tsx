import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { onKey: (k: string) => void; }

const KEYS = [['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']];

export const Keypad: React.FC<Props> = ({ onKey }) => (
  <View style={styles.grid}>
    {KEYS.map((row, ri) => (
      <View key={ri} style={styles.row}>
        {row.map((k, ki) => (
          <TouchableOpacity key={ki} onPress={() => k && onKey(k)} style={[styles.key, !k && styles.keyEmpty]} activeOpacity={0.6}>
            {k ? <Text style={[styles.keyText, k === '⌫' && { fontSize: 20 }]}>{k}</Text> : null}
          </TouchableOpacity>
        ))}
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  grid: { gap: 12 },
  row: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  key: { width: 78, height: 56, borderRadius: 14, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
  keyEmpty: { backgroundColor: 'transparent', shadowColor: 'transparent', elevation: 0 },
  keyText: { fontSize: 24, fontWeight: '500', color: T.text1 },
});
