import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'AccountType'>;

const getApiUrl = (endpoint: string, base: string) => {
  let resolvedBase = base.trim();
  if (resolvedBase.endsWith('/')) {
    resolvedBase = resolvedBase.slice(0, -1);
  }
  let cleanEndpoint = endpoint;
  if (!cleanEndpoint.startsWith('/')) {
    cleanEndpoint = `/${cleanEndpoint}`;
  }
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
};

export const AccountTypeScreen: React.FC<Props> = ({ navigation, route }) => {
  const [type, setType] = useState<'individual' | 'company' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { token: storeToken, apiBaseUrl } = useAppStore();
  const tokenFromParams = route.params?.token;

  const options = [
    {
      key: 'individual' as const,
      emoji: '👤',
      badge: 'PERSONAL TRADING',
      title: 'Individual Trader / Farmer',
      desc: 'I trade aqua products under my personal name or sole proprietorship.',
      features: [
        'Quick signup with Aadhaar / PAN verification',
        'Direct bank account settlement',
        'Personal bid management dashboard',
      ],
    },
    {
      key: 'company' as const,
      emoji: '🏢',
      badge: 'BUSINESS & TEAMS',
      title: 'Registered Company / Firm',
      desc: 'We trade as a registered business entity (Pvt Ltd, Partnership, LLP).',
      features: [
        'GST & Business License (FSSAI) verification',
        'Multi-user team access & manager roles',
        'Tax invoices & bulk purchase statements',
      ],
    },
  ];

  const handleContinue = async () => {
    if (!type) return;

    const formattedAccountType = type === 'individual' ? 'Individual' : 'Business';
    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/registration/account-type', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;
    console.log(`Submitting registration account-type (${formattedAccountType}) to ${targetUrl} with token:`, activeToken);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
      }

      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          accountType: formattedAccountType,
          AccountType: formattedAccountType,
        }),
      });

      setLoading(false);
      if (response.ok || response.status === 200 || response.status === 204) {
        navigation.navigate('PersonalDetails', { token: activeToken });
      } else {
        console.warn('Account type registration API status:', response.status);
        navigation.navigate('PersonalDetails', { token: activeToken });
      }
    } catch (err) {
      console.warn('Error calling registration account-type PUT API:', err);
      setLoading(false);
      navigation.navigate('PersonalDetails', { token: activeToken });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Hero Banner Header */}
      <LinearGradient colors={['#F8FAFC', '#FFFFFF']} style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backCircleBtn}>
            <Icon name="chevronL" size={16} color={T.navy} />
          </TouchableOpacity>
          <Logo width={120} dark />
          <View style={styles.stepPill}>
            <Text style={styles.stepPillText}>Step 2 of 6</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '33%' }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.title}>Account Structure</Text>
          <Text style={styles.sub}>Choose whether you are registering as an individual or a business enterprise</Text>

          <View style={styles.cardsGap}>
            {options.map(o => {
              const isActive = type === o.key;
              return (
                <TouchableOpacity
                  key={o.key}
                  onPress={() => setType(o.key)}
                  style={[styles.card, isActive && styles.cardActive]}
                  activeOpacity={0.88}
                >
                  <View style={styles.cardHeaderRow}>
                    <View style={[styles.badgeContainer, isActive && styles.badgeContainerActive]}>
                      <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{o.badge}</Text>
                    </View>
                    <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                      {isActive && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                  </View>

                  <View style={styles.roleMainRow}>
                    <View style={[styles.emojiCircle, isActive && styles.emojiCircleActive]}>
                      <Text style={styles.emojiText}>{o.emoji}</Text>
                    </View>
                    <View style={styles.roleTextContent}>
                      <Text style={[styles.roleTitle, isActive && styles.roleTitleActive]}>{o.title}</Text>
                      <Text style={styles.roleDesc}>{o.desc}</Text>
                    </View>
                  </View>

                  <View style={styles.benefitsBox}>
                    {o.features.map((f, idx) => (
                      <View key={idx} style={styles.bulletRow}>
                        <Icon name="checkCircle" size={12} color={isActive ? T.navy : T.green} />
                        <Text style={styles.bulletText}>{f}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label={loading ? "Saving Account Type..." : "Continue to Personal Details →"}
          onPress={type && !loading ? handleContinue : undefined}
          disabled={!type || loading}
          fullWidth
          style={styles.continueBtn}
        />
        <TouchableOpacity
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'PublicLanding' }] })}
          style={styles.homeLinkBtn}
        >
          <Text style={styles.homeLinkText}>🏠 Go to Home Marketplace</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  topHeader: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.hairline },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backCircleBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  stepPill: { backgroundColor: T.amber, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  stepPillText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  progressTrack: { height: 4, backgroundColor: '#E2E8F0', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: T.amber, borderRadius: 2 },

  scrollContent: { paddingBottom: 100 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2, lineHeight: 20 },

  cardsGap: { gap: 16, marginTop: 8 },
  card: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: T.cardBorder,
    padding: 18,
    gap: 12,
    ...T.shadowSoft,
  },
  cardActive: {
    borderColor: T.navy,
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  badgeContainer: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeContainerActive: { backgroundColor: `${T.navy}14` },
  badgeText: { fontSize: 10, fontWeight: '800', color: T.text3 },
  badgeTextActive: { color: T.navy },
  radioCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  radioCircleActive: { backgroundColor: T.navy, borderColor: T.navy },
  checkmark: { color: '#fff', fontSize: 12, fontWeight: '900' },

  roleMainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  emojiCircle: { width: 52, height: 52, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.hairline },
  emojiCircleActive: { backgroundColor: `${T.navy}12`, borderColor: T.navy },
  emojiText: { fontSize: 26 },
  roleTextContent: { flex: 1, gap: 4 },
  roleTitle: { fontSize: 18, fontWeight: '800', color: T.text1 },
  roleTitleActive: { color: T.navy },
  roleDesc: { fontSize: 13, color: T.text2, lineHeight: 18 },

  benefitsBox: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: T.hairline },
  bulletRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bulletText: { fontSize: 12, color: T.text2, fontWeight: '600', flex: 1 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10, alignItems: 'center', ...T.shadowSoft },
  continueBtn: { height: 52, borderRadius: 14, backgroundColor: T.amber },
  homeLinkBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
