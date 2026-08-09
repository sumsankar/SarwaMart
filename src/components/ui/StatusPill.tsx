import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { STATUS_PILL } from '../../constants/tokens';

interface Props { status?: any; }

export const StatusPill: React.FC<Props> = ({ status }) => {
  const rawStr = String(status ?? '').trim();
  const lowerStr = rawStr.toLowerCase();
  const cleanStr = lowerStr.replace(/[\s_-]/g, '');

  // Direct lookup in STATUS_PILL by clean string / lower string / raw string / number
  let theme =
    (STATUS_PILL as any)[cleanStr] ??
    (STATUS_PILL as any)[lowerStr] ??
    (STATUS_PILL as any)[rawStr] ??
    (STATUS_PILL as any)[Number(rawStr)];

  // Fallback pattern matching if direct key wasn't found
  if (!theme) {
    if (cleanStr.includes('pending') || cleanStr.includes('submit') || cleanStr.includes('approval') || cleanStr === '2') {
      theme = STATUS_PILL.pendingapproval;
    } else if (cleanStr.includes('live') || cleanStr.includes('active') || cleanStr.includes('published') || cleanStr === '3') {
      theme = STATUS_PILL.live;
    } else if (cleanStr.includes('draft') || cleanStr === '1') {
      theme = STATUS_PILL.draft;
    } else if (cleanStr.includes('reject') || cleanStr === '4') {
      theme = STATUS_PILL.rejected;
    } else if (cleanStr.includes('partially') || cleanStr === '5') {
      theme = STATUS_PILL.partiallyallocated;
    } else if (cleanStr.includes('sold') || cleanStr === '6') {
      theme = STATUS_PILL.soldout;
    } else if (cleanStr.includes('expire') || cleanStr === '7') {
      theme = STATUS_PILL.expired;
    } else if (cleanStr.includes('cancel') || cleanStr === '8') {
      theme = STATUS_PILL.cancelled;
    } else {
      theme = STATUS_PILL.live;
    }
  }

  // Format Human-Readable Label
  let label = rawStr;
  if (cleanStr === '1' || cleanStr === 'draft') {
    label = 'Draft';
  } else if (cleanStr === '2' || cleanStr.includes('pending') || cleanStr.includes('submit') || cleanStr.includes('approval')) {
    label = 'Pending Approval';
  } else if (cleanStr === '3' || cleanStr === 'live' || cleanStr === 'active' || cleanStr === 'published') {
    label = 'Live';
  } else if (cleanStr === '4' || cleanStr === 'rejected') {
    label = 'Rejected';
  } else if (cleanStr === '5' || cleanStr === 'partiallyallocated') {
    label = 'Partially Allocated';
  } else if (cleanStr === '6' || cleanStr === 'soldout' || cleanStr === 'sold') {
    label = 'Sold Out';
  } else if (cleanStr === '7' || cleanStr === 'expired') {
    label = 'Expired';
  } else if (cleanStr === '8' || cleanStr === 'cancelled' || cleanStr === 'canceled') {
    label = 'Cancelled';
  } else if (rawStr) {
    label = rawStr
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/_/g, ' ');
    label = label.charAt(0).toUpperCase() + label.slice(1);
  } else {
    label = 'Live';
  }

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
