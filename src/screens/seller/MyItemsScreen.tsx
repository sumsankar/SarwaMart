import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Header } from '../../components/ui/Header';
import { SegTabs } from '../../components/ui/SegTabs';
import { Card } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Icon } from '../../components/ui/Icon';
import { T } from '../../constants/tokens';
import { SELLER_ITEMS } from '../../constants/mockData';
import { useAppStore } from '../../store/appStore';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const MyItemsScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { setSelectedItem } = useAppStore();
  const [seg, setSeg] = useState('All');

  const filtered = seg === 'All' ? SELLER_ITEMS : SELLER_ITEMS.filter(i => i.status.toLowerCase() === seg.toLowerCase());

  return (
    <SafeAreaView style={styles.container}>
      <Header title="My Items" onBack={() => nav.goBack()}
        right={
          <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.addBtn}>
            <Icon name="plus" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />
      <SegTabs tabs={['All','Live','Pending','Sold','Expired']} active={seg} onSelect={setSeg} />
      <ScrollView contentContainerStyle={styles.list}>
        {filtered.map(item => (
          <Card key={item.id} onPress={() => { setSelectedItem(item); nav.navigate('ItemDetailSeller'); }}>
            <View style={styles.row}>
              <View style={styles.img}><Text style={styles.emoji}>{item.img}</Text></View>
              <View style={styles.info}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.name}</Text>
                  <StatusPill status={item.status} />
                </View>
                <Text style={styles.sub}>{item.sub} · {item.qty}</Text>
                <Text style={styles.price}>{item.price}</Text>
                {item.bids > 0 && <Text style={styles.bids}>{item.bids} bids received</Text>}
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
      <TouchableOpacity onPress={() => nav.navigate('CreateItem')} style={styles.fab}>
        <Icon name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  list: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', gap: 12, padding: 14 },
  img: { width: 80, height: 80, borderRadius: 10, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 38 },
  info: { flex: 1, gap: 3 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { fontSize: 15, fontWeight: '700', color: T.text1, flex: 1 },
  sub: { fontSize: 12, color: T.text2 },
  price: { fontSize: 16, fontWeight: '800', color: T.navy },
  bids: { fontSize: 12, color: T.amber, fontWeight: '600' },
  addBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: T.amber, alignItems: 'center', justifyContent: 'center', shadowColor: T.amber, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
});
