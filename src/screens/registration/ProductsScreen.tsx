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

type Props = NativeStackScreenProps<RootStackParams, 'Products'>;

interface SubcategoryItem {
  id: string;
  name: string;
}

interface CategoryItem {
  id: string;
  name: string;
  emoji?: string;
  desc?: string;
  colorBg?: string;
  subcategories: SubcategoryItem[];
}

const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    id: '474fedbf-8dce-48f2-8737-1165e2809986',
    name: 'Fish',
    emoji: '🐟',
    desc: 'Rohu, Catla, Pomfret, Seer, Tilapia, Salmon',
    colorBg: '#E0F2FE',
    subcategories: [
      { id: '79109e87-69eb-43bd-84c6-672c4986d232', name: 'Rohu' },
      { id: 'f72a4607-0a0a-46cb-ad6f-9b8923a84e8d', name: 'Catla' },
      { id: 'c8b003b9-c3d2-49d6-9a57-70393ae9789d', name: 'Pomfret' },
      { id: '7ad820d8-7d9e-48f8-8fd2-7b79b473055d', name: 'Seer Fish' },
      { id: '2ce3dcb5-21e0-4e71-b66b-b1ec5e05f5f4', name: 'Tilapia' },
    ],
  },
  {
    id: '68fe65c8-4215-4bf9-a95c-5c78f6785ef8',
    name: 'Prawn / Shrimp',
    emoji: '🦐',
    desc: 'Vannamei, Tiger Prawn, Black Tiger, Freshwater',
    colorBg: '#FFEDD5',
    subcategories: [
      { id: '66d8ec32-6e9e-4e35-8184-6a8eb3b95193', name: 'Vannamei' },
      { id: '336137f2-588b-44df-9bc9-0a808e5fc4d2', name: 'Tiger Prawn' },
      { id: 'e554b9ee-abdc-4cbc-860c-39517d586578', name: 'Black Tiger' },
      { id: '892e925b-b653-4cf1-80a7-21b428aa7ff4', name: 'Freshwater Scampi' },
    ],
  },
  {
    id: 'a6a96fad-c31d-4930-8445-58f11d060e9e',
    name: 'Crab & Lobster',
    emoji: '🦀',
    desc: 'Mud Crab, Blue Swimmer, Rock Lobster',
    colorBg: '#FCE7F3',
    subcategories: [
      { id: 'af360256-b1ef-4be3-b3bd-4ef8c25b30f0', name: 'Mud Crab' },
      { id: '9ba2cbc5-8f92-43ac-a191-fdca79b7ba39', name: 'Blue Swimmer Crab' },
      { id: 'c069c6b3-4bd6-4917-ad66-43283a7a60cd', name: 'Spiny Lobster' },
    ],
  },
  {
    id: '8c4f6d2f-ba7f-4c10-a8bb-33853a7e64ee',
    name: 'Squid & Shellfish',
    emoji: '🦑',
    desc: 'Indian Squid, Cuttlefish, Oyster, Clam',
    colorBg: '#F3E8FF',
    subcategories: [
      { id: 'becc1524-e312-4c68-a203-42eb1c37062a', name: 'Indian Squid' },
      { id: '6e457daf-f951-4e39-bbae-9c3e52445ed6', name: 'Cuttlefish' },
    ],
  },
];

