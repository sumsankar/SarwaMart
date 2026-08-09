import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { seedSeconds?: any; expiresAt?: string; compact?: boolean; }

const fmt = (n: number) => {
  const safe = isNaN(n) || n < 0 ? 0 : Math.floor(n);
  return String(safe).padStart(2, '0');
};

export const resolveSeedSeconds = (seedInput?: any, expiresAt?: string): number => {
  if (expiresAt) {
    const t = new Date(expiresAt).getTime();
    if (!isNaN(t)) {
      const remaining = Math.max(0, Math.floor((t - Date.now()) / 1000));
      return remaining;
    }
  }

  if (typeof seedInput === 'number' && !isNaN(seedInput)) {
    return Math.abs(Math.floor(seedInput)) || 14400;
  }

  if (typeof seedInput === 'string' && seedInput.trim()) {
    const parsed = Number(seedInput);
    if (!isNaN(parsed)) {
      return Math.abs(Math.floor(parsed)) || 14400;
    }
    let hash = 0;
    for (let i = 0; i < seedInput.length; i++) {
      hash = (hash << 5) - hash + seedInput.charCodeAt(i);
      hash |= 0;
    }
    return (Math.abs(hash) % 70000) + 3600;
  }

  return 14400;
};

// Static cache to store the target expiration epoch timestamp for each seed.
const targetCache: Record<string, number> = {};

const getTargetTime = (seedSecondsInput?: any, expiresAt?: string) => {
  const safeSeconds = resolveSeedSeconds(seedSecondsInput, expiresAt);
  const cacheKey = expiresAt || String(seedSecondsInput || safeSeconds);

  if (!targetCache[cacheKey]) {
    targetCache[cacheKey] = Date.now() + safeSeconds * 1000;
  }
  return targetCache[cacheKey];
};

export const CountdownTimer: React.FC<Props> = ({ seedSeconds, expiresAt, compact = false }) => {
  const targetTime = getTargetTime(seedSeconds, expiresAt);
  const [secs, setSecs] = useState(() => {
    const diff = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
    return isNaN(diff) ? 14400 : diff;
  });

  useEffect(() => {
    const calcRemaining = () => {
      const remaining = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));
      return isNaN(remaining) ? 0 : remaining;
    };

    setSecs(calcRemaining());

    const t = setInterval(() => {
      const remaining = calcRemaining();
      setSecs(remaining);
      if (remaining === 0) {
        clearInterval(t);
      }
    }, 1000);

    return () => clearInterval(t);
  }, [targetTime]);

  const safeSecs = isNaN(secs) ? 0 : secs;
  const h = Math.floor(safeSecs / 3600);
  const m = Math.floor((safeSecs % 3600) / 60);
  const s = safeSecs % 60;
  const isUrgent = safeSecs < 3600;
  const isWarning = safeSecs < 7200;

  const color = safeSecs === 0 ? T.text3 : isUrgent ? T.danger : isWarning ? T.amber : T.green;
  const bg    = safeSecs === 0 ? T.bg    : isUrgent ? `${T.danger}20` : isWarning ? `${T.amber}20` : `${T.green}18`;
  const label = safeSecs === 0 ? 'Expired' : `${fmt(h)}:${fmt(m)}:${fmt(s)}`;

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
