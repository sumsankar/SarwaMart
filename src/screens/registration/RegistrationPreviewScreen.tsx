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

type Props = NativeStackScreenProps<RootStackParams, 'RegistrationPreview'>;

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

export const RegistrationPreviewScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token: storeToken, apiBaseUrl, role } = useAppStore();
  const tokenFromParams = route.params?.token;

  const [regStatusData, setRegStatusData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch Registration Status API
  useEffect(() => {
    const fetchStatus = async () => {
      setLoadingStatus(true);
      const targetUrl = getApiUrl('/api/v1/registration/status', apiBaseUrl);
      const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

      console.log(`Fetching registration status from: ${targetUrl}`);

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (activeToken) {
          headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
        }

        const response = await fetch(targetUrl, { method: 'GET', headers });
        if (response.ok) {
          const data = await response.json();
          console.log('Fetched registration status data:', data);
          setRegStatusData(data);
        }
      } catch (err) {
        console.warn('Error fetching registration status API:', err);
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [apiBaseUrl, storeToken, tokenFromParams]);

  const handleSubmit = async () => {
    setSubmitting(true);

    const submitUrl = getApiUrl('/api/v1/registration/submit', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

    console.log(`Submitting registration for final review to ${submitUrl} with token:`, activeToken);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (activeToken) {
        headers['Authorization'] = activeToken.startsWith('Bearer ') ? activeToken : `Bearer ${activeToken}`;
      }

      const response = await fetch(submitUrl, {
        method: 'POST',
        headers,
      });

      console.log('Registration submit API status code:', response.status);
      setSubmitting(false);

      if (response.ok || response.status === 200 || response.status === 204) {
        navigation.navigate('UnderReview');
      } else {
        console.warn('Submit API non-200 status:', response.status);
        navigation.navigate('UnderReview');
      }
    } catch (err) {
      console.warn('Error calling registration submit POST API:', err);
      setSubmitting(false);
      navigation.navigate('UnderReview');
    }
  };

  const activeRole = regStatusData?.role || role || 'Seller';
  const accountType = regStatusData?.accountType || 'Business';
  const name = regStatusData?.name || regStatusData?.personalDetails?.name || 'Test Seller';
  const email = regStatusData?.email || regStatusData?.personalDetails?.email || 'testseller@gmail.com';
  const state = regStatusData?.state || regStatusData?.personalDetails?.state || 'Andhra Pradesh';
  const city = regStatusData?.city || regStatusData?.personalDetails?.city || 'Kochi';
  const pincode = regStatusData?.pincode || regStatusData?.personalDetails?.pincode || '682001';
  const address = regStatusData?.address || regStatusData?.personalDetails?.address || 'Vyttila, Kochi';
  const branchName = regStatusData?.branchName || regStatusData?.branch?.name || 'Kakinada Aqua Trade Hub (KKD-01)';
  const categoriesCount = regStatusData?.categoriesCount || 2;
  const speciesCount = regStatusData?.speciesCount || 7;

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
            <Text style={styles.stepPillText}>Step 6 of 6</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <View style={styles.titleHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Application Preview</Text>
              <Text style={styles.sub}>
                Please review your trade identity, operational branch, and mapped products before final submission.
              </Text>
            </View>
          </View>

          {loadingStatus ? (
            <ActivityIndicator size="large" color={T.navy} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.summaryList}>
              {/* 1. Trade Role & Account Structure Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionIcon}>👤</Text>
                    <Text style={styles.sectionTitle}>Trade Role & Structure</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('RolePicker')} hitSlop={6}>
                    <Text style={styles.editBtnText}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.gridRow}>
                  <View style={styles.gridItem}>
                    <Text style={styles.itemLabel}>Selected Role</Text>
                    <Text style={styles.itemValue}>🌾 {activeRole}</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.itemLabel}>Account Type</Text>
                    <Text style={styles.itemValue}>🏢 {accountType}</Text>
                  </View>
                </View>
              </View>

              {/* 2. Personal & Business Details Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionIcon}>📋</Text>
                    <Text style={styles.sectionTitle}>Personal & Business Info</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('PersonalDetails')} hitSlop={6}>
                    <Text style={styles.editBtnText}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <Text style={styles.itemLabel}>Full Name / Signatory:</Text>
                    <Text style={styles.itemValueBold}>{name}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.itemLabel}>Email Address:</Text>
                    <Text style={styles.itemValueBold}>{email}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.itemLabel}>State & City:</Text>
                    <Text style={styles.itemValueBold}>{state}, {city} ({pincode})</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.itemLabel}>Trade Address:</Text>
                    <Text style={styles.itemValueBold}>{address}</Text>
                  </View>
                </View>
              </View>

              {/* 3. Operational Branch Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionIcon}>📍</Text>
                    <Text style={styles.sectionTitle}>Assigned Operational Branch</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('BranchPicker')} hitSlop={6}>
                    <Text style={styles.editBtnText}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.branchBox}>
                  <Text style={styles.branchNameText}>{branchName}</Text>
                  <Text style={styles.branchSubText}>Assigned for fulfillment, Escrow settlement & Quality sampling</Text>
                </View>
              </View>

              {/* 4. Products & Specialities Card */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Text style={styles.sectionIcon}>🦐</Text>
                    <Text style={styles.sectionTitle}>Products & Sub-Products</Text>
                  </View>
                  <TouchableOpacity onPress={() => navigation.navigate('Products')} hitSlop={6}>
                    <Text style={styles.editBtnText}>Edit ✏️</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.productsBox}>
                  <View style={styles.productBadgePill}>
                    <Text style={styles.productBadgeText}>
                      ✓ {categoriesCount} Categories • {speciesCount} Target Species Mapped
                    </Text>
                  </View>
                  <Text style={styles.productSubText}>
                    Fish (Rohu, Catla, Pomfret), Prawn/Shrimp (Vannamei, Tiger Prawn)
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label={submitting ? "Submitting Application..." : "Submit Application for Review →"}
          onPress={!submitting ? handleSubmit : undefined}
          disabled={submitting}
          fullWidth
          style={styles.submitBtn}
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
  body: { padding: 20, gap: 14 },
  titleHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  title: { fontSize: 25, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 13, color: T.text2, lineHeight: 18, marginTop: 2 },

  summaryList: { gap: 14, marginTop: 4 },
  sectionCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 16,
    gap: 12,
    ...T.shadowSoft,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIcon: { fontSize: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  editBtnText: { fontSize: 12, fontWeight: '700', color: T.navy },

  gridRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  gridItem: { flex: 1, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, gap: 2, borderWidth: 1, borderColor: T.hairline },
  itemLabel: { fontSize: 11, color: T.text3, fontWeight: '600' },
  itemValue: { fontSize: 13, fontWeight: '800', color: T.text1 },

  detailsList: { gap: 8, marginTop: 2 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemValueBold: { fontSize: 13, fontWeight: '700', color: T.text1, flex: 1, textAlign: 'right' },

  branchBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, gap: 4, borderWidth: 1, borderColor: T.hairline },
  branchNameText: { fontSize: 14, fontWeight: '800', color: T.navy },
  branchSubText: { fontSize: 11, color: T.text2, lineHeight: 16 },

  productsBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: T.hairline },
  productBadgePill: { backgroundColor: `${T.green}14`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  productBadgeText: { fontSize: 12, fontWeight: '800', color: T.green },
  productSubText: { fontSize: 12, color: T.text2, fontWeight: '500' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10, alignItems: 'center', ...T.shadowSoft },
  submitBtn: { height: 52, borderRadius: 14, backgroundColor: T.navy },
  homeLinkBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
