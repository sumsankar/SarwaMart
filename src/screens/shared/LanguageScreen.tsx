import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { useI18n } from '../../constants/i18n';

export const LanguageScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { lang, setLang } = useI18n();

  const languages = [
    { code: 'en', label: 'English', native: 'English', region: 'All India' },
    { code: 'te', label: 'Telugu', native: 'తెలుగు', region: 'Andhra Pradesh, Telangana' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Language" onBack={() => nav.goBack()} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.hint}>Choose your preferred language for the app.</Text>
        <View style={styles.list}>
          {languages.map(l => (
            <TouchableOpacity
              key={l.code}
              style={[styles.row, lang === l.code && styles.rowActive]}
              onPress={() => setLang(l.code as 'en' | 'te')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeft}>
                <Text style={styles.nativeLabel}>{l.native}</Text>
                <Text style={styles.engLabel}>{l.label}</Text>
                <Text style={styles.regionLabel}>{l.region}</Text>
              </View>
              {lang === l.code && (
                <View style={styles.checkCircle}>
                  <Icon name="check" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.footer}>More languages coming soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  scroll: { padding: 16 },
  hint: { fontSize: 13, color: T.text2, marginBottom: 16 },
  list: { gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: T.card, borderRadius: 12, borderWidth: 1.5, borderColor: T.hairline },
  rowActive: { borderColor: T.navy, backgroundColor: `${T.navy}06` },
  rowLeft: { flex: 1, gap: 2 },
  nativeLabel: { fontSize: 18, fontWeight: '700', color: T.text1 },
  engLabel: { fontSize: 13, color: T.text2 },
  regionLabel: { fontSize: 11, color: T.text3 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  footer: { fontSize: 12, color: T.text3, textAlign: 'center', marginTop: 24 },
});
