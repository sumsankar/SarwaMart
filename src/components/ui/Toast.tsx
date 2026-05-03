import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { T } from '../../constants/tokens';

interface Props { message: string; visible: boolean; type?: 'success' | 'error' | 'info'; }

export const Toast: React.FC<Props> = ({ message, visible, type = 'success' }) => {
  const bg = type === 'success' ? T.green : type === 'error' ? T.danger : T.navy;
  return (
    <View style={[styles.toast, { backgroundColor: bg, opacity: visible ? 1 : 0, bottom: visible ? 80 : 60 }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute', left: 20, right: 20, borderRadius: 12,
    padding: 12, alignItems: 'center', zIndex: 999,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
