import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { seedSeconds: number; compact?: boolean; }

const fmt = (n: number) => String(n).padStart(2, '0');

// Static cache to store the target expiration epoch timestamp for each seed.
// This ensures that the countdown remains stable and continuously ticks down even when
// components are unmounted, remounted, or updated due to filtering/searching.
const targetCache: Record<number, number> = {};

const getTargetTime = (seedSeconds: number) => {
  if (!targetCache[seedSeconds]) {
    targetCache[seedSeconds] = Date.now() + seedSeconds * 1000;
  }
  return targetCache[seedSeconds];
};

export const CountdownTimer: React.FC<Props> = ({ seedSeconds, compact = false }) => {
  const targetTime = getTargetTime(seedSeconds);
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((targetTime - Date.now()) / 1000)));

  useEffect(() => {
    // Synchronize initial state if the target time changes
    setSecs(Math.max(0, Math.floor((targetTime - Date.now()) / 1000)));

    const t = setInterval(() => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      setSecs(remaining);
      if (remaining === 0) {
        clearInterval(t);
      }
    }, 1000);

    return () => clearInterval(t);
  }, [targetTime]);

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
