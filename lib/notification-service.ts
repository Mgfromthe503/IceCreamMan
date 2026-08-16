import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Notification types
export type NotificationType = 'new_request' | 'request_accepted' | 'driver_arriving' | 'delivery_complete' | 'eta_update';

interface NotificationPayload {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Store for notification listeners
type NotificationListener = (payload: NotificationPayload) => void;
const listeners: NotificationListener[] = [];

/**
 * Register for push notifications
 * On native: Uses expo-notifications
 * On web: Uses browser Notification API
 */
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // Web: Use browser Notification API
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          await AsyncStorage.setItem('notificationsEnabled', 'true');
          return 'web-notification-enabled';
        }
      }
      return null;
    }

    // Native: Use expo-notifications
    const Notifications = await import('expo-notifications').catch(() => null);
    if (!Notifications) return null;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get push token — projectId is required in expo-notifications ≥ 0.29
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    // Save token
    await AsyncStorage.setItem('pushToken', token);
    await AsyncStorage.setItem('notificationsEnabled', 'true');

    return token;
  } catch (error) {
    console.error('Error registering for notifications:', error);
    return null;
  }
}

/**
 * Send a local notification to the driver
 */
export async function sendLocalNotification(payload: NotificationPayload): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Web: Use browser Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(payload.title, {
          body: payload.body,
          icon: '/assets/images/icon.png',
          tag: payload.type,
        });
      }
    } else {
      // Native: Use expo-notifications
      const Notifications = await import('expo-notifications').catch(() => null);
      if (!Notifications) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          data: payload.data || {},
          sound: true,
        },
        trigger: null, // Immediately
      });
    }

    // Notify in-app listeners
    listeners.forEach(listener => listener(payload));
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Notify driver of a new ice cream request
 */
export async function notifyDriverNewRequest(address: string, distance?: string): Promise<void> {
  await sendLocalNotification({
    type: 'new_request',
    title: '🍦 New Ice Cream Request!',
    body: `Someone at ${address} wants ice cream!${distance ? ` (${distance} away)` : ''}`,
    data: { address, distance },
  });
}

/**
 * Notify customer that driver accepted
 */
export async function notifyCustomerAccepted(driverName: string, eta: number): Promise<void> {
  await sendLocalNotification({
    type: 'request_accepted',
    title: '🚚 Ice Cream Man is Coming!',
    body: `${driverName} accepted your request! ETA: ${eta} minutes`,
    data: { driverName, eta },
  });
}

/**
 * Notify customer of driver ETA update
 */
export async function notifyCustomerETA(driverName: string, etaMessage: string): Promise<void> {
  await sendLocalNotification({
    type: 'eta_update',
    title: `🚚 ${driverName} says:`,
    body: etaMessage,
    data: { driverName, message: etaMessage },
  });
}

/**
 * Notify customer that driver is arriving
 */
export async function notifyCustomerArriving(driverName: string): Promise<void> {
  await sendLocalNotification({
    type: 'driver_arriving',
    title: '🎉 Almost There!',
    body: `${driverName} is arriving at your location now!`,
    data: { driverName },
  });
}

/**
 * Add a notification listener
 */
export function addNotificationListener(listener: NotificationListener): () => void {
  listeners.push(listener);
  return () => {
    const index = listeners.indexOf(listener);
    if (index > -1) listeners.splice(index, 1);
  };
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
  const enabled = await AsyncStorage.getItem('notificationsEnabled');
  return enabled === 'true';
}
