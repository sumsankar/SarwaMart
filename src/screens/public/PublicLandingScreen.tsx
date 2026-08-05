import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Image,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from '../../components/ui/Logo';
import { BannerCarousel } from '../../components/ui/BannerCarousel';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { PUBLIC_BANNERS, productIcon } from '../../constants/mockData';
import { NotificationConsentModal } from '../../components/ui/NotificationConsentModal';
import { useAppStore } from '../../store/appStore';

type Props = NativeStackScreenProps<RootStackParams, 'PublicLanding'>;
type PromptAction = 'bid' | 'proposal' | 'browseItems' | 'browseRequests' | 'detail';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const PROMPT_COPY: Record<PromptAction, { emoji: string; title: string; sub: string; primary: string }> = {
  bid: { emoji: '🔨', title: 'Register to Place a Bid', sub: 'Join SarwaMart free to bid on fresh aqua products directly from verified farmers.', primary: "Register as Buyer — It's Free" },
  proposal: { emoji: '📋', title: 'Register to Submit a Proposal', sub: 'Join SarwaMart free to submit proposals on buyer requests and grow your aqua business.', primary: "Register as Seller — It's Free" },
  browseItems: { emoji: '🔍', title: 'Sign in to browse all items', sub: 'Create a free account to see the full live catalog of fresh aqua products from verified sellers.', primary: 'Create free account' },
  browseRequests: { emoji: '🔍', title: 'Sign in to browse all requests', sub: 'Create a free account to see every active buyer request and respond with a proposal.', primary: 'Create free account' },
  detail: { emoji: '🔐', title: 'Sign in to view full details', sub: 'Create a free account to see seller verification, region, grade, and place a bid in seconds.', primary: 'Create free account' },
};

const getSeedSeconds = (guid: string) => {
  if (!guid) return 3600;
  let code = 0;
  for (let i = 0; i < guid.length; i++) {
    code += guid.charCodeAt(i);
  }
  return (code % 3600) + 1200;
};

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

// 6-Digit Individual Textbox Input Component
const SixDigitPinInput: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleChangeText = (text: string, index: number) => {
    const cleaned = text.replace(/\D/g, '');
    const newArr = [...digits];

    if (cleaned.length > 0) {
      newArr[index] = cleaned[cleaned.length - 1];
      const nextVal = newArr.join('').slice(0, 6);
      onChange(nextVal);
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    } else {
      newArr[index] = '';
      const nextVal = newArr.join('').slice(0, 6);
      onChange(nextVal);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.pinBoxesRow}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <TextInput
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          value={digits[i]}
          onChangeText={(t) => handleChangeText(t, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          keyboardType="numeric"
          maxLength={1}
          secureTextEntry
          style={[styles.pinSquareBox, digits[i] ? styles.pinSquareBoxFilled : null]}
        />
      ))}
    </View>
  );
};

const SectionPlaceholder: React.FC<{
  loading: boolean;
  title: string;
  sub: string;
  emoji: string;
  themeColor: string;
  onRefresh: () => void;
}> = ({ loading, title, sub, emoji, themeColor, onRefresh }) => {
  return (
    <View style={styles.placeholderCard}>
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color={themeColor} />
          <Text style={styles.loaderText}>Loading live market data...</Text>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: `${themeColor}12` }]}>
            <Text style={[styles.emptyIconText, { color: themeColor }]}>{emoji}</Text>
          </View>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptySub}>{sub}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            activeOpacity={0.7}
            style={[styles.refreshBtn, { borderColor: themeColor }]}
          >
            <Icon name="refresh" size={12} color={themeColor} />
            <Text style={[styles.refreshBtnText, { color: themeColor }]}>Reload</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const RegisterPrompt: React.FC<{
  open: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLogin: () => void;
  action: PromptAction;
}> = ({ open, onClose, onRegister, onLogin, action }) => {
  const copy = PROMPT_COPY[action];
  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.promptIcon}>
          <Text style={{ fontSize: 34 }}>{copy.emoji}</Text>
        </View>
        <Text style={styles.promptTitle}>{copy.title}</Text>
        <Text style={styles.promptSub}>{copy.sub}</Text>
        <View style={styles.benefits}>
          {['✅ Verified sellers & buyers only', '🔒 Secure OTP + 6-Digit PIN login', '📦 Direct farm-to-buyer transactions', '💰 Best prices through competitive bidding'].map((b, i) => (
            <Text key={i} style={styles.benefit}>{b}</Text>
          ))}
        </View>
        <Button label={copy.primary} onPress={onRegister} fullWidth style={styles.registerBtn} />
        <Button label="Already have an account? Log in" onPress={onLogin} variant="secondary" fullWidth style={styles.loginBtn} />
        <TouchableOpacity onPress={onClose} style={styles.browseBtn}>
          <Text style={styles.browseBtnText}>Continue browsing</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

