import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
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

type Props = NativeStackScreenProps<RootStackParams, 'BranchPicker'>;

interface BranchItem {
  id: string;
  name: string;
  code?: string;
  city?: string;
  state?: string;
  address?: string;
  phone?: string;
}

const DEFAULT_BRANCHES: BranchItem[] = [
  {
    id: '33333333-3333-3333-3333-333333333001',
    name: 'Kakinada Aqua Trade Hub',
    code: 'KKD-01',
    city: 'Kakinada',
    state: 'Andhra Pradesh',
    address: 'Port Road, Commercial Jetty, Kakinada - 533001',
    phone: '+91 884 2345678',
  },
  {
    id: '33333333-3333-3333-3333-333333333002',
    name: 'Bhimavaram Fisheries Center',
    code: 'BMV-02',
    city: 'Bhimavaram',
    state: 'Andhra Pradesh',
    address: 'Aqua Farmers Complex, Undi Road, Bhimavaram - 534201',
    phone: '+91 8816 234567',
  },
  {
    id: '33333333-3333-3333-3333-333333333003',
    name: 'Kochi Marine Export Branch',
    code: 'KCH-01',
    city: 'Kochi',
    state: 'Kerala',
    address: 'Willingdon Island Export Terminal, Kochi - 682003',
    phone: '+91 484 2668899',
  },
  {
    id: '33333333-3333-3333-3333-333333333004',
    name: 'Nellore Shrimp Trade Office',
    code: 'NLR-01',
    city: 'Nellore',
    state: 'Andhra Pradesh',
    address: 'Mypadu Road, Krishnapatnam Port Link, Nellore - 524002',
    phone: '+91 861 2345890',
  },
  {
    id: '33333333-3333-3333-3333-333333333005',
    name: 'Surat Coastal Aqua Center',
    code: 'SRT-01',
    city: 'Surat',
    state: 'Gujarat',
    address: 'Dumas Road, Hazira Marine Belt, Surat - 395007',
    phone: '+91 261 2789012',
  },
];

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

