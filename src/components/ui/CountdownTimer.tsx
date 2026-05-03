import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { seedSeconds: number; compact?: boolean; }

const fmt = (n: number) => String(n).padStart(2, '0');

export const CountdownTimer: React.FC<Props> = ({ seedSeconds, compact = false }) => {
  const [secs, setSecs] = useState(seedSeconds);

  useEffect(() => {
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const isUrgent = secs < 3600;
  const isWarning = secs < 7200;

  const color = secs === 0 ? T.text3 : isUrgent ? T.danger : isWarning ? T.amber : T.green;
  const bg    = secs === 0 ? T.bg    : isUrgent ? `${T.danger}20` : isWarning ? `${T.amber}20` : `${T.green}18`;
  const label = secs === 0 ? 'Expired' : `${fmt(h)}:${fmt(m)}:${fmt(s)}`;

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: bg }]}>
        <Text style={[styles.compactText, { color }]}>⏱ {label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: bg }]}>
      <Text style={[styles.fullText, { color }]}>{label}</Text>
      {!isUrgent && !isWarning && secs > 0 && <Text style={styles.leftText}>left</Text>}
      {isWarning && secs > 0 && <Text style={[styles.urgentText, { color }]}>⚡ Urgent</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  compact: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  compactText: { fontSize: 11, fontWeight: '800', fontVariant: ['tabular-nums'] },
  full: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  fullText: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  leftText: { fontSize: 10, color: '#8A8FA8', fontWeight: '500' },
  urgentText: { fontSize: 10, fontWeight: '700' },
});