const getEmojiForCategory = (name: string): string => {
  const n = name.toLowerCase();
  if (n.includes('fish')) return '🐟';
  if (n.includes('prawn') || n.includes('shrimp')) return '🦐';
  if (n.includes('crab') || n.includes('lobster')) return '🦀';
  if (n.includes('squid') || n.includes('shell')) return '🦑';
  return '🌊';
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

export const ProductsScreen: React.FC<Props> = ({ navigation, route }) => {
  const [categories, setCategories] = useState<CategoryItem[]>(DEFAULT_CATEGORIES);
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [selectedSubcatIds, setSelectedSubcatIds] = useState<string[]>([]);

  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { token: storeToken, apiBaseUrl } = useAppStore();
  const tokenFromParams = route.params?.token;

  // Fetch Categories & Subcategories API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      const targetUrl = getApiUrl('/api/v1/categories', apiBaseUrl);
      console.log(`Fetching categories from: ${targetUrl}`);

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
            const mapped: CategoryItem[] = items.map((c: any) => {
              const rawSubs = c.subcategories || c.subs || c.children || [];
              const subcategories: SubcategoryItem[] = rawSubs.map((s: any) => ({
                id: typeof s === 'string' ? s : (s.id || s.subcategoryId || s.name),
                name: typeof s === 'string' ? s : (s.name || s.subcategoryName || s.title || ''),
              }));

              return {
                id: c.id || c.categoryId,
                name: c.name || c.categoryName || 'Category',
                emoji: c.emoji || getEmojiForCategory(c.name || ''),
                desc: c.description || c.desc || subcategories.map(s => s.name).join(', '),
                subcategories,
              };
            });

            setCategories(mapped);
          }
        }
      } catch (err) {
        console.warn('Error fetching categories API:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, [apiBaseUrl]);

  const toggleCategory = (cat: CategoryItem) => {
    const isCurrentlySelected = selectedCatIds.includes(cat.id);
    if (isCurrentlySelected) {
      // Remove category & its subcategories
      setSelectedCatIds(prev => prev.filter(id => id !== cat.id));
      const subIdsToRemove = cat.subcategories.map(s => s.id);
      setSelectedSubcatIds(prev => prev.filter(id => !subIdsToRemove.includes(id)));
    } else {
      // Select category & all its subcategories by default
      setSelectedCatIds(prev => [...prev, cat.id]);
      const subIdsToAdd = cat.subcategories.map(s => s.id);
      setSelectedSubcatIds(prev => Array.from(new Set([...prev, ...subIdsToAdd])));
    }
  };

  const toggleSubcategory = (subId: string, catId: string) => {
    // If selecting a subcategory, ensure its parent category is selected
    if (!selectedCatIds.includes(catId)) {
      setSelectedCatIds(prev => [...prev, catId]);
    }

    setSelectedSubcatIds(prev =>
      prev.includes(subId) ? prev.filter(id => id !== subId) : [...prev, subId]
    );
  };

  const toggleAllSubcategoriesForCategory = (cat: CategoryItem) => {
    const allSubIds = cat.subcategories.map(s => s.id);
    const selectedInCat = allSubIds.filter(id => selectedSubcatIds.includes(id));

    if (selectedInCat.length === allSubIds.length) {
      // Deselect all subcategories for this category
      setSelectedSubcatIds(prev => prev.filter(id => !allSubIds.includes(id)));
    } else {
      // Select all subcategories for this category
      if (!selectedCatIds.includes(cat.id)) {
        setSelectedCatIds(prev => [...prev, cat.id]);
      }
      setSelectedSubcatIds(prev => Array.from(new Set([...prev, ...allSubIds])));
    }
  };

  const selectAllGlobal = () => {
    const allCatIds = categories.map(c => c.id);
    const allSubIds = categories.flatMap(c => c.subcategories.map(s => s.id));
    setSelectedCatIds(allCatIds);
    setSelectedSubcatIds(allSubIds);
  };

  const clearAllGlobal = () => {
    setSelectedCatIds([]);
    setSelectedSubcatIds([]);
  };

  const handleContinue = async () => {
    if (selectedCatIds.length === 0) return;

    setLoading(true);
    setError('');

    const targetUrl = getApiUrl('/api/v1/registration/products', apiBaseUrl);
    const activeToken = tokenFromParams || storeToken || (await AsyncStorage.getItem('sm_auth_token')) || undefined;

    const payload = {
      categoryIds: selectedCatIds,
      CategoryIds: selectedCatIds,
      subcategoryIds: selectedSubcatIds,
      SubcategoryIds: selectedSubcatIds,
    };

    console.log(`Submitting registration products to ${targetUrl} with token:`, activeToken, payload);

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
        navigation.navigate('UnderReview');
      } else {
        console.warn('Products registration API status:', response.status);
        navigation.navigate('UnderReview');
      }
    } catch (err) {
      console.warn('Error calling registration products PUT API:', err);
      setLoading(false);
      navigation.navigate('UnderReview');
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
            <Text style={styles.stepPillText}>Step 5 of 5</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          {/* Header Summary Row */}
          <View style={styles.titleHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Products & Specialities</Text>
              <Text style={styles.sub}>Select your trade categories and target species to list on SarwaMart</Text>
            </View>
          </View>

          {/* Quick Stats & Global Controls Bar */}
          <View style={styles.summaryBar}>
            <View style={styles.summaryPill}>
              <Text style={styles.summaryPillText}>
                {selectedCatIds.length} {selectedCatIds.length === 1 ? 'Category' : 'Categories'} • {selectedSubcatIds.length} Species Selected
              </Text>
            </View>
            <View style={styles.globalActions}>
              <TouchableOpacity onPress={selectAllGlobal} hitSlop={6}>
                <Text style={styles.actionLinkText}>Select All</Text>
              </TouchableOpacity>
              <Text style={{ color: T.hairline }}>|</Text>
              <TouchableOpacity onPress={clearAllGlobal} hitSlop={6}>
                <Text style={styles.actionLinkText}>Clear</Text>
              </TouchableOpacity>
            </View>
          </View>

          {selectedCatIds.length === 0 && (
            <View style={styles.emptyHintCard}>
              <Text style={styles.emptyHintEmoji}>💡</Text>
              <Text style={styles.emptyHintText}>
                Tap any product card below to select categories & species you trade.
              </Text>
            </View>
          )}

          {loadingCategories ? (
            <ActivityIndicator size="large" color={T.navy} style={{ marginVertical: 30 }} />
          ) : (
            <View style={styles.categoryCardsList}>
              {categories.map((cat, idx) => {
                const isCatSelected = selectedCatIds.includes(cat.id);
                const catSubIds = cat.subcategories.map(s => s.id);
                const selectedSubCount = catSubIds.filter(id => selectedSubcatIds.includes(id)).length;
                const allSelected = selectedSubCount === catSubIds.length && catSubIds.length > 0;

                return (
                  <View
                    key={cat.id}
                    style={[styles.categoryCard, isCatSelected && styles.categoryCardSelected]}
                  >
                    {/* Category Header Row */}
                    <TouchableOpacity
                      onPress={() => toggleCategory(cat)}
                      style={styles.categoryCardHeader}
                      activeOpacity={0.85}
                    >
                      <View style={styles.categoryLeft}>
                        <View style={[styles.avatarCircle, { backgroundColor: cat.colorBg || '#E0F2FE' }]}>
                          <Text style={styles.avatarEmoji}>{cat.emoji || '🐟'}</Text>
                        </View>
                        <View style={styles.categoryInfo}>
                          <View style={styles.catTitleRow}>
                            <Text style={[styles.categoryTitle, isCatSelected && styles.categoryTitleSelected]}>
                              {cat.name}
                            </Text>
                            {selectedSubCount > 0 && (
                              <View style={styles.subCountBadge}>
                                <Text style={styles.subCountBadgeText}>
                                  {selectedSubCount} {selectedSubCount === 1 ? 'species' : 'species'}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.categoryDesc}>{cat.desc}</Text>
                        </View>
                      </View>

                      {/* Main Category Checkbox Circle */}
                      <View style={[styles.checkCircle, isCatSelected && styles.checkCircleSelected]}>
                        {isCatSelected && <Text style={styles.checkMark}>✓</Text>}
                      </View>
                    </TouchableOpacity>

                    {/* Sub-Products / Species Chips */}
                    {cat.subcategories.length > 0 && (
                      <View style={styles.subProductsSection}>
                        <View style={styles.subProductsHeader}>
                          <Text style={styles.subProductsLabel}>Sub-Products & Varieties:</Text>
                          <TouchableOpacity
                            onPress={() => toggleAllSubcategoriesForCategory(cat)}
                            hitSlop={6}
                          >
                            <Text style={styles.toggleAllCategoryText}>
                              {allSelected ? 'Deselect All' : 'Select All Species'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.speciesGrid}>
                          {cat.subcategories.map(sub => {
                            const isSubSelected = selectedSubcatIds.includes(sub.id);
                            return (
                              <TouchableOpacity
                                key={sub.id}
                                onPress={() => toggleSubcategory(sub.id, cat.id)}
                                style={[styles.speciesChip, isSubSelected && styles.speciesChipSelected]}
                                activeOpacity={0.8}
                              >
                                <View style={[styles.miniCheck, isSubSelected && styles.miniCheckSelected]}>
                                  {isSubSelected && <Text style={styles.miniCheckMark}>✓</Text>}
                                </View>
                                <Text style={[styles.speciesText, isSubSelected && styles.speciesTextSelected]}>
                                  {sub.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Fixed Action Footer */}
      <View style={styles.footer}>
        <Button
          label={loading ? "Submitting Application..." : "Submit Application for Review →"}
          onPress={selectedCatIds.length > 0 && !loading ? handleContinue : undefined}
          disabled={selectedCatIds.length === 0 || loading}
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

  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: T.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: T.cardBorder,
    ...T.shadowSoft,
  },
  summaryPill: { backgroundColor: `${T.navy}12`, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  summaryPillText: { fontSize: 11, fontWeight: '800', color: T.navy },
  globalActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionLinkText: { fontSize: 12, fontWeight: '700', color: T.navy },

  emptyHintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  emptyHintEmoji: { fontSize: 18 },
  emptyHintText: { fontSize: 12, color: '#1E40AF', fontWeight: '600', flex: 1 },

  categoryCardsList: { gap: 16, marginTop: 4 },
  categoryCard: {
    backgroundColor: T.card,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: T.cardBorder,
    padding: 16,
    gap: 14,
    ...T.shadowSoft,
  },
  categoryCardSelected: {
    borderColor: T.navy,
    backgroundColor: '#FFFFFF',
  },

  categoryCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatarCircle: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarEmoji: { fontSize: 24 },
  categoryInfo: { flex: 1, gap: 2 },
  catTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  categoryTitle: { fontSize: 17, fontWeight: '900', color: T.text1 },
  categoryTitleSelected: { color: T.navy },
  categoryDesc: { fontSize: 11, color: T.text3, lineHeight: 16 },

  subCountBadge: { backgroundColor: T.green, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  subCountBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  checkCircleSelected: { backgroundColor: T.navy, borderColor: T.navy },
  checkMark: { color: '#fff', fontSize: 12, fontWeight: '900' },

  subProductsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: T.hairline,
  },
  subProductsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subProductsLabel: { fontSize: 11, fontWeight: '800', color: T.text3, textTransform: 'uppercase', letterSpacing: 0.4 },
  toggleAllCategoryText: { fontSize: 11, fontWeight: '700', color: T.navy },

  speciesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  speciesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: T.hairline,
  },
  speciesChipSelected: {
    backgroundColor: `${T.green}14`,
    borderColor: T.green,
  },
  miniCheck: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: T.hairline, alignItems: 'center', justifyContent: 'center' },
  miniCheckSelected: { backgroundColor: T.green, borderColor: T.green },
  miniCheckMark: { color: '#fff', fontSize: 9, fontWeight: '900' },
  speciesText: { fontSize: 13, fontWeight: '600', color: T.text2 },
  speciesTextSelected: { color: T.green, fontWeight: '800' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: T.card, padding: 16, borderTopWidth: 1, borderTopColor: T.hairline, gap: 10, alignItems: 'center', ...T.shadowSoft },
  submitBtn: { height: 52, borderRadius: 14, backgroundColor: T.navy },
  homeLinkBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  homeLinkText: { color: T.navy, fontSize: 13, fontWeight: '700' },
});
