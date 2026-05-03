import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Header } from '../../components/ui/Header';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';

const GROUPS = [
  {
    label: 'Today',
    items: [
      { icon: 'gavel',       title: 'New bid on your Pomfret listing',  body: '₹245/kg for 200 kg',               time: '10:04 AM', unread: true,  color: T.amber },
      { icon: 'checkCircle', title: 'Your listing was approved',         body: 'Fresh Rohu · 500 kg is now live',  time: '8:30 AM',  unread: true,  color: T.green },
    ],
  },
  {
    label: 'Yesterday',
    items: [
      { icon: 'msgCircle', title: 'Sri Venkatesh Traders countered', body: '₹248/kg — tap to view thread',        time: '3:22 PM', unread: false, color: T.navy },
      { icon: 'receipt',   title: 'Invoice INV-2025-00412 settled',  body: '₹49,000 credited to your account',   time: '4:32 PM', unread: false, color: T.green },
    ],
  },
  {
    label: 'This Week',
    items: [
      { icon: 'alert', title: 'Your registration is under review', body: "We'll update you within 24 hours", time: 'Mon, 9 AM', unread: false, color: T.amber },
    ],
  },
];

export const NotificationsScreen: React.FC = () => {
  const nav = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Notifications"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity>
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        }
      />
      <ScrollView>
        {GROUPS.map(group => (
          <View key={group.label}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            {group.items.map((item, i) => (
              <TouchableOpacity key={i} style={[styles.notifRow, item.unread && styles.notifUnread]} activeOpacity={0.7}>
                {item.unread && <View style={styles.unreadBar} />}
                <View style={[styles.iconBox, { backgroundColor: `${item.color}15` }]}>
                  <Icon name={item.icon} size={20} color={item.color} />
                </View>
                <View style={styles.notifText}>
                  <Text style={[styles.notifTitle, item.unread && styles.notifTitleUnread]}>{item.title}</Text>
                  <Text style={styles.notifBody}>{item.body}</Text>
                </View>
                <Text style={styles.notifTime}>{item.time}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  markRead: { fontSize: 12, fontWeight: '700', color: T.amber },
  groupLabel: { fontSize: 12, fontWeight: '800', color: T.text3, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  notifRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.hairline, position: 'relative' },
  notifUnread: { backgroundColor: `${T.navy}06` },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: T.navy, borderTopRightRadius: 2, borderBottomRightRadius: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  notifText: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: T.text1 },
  notifTitleUnread: { fontWeight: '700' },
  notifBody: { fontSize: 12, color: T.text2, marginTop: 2 },
  notifTime: { fontSize: 11, color: T.text3, flexShrink: 0 },
});