export const BranchPickerScreen: React.FC<Props> = ({ navigation, route }) => {
  const [branches, setBranches] = useState<BranchItem[]>(DEFAULT_BRANCHES);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>('33333333-3333-3333-3333-333333333001');
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { token: storeToken, apiBaseUrl } = useAppStore();
  const tokenFromParams = route.params?.token;

  // Fetch branches from API
  useEffect(() => {
    const fetchBranches = async () => {
      setLoadingBranches(true);
      const targetUrl = getApiUrl('/api/v1/branches?page=1&pageSize=20', apiBaseUrl);
      console.log(`Fetching operational branches from: ${targetUrl}`);

      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          const data = await response.json();
          let items: any[] = [];
          if (Array.isArray(data)) {
            items = data;
          } else if (data && Array.isArray(data.items)) {
            items = data.items;
          } else if (data && Array.isArray(data.data)) {
            items = data.data;
          }

          if (items.length > 0) {
            const mapped: BranchItem[] = items.map((b: any, idx: number) => ({
              id: b.id || b.branchId || `33333333-3333-3333-3333-33333333300${idx + 1}`,
              name: b.name || b.branchName || 'SarwaMart Branch',
              code: b.code || b.branchCode || `SMB-0${idx + 1}`,
              city: b.city || b.district || '',
              state: b.state || b.stateName || '',
              address: b.address || b.location || '',
              phone: b.phone || b.contactNumber || '',
            }));
            setBranches(mapped);
            if (!selectedBranchId && mapped.length > 0) {
              setSelectedBranchId(mapped[0].id);
            }
          }
        }
      } catch (err) {
        console.warn('Error fetching branches API:', err);
      } finally {
        setLoadingBranches(false);
      }
    };

    fetchBranches();
  }, [apiBaseUrl]);

  const handleContinue = async () => {
    if (!selectedBranchId) return;

    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/registration/branch', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

    const payload = {
      branchId: selectedBranchId,
      BranchId: selectedBranchId,
    };

    console.log(`Submitting registration branch selection (${selectedBranchId}) to ${targetUrl} with token:`, activeToken);

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
        body: JSON.stringify(payload),
      });

      setLoading(false);
      if (response.ok || response.status === 200 || response.status === 204) {
        navigation.navigate('Products', { token: activeToken });
      } else {
        console.warn('Branch selection API status:', response.status);
        navigation.navigate('Products', { token: activeToken });
      }
    } catch (err) {
      console.warn('Error calling registration branch PUT API:', err);
      setLoading(false);
      navigation.navigate('Products', { token: activeToken });
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
            <Text style={styles.stepPillText}>Step 4 of 5</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '80%' }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={styles.title}>Operational Branch Assignment</Text>
          <Text style={styles.sub}>
            Select your assigned SarwaMart operational trade branch for local fulfillment, Escrow settlement & Quality inspection.
          </Text>

          {loadingBranches ? (
            <ActivityIndicator size="large" color={T.navy} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.cardsGap}>
              {branches.map(b => {
                const isActive = selectedBranchId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setSelectedBranchId(b.id)}
                    style={[styles.card, isActive && styles.cardActive]}
                    activeOpacity={0.88}
                  >
                    <View style={styles.cardHeaderRow}>
                      <View style={[styles.badgeContainer, isActive && styles.badgeContainerActive]}>
                        <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>
                          📍 {b.city || 'BRANCH'} {b.state ? `• ${b.state}` : ''}
                        </Text>
                      </View>
                      <View style={[styles.radioCircle, isActive && styles.radioCircleActive]}>
                        {isActive && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>

                    <View style={styles.branchMainRow}>
                      <View style={[styles.iconCircle, isActive && styles.iconCircleActive]}>
                        <Text style={styles.iconText}>🏢</Text>
                      </View>
                      <View style={styles.branchTextContent}>
                        <View style={styles.titleRow}>
                          <Text style={[styles.branchTitle, isActive && styles.branchTitleActive]}>{b.name}</Text>
                          {b.code ? <Text style={styles.codePill}>{b.code}</Text> : null}
                        </View>
                        {b.address ? <Text style={styles.branchAddress}>{b.address}</Text> : null}
                        {b.phone ? <Text style={styles.branchPhone}>📞 {b.phone}</Text> : null}
                      </View>
                    </View>

                    <View style={styles.featuresBox}>
                      <View style={styles.featureItem}>
                        <Icon name="checkCircle" size={12} color={isActive ? T.navy : T.green} />
                        <Text style={styles.featureText}>Quality Inspection & Sampling Support</Text>
                      </View>
                      <View style={styles.featureItem}>
                        <Icon name="checkCircle" size={12} color={isActive ? T.navy : T.green} />
                        <Text style={styles.featureText}>Escrow Payment & Logistics Dispatch</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label={loading ? "Assigning Branch..." : "Continue to Products →"}
          onPress={selectedBranchId && !loading ? handleContinue : undefined}
          disabled={!selectedBranchId || loading}
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

  scrollContent: { paddingBottom: 110 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, lineHeight: 19 },

  cardsGap: { gap: 14, marginTop: 8 },
  card: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: T.cardBorder,
    padding: 16,
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

  branchMainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconCircle: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: T.hairline },
  iconCircleActive: { backgroundColor: `${T.navy}12`, borderColor: T.navy },
  iconText: { fontSize: 22 },
  branchTextContent: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  branchTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  branchTitleActive: { color: T.navy },
  codePill: { fontSize: 10, fontWeight: '800', color: T.navy, backgroundColor: `${T.navy}10`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  branchAddress: { fontSize: 12, color: T.text2, lineHeight: 17 },
  branchPhone: { fontSize: 11, color: T.text3, fontWeight: '600', marginTop: 2 },

  featuresBox: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: T.hairline },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 11, color: T.text2, fontWeight: '600' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10, alignItems: 'center', ...T.shadowSoft },
  continueBtn: { height: 52, borderRadius: 14, backgroundColor: T.amber },
  homeLinkBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
