import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  timer: 'timer:v2',
  sessions: 'sessions:v1',
  plans: 'plans:v1',
  progress: 'progress:v1',
  settings: 'settings:v1',
  check: 'check:v1',
} as const;

// Loads an object. Fields missing from old saved data are filled from the fallback.
export async function loadObject<T extends object>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? { ...fallback, ...(JSON.parse(raw) as Partial<T>) } : fallback;
  } catch {
    return fallback;
  }
}

export async function loadArray<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

export function saveJSON(key: string, value: unknown): void {
  AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
