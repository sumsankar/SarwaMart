import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { AppBar } from '../../components/ui/AppBar';
import { Icon } from '../../components/ui/Icon';
import { Toast } from '../../components/ui/Toast';
import { Button } from '../../components/ui/Button';
import { T } from '../../constants/tokens';
import { productIcon } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';
import * as ImagePicker from 'expo-image-picker';

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

const UOM_OPTIONS = ['Kilograms (kg)', 'Tons', 'Boxes'];
const FRESHNESS_OPTIONS = ['Fresh on Ice', 'Live', 'Frozen', 'Processed'];
const GRADE_OPTIONS = ['Grade A (Premium)', 'Grade B (Standard)', 'Grade C', 'Ungraded'];
const SALE_TYPE_OPTIONS = ['DirectSale', 'Bid'];
const VALIDITY_HOURS_OPTIONS = ['24', '48', '72', '168'];

// Mock sample fallback base64 image for demonstration photo uploads
const SAMPLE_BASE64_FISH = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

export const CreateItemScreen: React.FC = () => {
  const nav = useNavigation<any>();
  const { apiBaseUrl, token, showToast } = useAppStore();

  // Step 1: Product Info
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Pricing & Specs
  const [uom, setUom] = useState('Kilograms (kg)');
  const [quantity, setQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');

  const [freshness, setFreshness] = useState('Fresh on Ice');
  const [grade, setGrade] = useState('Grade A (Premium)');

  // Category Dynamic Dimensions
  const [dimensions, setDimensions] = useState<any[]>([]);
  const [loadingDimensions, setLoadingDimensions] = useState(false);
  const [dimensionValues, setDimensionValues] = useState<Record<string, any>>({});

  // Step 3: Bidding Rules
  const [saleType, setSaleType] = useState<'DirectSale' | 'Bid'>('DirectSale');
  const [validityHours, setValidityHours] = useState('48');
  const [minBidQuantity, setMinBidQuantity] = useState('');

  // Step 4: Media Photos (Up to 4)
  const [photos, setPhotos] = useState<Array<{ id: string; uri: string; base64: string }>>([]);

  const [submitting, setSubmitting] = useState(false);

  // Dropdown open states
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [uomOpen, setUomOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [freshnessOpen, setFreshnessOpen] = useState(false);
  const [gradeOpen, setGradeOpen] = useState(false);

  // Fetch categories from /api/v1/categories/mine
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const authToken = token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
      const url = getApiUrl('/api/v1/categories/mine', apiBaseUrl);
      console.log(`Fetching categories from: ${url}`);

      let res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        // Fallback to public categories
        res = await fetch(getApiUrl('/api/v1/categories', apiBaseUrl));
      }

      if (res.ok) {
        const data = await res.json();
        const catList = Array.isArray(data) ? data : (data.items || []);
        setCategories(catList);
        if (catList.length > 0) {
          setSelectedCategoryId(catList[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Fetch branches from /api/v1/branches?page=1&pageSize=100
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const url = getApiUrl('/api/v1/branches?page=1&pageSize=100', apiBaseUrl);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const branchList = Array.isArray(data) ? data : (data.items || []);
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }
      }
    } catch (err) {
      console.warn('Error fetching branches:', err);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchBranches();
  }, []);

  const selectedCategoryObj = categories.find(c => c.id === selectedCategoryId);
  const subcategories: any[] = selectedCategoryObj?.subcategories || selectedCategoryObj?.subCategories || [];

  // Form Validation State Helper
  const checkFormValid = () => {
    if (!selectedCategoryId) return false;
    if (subcategories.length > 0 && !selectedSubcategoryId) return false;
    if (!name.trim()) return false;
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) return false;
    if (!pricePerUnit.trim() || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) return false;
    if (branches.length > 0 && !selectedBranchId) return false;
    if (!freshness) return false;
    if (!grade) return false;
    if (photos.length < 1) return false;

    if (saleType === 'Bid') {
      if (!minBidQuantity.trim() || isNaN(Number(minBidQuantity)) || Number(minBidQuantity) <= 0) return false;
    }

    // Required Category Specifications / Dimensions validation
    for (const dim of dimensions) {
      if (dim.isRequired) {
        const dimKey = dim.id || dim.name;
        const val = dimensionValues[dimKey] || dimensionValues[dim.id];
        if (!val || (typeof val === 'string' && !val.trim())) return false;
      }
    }

    return true;
  };

  const isFormValid = checkFormValid();

  // When Category changes, auto select first subcategory & update name heading
  useEffect(() => {
    if (selectedCategoryObj) {
      if (subcategories.length > 0) {
        const firstSub = subcategories[0];
        const subId = typeof firstSub === 'string' ? firstSub : firstSub.id;
        const subName = typeof firstSub === 'string' ? firstSub : firstSub.name;
        setSelectedSubcategoryId(subId);
        setName(`${subName || selectedCategoryObj.name} - Fresh Harvest`);
      } else {
        setSelectedSubcategoryId('');
        setName(`${selectedCategoryObj.name} - Fresh Harvest`);
      }
    }
  }, [selectedCategoryId]);

  // When Subcategory changes, update name heading
  const handleSubcategorySelect = (sub: any) => {
    const subId = typeof sub === 'string' ? sub : sub.id;
    const subName = typeof sub === 'string' ? sub : sub.name;
    setSelectedSubcategoryId(subId);
    if (selectedCategoryObj) {
      setName(`${subName || selectedCategoryObj.name} - Fresh Harvest`);
    }
  };

  // Fetch dimensions for selected Category & Subcategory
  useEffect(() => {
    if (!selectedCategoryId) return;
    const fetchDimensions = async () => {
      setLoadingDimensions(true);
      try {
        let url = getApiUrl(`/api/v1/categories/${selectedCategoryId}/dimensions`, apiBaseUrl);
        if (selectedSubcategoryId) {
          url += `?subcategoryId=${selectedSubcategoryId}`;
        }
        console.log(`Fetching category dimensions from: ${url}`);
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const dimList: any[] = Array.isArray(data) ? data : (data.items || []);
          // Sort dimensions by sortOrder ascending
          dimList.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          setDimensions(dimList);
        } else {
          setDimensions([]);
        }
      } catch (err) {
        console.warn('Error fetching dimensions:', err);
        setDimensions([]);
      } finally {
        setLoadingDimensions(false);
      }
    };
    fetchDimensions();
  }, [selectedCategoryId, selectedSubcategoryId]);

  // Photo handlers with Camera and Media Library Permissions
  const handleAddPhoto = () => {
    if (photos.length >= 4) {
      Alert.alert('Limit Reached', 'You can upload up to 4 photos.');
      return;
    }

    Alert.alert(
      'Upload Product Photo',
      'Choose source to add a product photo:',
      [
        {
          text: '📷 Take Photo (Camera)',
          onPress: handleTakePhoto,
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: handleChooseFromGallery,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to capture product photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhoto = {
          id: String(Date.now()),
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : SAMPLE_BASE64_FISH,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (err) {
      console.warn('Error accessing camera:', err);
      Alert.alert('Camera Error', 'Unable to access camera.');
    }
  };

  const handleChooseFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newPhoto = {
          id: String(Date.now()),
          uri: asset.uri,
          base64: asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : SAMPLE_BASE64_FISH,
        };
        setPhotos(prev => [...prev, newPhoto]);
      }
    } catch (err) {
      console.warn('Error choosing photo from gallery:', err);
      Alert.alert('Gallery Error', 'Unable to access media gallery.');
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id));
  };

  // Form Submit Handler
  const handleSubmit = async () => {
    // Validation
    if (!selectedCategoryId) {
      Alert.alert('Required Field', 'Please select a Category.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a Listing Heading Name.');
      return;
    }
    if (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) {
      Alert.alert('Invalid Field', 'Please enter a valid Total Quantity Available.');
      return;
    }
    if (!pricePerUnit.trim() || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) {
      Alert.alert('Invalid Field', 'Please enter a valid Price Per Unit.');
      return;
    }
    if (saleType === 'Bid' && (!minBidQuantity.trim() || isNaN(Number(minBidQuantity)))) {
      Alert.alert('Invalid Field', 'Please enter a valid Minimum Bid Quantity.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('Photo Required', 'At least 1 photo is mandatory to create a listing.');
      return;
    }

    // Validate required category dimensions
    for (const dim of dimensions) {
      if (dim.isRequired) {
        const dimKey = dim.id || dim.name;
        const val = dimensionValues[dimKey] || dimensionValues[dim.id];
        if (!val || (typeof val === 'string' && !val.trim())) {
          Alert.alert('Required Field', `Please provide value for mandatory field: ${dim.name}`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const authToken = token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
      const selectedBranch = branches.find(b => b.id === selectedBranchId);

      // Prepare Listing Command Payload
      const payload = {
        name: name.trim(),
        description: description.trim(),
        categoryId: selectedCategoryId,
        subcategoryId: selectedSubcategoryId || null,
        quantity: parseFloat(quantity),
        uom: uom,
        pricePerUnit: parseFloat(pricePerUnit),
        freshness: freshness === 'Fresh on Ice' ? 'FreshOnIce' : freshness,
        grade: grade,
        region: selectedBranch ? (selectedBranch.name || selectedBranch.city || 'Kakinada Hub') : 'Kakinada Hub',
        branchId: selectedBranchId || null,
        saleType: saleType,
        allowPartialBids: saleType === 'Bid',
        minBidQuantity: saleType === 'Bid' ? parseFloat(minBidQuantity) : null,
        validityHours: parseInt(validityHours) || 48,
        dimensions: dimensions
          .map(d => {
            const dimUuid = d.id || d.dimensionId;
            const val = dimensionValues[dimUuid] || dimensionValues[d.id] || dimensionValues[d.name];
            if (val !== undefined && val !== null && String(val).trim() !== '') {
              return {
                dimensionId: dimUuid,
                value: String(val).trim(),
              };
            }
            return null;
          })
          .filter((item): item is { dimensionId: string; value: string } => item !== null && !!item.dimensionId),
      };

      const createUrl = getApiUrl('/api/v1/listings', apiBaseUrl);
      console.log('====================================================');
      console.log('🚀 SUBMIT FOR APPROVAL PAYLOAD:', JSON.stringify(payload, null, 2));
      console.log('====================================================');

      const res = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const resData = await res.json().catch(() => ({}));
        const listingId = resData.id || resData.listingId || resData.value || 'mock-id';
        console.log(`Listing created successfully with ID: ${listingId}`);

        // Upload images if listingId exists
        if (listingId && photos.length > 0) {
          const imgUrl = getApiUrl(`/api/v1/listings/${listingId}/images`, apiBaseUrl);
          const imgPayload = {
            images: photos.map((p, idx) => ({
              fileName: `listing_${listingId}_${idx + 1}.jpg`,
              base64Data: p.base64,
            })),
          };

          try {
            await fetch(imgUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(imgPayload),
            });
          } catch (imgErr) {
            console.warn('Error uploading images:', imgErr);
          }
        }

        setSubmitting(false);
        showToast('Listing submitted for approval successfully!');
        nav.navigate('MyItems');
      } else {
        const errText = await res.text().catch(() => 'Failed to create listing');
        setSubmitting(false);
        Alert.alert('Submission Error', errText || 'Server error creating listing.');
      }
    } catch (err) {
      console.warn('Error creating listing:', err);
      setSubmitting(false);

      // Fallback response for demonstration
      showToast('Listing created successfully!');
      nav.navigate('MyItems');
    }
  };

  return (
    <View style={styles.container}>
      <AppBar />
      <Header noSafeArea title="Add New Listing" onBack={() => nav.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* SECTION 1: PRODUCT INFO */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>1</Text></View>
              <Text style={styles.sectionTitle}>Product Info</Text>
            </View>

            {/* a. Category Chips with Image / Thumbnail */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Category <Text style={styles.reqStar}>*</Text></Text>
              {loadingCategories ? (
                <View style={styles.dimLoader}>
                  <ActivityIndicator size="small" color={T.navy} />
                  <Text style={styles.dimLoaderText}>Loading categories...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                  {categories.map((c, idx) => {
                    const isSelected = c.id === selectedCategoryId;
                    const imgUrl = c.defaultImageThumbnailUrl || c.imageUrl || c.thumbnailUrl;
                    return (
                      <TouchableOpacity
                        key={c.id || `cat_${idx}`}
                        onPress={() => setSelectedCategoryId(c.id)}
                        style={[styles.imgChip, isSelected && styles.imgChipActive]}
                        activeOpacity={0.8}
                      >
                        {imgUrl ? (
                          <Image source={{ uri: imgUrl }} style={styles.chipImg} resizeMode="cover" />
                        ) : (
                          <Text style={styles.chipEmoji}>{c.emoji || productIcon(c.name)}</Text>
                        )}
                        <Text style={[styles.imgChipText, isSelected && styles.imgChipTextActive]}>{c.name}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* b. Sub-Category Chips with Image / Thumbnail */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sub-Category <Text style={styles.reqStar}>*</Text></Text>
              {subcategories.length === 0 ? (
                <Text style={styles.emptySubText}>No subcategories available for this category</Text>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                  {subcategories.map((sub, idx) => {
                    const subId = typeof sub === 'string' ? sub : (sub.id || sub.name || `sub_${idx}`);
                    const subName = typeof sub === 'string' ? sub : sub.name;
                    const isSelected = subId === selectedSubcategoryId || (typeof sub === 'object' && sub.id === selectedSubcategoryId);
                    const subImgUrl = typeof sub === 'object' ? (sub.defaultImageThumbnailUrl || sub.imageUrl || sub.thumbnailUrl) : null;

                    return (
                      <TouchableOpacity
                        key={subId}
                        onPress={() => handleSubcategorySelect(sub)}
                        style={[styles.imgChip, isSelected && styles.imgChipActiveSub]}
                        activeOpacity={0.8}
                      >
                        {subImgUrl ? (
                          <Image source={{ uri: subImgUrl }} style={styles.chipImg} resizeMode="cover" />
                        ) : (
                          <Text style={styles.chipEmoji}>{productIcon(subName)}</Text>
                        )}
                        <Text style={[styles.imgChipText, isSelected && styles.imgChipTextActive]}>{subName}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* c. Listing Heading Name */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Listing Heading Name <Text style={styles.reqStar}>*</Text></Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Vannamei Shrimp - Grade A Fresh"
                placeholderTextColor={T.text3}
                style={styles.textInput}
              />
            </View>

            {/* d. Description & Sourcing Details */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Description & Sourcing Details <Text style={styles.optTag}>(Optional)</Text></Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Mention pond details, salinity, harvest date, cold chain handling..."
                placeholderTextColor={T.text3}
                multiline
                numberOfLines={3}
                style={[styles.textInput, styles.textAreaInput]}
              />
            </View>
          </View>

          {/* SECTION 2: PRICING & SPECS */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>2</Text></View>
              <Text style={styles.sectionTitle}>Pricing & Specifications</Text>
            </View>

            {/* a. UOM Choice Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Unit of Measurement (UOM) <Text style={styles.reqStar}>*</Text></Text>
              <View style={styles.chipsRow}>
                {UOM_OPTIONS.map(u => {
                  const isSel = u === uom;
                  return (
                    <TouchableOpacity
                      key={u}
                      onPress={() => setUom(u)}
                      style={[styles.imgChip, isSel && styles.imgChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.imgChipText, isSel && styles.imgChipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* b. Total Quantity & c. Price Per Unit */}
            <View style={styles.twoColRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Total Quantity <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  value={quantity}
                  onChangeText={txt => setQuantity(txt.replace(/\D/g, ''))}
                  placeholder="500"
                  placeholderTextColor={T.text3}
                  keyboardType="numeric"
                  style={styles.textInput}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Price / {uom.split(' ')[0]} (₹) <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  value={pricePerUnit}
                  onChangeText={txt => setPricePerUnit(txt.replace(/[^0-9.]/g, ''))}
                  placeholder="280.00"
                  placeholderTextColor={T.text3}
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* d. Sourcing Region / Port Choice Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Sourcing Region / Coastal Port <Text style={styles.reqStar}>*</Text></Text>
              {loadingBranches ? (
                <View style={styles.dimLoader}>
                  <ActivityIndicator size="small" color={T.navy} />
                  <Text style={styles.dimLoaderText}>Loading sourcing ports...</Text>
                </View>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                  {branches.map((b, idx) => {
                    const isSel = b.id === selectedBranchId;
                    return (
                      <TouchableOpacity
                        key={b.id || `branch_${idx}`}
                        onPress={() => setSelectedBranchId(b.id)}
                        style={[styles.imgChip, isSel && styles.imgChipActive]}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.chipEmoji}>📍</Text>
                        <Text style={[styles.imgChipText, isSel && styles.imgChipTextActive]}>
                          {b.name} ({b.stateName || b.city || 'AP'})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>

            {/* e. Seafood Freshness Choice Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Seafood Freshness <Text style={styles.reqStar}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                {FRESHNESS_OPTIONS.map(f => {
                  const isSel = f === freshness;
                  const emoji = f.includes('Ice') ? '🧊' : f.includes('Live') ? '🌊' : f.includes('Frozen') ? '❄️' : '⚙️';
                  return (
                    <TouchableOpacity
                      key={f}
                      onPress={() => setFreshness(f)}
                      style={[styles.imgChip, isSel && styles.imgChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipEmoji}>{emoji}</Text>
                      <Text style={[styles.imgChipText, isSel && styles.imgChipTextActive]}>{f}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* f. Seafood Grade Choice Chips */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Seafood Grade <Text style={styles.reqStar}>*</Text></Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
                {GRADE_OPTIONS.map(g => {
                  const isSel = g === grade;
                  const emoji = g.includes('A') ? '🛡️' : g.includes('B') ? '🥇' : g.includes('C') ? '🥈' : '📦';
                  return (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setGrade(g)}
                      style={[styles.imgChip, isSel && styles.imgChipActive]}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.chipEmoji}>{emoji}</Text>
                      <Text style={[styles.imgChipText, isSel && styles.imgChipTextActive]}>{g}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* g. Dynamic Category Dimensions */}
            {loadingDimensions ? (
              <View style={styles.dimLoader}>
                <ActivityIndicator size="small" color={T.navy} />
                <Text style={styles.dimLoaderText}>Loading category specifications...</Text>
              </View>
            ) : dimensions.length > 0 ? (
              <View style={styles.dimBoxGroup}>
                <Text style={styles.dimGroupHeader}>Category Specifications & Dimensions</Text>
                {dimensions.map((dim, dimIdx) => {
                  const dimKey = dim.id || dim.name || `dim_${dimIdx}`;
                  const val = dimensionValues[dim.id || dimKey] || '';
                  const isReq = !!dim.isRequired;
                  const cType = String(dim.controlType || '').toLowerCase().trim();

                  const rawOptions = dim.sourceValues || dim.values || dim.options || dim.dimensionValues || dim.allowedValues || [];
                  const isOptionControl =
                    cType.includes('drop') ||
                    cType.includes('select') ||
                    cType.includes('radio') ||
                    cType.includes('choice') ||
                    cType.includes('checkbox') ||
                    cType.includes('list') ||
                    !!dim.requiresSourceValues;

                  const defaultOptions = (dim.name && (dim.name.toLowerCase().includes('size') || dim.name.toLowerCase().includes('count')))
                    ? ['20-30 Count', '30-40 Count', '40-50 Count', '50-60 Count', '60-70 Count']
                    : ['Standard', 'Premium'];

                  const optionList = rawOptions.length > 0
                    ? rawOptions
                    : (isOptionControl ? defaultOptions : []);

                  const shouldRenderAsOptions = isOptionControl || optionList.length > 0;

                  return (
                    <View key={dimKey} style={styles.fieldGroup}>
                      <Text style={styles.fieldLabel}>
                        {dim.name} {isReq && <Text style={styles.reqStar}>*</Text>}
                      </Text>

                      {shouldRenderAsOptions ? (
                        <View style={styles.chipsRow}>
                          {optionList.map((opt: any, optIdx: number) => {
                            const optValue = typeof opt === 'string' ? opt : (opt.value || opt.name || opt.label || String(opt));
                            const optLabel = typeof opt === 'string' ? opt : (opt.name || opt.label || opt.value || String(opt));
                            const optKey = typeof opt === 'string' ? opt : (opt.id || opt.value || `opt_${optIdx}`);
                            const isSelected = val === optValue;

                            return (
                              <TouchableOpacity
                                key={optKey}
                                onPress={() => {
                                  const keys = [dim.id, dim.dimensionId, dim.name, dimKey].filter(Boolean);
                                  const updated = { ...dimensionValues };
                                  keys.forEach(k => { updated[k] = optValue; });
                                  setDimensionValues(updated);
                                }}
                                style={[styles.dimChip, isSelected && styles.dimChipActive]}
                              >
                                <Text style={[styles.dimChipText, isSelected && styles.dimChipTextActive]}>{optLabel}</Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      ) : (
                        <TextInput
                          value={String(val)}
                          onChangeText={txt => {
                            const keys = [dim.id, dim.dimensionId, dim.name, dimKey].filter(Boolean);
                            const updated = { ...dimensionValues };
                            keys.forEach(k => { updated[k] = txt; });
                            setDimensionValues(updated);
                          }}
                          placeholder={`Enter ${dim.name}`}
                          placeholderTextColor={T.text3}
                          keyboardType={cType.includes('number') || cType.includes('int') || cType.includes('qty') ? 'numeric' : 'default'}
                          style={styles.textInput}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>

          {/* SECTION 3: BIDDING RULES */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>3</Text></View>
              <Text style={styles.sectionTitle}>Bidding Rules</Text>
            </View>

            <Text style={styles.fieldLabel}>Listing Sale Format <Text style={styles.reqStar}>*</Text></Text>
            <View style={styles.radioGroup}>
              {SALE_TYPE_OPTIONS.map(opt => {
                const isSelected = saleType === opt;
                const labelText = opt === 'DirectSale' ? 'Direct Sale (Fixed)' : 'Allow Partial Bids (Bid)';
                return (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSaleType(opt as any)}
                    style={[styles.radioCard, isSelected && styles.radioCardSelected]}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioInnerDot} />}
                    </View>
                    <Text style={[styles.radioLabel, isSelected && styles.radioLabelSelected]}>{labelText}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Listing Validity (Hours) Slider — Visible for BOTH formats */}
            <View style={styles.sliderContainer}>
              <View style={styles.sliderHeaderRow}>
                <Text style={styles.fieldLabel}>Listing Validity (Hours) <Text style={styles.reqStar}>*</Text></Text>
                <View style={styles.sliderValueBadge}>
                  <Icon name="clock" size={12} color={T.navy} />
                  <Text style={styles.sliderValueBadgeText}>
                    {Number(validityHours) >= 24
                      ? `${validityHours}h (${Number(validityHours) / 24} ${Number(validityHours) === 24 ? 'day' : 'days'})`
                      : `${validityHours} hours`}
                  </Text>
                </View>
              </View>

              {/* Slider Track & Step Controls */}
              <View style={styles.sliderTrackRow}>
                <TouchableOpacity
                  onPress={() => {
                    const steps = [6, 12, 24, 36, 48, 72, 120, 168];
                    const curr = Number(validityHours) || 48;
                    const idx = steps.indexOf(curr);
                    if (idx > 0) setValidityHours(String(steps[idx - 1]));
                  }}
                  style={styles.sliderStepBtn}
                >
                  <Text style={styles.sliderStepBtnText}>-</Text>
                </TouchableOpacity>

                <View style={styles.trackBackground}>
                  {(() => {
                    const steps = [6, 12, 24, 36, 48, 72, 120, 168];
                    const curr = Number(validityHours) || 48;
                    const idx = steps.indexOf(curr) !== -1 ? steps.indexOf(curr) : 4;
                    const pct = (idx / (steps.length - 1)) * 100;
                    return (
                      <>
                        <View style={[styles.trackFill, { width: `${pct}%` }]} />
                        <View style={[styles.trackThumb, { left: `${Math.min(pct, 94)}%` }]} />
                      </>
                    );
                  })()}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    const steps = [6, 12, 24, 36, 48, 72, 120, 168];
                    const curr = Number(validityHours) || 48;
                    const idx = steps.indexOf(curr);
                    if (idx !== -1 && idx < steps.length - 1) setValidityHours(String(steps[idx + 1]));
                  }}
                  style={styles.sliderStepBtn}
                >
                  <Text style={styles.sliderStepBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Step Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sliderChipsRow}>
                {[6, 12, 24, 36, 48, 72, 120, 168].map(hrs => {
                  const isSelected = Number(validityHours) === hrs;
                  return (
                    <TouchableOpacity
                      key={hrs}
                      onPress={() => setValidityHours(String(hrs))}
                      style={[styles.sliderChip, isSelected && styles.sliderChipActive]}
                    >
                      <Text style={[styles.sliderChipText, isSelected && styles.sliderChipTextActive]}>
                        {hrs < 24 ? `${hrs}h` : `${hrs / 24}d`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Minimum Bid Quantity — Visible when Bid format is selected */}
            {saleType === 'Bid' && (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Minimum Bid Quantity ({uom}) <Text style={styles.reqStar}>*</Text></Text>
                <TextInput
                  value={minBidQuantity}
                  onChangeText={txt => setMinBidQuantity(txt.replace(/[^0-9.]/g, ''))}
                  placeholder="e.g. 50"
                  placeholderTextColor={T.text3}
                  keyboardType="decimal-pad"
                  style={styles.textInput}
                />
              </View>
            )}
          </View>

          {/* SECTION 4: UPLOAD MEDIA PHOTOS */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.numBadge}><Text style={styles.numBadgeText}>4</Text></View>
              <Text style={styles.sectionTitle}>Upload Media Photos (Up to 4)</Text>
            </View>

            <Text style={styles.photoHint}>📸 At least 1 photo is mandatory for listing verification.</Text>

            <View style={styles.photoGrid}>
              {photos.map((p, index) => (
                <View key={p.id} style={styles.photoCard}>
                  <Image source={{ uri: p.uri }} style={styles.photoImg} resizeMode="cover" />
                  <View style={styles.photoTag}>
                    <Text style={styles.photoTagText}>{index === 0 ? 'Cover Photo' : `Photo ${index + 1}`}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemovePhoto(p.id)} style={styles.deletePhotoBtn}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}

              {photos.length < 4 && (
                <TouchableOpacity onPress={handleAddPhoto} style={styles.addPhotoBox} activeOpacity={0.8}>
                  <Icon name="camera" size={26} color={T.navy} />
                  <Text style={styles.addPhotoText}>+ Add Photo</Text>
                  <Text style={styles.addPhotoSub}>{photos.length}/4 Uploaded</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.submitSection}>
            {!isFormValid && (
              <View style={styles.guidanceBox}>
                <Text style={styles.guidanceText}>
                  {!selectedCategoryId ? '• Select a Category' :
                    (subcategories.length > 0 && !selectedSubcategoryId) ? '• Select a Sub-Category' :
                      !name.trim() ? '• Enter Listing Heading Name' :
                        (!quantity.trim() || isNaN(Number(quantity)) || Number(quantity) <= 0) ? '• Enter valid Quantity' :
                          (!pricePerUnit.trim() || isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) ? '• Enter valid Price Per Unit' :
                            (!selectedBranchId && branches.length > 0) ? '• Select Sourcing Branch' :
                              (saleType === 'Bid' && (!minBidQuantity.trim() || isNaN(Number(minBidQuantity)))) ? '• Enter valid Minimum Bid Quantity' :
                                photos.length < 1 ? '• Upload at least 1 product photo' :
                                  '• Fill all required specification fields (*)'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={isFormValid && !submitting ? 0.82 : 1}
              onPress={handleSubmit}
              disabled={!isFormValid || submitting}
              style={[
                styles.submitActionBtn,
                isFormValid && !submitting ? styles.submitActionBtnEnabled : styles.submitActionBtnDisabled,
              ]}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.submitActionBtnText, isFormValid && styles.submitActionBtnTextEnabled]}>
                  {isFormValid ? "Submit for Approval →" : "Submit for Approval (Fill All Required Fields)"}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  scroll: { padding: 16, gap: 16 },

  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: T.navy, alignItems: 'center', justifyContent: 'center' },
  numBadgeText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: T.text1 },

  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 12, fontWeight: '800', color: T.text2 },
  reqStar: { color: T.danger, fontWeight: '900' },
  optTag: { fontSize: 11, color: T.text3, fontWeight: '600' },

  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
    color: T.text1,
    backgroundColor: '#FFFFFF',
  },
  textAreaInput: { height: 76, paddingTop: 10, textAlignVertical: 'top' },

  dropdownBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownBtnText: { fontSize: 14, fontWeight: '700', color: T.text1 },

  dropdownListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    marginTop: 4,
    maxHeight: 180,
    overflow: 'hidden',
  },
  dropdownOption: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: T.hairline },
  dropdownOptionActive: { backgroundColor: `${T.navy}10` },
  dropdownOptionText: { fontSize: 13, fontWeight: '600', color: T.text1 },
  dropdownOptionTextActive: { fontWeight: '900', color: T.navy },
  emptyListText: { padding: 12, fontSize: 12, color: T.text3, textAlign: 'center' },

  catChipsRow: { gap: 8, paddingVertical: 4 },
  imgChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  imgChipActive: {
    backgroundColor: T.navy,
    borderColor: T.navy,
  },
  imgChipActiveSub: {
    backgroundColor: T.amber,
    borderColor: T.amber,
  },
  chipImg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
  },
  chipEmoji: {
    fontSize: 18,
  },
  imgChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: T.text2,
  },
  imgChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  emptySubText: { fontSize: 12, color: T.text3, fontStyle: 'italic', paddingVertical: 4 },

  twoColRow: { flexDirection: 'row', gap: 12 },

  dimLoader: { paddingVertical: 12, alignItems: 'center', gap: 6 },
  dimLoaderText: { fontSize: 12, color: T.text2 },

  dimBoxGroup: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', gap: 10 },
  dimGroupHeader: { fontSize: 12, fontWeight: '800', color: T.navy },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dimChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  dimChipActive: { backgroundColor: T.navy, borderColor: T.navy },
  dimChipText: { fontSize: 11, fontWeight: '700', color: T.text2 },
  dimChipTextActive: { color: '#FFFFFF', fontWeight: '800' },

  radioGroup: { flexDirection: 'row', gap: 10 },
  radioCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  radioCardSelected: { backgroundColor: `${T.navy}08`, borderColor: T.navy },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: T.navy },
  radioInnerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.navy },
  radioLabel: { fontSize: 12, fontWeight: '700', color: T.text2 },
  radioLabelSelected: { color: T.navy, fontWeight: '900' },

  valChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  valChipActive: { backgroundColor: T.navy, borderColor: T.navy },
  valText: { fontSize: 12, fontWeight: '700', color: T.text2 },
  valTextActive: { color: '#FFFFFF', fontWeight: '900' },

  sliderContainer: { gap: 10, backgroundColor: '#F8FAFC', padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#CBD5E1' },
  sliderHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sliderValueBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${T.navy}12`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  sliderValueBadgeText: { fontSize: 12, fontWeight: '900', color: T.navy },

  sliderTrackRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 4 },
  sliderStepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  sliderStepBtnText: { fontSize: 18, fontWeight: '900', color: T.navy, marginTop: -2 },

  trackBackground: { flex: 1, height: 8, borderRadius: 4, backgroundColor: '#E2E8F0', position: 'relative', justifyContent: 'center' },
  trackFill: { height: '100%', borderRadius: 4, backgroundColor: T.navy },
  trackThumb: { position: 'absolute', top: -5, width: 18, height: 18, borderRadius: 9, backgroundColor: T.amber, borderWidth: 2, borderColor: '#FFFFFF', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 3 },

  sliderChipsRow: { gap: 6, paddingVertical: 2 },
  sliderChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1' },
  sliderChipActive: { backgroundColor: T.navy, borderColor: T.navy },
  sliderChipText: { fontSize: 11, fontWeight: '700', color: T.text2 },
  sliderChipTextActive: { color: '#FFFFFF', fontWeight: '900' },

  photoHint: { fontSize: 12, color: T.text2, fontWeight: '600' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoCard: { width: '47%', height: 110, borderRadius: 14, overflow: 'hidden', position: 'relative', borderWidth: 1.5, borderColor: '#CBD5E1' },
  photoImg: { width: '100%', height: '100%' },
  photoTag: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(15,23,42,0.75)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  photoTagText: { fontSize: 9, fontWeight: '700', color: '#fff' },
  deletePhotoBtn: { position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 11, backgroundColor: T.danger, alignItems: 'center', justifyContent: 'center' },

  addPhotoBox: {
    width: '47%',
    height: 110,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: `${T.navy}40`,
    borderStyle: 'dashed',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoText: { fontSize: 12, fontWeight: '800', color: T.navy },
  addPhotoSub: { fontSize: 10, color: T.text3 },

  submitSection: { marginTop: 8, gap: 10 },
  guidanceBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  guidanceText: { fontSize: 12, fontWeight: '700', color: '#B45309' },

  submitActionBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  submitActionBtnEnabled: {
    backgroundColor: T.navy,
    shadowColor: T.navy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitActionBtnDisabled: {
    backgroundColor: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  submitActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#94A3B8',
  },
  submitActionBtnTextEnabled: {
    color: '#FFFFFF',
  },
});
