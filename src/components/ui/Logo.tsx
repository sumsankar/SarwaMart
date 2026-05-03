import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface Props { width?: number; dark?: boolean; }

export const Logo: React.FC<Props> = ({ width = 140, dark = false }) => (
  <Image
    source={require('../../../assets/logo.png')}
    style={[{ width, height: width * 0.35 }, dark && styles.dark]}
    resizeMode="contain"
  />
);

const styles = StyleSheet.create({
  dark: { tintColor: '#ffffff' },
});