// PIN Login Bottom Sheet Modal Component with Field Validation & Enabled Login Button
const LoginBottomSheet: React.FC<{
  open: boolean;
  onClose: () => void;
  onPerformPINLogin: (phone: string, pin: string, setLoggingIn: (v: boolean) => void, setError: (msg: string) => void) => void;
  onRegister: () => void;
}> = ({ open, onClose, onPerformPINLogin, onRegister }) => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const resetFields = () => {
    setPhone('');
    setPin('');
    setErrorMsg('');
    setLoggingIn(false);
  };

  useEffect(() => {
    if (open) {
      resetFields();
    }
  }, [open]);

  const handleClose = () => {
    resetFields();
    onClose();
  };

  const isValidPhone = /^\d{10}$/.test(phone);
  const isValidPin = /^\d{6}$/.test(pin);
  const canSubmit = isValidPhone && isValidPin;

  const handleSubmit = () => {
    if (!canSubmit || loggingIn) return;
    onPerformPINLogin(phone, pin, setLoggingIn, setErrorMsg);
  };

  // Status helper message
  const getStatusHelperText = () => {
    if (!phone) return '• Enter 10-digit mobile number';
    if (!isValidPhone) return '• Mobile number must be 10 digits';
    if (!pin) return '• Enter 6-digit security PIN below';
    if (!isValidPin) return `• Enter ${6 - pin.length} more PIN digit(s)`;
    return '✓ All required fields entered! Tap Login →';
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} onPress={handleClose} activeOpacity={1} />
      <View style={styles.loginSheetContainer}>
        <View style={styles.handle} />

        <View style={styles.loginSheetHeader}>
          <View style={styles.loginIconCircle}>
            <Text style={{ fontSize: 26 }}>🔑</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.loginSheetTitle}>Sign In with 6-Digit PIN</Text>
            <Text style={styles.loginSheetSub}>Enter mobile number and 6-digit PIN to sign in.</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeCircleBtn}>
            <Text style={{ fontSize: 16, color: T.text3 }}>✕</Text>
          </TouchableOpacity>
        </View>

        {errorMsg ? (
          <View style={styles.errorBannerBox}>
            <Text style={styles.errorBannerText}>⚠️ {errorMsg}</Text>
          </View>
        ) : null}

        {/* 1. Mobile Number Input */}
        <View style={styles.inputFieldGroup}>
          <View style={styles.labelWithCheckRow}>
            <Text style={styles.fieldLabelText}>Mobile Number</Text>
            {isValidPhone && <Text style={styles.checkText}>✓ Valid 10 Digits</Text>}
          </View>
          <View style={[styles.phoneInputRow, isValidPhone ? styles.inputBorderValid : null]}>
            <View style={styles.flagPill}>
              <Text style={styles.flagText}>🇮🇳 +91</Text>
            </View>
            <TextInput
              value={phone}
              onChangeText={(txt) => {
                setPhone(txt.replace(/\D/g, '').slice(0, 10));
                setErrorMsg('');
              }}
              placeholder="Enter 10-digit mobile number"
              placeholderTextColor={T.text3}
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.loginPhoneInput}
            />
          </View>
        </View>

        {/* 2. 6-Digit PIN Input with 6 Textboxes */}
        <View style={styles.inputFieldGroup}>
          <View style={styles.pinLabelRow}>
            <Text style={styles.fieldLabelText}>Enter 6-Digit Security PIN</Text>
            <Text style={[styles.pinCountText, isValidPin ? { color: T.green } : null]}>
              {isValidPin ? '✓ 6/6 Digits' : `${pin.length}/6`}
            </Text>
          </View>
          <SixDigitPinInput
            value={pin}
            onChange={(val) => {
              setPin(val);
              setErrorMsg('');
            }}
          />
        </View>

        {/* Field Status Guidance Box */}
        <View style={[styles.statusGuidanceBox, canSubmit ? styles.statusGuidanceBoxReady : null]}>
          <Text style={[styles.statusGuidanceText, canSubmit ? styles.statusGuidanceTextReady : null]}>
            {getStatusHelperText()}
          </Text>
        </View>

        {/* Login Button with Dynamic Enabled / Disabled States */}
        <TouchableOpacity
          activeOpacity={canSubmit ? 0.82 : 1}
          onPress={handleSubmit}
          disabled={!canSubmit || loggingIn}
          style={[
            styles.loginActionBtn,
            canSubmit ? styles.loginActionBtnEnabled : styles.loginActionBtnDisabled,
          ]}
        >
          {loggingIn ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.loginActionBtnText, canSubmit ? styles.loginActionBtnTextEnabled : null]}>
              {canSubmit ? "Login →" : "Login (Fill All Fields)"}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={onRegister} style={styles.createAccountLinkBtn}>
          <Text style={styles.createAccountLinkText}>
            Don't have an account? <Text style={{ fontWeight: '800', color: T.amber }}>Register Free</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export const PublicLandingScreen: React.FC<Props> = ({ navigation }) => {
  const { apiBaseUrl, setToken, setRole, setLoggedIn } = useAppStore();
  const [promptOpen, setPromptOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [promptAction, setPromptAction] = useState<PromptAction>('bid');
  const [search, setSearch] = useState('');

  const [items, setItems] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Filter State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState<string | null>(null);

  const listingsScrollRef = useRef<ScrollView>(null);
  const requestsScrollRef = useRef<ScrollView>(null);
  const [listingsOffset, setListingsOffset] = useState(0);
  const [requestsOffset, setRequestsOffset] = useState(0);

  const scrollListings = (direction: 'left' | 'right') => {
    const step = 225;
    const newX = direction === 'left' ? Math.max(0, listingsOffset - step) : listingsOffset + step;
    listingsScrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  const scrollRequests = (direction: 'left' | 'right') => {
    const step = 225;
    const newX = direction === 'left' ? Math.max(0, requestsOffset - step) : requestsOffset + step;
    requestsScrollRef.current?.scrollTo({ x: newX, animated: true });
  };

  const fetchListings = async (silent = false) => {
    if (!silent) setLoadingItems(true);
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/listings/public?pageSize=15');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch public listings:', err);
    } finally {
      if (!silent) setLoadingItems(false);
    }
  };

  const fetchRequests = async (silent = false) => {
    if (!silent) setLoadingRequests(true);
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/requests/public?pageSize=15');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items || []);
      }
    } catch (err) {
      console.warn('Failed to fetch public requests:', err);
    } finally {
      if (!silent) setLoadingRequests(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/api/v1/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch categories:', err);
    }
  };

  useEffect(() => {
    fetchListings();
    fetchRequests();
    fetchCategories();
  }, []);

  const showPrompt = (action: PromptAction) => {
    setPromptAction(action);
    setPromptOpen(true);
  };

  const handleRegister = () => {
    setPromptOpen(false);
    setLoginSheetOpen(false);
    navigation.navigate('MobileEntry', { mode: 'register' });
  };

  const handleLoginClick = () => {
    setPromptOpen(false);
    setLoginSheetOpen(true);
  };

  const handlePINLoginSubmit = async (
    phone: string,
    pin: string,
    setLoggingIn: (v: boolean) => void,
    setError: (msg: string) => void
  ) => {
    setLoggingIn(true);
    setError('');

    const loginUrl = getApiUrl('/api/v1/auth/pin/login', apiBaseUrl);
    console.log(`Submitting PIN login to: ${loginUrl} for phone: ${phone}`);

    try {
      // 1. Call POST /api/v1/auth/pin/login
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin }),
      });

      if (response.ok) {
        const loginData = await response.json().catch(() => ({}));
        console.log('PIN Login success response:', loginData);

        const accessToken = loginData.accessToken || loginData.token || '';
        const refreshToken = loginData.refreshToken || '';

        if (accessToken) {
          // 2. Securely store accessToken and refreshToken
          await AsyncStorage.setItem('sm_access_token', accessToken);
          await AsyncStorage.setItem('sm_auth_token', accessToken);
          if (refreshToken) {
            await AsyncStorage.setItem('sm_refresh_token', refreshToken);
          }
          setToken(accessToken);

          // 3. Fetch User Profile & Role from GET /api/v1/auth/me
          let resolvedRole: 'seller' | 'buyer' = 'seller';
          try {
            const meUrl = getApiUrl('/api/v1/auth/me', apiBaseUrl);
            const meRes = await fetch(meUrl, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            });

            if (meRes.ok) {
              const meData = await meRes.json();
              console.log('GET /api/v1/auth/me success profile:', meData);
              const userRoleStr = (meData.role || meData.tradeRole || meData.userRole || meData.type || '').toLowerCase();
              if (userRoleStr.includes('buyer') || userRoleStr.includes('trader')) {
                resolvedRole = 'buyer';
              } else {
                resolvedRole = 'seller';
              }
            } else {
              console.warn('/api/v1/auth/me returned status:', meRes.status);
              // Fallback to role from loginData if available
              const loginRole = (loginData.role || loginData.userRole || '').toLowerCase();
              if (loginRole.includes('buyer')) resolvedRole = 'buyer';
            }
          } catch (meErr) {
            console.warn('Error fetching /api/v1/auth/me:', meErr);
          }

          setLoggingIn(false);
          setRole(resolvedRole);
          setLoggedIn(true);
          setLoginSheetOpen(false);

          // 4. Navigate based on role
          navigation.replace(resolvedRole === 'buyer' ? 'BuyerTabs' : 'SellerTabs');
        } else {
          setLoggingIn(false);
          setError('Login succeeded but no access token was returned.');
        }
      } else {
        setLoggingIn(false);
        setError('Invalid mobile number or 6-digit PIN. Please try again.');
      }
    } catch (err) {
      console.warn('Error calling PIN login API:', err);
      setLoggingIn(false);
      setError('Network error connecting to login server.');
    }
  };

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
  const activeSubcategories: any[] = selectedCategoryObj?.subcategories || selectedCategoryObj?.subCategories || [];

  const filteredItems = items.filter(i => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      i.name?.toLowerCase().includes(q) ||
      i.category?.toLowerCase().includes(q) ||
      i.subcategory?.toLowerCase().includes(q) ||
      i.region?.toLowerCase().includes(q) ||
      i.branchName?.toLowerCase().includes(q);

    const matchesCat = !selectedCategoryId || i.categoryId === selectedCategoryId;
    const matchesSub = !selectedSubcategoryName || i.subcategory?.toLowerCase() === selectedSubcategoryName.toLowerCase();
    return matchesSearch && matchesCat && matchesSub;
  });

  const filteredRequests = requests.filter(r => {
    const q = search.toLowerCase().trim();
    const matchesSearch = !q ||
      r.category?.toLowerCase().includes(q) ||
      r.subcategory?.toLowerCase().includes(q) ||
      r.destinationRegion?.toLowerCase().includes(q) ||
      r.branchName?.toLowerCase().includes(q);

    const matchesCat = !selectedCategoryId || r.categoryId === selectedCategoryId;
    const matchesSub = !selectedSubcategoryName || r.subcategory?.toLowerCase() === selectedSubcategoryName.toLowerCase();
    return matchesSearch && matchesCat && matchesSub;
  });

  return (
    <SafeAreaView style={styles.container}>
      <NotificationConsentModal />

      {/* Top Header Bar on White Background */}
      <View style={styles.header}>
        <Logo width={135} dark />
        <View style={styles.headerRightGroup}>
          <TouchableOpacity onPress={handleLoginClick} style={styles.loginChip} activeOpacity={0.8}>
            <Text style={styles.loginChipText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleRegister} style={styles.registerChip} activeOpacity={0.85}>
            <Text style={styles.registerChipText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Deep Navy Top Shell for Ticker + Banner */}
        <LinearGradient colors={['#0F172A', '#1E293B', '#334155']} style={styles.topNavyShell}>
          {/* Ticker Bar inside dark shell */}
          <View style={styles.tickerBarDark}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerContent}>
              <View style={styles.tickerItem}>
                <View style={styles.greenPulseDot} />
                <Text style={styles.tickerTextDark}>Live Coastal Hubs: Kakinada • Bhimavaram • Kochi • Nellore</Text>
              </View>
              <Text style={styles.tickerSepDark}>|</Text>
              <View style={styles.tickerItem}>
                <Text style={styles.tickerTextDark}>🛡️ 100% Escrow Protection Vault</Text>
              </View>
            </ScrollView>
          </View>

          {/* Hero Banner Carousel Component inside dark shell */}
          <View style={styles.bannerCarouselWrapper}>
            <BannerCarousel banners={PUBLIC_BANNERS} />
          </View>
        </LinearGradient>

        {/* Floating Search & Category Filter Card */}
        <View style={styles.floatingSearchFilterCard}>
          {/* Search Box */}
          <View style={styles.searchBox}>
            <Icon name="search" size={16} color={T.navy} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search Rohu, Vannamei, Mud Crab, Kakinada..."
              placeholderTextColor={T.text3}
              style={styles.searchInput}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Category Horizontal Pills */}
          <View style={styles.categoryHeaderRow}>
            <Text style={styles.filterTitleText}>Categories:</Text>
            {(selectedCategoryId || selectedSubcategoryName) && (
              <TouchableOpacity onPress={() => { setSelectedCategoryId(null); setSelectedSubcategoryName(null); }}>
                <Text style={styles.resetFilterText}>Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
            <TouchableOpacity
              onPress={() => { setSelectedCategoryId(null); setSelectedSubcategoryName(null); }}
              style={[styles.catPill, !selectedCategoryId && styles.catPillActive]}
              activeOpacity={0.85}
            >
              <Text style={styles.catEmoji}>🌊</Text>
              <Text style={[styles.catName, !selectedCategoryId && styles.catNameActive]}>All Aqua</Text>
            </TouchableOpacity>

            {categories.map(c => {
              const isSelected = selectedCategoryId === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => { setSelectedCategoryId(c.id); setSelectedSubcategoryName(null); }}
                  style={[styles.catPill, isSelected && styles.catPillActive]}
                  activeOpacity={0.85}
                >
                  <Text style={styles.catEmoji}>{c.emoji || productIcon(c.name)}</Text>
                  <Text style={[styles.catName, isSelected && styles.catNameActive]}>{c.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Subcategory Strip if selected */}
          {selectedCategoryObj && activeSubcategories.length > 0 && (
            <View style={styles.subcategoryStrip}>
              <Text style={styles.subStripTitle}>Sub-Species in {selectedCategoryObj.name}:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subStripRow}>
                <TouchableOpacity
                  onPress={() => setSelectedSubcategoryName(null)}
                  style={[styles.subChip, !selectedSubcategoryName && styles.subChipActive]}
                >
                  <Text style={[styles.subChipText, !selectedSubcategoryName && styles.subChipTextActive]}>
                    All {selectedCategoryObj.name}
                  </Text>
                </TouchableOpacity>

                {activeSubcategories.map((sub: any) => {
                  const subName = typeof sub === 'string' ? sub : sub.name;
                  const isSel = selectedSubcategoryName?.toLowerCase() === subName.toLowerCase();
                  return (
                    <TouchableOpacity
                      key={subName}
                      onPress={() => setSelectedSubcategoryName(isSel ? null : subName)}
                      style={[styles.subChip, isSel && styles.subChipActive]}
                    >
                      <Text style={[styles.subChipText, isSel && styles.subChipTextActive]}>{subName}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* CAROUSEL 1: LIVE SEAFOOD LISTINGS */}
        <View style={styles.sectionContainerNavy}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitleNavy}>Live Seafood Listings ({filteredItems.length})</Text>
              <View style={styles.assuredBadgeNavy}>
                <Icon name="checkCircle" size={12} color={T.navy} />
                <Text style={styles.assuredTextNavy}>Verified Quality Sourcing</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => showPrompt('browseItems')} style={styles.arrowCircleBtnNavy}>
              <Icon name="chevronR" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {filteredItems.length === 0 ? (
            <SectionPlaceholder
              loading={loadingItems}
              title="No Live Listings Found"
              sub="Aqua items from verified farmers are updated daily. Tap reload or register to place your own bid request."
              emoji="🎣"
              themeColor={T.navy}
              onRefresh={fetchListings}
            />
          ) : (
            <View style={{ position: 'relative' }}>
              <ScrollView
                ref={listingsScrollRef}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScrollBox}
                onScroll={(e) => setListingsOffset(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                {filteredItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => showPrompt('detail')}
                    style={styles.itemCardCarousel}
                    activeOpacity={0.88}
                  >
                    <View style={styles.itemAccent} />
                    <View style={styles.itemImgBox}>
                      {item.images && item.images.length > 0 ? (
                        <Image
                          source={{ uri: item.images.find((img: any) => img.isCover)?.imageUrl || item.images[0].imageUrl }}
                          style={styles.itemCardImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.itemEmoji}>{productIcon(item.subcategory || item.category)}</Text>
                      )}
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedText}>✓ Verified</Text>
                      </View>
                    </View>

                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>
                        {item.subcategory || item.category} • {item.quantityRemaining} {item.uom}
                      </Text>

                      <View style={styles.itemLocRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.itemLocText} numberOfLines={1}>
                          {item.region || item.branchName || 'Kakinada Hub'}
                        </Text>
                      </View>

                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemPrice}>
                          {item.saleType === 'Auction' ? 'Auction' : 'Direct Sale'}
                        </Text>
                        <CountdownTimer seedSeconds={getSeedSeconds(item.id)} compact />
                      </View>

                      <View style={styles.itemTagsRow}>
                        <View style={styles.itemTag}>
                          <Icon name="shield" size={10} color={T.navy} />
                          <Text style={styles.itemTagText}>Gr. {item.grade}</Text>
                        </View>
                        <View style={styles.itemTag}>
                          <Text style={styles.itemTagText}>{item.freshness || 'Iced Fresh'}</Text>
                        </View>
                      </View>

                      <TouchableOpacity onPress={() => showPrompt('bid')} style={styles.placeBidBtn} activeOpacity={0.85}>
                        <Icon name="gavel" size={13} color="#fff" />
                        <Text style={styles.placeBidBtnText}>
                          {item.saleType === 'Auction' ? 'Place a Bid' : 'Submit Proposal'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {listingsOffset > 10 && (
                <TouchableOpacity onPress={() => scrollListings('left')} style={styles.floatingNavBtnLeft}>
                  <Icon name="chevronL" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              {listingsOffset < (filteredItems.length * 225 - SCREEN_WIDTH) && (
                <TouchableOpacity onPress={() => scrollListings('right')} style={styles.floatingNavBtnRight}>
                  <Icon name="chevronR" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* CAROUSEL 2: ACTIVE BUYER REQUESTS */}
        <View style={styles.sectionContainerAmber}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleBlock}>
              <Text style={styles.sectionTitleAmber}>Active Buyer Requests ({filteredRequests.length})</Text>
              <View style={styles.assuredBadgeAmber}>
                <Icon name="checkCircle" size={12} color={T.amber} />
                <Text style={styles.assuredTextAmber}>Verified Buying Desks</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => showPrompt('browseRequests')} style={styles.arrowCircleBtnAmber}>
              <Icon name="chevronR" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          {filteredRequests.length === 0 ? (
            <SectionPlaceholder
              loading={loadingRequests}
              title="No Active Requests Found"
              sub="Verified buyers post bulk purchase requests daily. Register as a seller to submit direct proposals."
              emoji="📦"
              themeColor={T.amber}
              onRefresh={fetchRequests}
            />
          ) : (
            <View style={{ position: 'relative' }}>
              <ScrollView
                ref={requestsScrollRef}
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hScrollBox}
                onScroll={(e) => setRequestsOffset(e.nativeEvent.contentOffset.x)}
                scrollEventThrottle={16}
              >
                {filteredRequests.map(req => (
                  <TouchableOpacity
                    key={req.id}
                    onPress={() => showPrompt('detail')}
                    style={styles.itemCardCarousel}
                    activeOpacity={0.88}
                  >
                    <View style={[styles.itemAccent, { backgroundColor: T.amber }]} />
                    <View style={[styles.itemImgBox, { backgroundColor: `${T.amber}10` }]}>
                      {req.images && req.images.length > 0 ? (
                        <Image
                          source={{ uri: req.images.find((img: any) => img.isCover)?.imageUrl || req.images[0].imageUrl }}
                          style={styles.itemCardImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.itemEmoji}>{productIcon(req.subcategory || req.category)}</Text>
                      )}
                      <View style={[styles.verifiedBadge, { backgroundColor: T.amber }]}>
                        <Text style={styles.verifiedText}>Buying Demand</Text>
                      </View>
                    </View>

                    <View style={styles.itemBody}>
                      <Text style={styles.itemName} numberOfLines={1}>{req.subcategory || req.category}</Text>
                      <Text style={styles.itemSub} numberOfLines={1}>
                        Target Qty: {req.targetQuantity} {req.uom}
                      </Text>

                      <View style={styles.itemLocRow}>
                        <Icon name="mapPin" size={11} color={T.text3} />
                        <Text style={styles.itemLocText} numberOfLines={1}>
                          {req.destinationRegion || req.branchName || 'Kakinada Hub'}
                        </Text>
                      </View>

                      <View style={styles.itemPriceRow}>
                        <Text style={[styles.itemPrice, { color: T.amber }]}>
                          {req.targetPricePerUnit ? `₹${req.targetPricePerUnit}/${req.uom}` : 'Open Offer'}
                        </Text>
                        <CountdownTimer seedSeconds={getSeedSeconds(req.id)} compact />
                      </View>

                      <TouchableOpacity onPress={() => showPrompt('proposal')} style={[styles.placeBidBtn, { backgroundColor: T.navy }]} activeOpacity={0.85}>
                        <Icon name="fileText" size={13} color="#fff" />
                        <Text style={styles.placeBidBtnText}>Submit Proposal</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {requestsOffset > 10 && (
                <TouchableOpacity onPress={() => scrollRequests('left')} style={styles.floatingNavBtnLeft}>
                  <Icon name="chevronL" size={14} color="#fff" />
                </TouchableOpacity>
              )}
              {requestsOffset < (filteredRequests.length * 225 - SCREEN_WIDTH) && (
                <TouchableOpacity onPress={() => scrollRequests('right')} style={styles.floatingNavBtnRight}>
                  <Icon name="chevronR" size={14} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Section 3: Platform Guarantee Pillars */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>SarwaMart Guaranteed Trade Protection</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustCard}>
              <View style={styles.trustIconCircle}>
                <Text style={{ fontSize: 22 }}>🛡️</Text>
              </View>
              <Text style={styles.trustCardTitle}>Escrow Vault</Text>
              <Text style={styles.trustCardSub}>Payment held safely until quality sign-off</Text>
            </View>

            <View style={styles.trustCard}>
              <View style={styles.trustIconCircle}>
                <Text style={{ fontSize: 22 }}>🧪</Text>
              </View>
              <Text style={styles.trustCardTitle}>Lab Quality Testing</Text>
              <Text style={styles.trustCardSub}>Count & moisture verified at branch</Text>
            </View>

            <View style={styles.trustCard}>
              <View style={styles.trustIconCircle}>
                <Text style={{ fontSize: 22 }}>🚚</Text>
              </View>
              <Text style={styles.trustCardTitle}>Hub Logistics</Text>
              <Text style={styles.trustCardSub}>5 coastal branch dispatch desks</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Floating Bottom Sticky Bar */}
      <View style={styles.footer}>
        <Button
          label="Join SarwaMart Trade Network →"
          onPress={handleRegister}
          fullWidth
          style={styles.joinBtn}
        />
      </View>

      {/* Register Action Prompt Modal Sheet */}
      <RegisterPrompt
        open={promptOpen}
        onClose={() => setPromptOpen(false)}
        onRegister={handleRegister}
        onLogin={handleLoginClick}
        action={promptAction}
      />

      {/* Login Bottom Sheet Drawer Modal */}
      <LoginBottomSheet
        open={loginSheetOpen}
        onClose={() => setLoginSheetOpen(false)}
        onPerformPINLogin={handlePINLoginSubmit}
        onRegister={handleRegister}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },

  topNavyShell: { paddingBottom: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: 10 },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: T.hairline },
  headerRightGroup: { flexDirection: 'row', gap: 8 },
  loginChip: { height: 34, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  loginChipText: { color: T.navy, fontSize: 12, fontWeight: '800' },
  registerChip: { height: 34, paddingHorizontal: 14, borderRadius: 10, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  registerChipText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  tickerBarDark: { backgroundColor: 'rgba(255,255,255,0.08)', paddingVertical: 6, marginHorizontal: 16, borderRadius: 10, marginTop: 4 },
  tickerContent: { paddingHorizontal: 12, alignItems: 'center', gap: 12 },
  tickerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  greenPulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: T.green },
  tickerTextDark: { fontSize: 11, fontWeight: '700', color: '#E2E8F0' },
  tickerSepDark: { color: 'rgba(255,255,255,0.2)' },

  scrollContent: { paddingBottom: 20 },
  bannerCarouselWrapper: { marginTop: 12, paddingHorizontal: 16 },

  floatingSearchFilterCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 12, height: 42, borderWidth: 1, borderColor: '#CBD5E1' },
  searchInput: { flex: 1, fontSize: 13, color: T.text1, paddingVertical: 0 },
  clearText: { color: T.text3, fontSize: 14, paddingHorizontal: 4 },

  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterTitleText: { fontSize: 11, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.5 },
  resetFilterText: { fontSize: 11, fontWeight: '800', color: T.navy },

  categoryRow: { gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  catPillActive: { backgroundColor: T.navy, borderColor: T.navy },
  catEmoji: { fontSize: 14 },
  catName: { fontSize: 12, fontWeight: '700', color: T.text2 },
  catNameActive: { color: '#FFFFFF', fontWeight: '900' },

  subcategoryStrip: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, gap: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  subStripTitle: { fontSize: 10, fontWeight: '800', color: T.text3 },
  subStripRow: { gap: 6 },
  subChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  subChipActive: { backgroundColor: T.amber, borderColor: T.amber },
  subChipText: { fontSize: 11, fontWeight: '700', color: T.text2 },
  subChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  sectionContainerNavy: { marginHorizontal: 16, marginTop: 16, marginBottom: 16, backgroundColor: '#FFFFFF', borderRadius: 22, paddingTop: 16, paddingBottom: 16, borderWidth: 1.5, borderColor: '#CBD5E1', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  sectionContainerAmber: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFBEB', borderRadius: 22, paddingTop: 16, paddingBottom: 16, borderWidth: 1.5, borderColor: '#FDE68A', shadowColor: '#D97706', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitleBlock: { gap: 4 },
  sectionTitleNavy: { fontSize: 18, fontWeight: '900', color: T.navy },
  sectionTitleAmber: { fontSize: 18, fontWeight: '900', color: T.amber },
  assuredBadgeNavy: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assuredBadgeAmber: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  assuredTextNavy: { fontSize: 11, fontWeight: '700', color: T.navy },
  assuredTextAmber: { fontSize: 11, fontWeight: '700', color: T.amber },
  arrowCircleBtnNavy: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  arrowCircleBtnAmber: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },

  hScrollBox: { paddingLeft: 16, paddingRight: 16, gap: 12 },

  itemCardCarousel: { width: 215, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  itemAccent: { height: 3, backgroundColor: T.navy },
  itemImgBox: { height: 95, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  itemCardImg: { width: '100%', height: '100%' },
  itemEmoji: { fontSize: 48 },
  verifiedBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: T.green, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  verifiedText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  itemBody: { padding: 12, gap: 5 },
  itemName: { fontSize: 14, fontWeight: '900', color: T.text1 },
  itemSub: { fontSize: 11, color: T.text2, fontWeight: '600' },
  itemLocRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemLocText: { fontSize: 11, color: T.text3, flexShrink: 1 },
  itemPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '900', color: T.navy },
  itemTagsRow: { flexDirection: 'row', gap: 5, flexWrap: 'wrap' },
  itemTag: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5, backgroundColor: `${T.navy}08`, borderWidth: 1, borderColor: `${T.navy}20` },
  itemTagText: { fontSize: 9, fontWeight: '700', color: T.navy },
  placeBidBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 36, borderRadius: 10, backgroundColor: T.amber, marginTop: 4 },
  placeBidBtnText: { color: '#fff', fontSize: 12, fontWeight: '800' },

  floatingNavBtnLeft: { position: 'absolute', left: 4, top: '40%', width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  floatingNavBtnRight: { position: 'absolute', right: 4, top: '40%', width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center', zIndex: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },

  placeholderCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#CBD5E1', padding: 24, alignItems: 'center', justifyContent: 'center' },
  loaderContainer: { paddingVertical: 12, alignItems: 'center', gap: 10 },
  loaderText: { fontSize: 12, color: T.text2 },
  emptyContainer: { alignItems: 'center', gap: 10 },
  emptyIconCircle: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyIconText: { fontSize: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.text1 },
  emptySub: { fontSize: 12, color: T.text2, textAlign: 'center', lineHeight: 18 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10, borderWidth: 1, marginTop: 4 },
  refreshBtnText: { fontSize: 12, fontWeight: '700' },

  trustSection: { paddingHorizontal: 16, gap: 12 },
  trustTitle: { fontSize: 15, fontWeight: '900', color: T.text1 },
  trustGrid: { flexDirection: 'row', gap: 10 },
  trustCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, gap: 6, borderWidth: 1.5, borderColor: '#CBD5E1', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  trustIconCircle: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  trustCardTitle: { fontSize: 12, fontWeight: '800', color: T.text1 },
  trustCardSub: { fontSize: 10, color: T.text3, lineHeight: 14 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', padding: 16, borderTopWidth: 1, borderTopColor: '#CBD5E1', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 5 },
  joinBtn: { height: 52, borderRadius: 14, backgroundColor: T.navy },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, alignItems: 'center' },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: T.hairline },
  promptIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  promptTitle: { fontSize: 20, fontWeight: '900', color: T.text1, textAlign: 'center' },
  promptSub: { fontSize: 13, color: T.text2, textAlign: 'center', lineHeight: 19 },
  benefits: { width: '100%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, gap: 6 },
  benefit: { fontSize: 12, color: T.text2, fontWeight: '600' },
  registerBtn: { height: 48, borderRadius: 12, backgroundColor: T.amber },
  loginBtn: { height: 48, borderRadius: 12 },
  browseBtn: { paddingVertical: 4 },
  browseBtnText: { color: T.text3, fontSize: 13, fontWeight: '600' },

  // PIN Login Bottom Sheet Styles with Field Validation & Dynamic Enable Button
  loginSheetContainer: { backgroundColor: T.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, gap: 14, ...T.shadowSoft },
  loginSheetHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  loginIconCircle: { width: 48, height: 48, borderRadius: 16, backgroundColor: `${T.navy}10`, alignItems: 'center', justifyContent: 'center' },
  loginSheetTitle: { fontSize: 18, fontWeight: '900', color: T.text1 },
  loginSheetSub: { fontSize: 12, color: T.text2, lineHeight: 17 },
  closeCircleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },

  errorBannerBox: { backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FCA5A5' },
  errorBannerText: { color: '#DC2626', fontSize: 12, fontWeight: '700' },

  inputFieldGroup: { gap: 6 },
  labelWithCheckRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fieldLabelText: { fontSize: 11, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  checkText: { fontSize: 11, fontWeight: '800', color: T.green },

  phoneInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  inputBorderValid: { borderRadius: 12, borderColor: T.green },
  flagPill: { height: 46, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  flagText: { fontSize: 13, fontWeight: '800', color: T.text1 },
  loginPhoneInput: { flex: 1, height: 46, borderRadius: 12, borderWidth: 1.5, borderColor: '#CBD5E1', paddingHorizontal: 14, fontSize: 15, fontWeight: '700', color: T.text1, backgroundColor: '#FFFFFF' },

  pinLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pinCountText: { fontSize: 11, fontWeight: '800', color: T.navy },
  pinBoxesRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6, marginVertical: 4 },
  pinSquareBox: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '800',
    color: T.navy,
  },
  pinSquareBoxFilled: {
    borderColor: T.navy,
    backgroundColor: `${T.navy}08`,
  },

  statusGuidanceBox: { backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  statusGuidanceBoxReady: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  statusGuidanceText: { fontSize: 11, fontWeight: '700', color: T.text3 },
  statusGuidanceTextReady: { color: T.green },

  loginActionBtn: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  loginActionBtnDisabled: { backgroundColor: '#CBD5E1', opacity: 0.65 },
  loginActionBtnEnabled: { backgroundColor: T.navy, opacity: 1, shadowColor: T.navy, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  loginActionBtnText: { fontSize: 15, fontWeight: '800', color: '#64748B' },
  loginActionBtnTextEnabled: { color: '#FFFFFF' },

  createAccountLinkBtn: { alignItems: 'center', paddingVertical: 6 },
  createAccountLinkText: { fontSize: 13, color: T.text2 },
});
