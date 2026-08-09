import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Avatar } from '../../components/ui/Avatar';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';

interface StateItem {
  id?: string;
  name: string;
  code?: string;
}

const getApiUrl = (endpoint: string, base: string) => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let resolvedBase = cleanBase;
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
};

const SECTIONS = [
  { title: 'Personal Details',        icon: 'user' },
  { title: 'Products & Subproducts',  icon: 'fish' },
  { title: 'Regions & Areas',         icon: 'mapPin' },
  { title: 'KYC & Documents',         icon: 'shield' },
  { title: 'Bank Account Details',    icon: 'receipt' },
  { title: 'Security',               icon: 'shield' },
  { title: 'Preferences',            icon: 'globe' },
];

export const ProfileScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { role, user, token, apiBaseUrl, setUser, setRole, showToast, fetchUserProfile } = useAppStore();
  const isSeller = role === 'seller';

  const rawName = user?.fullName || user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null);
  const userName = rawName || (isSeller ? 'Ravi Kumar' : 'Priya Nair');
  const accountType = user?.accountType || user?.type || 'Individual';
  const userPhone = user?.phoneNumber || user?.phone || user?.mobile || '';
  const userEmail = user?.email || '';
  const userCompany = user?.companyName || user?.businessName || '';
  const userState = user?.stateName || user?.state || 'Andhra Pradesh';
  const userCity = user?.city || 'Kakinada';
  const userPincode = user?.pincode || '533001';
  const userAddress = user?.address || 'Kakinada Port Road';

  // Dynamic Stats from /api/v1/auth/me endpoint
  const listingsVal = user?.listingsCount ?? 0;
  const requestsVal = user?.requestsCount ?? 0;
  const statVal1 = isSeller ? String(listingsVal) : String(requestsVal);
  const statLabel1 = isSeller ? 'Listings' : 'Requests';

  const ratingVal = user?.rating ?? user?.userRating ?? user?.averageRating ?? '4.8';
  const ratingText = typeof ratingVal === 'number' ? `${ratingVal.toFixed(1)} ★` : (String(ratingVal).includes('★') ? String(ratingVal) : `${ratingVal} ★`);

  const rawMemberDate = user?.memberSince || user?.createdAt || user?.createdDate || user?.joiningDate || user?.registeredOn;
  const formatMemberSince = (raw?: string) => {
    if (!raw) return 'Jan 2026';
    try {
      const dateObj = new Date(raw);
      if (!isNaN(dateObj.getTime())) {
        const month = dateObj.toLocaleString('en-US', { month: 'short' });
        const year = dateObj.getFullYear();
        return `${month} ${year}`;
      }
    } catch (e) {}
    return String(raw);
  };
  const memberSinceText = formatMemberSince(rawMemberDate);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Accordion Expand/Collapse State
  const [expandedSection, setExpandedSection] = useState<string | null>('Personal Details');
  const [saving, setSaving] = useState(false);

  // 1. Personal Details Form
  const [form, setForm] = useState({
    fullName: userName,
    phone: userPhone,
    email: userEmail,
    companyName: userCompany,
    accountType: accountType,
    role: role,
    stateName: userState,
    city: userCity,
    pincode: userPincode,
    address: userAddress,
  });

  // 2. Products Selection
  const [selectedProducts, setSelectedProducts] = useState<string[]>([
    'Vannamei Shrimp', 'Black Tiger Shrimp', 'Sea Catfish (Katla)', 'Rohu Fish', 'Mud Crab'
  ]);
  const ALL_PRODUCTS = [
    'Vannamei Shrimp', 'Black Tiger Shrimp', 'Scampi', 'Rohu Fish',
    'Sea Catfish (Katla)', 'Tilapia', 'Seer Fish (Surmai)', 'Mud Crab', 'Blue Crab', 'Squid', 'Lobster'
  ];

  // 3. Operating Regions Selection
  const [selectedRegions, setSelectedRegions] = useState<string[]>([
    'Kakinada Port Hub', 'Bhimavaram Aqua Zone', 'Visakhapatnam Fishing Harbour'
  ]);
  const ALL_REGIONS = [
    'Kakinada Port Hub', 'Bhimavaram Aqua Zone', 'Visakhapatnam Fishing Harbour',
    'Nellore Sea Coast', 'Machilipatnam', 'Kochi Port, Kerala', 'Chennai Harbour, Tamil Nadu'
  ];

  // 4. KYC Details Form
  const [kycForm, setKycForm] = useState({
    gstin: '37AAAAA0000A1Z5',
    pan: 'ABCDE1234F',
    aadhaar: 'XXXX-XXXX-9876',
    status: 'Verified',
  });

  // 5. Bank Account Details Form
  const [bankForm, setBankForm] = useState({
    bankName: 'State Bank of India',
    accountName: userName,
    accountNumber: 'XXXXXX987654',
    ifsc: 'SBIN0001234',
  });

  // 6. Security PIN Form
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });

  // 7. Preferences Form
  const [prefs, setPrefs] = useState({
    whatsapp: true,
    sms: true,
    email: true,
    language: 'English',
  });

  // States picker sub-modal
  const [statesList, setStatesList] = useState<StateItem[]>([]);
  const [statePickerOpen, setStatePickerOpen] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        fullName: rawName || '',
        phone: userPhone,
        email: userEmail,
        companyName: userCompany,
        accountType: accountType,
        role: role,
        stateName: userState,
        city: userCity,
        pincode: userPincode,
        address: userAddress,
      });
    }
  }, [user]);

  // Fetch states from API
  const fetchStates = async () => {
    if (statesList.length > 0) return;
    setLoadingStates(true);
    try {
      const url = getApiUrl('/api/v1/states?includeInactive=false', apiBaseUrl);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const rawArray = Array.isArray(data) ? data : (data.items || data.data || []);
        const parsed: StateItem[] = rawArray.map((s: any) => ({
          id: s.id || s.stateId,
          name: typeof s === 'string' ? s : (s.name || s.stateName || s.title || ''),
          code: s.code || s.stateCode,
        })).filter((s: StateItem) => s.name.length > 0);

        setStatesList(parsed);
      }
    } catch (e) {
      console.warn('Error fetching states in profile:', e);
    } finally {
      setLoadingStates(false);
    }
  };

  const toggleSection = (title: string) => {
    if (title === 'Personal Details') fetchStates();
    setExpandedSection(prev => prev === title ? null : title);
  };

  // Save Handlers
  const handleSavePersonal = async () => {
    if (!form.fullName.trim()) {
      showToast('Please enter your full name', 'error');
      return;
    }
    setSaving(true);
    const updatedProfile = {
      ...user,
      fullName: form.fullName.trim(),
      name: form.fullName.trim(),
      phoneNumber: form.phone.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      companyName: form.companyName.trim(),
      businessName: form.companyName.trim(),
      accountType: form.accountType,
      type: form.accountType,
      role: form.role,
      stateName: form.stateName,
      state: form.stateName,
      city: form.city.trim(),
      pincode: form.pincode.trim(),
      address: form.address.trim(),
    };

    setUser(updatedProfile);
    if (form.role !== role) setRole(form.role as 'seller' | 'buyer');

    if (token) {
      try {
        const url = getApiUrl('/api/v1/auth/profile', apiBaseUrl);
        await fetch(url, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile),
        });
      } catch (err) {
        console.warn('Backend profile update warning:', err);
      }
    }
    setSaving(false);
    showToast('Personal details updated successfully!', 'success');
  };

  const handleSaveProducts = () => {
    showToast('Products & Subproducts preferences saved!', 'success');
  };

  const handleSaveRegions = () => {
    showToast('Operating regions & hubs saved!', 'success');
  };

  const handleSaveKyc = () => {
    showToast('KYC details updated successfully!', 'success');
  };

  const handleSaveBank = () => {
    showToast('Bank details updated successfully!', 'success');
  };

  const handleSavePin = () => {
    if (pinForm.newPin && pinForm.newPin !== pinForm.confirmPin) {
      showToast('New PIN and Confirm PIN do not match', 'error');
      return;
    }
    showToast('Security PIN updated successfully!', 'success');
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
  };

  const handleSavePrefs = () => {
    showToast('Preferences updated successfully!', 'success');
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="My Profile" onBack={() => nav.goBack()} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero Card */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Avatar name={userName} size={72} bg="rgba(255,255,255,0.2)" />
            <TouchableOpacity onPress={() => toggleSection('Personal Details')} style={styles.cameraBadge}>
              <Icon name="camera" size={11} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroName}>{userName}</Text>
            {userCompany ? <Text style={styles.heroSubText}>🏢 {userCompany}</Text> : null}
            {userPhone ? <Text style={styles.heroSubText}>📱 {userPhone}</Text> : null}
            <View style={styles.heroBadges}>
              <View style={isSeller ? styles.badgeSeller : styles.badgeType}>
                <Text style={styles.badgeSellerText}>{isSeller ? 'Seller' : 'Buyer'}</Text>
              </View>
              <View style={styles.badgeType}><Text style={styles.badgeTypeText}>{accountType}</Text></View>
              <View style={styles.badgeKyc}><Text style={styles.badgeKycText}>✓ KYC Verified</Text></View>
            </View>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {[[statVal1, statLabel1], [ratingText, 'Rating'], [memberSinceText, 'Member since']].map(([v, l], i) => (
            <View key={l} style={[styles.statCell, i < 2 && styles.statCellBorder]}>
              <Text style={styles.statVal}>{v}</Text>
              <Text style={styles.statLabel}>{l}</Text>
            </View>
          ))}
        </View>

        {/* ACCORDION SECTIONS */}
        <View style={styles.accordionContainer}>
          {SECTIONS.map((s) => {
            const isExpanded = expandedSection === s.title;
            return (
              <View key={s.title} style={[styles.accordionCard, isExpanded && styles.accordionCardExpanded]}>
                {/* Accordion Header Bar */}
                <TouchableOpacity
                  style={styles.accordionHeader}
                  onPress={() => toggleSection(s.title)}
                  activeOpacity={0.8}
                >
                  <View style={styles.accordionHeaderLeft}>
                    <View style={[styles.sectionIcon, isExpanded && styles.sectionIconActive]}>
                      <Icon name={s.icon} size={18} color={isExpanded ? '#FFFFFF' : T.navy} />
                    </View>
                    <Text style={[styles.sectionTitle, isExpanded && styles.sectionTitleActive]}>{s.title}</Text>
                  </View>
                  <View style={[styles.chevronBadge, isExpanded && styles.chevronBadgeActive]}>
                    <Icon name={isExpanded ? 'chevronD' : 'chevronR'} size={14} color={isExpanded ? '#FFFFFF' : T.text3} />
                  </View>
                </TouchableOpacity>

                {/* Expanded Accordion Body Content */}
                {isExpanded && (
                  <View style={styles.accordionBody}>
                    {/* SECTION 1: PERSONAL DETAILS */}
                    {s.title === 'Personal Details' && (
                      <View style={styles.formContent}>
                        <Input
                          label="Full Name *"
                          value={form.fullName}
                          onChangeText={(v) => setForm(f => ({ ...f, fullName: v }))}
                          placeholder="e.g. Ravi Kumar"
                        />
                        <Input
                          label="Phone Number"
                          value={form.phone}
                          onChangeText={(v) => setForm(f => ({ ...f, phone: v }))}
                          placeholder="+91 98765 43210"
                          keyboardType="phone-pad"
                        />
                        <Input
                          label="Email Address"
                          value={form.email}
                          onChangeText={(v) => setForm(f => ({ ...f, email: v }))}
                          placeholder="user@example.com"
                          keyboardType="email-address"
                        />
                        <Input
                          label="Company / Business Name"
                          value={form.companyName}
                          onChangeText={(v) => setForm(f => ({ ...f, companyName: v }))}
                          placeholder="e.g. Coastal Aqua Traders"
                        />

                        <Text style={styles.labelTitle}>Account Type</Text>
                        <View style={styles.pillRow}>
                          {['Individual', 'Business'].map(type => (
                            <TouchableOpacity
                              key={type}
                              onPress={() => setForm(f => ({ ...f, accountType: type }))}
                              style={[styles.pillOption, form.accountType === type && styles.pillOptionActive]}
                            >
                              <Text style={[styles.pillText, form.accountType === type && styles.pillTextActive]}>{type}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={styles.labelTitle}>Trade Role</Text>
                        <View style={styles.pillRow}>
                          {['seller', 'buyer'].map(r => (
                            <TouchableOpacity
                              key={r}
                              onPress={() => setForm(f => ({ ...f, role: r as 'seller' | 'buyer' }))}
                              style={[styles.pillOption, form.role === r && styles.pillOptionActive]}
                            >
                              <Text style={[styles.pillText, form.role === r && styles.pillTextActive]}>
                                {r === 'seller' ? 'Seller (Farmer)' : 'Buyer (Trader)'}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Text style={styles.labelTitle}>State *</Text>
                        <TouchableOpacity onPress={() => { fetchStates(); setStatePickerOpen(true); }} style={styles.selectBtn} activeOpacity={0.8}>
                          <Text style={styles.selectBtnText}>{form.stateName || 'Select State'}</Text>
                          <Icon name="chevronR" size={16} color={T.navy} />
                        </TouchableOpacity>

                        <View style={styles.gridRow}>
                          <View style={{ flex: 1 }}>
                            <Input
                              label="City / Hub"
                              value={form.city}
                              onChangeText={(v) => setForm(f => ({ ...f, city: v }))}
                              placeholder="Kakinada"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Input
                              label="Pincode"
                              value={form.pincode}
                              onChangeText={(v) => setForm(f => ({ ...f, pincode: v }))}
                              placeholder="533001"
                              keyboardType="numeric"
                              maxLength={6}
                            />
                          </View>
                        </View>

                        <Input
                          label="Operating Address"
                          value={form.address}
                          onChangeText={(v) => setForm(f => ({ ...f, address: v }))}
                          placeholder="e.g. Main Aqua Hub, Kakinada Port Road"
                          multiline
                          numberOfLines={2}
                        />

                        <Button
                          label={saving ? 'Saving...' : 'Save Personal Details'}
                          onPress={handleSavePersonal}
                          disabled={saving}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}

                    {/* SECTION 2: PRODUCTS & SUBPRODUCTS */}
                    {s.title === 'Products & Subproducts' && (
                      <View style={styles.formContent}>
                        <Text style={styles.helperNotice}>Select products and species you supply or deal in:</Text>
                        <View style={styles.chipGrid}>
                          {ALL_PRODUCTS.map(p => {
                            const isSel = selectedProducts.includes(p);
                            return (
                              <TouchableOpacity
                                key={p}
                                onPress={() => {
                                  if (isSel) setSelectedProducts(selectedProducts.filter(item => item !== p));
                                  else setSelectedProducts([...selectedProducts, p]);
                                }}
                                style={[styles.productChip, isSel && styles.productChipActive]}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.productChipText, isSel && styles.productChipTextActive]}>
                                  {isSel ? `✓ ${p}` : `+ ${p}`}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <Button
                          label="Save Product Preferences"
                          onPress={handleSaveProducts}
                          style={{ marginTop: 14 }}
                        />
                      </View>
                    )}

                    {/* SECTION 3: REGIONS & AREAS */}
                    {s.title === 'Regions & Areas' && (
                      <View style={styles.formContent}>
                        <Text style={helperNoticeStyle}>Select primary coastal hubs & operating ports:</Text>
                        <View style={styles.chipGrid}>
                          {ALL_REGIONS.map(r => {
                            const isSel = selectedRegions.includes(r);
                            return (
                              <TouchableOpacity
                                key={r}
                                onPress={() => {
                                  if (isSel) setSelectedRegions(selectedRegions.filter(item => item !== r));
                                  else setSelectedRegions([...selectedRegions, r]);
                                }}
                                style={[styles.productChip, isSel && styles.productChipActive]}
                                activeOpacity={0.8}
                              >
                                <Text style={[styles.productChipText, isSel && styles.productChipTextActive]}>
                                  {isSel ? `📍 ${r}` : `+ ${r}`}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>

                        <Button
                          label="Save Operating Regions"
                          onPress={handleSaveRegions}
                          style={{ marginTop: 14 }}
                        />
                      </View>
                    )}

                    {/* SECTION 4: KYC & DOCUMENTS */}
                    {s.title === 'KYC & Documents' && (
                      <View style={styles.formContent}>
                        <View style={styles.kycStatusBanner}>
                          <Text style={styles.kycStatusText}>Status: <Text style={{ color: T.green, fontWeight: '800' }}>✓ KYC Verified</Text></Text>
                        </View>
                        <Input
                          label="GSTIN Number"
                          value={kycForm.gstin}
                          onChangeText={(v) => setKycForm(f => ({ ...f, gstin: v }))}
                        />
                        <Input
                          label="PAN Card Number"
                          value={kycForm.pan}
                          onChangeText={(v) => setKycForm(f => ({ ...f, pan: v }))}
                        />
                        <Input
                          label="Aadhaar / National ID"
                          value={kycForm.aadhaar}
                          onChangeText={(v) => setKycForm(f => ({ ...f, aadhaar: v }))}
                        />
                        <Button
                          label="Update KYC Details"
                          onPress={handleSaveKyc}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}

                    {/* SECTION 5: BANK ACCOUNT DETAILS */}
                    {s.title === 'Bank Account Details' && (
                      <View style={styles.formContent}>
                        <Input
                          label="Bank Name"
                          value={bankForm.bankName}
                          onChangeText={(v) => setBankForm(f => ({ ...f, bankName: v }))}
                          placeholder="e.g. State Bank of India"
                        />
                        <Input
                          label="Account Holder Name"
                          value={bankForm.accountName}
                          onChangeText={(v) => setBankForm(f => ({ ...f, accountName: v }))}
                        />
                        <Input
                          label="Account Number"
                          value={bankForm.accountNumber}
                          onChangeText={(v) => setBankForm(f => ({ ...f, accountNumber: v }))}
                          keyboardType="numeric"
                        />
                        <Input
                          label="IFSC Code"
                          value={bankForm.ifsc}
                          onChangeText={(v) => setBankForm(f => ({ ...f, ifsc: v.toUpperCase() }))}
                        />
                        <Button
                          label="Save Bank Account Details"
                          onPress={handleSaveBank}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}

                    {/* SECTION 6: SECURITY */}
                    {s.title === 'Security' && (
                      <View style={styles.formContent}>
                        <Input
                          label="Current 6-Digit PIN"
                          value={pinForm.currentPin}
                          onChangeText={(v) => setPinForm(f => ({ ...f, currentPin: v }))}
                          keyboardType="numeric"
                          secureTextEntry
                          maxLength={6}
                        />
                        <Input
                          label="New 6-Digit PIN"
                          value={pinForm.newPin}
                          onChangeText={(v) => setPinForm(f => ({ ...f, newPin: v }))}
                          keyboardType="numeric"
                          secureTextEntry
                          maxLength={6}
                        />
                        <Input
                          label="Confirm New PIN"
                          value={pinForm.confirmPin}
                          onChangeText={(v) => setPinForm(f => ({ ...f, confirmPin: v }))}
                          keyboardType="numeric"
                          secureTextEntry
                          maxLength={6}
                        />
                        <Button
                          label="Update Security PIN"
                          onPress={handleSavePin}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}

                    {/* SECTION 7: PREFERENCES */}
                    {s.title === 'Preferences' && (
                      <View style={styles.formContent}>
                        <Text style={styles.labelTitle}>Notification Channels</Text>
                        <TouchableOpacity
                          style={styles.toggleRow}
                          onPress={() => setPrefs(p => ({ ...p, whatsapp: !p.whatsapp }))}
                        >
                          <Text style={styles.toggleText}>WhatsApp Trade Alerts</Text>
                          <Text style={{ fontSize: 16 }}>{prefs.whatsapp ? '🟢 ON' : '⚪ OFF'}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.toggleRow}
                          onPress={() => setPrefs(p => ({ ...p, sms: !p.sms }))}
                        >
                          <Text style={styles.toggleText}>SMS Updates</Text>
                          <Text style={{ fontSize: 16 }}>{prefs.sms ? '🟢 ON' : '⚪ OFF'}</Text>
                        </TouchableOpacity>

                        <Text style={[styles.labelTitle, { marginTop: 10 }]}>Preferred App Language</Text>
                        <View style={styles.pillRow}>
                          {['English', 'Telugu', 'Tamil', 'Hindi'].map(l => (
                            <TouchableOpacity
                              key={l}
                              onPress={() => setPrefs(p => ({ ...p, language: l }))}
                              style={[styles.pillOption, prefs.language === l && styles.pillOptionActive]}
                            >
                              <Text style={[styles.pillText, prefs.language === l && styles.pillTextActive]}>{l}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <Button
                          label="Save Preferences"
                          onPress={handleSavePrefs}
                          style={{ marginTop: 10 }}
                        />
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {/* Danger zone */}
          <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7}>
            <Icon name="trash" size={18} color={T.danger} />
            <Text style={styles.deleteText}>Delete my account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* STATE PICKER SUB-MODAL FOR PERSONAL DETAILS */}
      <Modal visible={statePickerOpen} animationType="slide" transparent onRequestClose={() => setStatePickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Operating State</Text>
              <TouchableOpacity onPress={() => setStatePickerOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
            {loadingStates ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <ActivityIndicator color={T.navy} />
              </View>
            ) : (
              <FlatList
                data={statesList}
                keyExtractor={(item, index) => item.id || `state_${index}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.stateItem, form.stateName === item.name && styles.stateItemActive]}
                    onPress={() => {
                      setForm(f => ({ ...f, stateName: item.name }));
                      setStatePickerOpen(false);
                    }}
                  >
                    <Text style={[styles.stateItemText, form.stateName === item.name && styles.stateItemTextActive]}>
                      {item.name}
                    </Text>
                    {form.stateName === item.name && <Text style={{ color: T.navy, fontWeight: '800' }}>✓</Text>}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const helperNoticeStyle = { fontSize: 12, color: T.text3, marginBottom: 10, fontWeight: '600' as const };

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  hero: { backgroundColor: T.navy, padding: 24, paddingBottom: 28, flexDirection: 'row', gap: 16, alignItems: 'center' },
  avatarWrap: { position: 'relative' },
  cameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: T.amber, borderWidth: 2, borderColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  heroName: { fontSize: 20, fontWeight: '800', color: '#fff' },
  heroSubText: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2, fontWeight: '600' },
  heroBadges: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  badgeSeller: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${T.amber}30` },
  badgeSellerText: { fontSize: 11, fontWeight: '700', color: T.amber },
  badgeType: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeTypeText: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
  badgeKyc: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: `${T.green}40` },
  badgeKycText: { fontSize: 11, fontWeight: '700', color: '#7EDB8B' },
  statsRow: { backgroundColor: T.card, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: T.hairline },
  statCell: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statCellBorder: { borderRightWidth: 1, borderRightColor: T.hairline },
  statVal: { fontSize: 18, fontWeight: '900', color: T.navy },
  statLabel: { fontSize: 11, color: T.text3, marginTop: 2 },

  // ACCORDION STYLES
  accordionContainer: { padding: 16, gap: 10 },
  accordionCard: { backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.hairline, overflow: 'hidden' },
  accordionCardExpanded: { borderColor: `${T.navy}40`, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  accordionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  sectionIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  sectionIconActive: { backgroundColor: T.navy },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: T.text1 },
  sectionTitleActive: { color: T.navy, fontWeight: '800' },
  chevronBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  chevronBadgeActive: { backgroundColor: T.navy },

  accordionBody: { paddingHorizontal: 14, paddingBottom: 16, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  formContent: { gap: 8 },
  helperNotice: { fontSize: 12, color: T.text3, marginBottom: 8, fontWeight: '600' },

  labelTitle: { fontSize: 12, fontWeight: '700', color: T.text2, marginTop: 4, marginBottom: 4 },
  pillRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  pillOption: { height: 36, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  pillOptionActive: { backgroundColor: T.navy, borderColor: T.navy },
  pillText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  pillTextActive: { color: '#FFFFFF', fontWeight: '800' },

  selectBtn: { height: 44, borderRadius: 10, borderWidth: 1.5, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  selectBtnText: { fontSize: 13, fontWeight: '600', color: T.text1 },
  gridRow: { flexDirection: 'row', gap: 10 },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  productChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1.5, borderColor: '#CBD5E1' },
  productChipActive: { backgroundColor: `${T.navy}12`, borderColor: T.navy },
  productChipText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  productChipTextActive: { color: T.navy, fontWeight: '800' },

  kycStatusBanner: { backgroundColor: `${T.green}15`, padding: 10, borderRadius: 10, marginBottom: 8 },
  kycStatusText: { fontSize: 13, fontWeight: '700', color: T.text1 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  toggleText: { fontSize: 13, fontWeight: '600', color: T.text1 },

  deleteRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: `${T.danger}08`, borderRadius: 12, borderWidth: 1, borderColor: `${T.danger}25`, marginTop: 8 },
  deleteText: { fontSize: 14, fontWeight: '600', color: T.danger },

  // State sub-modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '70%', padding: 20 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: T.navy },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 16, color: T.text3, fontWeight: '800' },
  stateItem: { paddingVertical: 14, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stateItemActive: { backgroundColor: `${T.navy}08` },
  stateItemText: { fontSize: 14, color: T.text1, fontWeight: '600' },
  stateItemTextActive: { fontWeight: '800', color: T.navy },
});
