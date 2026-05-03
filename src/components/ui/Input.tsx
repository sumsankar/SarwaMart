import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ViewStyle } from 'react-native';
import { T } from '../../constants/tokens';

interface Props {
  label?: string;
  value?: string;
  onChangeText?: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'phone-pad' | 'email-address';
  secureTextEntry?: boolean;
  prefix?: string;
  helper?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  autoFocus?: boolean;
}

export const Input: React.FC<Props> = ({
  label, value, onChangeText, placeholder, keyboardType = 'default',
  secureTextEntry, prefix, helper, error, disabled, style, multiline, numberOfLines, maxLength, autoFocus,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.box,
        focused && styles.focused,
        !!error && styles.errored,
        multiline && { height: 80, alignItems: 'flex-start', paddingVertical: 10 },
      ]}>
        {prefix && <Text style={styles.prefix}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={T.text3}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          autoFocus={autoFocus}
          style={[styles.input, multiline && { textAlignVertical: 'top', flex: 1 }]}
        />
      </View>
      {(helper || error) && <Text style={[styles.helper, !!error && { color: T.danger }]}>{error || helper}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { gap: 5 },
  label: { fontSize: 12, fontWeight: '600', color: T.text2, letterSpacing: 0.4, textTransform: 'uppercase' },
  box: {
    flexDirection: 'row', alignItems: 'center', height: 52,
    backgroundColor: T.card, borderWidth: 1.5, borderColor: T.hairline,
    borderRadius: 10, paddingHorizontal: 14, gap: 8,
  },
  focused: { borderColor: T.navy },
  errored: { borderColor: T.danger },
  prefix: { color: T.text3, fontSize: 15 },
  input: { flex: 1, fontSize: 15, color: T.text1 },
  helper: { fontSize: 12, color: T.text3 },
});
