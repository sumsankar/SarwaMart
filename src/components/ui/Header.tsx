import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { T } from '../../constants/tokens';
import { Icon } from './Icon';

interface Props {
  title?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  center?: React.ReactNode;
  dark?: boolean;
  noSafeArea?: boolean;
}

export const Header: React.FC<Props> = ({ title, onBack, right, center, dark, noSafeArea }) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[
      styles.container,
      { backgroundColor: dark ? T.navy : T.card, paddingTop: noSafeArea ? 0 : insets.top },
      dark ? null : styles.border,
    ]}>
      <View style={styles.inner}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={[styles.backBtn, { backgroundColor: dark ? 'rgba(255,255,255,0.12)' : T.bg }]}>
            <Icon name="back" size={18} color={dark ? '#fff' : T.text1} />
          </TouchableOpacity>
        )}
        {center ? (
          <View style={styles.centerWrap}>{center}</View>
        ) : (
          <Text style={[styles.title, { color: dark ? '#fff' : T.text1 }]} numberOfLines={1}>{title}</Text>
        )}
        {right && <View style={styles.right}>{right}</View>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexShrink: 0 },
  border: { borderBottomWidth: 1, borderBottomColor: T.hairline },
  inner: { height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 17, fontWeight: '700' },
  centerWrap: { flex: 1, alignItems: 'center' },
  right: { marginLeft: 'auto' },
});
