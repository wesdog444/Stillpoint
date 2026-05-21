import * as Notifications from 'expo-notifications';

/**
 * Requests the OS notification permission.
 * Returns true if the user granted it, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const result = await Notifications.requestPermissionsAsync();
  return result.status === 'granted';
}
