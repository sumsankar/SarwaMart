import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { T } from '../../constants/tokens';
import { Icon } from './Icon';

type Variant = 'primary' | 'secondary' | 'success' | 'ghost' | 'danger' | 'navy';
type Size = 'sm' | 'md';

interface Props {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: Size;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANTS: Record<Variant, { bg: string; text: string; border?: string }> = {
  primary:   { bg: T.amber,   text: '#fff' },
  secondary: { bg: 'transparent', text: T.navy, border: T.navy },
  success:   { bg: T.green,   text: '#fff' },
  ghost:     { bg: 'transparent', text: T.text2 },
  danger:    { bg: 'transparent', text: T.danger, border: T.danger },
  navy:      { bg: T.navy,    text: '#fff' },
};

export const Button: React.FC<Props> = ({
  label, onPress, variant = 'primary', disabled, fullWidth, size = 'md', icon, style, textStyle,
}) => {
  const [pressed, setPressed] = useState(false);
  const v = VARIANTS[variant];
  const height = size === 'sm' ? 36 : 48;
  const fontSize = size === 'sm' ? 13 : 15;

  const hasShadow = !disabled && (variant === 'primary' || variant === 'navy' || variant === 'success');

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={disabled ? undefined : onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        { height, backgroundColor: v.bg, borderColor: v.border || 'transparent', borderWidth: v.border ? 1.5 : 0 },
        hasShadow && styles.hasShadow,
        variant === 'primary' && styles.primaryShadow,
        variant === 'navy' && styles.navyShadow,
        variant === 'success' && styles.successShadow,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon && <Icon name={icon} size={16} color={v.text} />}
      <Text style={[styles.label, { fontSize, color: v.text }, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingHorizontal: 20, gap: 6,
  },
  hasShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryShadow: { shadowColor: T.amber },
  navyShadow: { shadowColor: T.navy },
  successShadow: { shadowColor: T.green },
  fullWidth: { width: '100%' },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
  label: { fontWeight: '700', letterSpacing: 0.3 }, // Slightly heavier and wider letter spacing for ultra premium text look
});
