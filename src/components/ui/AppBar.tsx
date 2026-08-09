import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParams } from '../../navigation/RootNavigator';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { Icon } from './Icon';
import { T } from '../../constants/tokens';
import { useAppStore } from '../../store/appStore';
import { AppDrawer } from './AppDrawer';

type Nav = NativeStackNavigationProp<RootStackParams>;

export const AppBar: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { role, user } = useAppStore();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const rawName = user?.fullName || user?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : null);
  const userName = rawName || (role === 'seller' ? 'Ravi Kumar' : 'Priya Nair');

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safe}>
        <View style={styles.bar}>
          <TouchableOpacity onPress={() => setDrawerOpen(true)} hitSlop={8}>
            <Icon name="menu" size={22} color={T.navy} />
          </TouchableOpacity>
          <Logo width={110} dark />
          <View style={styles.right}>
            <TouchableOpacity onPress={() => nav.navigate('Notifications')} style={styles.bellWrap} hitSlop={8}>
              <Icon name="bell" size={22} color={T.navy} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => nav.navigate('Profile')} hitSlop={4}>
              <Avatar name={userName} size={32} bg={T.navy} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
      <AppDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
};

const styles = StyleSheet.create({
  safe: { backgroundColor: T.card, borderBottomWidth: 1, borderBottomColor: T.hairline },
  bar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  right: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bellWrap: { position: 'relative' },
  notifDot: { position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderRadius: 4, backgroundColor: T.amber, borderWidth: 1.5, borderColor: T.card },
});
