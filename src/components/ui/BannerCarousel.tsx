import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface Banner {
  bg: [string, string];
  tag: string;
  title: string;
  cta: string;
  emoji: string;
}

export const BannerCarousel: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const [cur, setCur] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setCur(c => (c + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length]);

  const b = banners[cur];

  return (
    <View style={styles.wrapper}>
      <LinearGradient colors={b.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
        <View style={styles.content}>
          <Text style={styles.tag}>{b.tag}</Text>
          <Text style={styles.title}>{b.title}</Text>
          <View style={styles.ctaChip}>
            <Text style={styles.ctaText}>{b.cta}</Text>
          </View>
        </View>
        <Text style={styles.emoji}>{b.emoji}</Text>
      </LinearGradient>
      <View style={styles.dots}>
        {banners.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => setCur(i)}>
            <View style={[styles.dot, i === cur && styles.dotActive]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginVertical: 12, borderRadius: 14, overflow: 'hidden', position: 'relative' },
  banner: { height: 140, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 12 },
  content: { flex: 1 },
  tag: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
  title: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 23 },
  ctaChip: { marginTop: 10, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  ctaText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  emoji: { fontSize: 52 },
  dots: { position: 'absolute', bottom: 10, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  dotActive: { width: 20, backgroundColor: '#fff' },
});
