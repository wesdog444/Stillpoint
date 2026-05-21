import { requestNotificationPermission } from '../notifications';

const expoNotifications = require('expo-notifications');

describe('requestNotificationPermission', () => {
  beforeEach(() => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockClear();
  });

  it('returns true when permission is granted', async () => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'granted',
    });
    await expect(requestNotificationPermission()).resolves.toBe(true);
  });

  it('returns false when permission is denied', async () => {
    (expoNotifications.requestPermissionsAsync as jest.Mock).mockResolvedValueOnce({
      status: 'denied',
    });
    await expect(requestNotificationPermission()).resolves.toBe(false);
  });

  it('calls expo-notifications requestPermissionsAsync', async () => {
    await requestNotificationPermission();
    expect(expoNotifications.requestPermissionsAsync).toHaveBeenCalled();
  });
});
