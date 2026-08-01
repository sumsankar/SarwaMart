import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'UnderReview'>;

const STEPS = [
  { label: 'Submitted', done: true },
  { label: 'KYC Review', done: true },
  { label: 'Trade Access', done: false },
];

export const UnderReviewScreen: React.FC<Props> = ({ navigation }) => {
  const { logout } = useAppStore();

  const goToPublic = () => navigation.reset({ index: 0, routes: [{ name: 'PublicLanding' }] });

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Hero Banner Header */}
      <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.topHeader}>
        <View style={styles.headerRow}>
          <Logo width={140} dark />
          <View style={styles.reviewBadge}>
            <Text style={styles.reviewBadgeText}>⏳ Review Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 44 }}>🛡️</Text>
            </View>

            <Text style={styles.title}>Account Under Verification</Text>
            <Text style={styles.sub}>
              Thank you for registering on SarwaMart! Our desk team is verifying your trade & location credentials.
            </Text>

            {/* Timeline Progress */}
            <View style={styles.timelineCard}>
              {STEPS.map((s, idx) => (
                <View key={s.label} style={styles.timelineRow}>
                  <View style={[styles.timelineDot, s.done && styles.timelineDotDone]}>
                    <Text style={styles.timelineDotText}>{s.done ? '✓' : idx + 1}</Text>
                  </View>
                  {idx < STEPS.length - 1 && <View style={[styles.timelineLine, s.done && styles.timelineLineDone]} />}
                  <Text style={[styles.timelineLabel, s.done && styles.timelineLabelDone]}>{s.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.noticeBox}>
              <Icon name="info" size={16} color={T.navy} />
              <Text style={styles.noticeText}>
                Approval takes <Text style={{ fontWeight: '800' }}>under 24 hours</Text>. In the meantime, you can browse live fish & prawn listings on SarwaMart.
              </Text>
            </View>
          </View>

          {/* Actions */}
          <Button label="Browse Live Marketplace →" onPress={goToPublic} fullWidth style={styles.primaryBtn} />

          <View style={styles.linkRow}>
            <TouchableOpacity onPress={goToPublic} style={styles.actionPill}>
              <Icon name="help" size={14} color={T.navy} />
              <Text style={styles.actionPillText}>Support Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={async () => { await logout(); goToPublic(); }} style={[styles.actionPill, { borderColor: `${T.danger}40` }]}>
              <Icon name="logout" size={14} color={T.danger} />
              <Text style={[styles.actionPillText, { color: T.danger }]}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: T.hairline },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewBadge: { backgroundColor: T.amber, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  reviewBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

  scrollContent: { paddingBottom: 40 },
  body: { padding: 20, gap: 16, alignItems: 'center' },
  card: {
    width: '100%',
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 24,
    alignItems: 'center',
    gap: 14,
    ...T.shadowSoft,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  title: { fontSize: 22, fontWeight: '900', color: T.text1, textAlign: 'center' },
  sub: { fontSize: 13, color: T.text2, textAlign: 'center', lineHeight: 20 },

  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    gap: 12,
    borderWidth: 1,
    borderColor: T.hairline,
  },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timelineDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  timelineDotDone: { backgroundColor: T.green },
  timelineDotText: { fontSize: 11, fontWeight: '900', color: '#fff' },
  timelineLine: { width: 24, height: 2, backgroundColor: '#E2E8F0' },
  timelineLineDone: { backgroundColor: T.green },
  timelineLabel: { fontSize: 11, fontWeight: '700', color: T.text3 },
  timelineLabelDone: { color: T.green },

  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${T.navy}08`,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${T.navy}20`,
    width: '100%',
  },
  noticeText: { flex: 1, fontSize: 12, color: T.text2, lineHeight: 18 },

  primaryBtn: { height: 52, borderRadius: 14, backgroundColor: T.navy, width: '100%' },
  linkRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: T.card, borderWidth: 1, borderColor: T.cardBorder, ...T.shadowSoft },
  actionPillText: { fontSize: 13, fontWeight: '700', color: T.navy },
});
