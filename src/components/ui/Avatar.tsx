import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T } from '../../constants/tokens';

interface Props {
  name?: string;
  size?: number;
  bg?: string;
}

export const Avatar: React.FC<Props> = ({ name = 'U', size = 40, bg = T.navy }) => {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  text: { color: '#fff', fontWeight: '700' },
});
