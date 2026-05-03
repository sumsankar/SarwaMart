import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T } from '../constants/tokens';
import { useAppStore } from '../store/appStore';
import { Icon } from '../components/ui/Icon';

// Auth & onboarding
import { SplashScreen } from '../screens/auth/SplashScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { MobileEntryScreen } from '../screens/auth/MobileEntryScreen';
import { OTPScreen } from '../screens/auth/OTPScreen';
import { PINSetupScreen } from '../screens/auth/PINSetupScreen';
import { PINLoginScreen } from '../screens/auth/PINLoginScreen';

// Registration
import { RolePickerScreen } from '../screens/registration/RolePickerScreen';
import { AccountTypeScreen } from '../screens/registration/AccountTypeScreen';
import { PersonalDetailsScreen } from '../screens/registration/PersonalDetailsScreen';
import { ProductsScreen } from '../screens/registration/ProductsScreen';
import { UnderReviewScreen } from '../screens/registration/UnderReviewScreen';

// Public
import { PublicLandingScreen } from '../screens/public/PublicLandingScreen';

// Seller
import { SellerHomeScreen } from '../screens/seller/SellerHomeScreen';
import { MyItemsScreen } from '../screens/seller/MyItemsScreen';
import { CreateItemScreen } from '../screens/seller/CreateItemScreen';
import { ItemDetailSellerScreen } from '../screens/seller/ItemDetailSellerScreen';
import { NegotiationScreen } from '../screens/seller/NegotiationScreen';

// Buyer
import { BuyerHomeScreen } from '../screens/buyer/BuyerHomeScreen';
import { ItemDetailBuyerScreen } from '../screens/buyer/ItemDetailBuyerScreen';
import { PlaceBidScreen } from '../screens/buyer/PlaceBidScreen';
import { MyBidsScreen } from '../screens/buyer/MyBidsScreen';
import { MyRequestsScreen } from '../screens/buyer/MyRequestsScreen';
import { CreateRequestScreen } from '../screens/buyer/CreateRequestScreen';

// Shared
import { InvoiceListScreen } from '../screens/shared/InvoiceListScreen';
import { InvoiceDetailScreen } from '../screens/shared/InvoiceDetailScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { LanguageScreen } from '../screens/shared/LanguageScreen';

export type RootStackParams = {
  Splash: undefined;
  PublicLanding: undefined;
  Login: undefined;
  MobileEntry: undefined;
  OTP: { phone: string };
  PINSetup: undefined;
  PINLogin: undefined;
  RolePicker: undefined;
  AccountType: undefined;
  PersonalDetails: undefined;
  Products: undefined;
  UnderReview: undefined;
  SellerTabs: undefined;
  BuyerTabs: undefined;
  MyItems: undefined;
  CreateItem: undefined;
  ItemDetailSeller: undefined;
  Negotiation: undefined;
  ItemDetailBuyer: undefined;
  PlaceBid: undefined;
  MyBids: undefined;
  MyRequests: undefined;
  CreateRequest: undefined;
  InvoiceList: undefined;
  InvoiceDetail: undefined;
  Notifications: undefined;
  Profile: undefined;
  Language: undefined;
};

const Stack = createNativeStackNavigator<RootStackParams>();
const SellerTab = createBottomTabNavigator();
const BuyerTab = createBottomTabNavigator();

const SellerTabNavigator = () => (
  <SellerTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { height: 64, borderTopColor: T.hairline, backgroundColor: T.card },
      tabBarActiveTintColor: T.navy,
      tabBarInactiveTintColor: T.text3,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarIcon: ({ color, size }) => {
        const icons: Record<string, string> = { Home: 'home', Items: 'package', Invoices: 'invoice' };
        return <Icon name={icons[route.name] || 'home'} size={22} color={color} />;
      },
    })}
  >
    <SellerTab.Screen name="Home" component={SellerHomeScreen} />
    <SellerTab.Screen name="Items" component={MyItemsScreen} />
    <SellerTab.Screen name="Invoices" component={InvoiceListScreen} />
  </SellerTab.Navigator>
);

const BuyerTabNavigator = () => (
  <BuyerTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { height: 64, borderTopColor: T.hairline, backgroundColor: T.card },
      tabBarActiveTintColor: T.navy,
      tabBarInactiveTintColor: T.text3,
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
      tabBarIcon: ({ color }) => {
        const icons: Record<string, string> = { Home: 'home', 'My Bids': 'gavel', Invoices: 'invoice' };
        return <Icon name={icons[route.name] || 'home'} size={22} color={color} />;
      },
    })}
  >
    <BuyerTab.Screen name="Home" component={BuyerHomeScreen} />
    <BuyerTab.Screen name="My Bids" component={MyBidsScreen} />
    <BuyerTab.Screen name="Invoices" component={InvoiceListScreen} />
  </BuyerTab.Navigator>
);

export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="PublicLanding" component={PublicLandingScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MobileEntry" component={MobileEntryScreen} />
      <Stack.Screen name="OTP" component={OTPScreen} />
      <Stack.Screen name="PINSetup" component={PINSetupScreen} />
      <Stack.Screen name="PINLogin" component={PINLoginScreen} />
      <Stack.Screen name="RolePicker" component={RolePickerScreen} />
      <Stack.Screen name="AccountType" component={AccountTypeScreen} />
      <Stack.Screen name="PersonalDetails" component={PersonalDetailsScreen} />
      <Stack.Screen name="Products" component={ProductsScreen} />
      <Stack.Screen name="UnderReview" component={UnderReviewScreen} />
      <Stack.Screen name="SellerTabs" component={SellerTabNavigator} />
      <Stack.Screen name="BuyerTabs" component={BuyerTabNavigator} />
      <Stack.Screen name="MyItems" component={MyItemsScreen} />
      <Stack.Screen name="CreateItem" component={CreateItemScreen} />
      <Stack.Screen name="ItemDetailSeller" component={ItemDetailSellerScreen} />
      <Stack.Screen name="Negotiation" component={NegotiationScreen} />
      <Stack.Screen name="ItemDetailBuyer" component={ItemDetailBuyerScreen} />
      <Stack.Screen name="PlaceBid" component={PlaceBidScreen} />
      <Stack.Screen name="MyBids" component={MyBidsScreen} />
      <Stack.Screen name="MyRequests" component={MyRequestsScreen} />
      <Stack.Screen name="CreateRequest" component={CreateRequestScreen} />
      <Stack.Screen name="InvoiceList" component={InvoiceListScreen} />
      <Stack.Screen name="InvoiceDetail" component={InvoiceDetailScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Language" component={LanguageScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);
