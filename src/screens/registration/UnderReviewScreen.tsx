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

const TWO_STAGES = [
  {
    stage: 1,
    title: 'Submitted',
    status: 'Completed',
    desc: 'Application details & documentation received',
    isDone: true,
  },
  {
    stage: 2,
    title: 'Under Review',
    status: 'In Progress',
    desc: 'Desk team verifying trade identity & branch assignment',
    isDone: false,
    isActive: true,
  },
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
          <View style={styles.heroCard}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 42 }}>🛡️</Text>
            </View>

            <Text style={styles.title}>Account Under Review</Text>
            <Text style={styles.sub}>
              Thank you for registering! Your application has been submitted and is currently being verified by the SarwaMart Desk Team.
            </Text>

            {/* 2-Stage Verification Timeline */}
            <View style={styles.twoStageContainer}>
              {TWO_STAGES.map((s, idx) => (
                <View key={s.title} style={styles.stageCardItem}>
                  <View style={styles.stageHeaderRow}>
                    <View style={styles.stageLeft}>
                      <View
                        style={[
                          styles.stageBadgeCircle,
                          s.isDone && styles.stageBadgeCircleDone,
                          s.isActive && styles.stageBadgeCircleActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.stageBadgeText,
                            (s.isDone || s.isActive) && styles.stageBadgeTextActive,
                          ]}
                        >
                          {s.isDone ? '✓' : s.stage}
                        </Text>
                      </View>
                      <View style={styles.stageTitleCol}>
                        <Text style={[styles.stageTitle, s.isActive && styles.stageTitleActive]}>
                          {s.title}
                        </Text>
                        <Text style={styles.stageDesc}>{s.desc}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.statusPill,
                        s.isDone && styles.statusPillDone,
                        s.isActive && styles.statusPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          s.isDone && styles.statusPillTextDone,
                          s.isActive && styles.statusPillTextActive,
                        ]}
                      >
                        {s.isDone ? '✓ Completed' : '⏳ In Progress'}
                      </Text>
                    </View>
                  </View>

                  {idx === 0 && <View style={styles.stageConnectorLine} />}
                </View>
              ))}
            </View>

            {/* Time Expectation Box */}
            <View style={styles.noticeBox}>
              <Icon name="info" size={16} color={T.navy} />
              <Text style={styles.noticeText}>
                Approval takes <Text style={{ fontWeight: '800', color: T.navy }}>under 24 hours</Text>. You will receive SMS & email notifications once your trade account is activated.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <Button
            label="Browse Live Marketplace →"
            onPress={goToPublic}
            fullWidth
            style={styles.primaryBtn}
          />

          <View style={styles.linkRow}>
            <TouchableOpacity onPress={goToPublic} style={styles.actionPill}>
              <Icon name="help" size={14} color={T.navy} />
              <Text style={styles.actionPillText}>Support Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await logout();
                goToPublic();
              }}
              style={[styles.actionPill, { borderColor: `${T.danger}40` }]}
            >
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

  heroCard: {
    width: '100%',
    backgroundColor: T.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 22,
    alignItems: 'center',
    gap: 16,
    ...T.shadowSoft,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
  },
  title: { fontSize: 23, fontWeight: '900', color: T.text1, textAlign: 'center' },
  sub: { fontSize: 13, color: T.text2, textAlign: 'center', lineHeight: 20 },

  twoStageContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: T.hairline,
    padding: 16,
    gap: 12,
  },
  stageCardItem: { gap: 8 },
  stageHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stageLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  stageBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageBadgeCircleDone: { backgroundColor: T.green },
  stageBadgeCircleActive: { backgroundColor: T.amber },
  stageBadgeText: { fontSize: 13, fontWeight: '900', color: T.text3 },
  stageBadgeTextActive: { color: '#FFFFFF' },

  stageTitleCol: { flex: 1, gap: 2 },
  stageTitle: { fontSize: 15, fontWeight: '800', color: T.text1 },
  stageTitleActive: { color: T.navy },
  stageDesc: { fontSize: 11, color: T.text3, lineHeight: 15 },

  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#E2E8F0' },
  statusPillDone: { backgroundColor: `${T.green}14` },
  statusPillActive: { backgroundColor: `${T.amber}16` },
  statusPillText: { fontSize: 11, fontWeight: '800', color: T.text3 },
  statusPillTextDone: { color: T.green },
  statusPillTextActive: { color: T.amber },

  stageConnectorLine: { height: 16, width: 2, backgroundColor: '#E2E8F0', marginLeft: 15, marginVertical: -4 },

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
