import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { SegTabs } from '../../components/ui/SegTabs';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { MY_REQUESTS } from '../../constants/mockData';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const MyRequestsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const [seg, setSeg] = useState('All');

  const filtered = seg === 'All' ? MY_REQUESTS
    : seg === 'Proposals received' ? MY_REQUESTS.filter(r => r.proposals > 0)
    : MY_REQUESTS.filter(r => r.status.toLowerCase() === seg.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="My Requests"
        onBack={() => nav.goBack()}
        right={
          <TouchableOpacity style={styles.addBtn} onPress={() => nav.navigate('CreateRequest')}>
            <Icon name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />
      <SegTabs tabs={['All', 'Open', 'Proposals received', 'Closed', 'Expired']} active={seg} onSelect={setSeg} />

      {/* Stats strip */}
      <View style={styles.statsStrip}>
        {[['2', 'Active Requests'], ['14', 'Total Proposals']].map(([v, l], i) => (
          <View key={l} style={[styles.statCell, i > 0 && styles.statCellBorder]}>
            <Text style={styles.statLabel}>{l}</Text>
            <Text style={styles.statVal}>{v}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map(req => (
          <Card key={req.id} onPress={() => nav.navigate('Negotiation')}>
            <View style={styles.reqInner}>
              <View style={styles.reqRow}>
                <View style={styles.reqImgBox}><Text style={styles.reqEmoji}>{req.img}</Text></View>
                <View style={{ flex: 1 }}>
                  <View style={styles.titleRow}>
                    <Text style={styles.reqProduct}>{req.product} · {req.sub}</Text>
                    <StatusPill status={req.status} />
                  </View>
                  <Text style={styles.reqMeta}>{req.qty} · Expected {req.price}</Text>
                  <View style={styles.reqBottom}>
                    <View style={styles.locRow}>
                      <Icon name="mapPin" size={11} color={T.text3} />
                      <Text style={styles.locText}>{req.loc}</Text>
                      <Text style={styles.timeText}>· {req.time}</Text>
                    </View>
                    {req.proposals > 0 && (
                      <View style={styles.proposalBadge}>
                        <Icon name="receipt" size={10} color={T.amber} />
                        <Text style={styles.proposalText}>{req.proposals} proposals</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
          </Card>
        ))}
        {filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No requests here</Text>
            <Text style={styles.emptySub}>Post a request and verified sellers will respond.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => nav.navigate('CreateRequest')}>
              <Text style={styles.emptyBtnText}>Post a Request</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  addBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  statsStrip: { flexDirection: 'row', margin: 12, marginHorizontal: 16, padding: 14, backgroundColor: T.navy, borderRadius: 12 },
  statCell: { flex: 1 },
  statCellBorder: { paddingLeft: 16, borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.2)' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 },
  statVal: { fontSize: 22, fontWeight: '900', color: '#fff' },
  list: { padding: 16, paddingTop: 4, gap: 10 },
  reqInner: { padding: 14 },
  reqRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  reqImgBox: { width: 52, height: 52, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  reqEmoji: { fontSize: 28 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqProduct: { fontSize: 15, fontWeight: '800', color: T.text1, flex: 1 },
  reqMeta: { fontSize: 12, color: T.text2, marginTop: 2 },
  reqBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText: { fontSize: 11, color: T.text3 },
  timeText: { fontSize: 11, color: T.text3 },
  proposalBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: `${T.amber}20`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  proposalText: { fontSize: 11, fontWeight: '700', color: T.amber },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: T.text1 },
  emptySub: { fontSize: 13, color: T.text3, textAlign: 'center', paddingHorizontal: 40 },
  emptyBtn: { marginTop: 8, height: 44, paddingHorizontal: 24, backgroundColor: T.amber, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
