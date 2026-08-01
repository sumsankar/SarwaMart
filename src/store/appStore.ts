import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

type Role = 'seller' | 'buyer';

interface AppState {
  role: Role;
  isLoggedIn: boolean;
  token: string | null;
  selectedItem: any;
  selectedRequest: any;
  toast: { msg: string; visible: boolean; type: 'success' | 'error' | 'info' };
  apiBaseUrl: string;
  setRole: (role: Role) => void;
  setLoggedIn: (val: boolean) => void;
  setToken: (token: string | null) => void;
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

export const useAppStore = create<AppState>((set) => ({
  role: 'seller',
  isLoggedIn: false,
  token: null,
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

  loadToken: async () => {
    const savedToken = await AsyncStorage.getItem('sm_auth_token');
    if (savedToken) {
      set({ token: savedToken });
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
    set({ isLoggedIn: false, role: 'seller', token: null });
  },
}));
