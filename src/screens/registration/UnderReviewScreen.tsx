import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';
import { Icon } from '../../components/ui/Icon';

type Props = NativeStackScreenProps<RootStackParams, 'UnderReview'>;

const STEPS = [
  { label: 'Submitted',    done: true },
  { label: 'Under Review', done: true },
  { label: 'Approved',     done: false },
];

export const UnderReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAppStore();

  const goToPublic = () => navigation.reset({ index: 0, routes: [{ name: 'PublicLanding' }] });

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={[T.navy, '#2D5FA8']} style={styles.top}>
        <Logo width={140} dark />
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.body}>
          <View style={styles.iconWrap}>
            <Icon name="clock" size={52} color={T.amber} />
          </View>
          <Text style={styles.title}>Account Under Review</Text>
          <Text style={styles.sub}>
            Our team usually approves accounts within 24 hours. We'll notify you on your registered mobile and email.
          </Text>
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

          <View style={styles.hint}>
            <Icon name="info" size={14} color={T.navy} />
            <Text style={styles.hintText}>
              You can browse the marketplace as a guest while you wait. We'll unlock bidding & posting once your account is approved.
            </Text>
          </View>

          <Button label="Browse SarwaMart" onPress={goToPublic} fullWidth style={styles.primaryBtn} />

          <TouchableOpacity style={styles.support}>
            <Icon name="help" size={16} color={T.navy} />
            <Text style={styles.supportText}>Contact Support</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={async () => { await logout(); goToPublic(); }} style={styles.logout}>
            <Icon name="logout" size={14} color={T.danger} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  top: { height: 120, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1 },
  body: { flex: 1, padding: 32, alignItems: 'center', justifyContent: 'center', gap: 18 },
  iconWrap: { width: 100, height: 100, borderRadius: 28, backgroundColor: `${T.amber}15`, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '900', color: T.text1, textAlign: 'center' },
  sub: { fontSize: 14, color: T.text2, textAlign: 'center', lineHeight: 22 },
  steps: { flexDirection: 'row', gap: 8, alignItems: 'center', marginVertical: 8 },
  stepRow: { alignItems: 'center' },
  stepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: T.green },
  stepLine: { width: 40, height: 2, backgroundColor: T.hairline, marginHorizontal: -8 },
  stepLineDone: { backgroundColor: T.green },
  stepLabel: { fontSize: 11, color: T.text3, marginTop: 6, fontWeight: '600' },
  stepLabelDone: { color: T.green },
  hint: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, backgroundColor: `${T.navy}06`, borderWidth: 1, borderColor: `${T.navy}15` },
  hintText: { flex: 1, fontSize: 12, color: T.text2, lineHeight: 17 },
  primaryBtn: { height: 52, borderRadius: 14, marginTop: 4 },
  support: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.hairline },
  supportText: { color: T.navy, fontWeight: '700', fontSize: 14 },
  logout: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 12 },
  logoutText: { color: T.danger, fontSize: 14, fontWeight: '600' },
});
