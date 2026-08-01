import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'PersonalDetails'>;

interface StateItem {
  id?: string;
  name: string;
  code?: string;
}

const DEFAULT_STATES: StateItem[] = [
  { name: 'Andhra Pradesh' },
  { name: 'West Bengal' },
  { name: 'Tamil Nadu' },
  { name: 'Kerala' },
  { name: 'Odisha' },
  { name: 'Gujarat' },
  { name: 'Maharashtra' },
  { name: 'Karnataka' },
  { name: 'Telangana' },
  { name: 'Goa' },
  { name: 'Assam' },
  { name: 'Bihar' },
  { name: 'Punjab' },
  { name: 'Haryana' },
  { name: 'Uttar Pradesh' },
  { name: 'Rajasthan' },
  { name: 'Madhya Pradesh' },
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

export const PersonalDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { token: storeToken, apiBaseUrl } = useAppStore();
  const tokenFromParams = route.params?.token;

  const [form, setForm] = useState({
    name: '',
    email: '',
    state: '',
    stateId: '',
    city: '',
    pincode: '',
    address: '',
  });

  const [statesList, setStatesList] = useState<StateItem[]>(DEFAULT_STATES);
  const [loadingStates, setLoadingStates] = useState(false);
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  // Validation Rules
  const isNameValid = form.name.trim().length > 0;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isStateValid = form.state.trim().length > 0;
  const isCityValid = form.city.trim().length > 0;
  const isPincodeValid = /^\d{6}$/.test(form.pincode.trim());
  const isAddressValid = form.address.trim().length > 0;

  const isFormValid = isNameValid && isEmailValid && isStateValid && isCityValid && isPincodeValid && isAddressValid;

  // Fetch States API
  useEffect(() => {
    const fetchStates = async () => {
      setLoadingStates(true);
      const targetUrl = getApiUrl('/api/v1/states?includeInactive=false', apiBaseUrl);
      console.log(`Fetching states from: ${targetUrl}`);

      try {
        const response = await fetch(targetUrl);
        if (response.ok) {
          const data = await response.json();
          let parsedStates: StateItem[] = [];

          if (Array.isArray(data)) {
            parsedStates = data.map((item: any) => {
              if (typeof item === 'string') return { name: item };
              return {
                id: item.id || item.stateId,
                name: item.name || item.stateName || item.title || '',
                code: item.code || item.stateCode,
              };
            }).filter(s => s.name.length > 0);
          } else if (data && Array.isArray(data.items)) {
            parsedStates = data.items.map((item: any) => ({
              id: item.id || item.stateId,
              name: item.name || item.stateName || '',
              code: item.code,
            }));
          } else if (data && Array.isArray(data.data)) {
            parsedStates = data.data.map((item: any) => ({
              id: item.id || item.stateId,
              name: item.name || item.stateName || '',
              code: item.code,
            }));
          }

          if (parsedStates.length > 0) {
            setStatesList(parsedStates);
          }
        }
      } catch (err) {
        console.warn('Error fetching states API:', err);
      } finally {
        setLoadingStates(false);
      }
    };

    fetchStates();
  }, [apiBaseUrl]);

  const handleContinue = async () => {
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/registration/personal-details', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      state: form.state.trim(),
      stateId: form.stateId || undefined,
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      address: form.address.trim(),
    };

    console.log(`Submitting registration personal-details to ${targetUrl} with token:`, activeToken, payload);

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
        navigation.navigate('BranchPicker', { token: activeToken });
      } else {
        console.warn('Personal details registration API status:', response.status);
        navigation.navigate('BranchPicker', { token: activeToken });
      }
    } catch (err) {
      console.warn('Error calling registration personal-details PUT API:', err);
      setLoading(false);
      navigation.navigate('BranchPicker', { token: activeToken });
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
            <Text style={styles.stepPillText}>Step 3 of 5</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.body}>
            <Text style={styles.title}>Personal & Business Info</Text>
            <Text style={styles.sub}>Enter your details for official trade identity & KYC verification</Text>

            <View style={styles.formCard}>
              {/* Full Name */}
              <Input
                label="Full Name / Authorized Signatory *"
                value={form.name}
                onChangeText={v => set('name', v)}
                placeholder="e.g. Test Seller"
                helper={form.name && !isNameValid ? 'Full name is required' : undefined}
              />

              {/* Email Address */}
              <Input
                label="Email Address *"
                value={form.email}
                onChangeText={v => set('email', v)}
                placeholder="e.g. testseller@gmail.com"
                keyboardType="email-address"
                helper={form.email && !isEmailValid ? 'Please enter a valid email address' : undefined}
                error={form.email && !isEmailValid ? 'Invalid email format' : undefined}
              />

              {/* State Dropdown Selector */}
              <View style={styles.dropdownField}>
                <Text style={styles.dropdownLabel}>State / Region *</Text>
                <TouchableOpacity
                  onPress={() => setStateModalVisible(true)}
                  style={[styles.dropdownButton, isStateValid && styles.dropdownButtonSelected]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.dropdownValue, !form.state && styles.dropdownPlaceholder]}>
                    {form.state || 'Select State from list'}
                  </Text>
                  <Icon name="chevronR" size={16} color={T.navy} />
                </TouchableOpacity>
              </View>

              {/* City */}
              <Input
                label="City / District / Mandi *"
                value={form.city}
                onChangeText={v => set('city', v)}
                placeholder="e.g. Kochi"
                helper={form.city && !isCityValid ? 'City is required' : undefined}
              />

              {/* Pincode */}
              <Input
                label="Pincode *"
                value={form.pincode}
                onChangeText={v => set('pincode', v.replace(/\D/g, '').slice(0, 6))}
                placeholder="e.g. 682001"
                keyboardType="numeric"
                maxLength={6}
                helper={form.pincode && !isPincodeValid ? 'Pincode must be 6 digits' : undefined}
                error={form.pincode && form.pincode.length > 0 && !isPincodeValid ? 'Invalid 6-digit pincode' : undefined}
              />

              {/* Address Details (Multiline) */}
              <Input
                label="Address Details *"
                value={form.address}
                onChangeText={v => set('address', v)}
                placeholder="e.g. Vyttila, Kochi..."
                multiline
                numberOfLines={3}
                helper={form.address && !isAddressValid ? 'Address details are required' : undefined}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* State Picker Modal */}
      <Modal visible={stateModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select State</Text>
              <TouchableOpacity onPress={() => setStateModalVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingStates ? (
              <ActivityIndicator size="large" color={T.navy} style={{ marginVertical: 30 }} />
            ) : (
              <FlatList
                data={statesList}
                keyExtractor={(item, idx) => item.id || item.name || idx.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.stateItem, form.state === item.name && styles.stateItemSelected]}
                    onPress={() => {
                      set('state', item.name);
                      if (item.id) set('stateId', item.id);
                      setStateModalVisible(false);
                    }}
                  >
                    <Text style={[styles.stateItemText, form.state === item.name && styles.stateItemTextSelected]}>
                      {item.name}
                    </Text>
                    {form.state === item.name && <Text style={styles.checkmarkText}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label={loading ? "Saving Personal Details..." : "Continue to Branch Assignment →"}
          onPress={isFormValid && !loading ? handleContinue : undefined}
          disabled={!isFormValid || loading}
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
  title: { fontSize: 26, fontWeight: '900', color: T.text1 },
  sub: { fontSize: 14, color: T.text2, lineHeight: 20 },

  formCard: {
    backgroundColor: T.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: T.cardBorder,
    padding: 18,
    gap: 16,
    marginTop: 8,
    ...T.shadowSoft,
  },

  dropdownField: { gap: 6 },
  dropdownLabel: { fontSize: 13, fontWeight: '700', color: T.text1 },
  dropdownButton: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: T.hairline,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownButtonSelected: { borderColor: T.navy, backgroundColor: '#FFFFFF' },
  dropdownValue: { fontSize: 14, color: T.text1, fontWeight: '600' },
  dropdownPlaceholder: { color: T.text3, fontWeight: '400' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%', padding: 20, gap: 14 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: T.hairline },
  modalTitle: { fontSize: 18, fontWeight: '900', color: T.text1 },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 18, fontWeight: '800', color: T.text2 },
  stateItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.hairline },
  stateItemSelected: { backgroundColor: `${T.navy}08`, paddingHorizontal: 10, borderRadius: 10 },
  stateItemText: { fontSize: 15, color: T.text1, fontWeight: '500' },
  stateItemTextSelected: { color: T.navy, fontWeight: '800' },
  checkmarkText: { color: T.navy, fontWeight: '900', fontSize: 16 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10, alignItems: 'center', ...T.shadowSoft },
  continueBtn: { height: 52, borderRadius: 14, backgroundColor: T.amber },
  homeLinkBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
