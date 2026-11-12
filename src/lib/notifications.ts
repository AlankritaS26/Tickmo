import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Phase } from './timer';

const CHANNEL_ID = 'timer';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      // Android 13+ only shows the permission prompt after a channel exists.
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Timer alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 300, 200, 300],
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return true;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.status === 'granted';
  } catch {
    return false;
  }
}

function message(phase: Phase, goal?: string) {
  if (phase === 'focus') {
    return {
      title: 'Pomodoro done. Mo is proud of you.',
      body: goal ? `Did you finish "${goal}"? Open Tickmo to tick it off.` : 'Take a short break.',
    };
  }
  if (phase === 'short') return { title: 'Break over', body: 'Next session is waiting. One more?' };
  return { title: 'Long break over', body: 'Fresh cycle. Let’s go.' };
}

export async function scheduleEnd(phase: Phase, endTime: number, goal?: string): Promise<string | null> {
  try {
    return await Notifications.scheduleNotificationAsync({
      content: message(phase, goal),
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(endTime),
        channelId: CHANNEL_ID,
      },
    });
  } catch {
    return null; // the timer still works without notifications
  }
}

export async function cancelEnd(id: string | null): Promise<void> {
  if (id) await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
