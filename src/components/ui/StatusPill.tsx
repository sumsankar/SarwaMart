import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_PILL } from '../../constants/tokens';

interface Props { status?: string; }

export const StatusPill: React.FC<Props> = ({ status = '' }) => {
  const key = status.toLowerCase() as keyof typeof STATUS_PILL;
  const theme = STATUS_PILL[key] ?? { bg: '#EDEDF4', text: '#5A5E7A', dot: '#8A8FA8' };
  const label = status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  return (
    <View style={[styles.pill, { backgroundColor: theme.bg }]}>
      <View style={[styles.dot, { backgroundColor: theme.dot }]} />
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
});
