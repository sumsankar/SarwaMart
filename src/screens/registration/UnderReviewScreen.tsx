import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';
import { Icon } from '../../components/ui/Icon';

type Props = NativeStackScreenProps<RootStackParams, 'UnderReview'>;

const STEPS = [
  { label: 'Submitted', done: true },
  { label: 'Under Review', done: true },
  { label: 'Approved', done: false },
];

export const UnderReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAppStore();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <View style={styles.iconWrap}>
          <Icon name="clock" size={52} color={T.amber} />
        </View>
        <Text style={styles.title}>Account Under Review</Text>
        <Text style={styles.sub}>Our team usually approves accounts within 24 hours. We'll notify you on your registered mobile and email.</Text>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={s.label} style={styles.stepRow}>
              <View style={[styles.stepDot, s.done && styles.stepDotDone]}>
                {s.done && <Icon name="check" size={12} color="#fff" />}
              </View>
              {i < STEPS.length - 1 && <View style={[styles.stepLine, s.done && styles.stepLineDone]} />}
              <Text style={[styles.stepLabel, s.done && styles.stepLabelDone]}>{s.label}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.support}>
          <Icon name="help" size={16} color={T.navy} />
          <Text style={styles.supportText}>Contact Support</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={async () => { await logout(); navigation.replace('PublicLanding'); }} style={styles.logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  body: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 20 },
  iconWrap: { width: 100, height: 100, borderRadius: 28, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: T.text1, textAlign: 'center' },
  sub: { fontSize: 14, color: T.text2, textAlign: 'center', lineHeight: 22 },
  steps: { flexDirection: 'row', gap: 8, alignItems: 'center', marginVertical: 16 },
  stepRow: { alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: T.green },
  stepLine: { width: 40, height: 2, backgroundColor: T.hairline, marginHorizontal: -8 },
  stepLineDone: { backgroundColor: T.green },
  stepLabel: { fontSize: 11, color: T.text3, marginTop: 6, fontWeight: '600' },
  stepLabelDone: { color: T.green },
  support: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.hairline },
  supportText: { color: T.navy, fontWeight: '700', fontSize: 14 },
  logout: { padding: 12 },
  logoutText: { color: T.danger, fontSize: 14, fontWeight: '600' },
});
