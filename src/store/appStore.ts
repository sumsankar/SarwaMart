import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Role = 'seller' | 'buyer';

interface AppState {
  role: Role;
  isLoggedIn: boolean;
  selectedItem: any;
  selectedRequest: any;
  toast: { msg: string; visible: boolean; type: 'success' | 'error' | 'info' };
  setRole: (role: Role) => void;
  setLoggedIn: (val: boolean) => void;
  setSelectedItem: (item: any) => void;
  setSelectedRequest: (req: any) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  logout: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'seller',
  isLoggedIn: false,
  selectedItem: null,
  selectedRequest: null,
  toast: { msg: '', visible: false, type: 'success' },

  setRole: (role) => {
    set({ role });
    AsyncStorage.setItem('sm_role', role);
  },

  setLoggedIn: (val) => {
    set({ isLoggedIn: val });
    AsyncStorage.setItem('sm_logged_in', val ? '1' : '0');
  },

  setSelectedItem: (item) => set({ selectedItem: item }),
  setSelectedRequest: (req) => set({ selectedRequest: req }),

  showToast: (msg, type = 'success') => {
    set({ toast: { msg, visible: true, type } });
    setTimeout(() => set(s => ({ toast: { ...s.toast, visible: false } })), 2500);
  },

  hideToast: () => set(s => ({ toast: { ...s.toast, visible: false } })),

  logout: async () => {
    await AsyncStorage.removeItem('sm_role');
    await AsyncStorage.removeItem('sm_logged_in');
    set({ isLoggedIn: false, role: 'seller' });
  },
}));
