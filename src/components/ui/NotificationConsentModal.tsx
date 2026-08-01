import React, { useState, useEffect } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Button } from './Button';
import { Icon } from './Icon';
import { T } from '../../constants/tokens';
import { notificationService } from '../../services/notificationService';

export const NotificationConsentModal: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkConsent = async () => {
      const alreadyPrompted = await notificationService.hasPromptedConsent();
      if (!alreadyPrompted) {
        // Small delay so app finishes mounting smooth transition
        setTimeout(() => setVisible(true), 800);
      }
    };
    checkConsent();
  }, []);

  const handleAllow = async () => {
    setLoading(true);
    try {
      await notificationService.requestPermission();
    } finally {
      setLoading(false);
      setVisible(false);
    }
  };

  const handleDecline = async () => {
    await notificationService.markConsentPrompted(false);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDecline}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Text style={{ fontSize: 36 }}>🔔</Text>
          </View>
          
          <Text style={styles.title}>Enable Notifications?</Text>
          <Text style={styles.subtitle}>
            Never miss live auction bids, buyer request matches, or price alerts on SarwaMart.
          </Text>

          <View style={styles.benefitList}>
            {[
              '🔨 Instant live bid & counter-offer alerts',
              '📋 Instant notifications on buyer requests',
              '📈 Daily aqua market price updates',
            ].map((b, i) => (
              <View key={i} style={styles.benefitRow}>
                <Text style={styles.benefitText}>{b}</Text>
              </View>
            ))}
          </View>

          <View style={styles.btnRow}>
            <Button
              label={loading ? "Enabling..." : "🔔 Enable Notifications"}
              onPress={handleAllow}
              fullWidth
              style={styles.allowBtn}
            />
            <TouchableOpacity onPress={handleDecline} style={styles.maybeLaterBtn} activeOpacity={0.7}>
              <Text style={styles.maybeLaterText}>Not Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: T.card,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: T.cardBorder,
    ...T.shadowSoft,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${T.navy}12`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${T.navy}20`,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: T.text1,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: T.text2,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 18,
  },
  benefitList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: T.hairline,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: T.text2,
    fontWeight: '600',
  },
  btnRow: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  allowBtn: {
    height: 48,
    borderRadius: 14,
    backgroundColor: T.navy,
  },
  maybeLaterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  maybeLaterText: {
    fontSize: 13,
    color: T.text3,
    fontWeight: '700',
  },
});
