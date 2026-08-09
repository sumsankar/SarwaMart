import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { T } from '../../constants/tokens';
import { productIcon } from '../../constants/mockData';

export const DEFAULT_CATEGORIES = ['All', 'Fish', 'Prawn', 'Crab', 'Lobster', 'Squid'];

export interface CategoryFilterItem {
  id?: string;
  name: string;
  emoji?: string;
}

export interface CategoryFilterBarProps {
  categories?: (string | CategoryFilterItem)[];
  selectedCategory: string; // matches name or 'All'
  onSelectCategory: (categoryName: string, categoryObj?: any) => void;
  title?: string;
  containerStyle?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showReset?: boolean;
  onReset?: () => void;
  allLabel?: string;
  allEmoji?: string;
}

export const CategoryFilterBar: React.FC<CategoryFilterBarProps> = ({
  categories = DEFAULT_CATEGORIES,
  selectedCategory,
  onSelectCategory,
  title = 'CATEGORY:',
  containerStyle,
  contentContainerStyle,
  showReset = false,
  onReset,
  allLabel = 'All',
  allEmoji = '🌐',
}) => {
  const normSelected = (selectedCategory || 'All').toLowerCase();

  const normalizedCategories = React.useMemo(() => {
    const list = categories && categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const hasAll = list.some(c => {
      const name = typeof c === 'string' ? c : c.name;
      return name.toLowerCase() === 'all' || name.toLowerCase() === 'all aqua';
    });

    if (hasAll) return list;
    return [{ id: 'all_auto', name: allLabel, emoji: allEmoji }, ...list];
  }, [categories, allLabel, allEmoji]);

  return (
    <View style={[styles.container, containerStyle]}>
      {title || showReset ? (
        <View style={styles.headerRow}>
          {title ? <Text style={styles.title}>{title}</Text> : <View />}
          {showReset && onReset ? (
            <TouchableOpacity onPress={onReset} hitSlop={8}>
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      >
        {normalizedCategories.map((cat, idx) => {
          const catName = typeof cat === 'string' ? cat : cat.name;
          const catId = typeof cat === 'string' ? cat : (cat.id || cat.name);
          const isAll = catName.toLowerCase() === 'all' || catName.toLowerCase() === 'all aqua';
          const isActive = isAll
            ? (normSelected === 'all' || normSelected === 'all aqua' || !selectedCategory || selectedCategory.toLowerCase() === 'all')
            : normSelected === catName.toLowerCase();
          
          let emoji = typeof cat === 'object' && cat.emoji ? cat.emoji : (isAll ? allEmoji : productIcon(catName));

          return (
            <TouchableOpacity
              key={catId || `cat_${idx}`}
              onPress={() => onSelectCategory(catName, typeof cat === 'object' ? cat : null)}
              style={[styles.chip, isActive && styles.chipActive]}
              activeOpacity={0.82}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={[styles.text, isActive && styles.textActive]}>{isAll ? allLabel : catName}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  title: {
    fontSize: 10,
    fontWeight: '800',
    color: T.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  resetText: {
    fontSize: 11,
    fontWeight: '800',
    color: T.green,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6.5,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: T.navy,
    borderColor: T.navy,
    shadowColor: T.navy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  emoji: {
    fontSize: 13,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
    color: T.text2,
  },
  textActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
