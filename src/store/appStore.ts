import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Role = 'seller' | 'buyer';

export interface UserProfile {
  id?: string;
  fullName?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  companyName?: string;
  businessName?: string;
  role?: string;
  tradeRole?: string;
  userRole?: string;
  accountType?: string;
  type?: string;
  branchName?: string;
  region?: string;
  stateId?: string | number;
  stateName?: string;
  districtId?: string | number;
  districtName?: string;
  dealsCount?: number | string;
  totalDeals?: number | string;
  deals?: number | string;
  completedDeals?: number | string;
  rating?: number | string;
  userRating?: number | string;
  createdAt?: string;
  createdDate?: string;
  memberSince?: string;
  joiningDate?: string;
  registeredOn?: string;
  listingsCount?: number | string;
  requestsCount?: number | string;
  [key: string]: any;
}

interface AppState {
  role: Role;
  isLoggedIn: boolean;
  token: string | null;
  user: UserProfile | null;
  selectedItem: any;
  selectedRequest: any;
  toast: { msg: string; visible: boolean; type: 'success' | 'error' | 'info' };
  apiBaseUrl: string;
  setRole: (role: Role) => void;
  setLoggedIn: (val: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  fetchUserProfile: (tokenOverride?: string) => Promise<UserProfile | null>;
  loadToken: () => Promise<void>;
  setSelectedItem: (item: any) => void;
  setSelectedRequest: (req: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  setApiBaseUrl: (url: string) => void;
  loadApiBaseUrl: () => Promise<void>;
  logout: () => Promise<void>;
}

const DEFAULT_API_BASE = 'https://sarwamart-api-g3bhexcsggetc4eu.canadacentral-01.azurewebsites.net/';

const getApiUrl = (endpoint: string, base: string) => {
  const cleanBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let resolvedBase = cleanBase;
  if (Platform.OS === 'android') {
    if (resolvedBase.includes('localhost')) {
      resolvedBase = resolvedBase.replace('localhost', '10.0.2.2');
    } else if (resolvedBase.includes('127.0.0.1')) {
      resolvedBase = resolvedBase.replace('127.0.0.1', '10.0.2.2');
    }
  }
  return `${resolvedBase}${cleanEndpoint}`;
};

export const useAppStore = create<AppState>((set, get) => ({
  role: 'seller',
  isLoggedIn: false,
  token: null,
  user: null,
  selectedItem: null,
  selectedRequest: null,
  toast: { msg: '', visible: false, type: 'success' },
  apiBaseUrl: DEFAULT_API_BASE,

  setRole: (role) => {
    set({ role });
    AsyncStorage.setItem('sm_role', role);
  },

  setLoggedIn: (val) => {
    set({ isLoggedIn: val });
    AsyncStorage.setItem('sm_logged_in', val ? '1' : '0');
  },

  setToken: (token) => {
    set({ token });
    if (token) {
      AsyncStorage.setItem('sm_auth_token', token);
    } else {
      AsyncStorage.removeItem('sm_auth_token');
    }
  },

  setUser: (user) => {
    set({ user });
    if (user) {
      AsyncStorage.setItem('sm_user_profile', JSON.stringify(user));
    } else {
      AsyncStorage.removeItem('sm_user_profile');
    }
  },

  fetchUserProfile: async (tokenOverride?: string) => {
    const state = get();
    const activeToken = tokenOverride || state.token || (await AsyncStorage.getItem('sm_access_token')) || (await AsyncStorage.getItem('sm_auth_token'));
    if (!activeToken) return null;

    try {
      const url = getApiUrl('/api/v1/auth/me', state.apiBaseUrl);
      console.log('Fetching user profile from:', url);
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${activeToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        const meData = await res.json();
        console.log('GET /api/v1/auth/me success in store:', meData);
        state.setUser(meData);

        const userRoleStr = (meData.role || meData.tradeRole || meData.userRole || meData.type || '').toLowerCase();
        if (userRoleStr.includes('buyer') || userRoleStr.includes('trader')) {
          state.setRole('buyer');
        } else if (userRoleStr.includes('seller') || userRoleStr.includes('farmer')) {
          state.setRole('seller');
        }

        return meData;
      }
    } catch (err) {
      console.warn('Error fetching /api/v1/auth/me in store:', err);
    }
    return null;
  },

  loadToken: async () => {
    const savedToken = await AsyncStorage.getItem('sm_auth_token');
    const savedProfile = await AsyncStorage.getItem('sm_user_profile');
    let userObj: UserProfile | null = null;
    if (savedProfile) {
      try {
        userObj = JSON.parse(savedProfile);
      } catch (e) {}
    }
    if (savedToken) {
      set({ token: savedToken, user: userObj });
      get().fetchUserProfile(savedToken);
    } else if (userObj) {
      set({ user: userObj });
    }
  },

  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedRequest: (req) => set({ selectedRequest: req }),

  showToast: (msg, type = 'success') => {
    set({ toast: { msg, visible: true, type } });
    setTimeout(() => set(s => ({ toast: { ...s.toast, visible: false } })), 2500);
  },

  hideToast: () => set(s => ({ toast: { ...s.toast, visible: false } })),

  setApiBaseUrl: (url) => {
    set({ apiBaseUrl: url });
    AsyncStorage.setItem('sm_api_base', url);
  },

  loadApiBaseUrl: async () => {
    const saved = await AsyncStorage.getItem('sm_api_base');
    if (saved) {
      if (
        saved === 'https://localhost:7096' ||
        saved === 'https://10.0.2.2:7096' ||
        saved.includes('7096') ||
        saved.includes('5157') ||
        saved.includes('localhost') ||
        saved.includes('10.0.2.2')
      ) {
        set({ apiBaseUrl: DEFAULT_API_BASE });
        await AsyncStorage.setItem('sm_api_base', DEFAULT_API_BASE);
      } else {
        set({ apiBaseUrl: saved });
      }
    } else {
      set({ apiBaseUrl: DEFAULT_API_BASE });
    }
  },

  logout: async () => {
    await AsyncStorage.removeItem('sm_role');
    await AsyncStorage.removeItem('sm_logged_in');
    await AsyncStorage.removeItem('sm_auth_token');
    await AsyncStorage.removeItem('sm_access_token');
    await AsyncStorage.removeItem('sm_refresh_token');
    await AsyncStorage.removeItem('sm_user_profile');
    set({ isLoggedIn: false, role: 'seller', token: null, user: null });
  },
}));
