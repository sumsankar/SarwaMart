import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const NOTIF_CONSENT_KEY = '@sarwamart_notification_consent_prompted';
const NOTIF_GRANTED_KEY = '@sarwamart_notification_permission_granted';

// Detect Expo Go sandbox environment
const isExpoGo = Constants.appOwnership === 'expo';

// Safe dynamic module getter (prevents expo-notifications top-level module load error in Expo Go SDK 53+)
const getNotificationsModule = () => {
  if (isExpoGo || Platform.OS === 'web') return null;
  try {
    return require('expo-notifications');
  } catch (e) {
    return null;
  }
};

// Configure foreground notification behavior safely when running in custom native builds
try {
  const Notifications = getNotificationsModule();
  if (Notifications && typeof Notifications.setNotificationHandler === 'function') {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
} catch (e) {
  // Suppress initialization errors
}

export const notificationService = {
  /**
   * Check whether the user has already been prompted for notification consent.
   */
  async hasPromptedConsent(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(NOTIF_CONSENT_KEY);
      return val === 'true';
    } catch (e) {
      return false;
    }
  },

  /**
   * Mark that consent prompt was shown to user.
   */
  async markConsentPrompted(granted: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(NOTIF_CONSENT_KEY, 'true');
      await AsyncStorage.setItem(NOTIF_GRANTED_KEY, granted ? 'true' : 'false');
    } catch (e) {
      // Suppress
    }
  },

  /**
   * Check existing notification permission status.
   */
  async checkPermissionStatus(): Promise<boolean> {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) return false;
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  },

  /**
   * Request native system notification permissions safely.
   */
  async requestPermission(): Promise<boolean> {
    try {
      const Notifications = getNotificationsModule();
      if (!Notifications) {
        // In Expo Go or Web, save consent locally without triggering SDK 53+ remote notification error
        await this.markConsentPrompted(true);
        return true;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      const isGranted = finalStatus === 'granted';
      await this.markConsentPrompted(isGranted);
      return isGranted;
    } catch (e) {
      await this.markConsentPrompted(true);
      return true;
    }
  },
};
