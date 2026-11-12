import { useEffect, useMemo } from 'react';
import { ColorValue } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppProvider, useApp, useColors } from '../state/AppProvider';
import { setupNotifications } from '../lib/notifications';
import { CheckModal } from '../components/CheckModal';
import { CelebrationModal } from '../components/CelebrationModal';

type IconName = keyof typeof Ionicons.glyphMap;
const icon =
  (name: IconName) =>
  ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color as string} size={size} />
  );

function KeepAwake() {
  useKeepAwake();
  return null;
}

function Shell() {
  const { ready, timer } = useApp();
  const c = useColors();
  useEffect(() => {
    setupNotifications();
  }, []);

  // Navigation colours follow the selected theme.
  const navTheme = useMemo(() => {
    const base = c.dark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: { ...base.colors, background: c.bg, card: c.card, primary: c.focus, text: c.text, border: c.card },
    };
  }, [c]);

  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style={c.dark ? 'light' : 'dark'} />
      {timer.status === 'running' ? <KeepAwake /> : null}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.focus,
          tabBarInactiveTintColor: c.muted,
          tabBarStyle: { backgroundColor: c.card, borderTopColor: c.card },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Timer', tabBarIcon: icon('timer-outline') }} />
        <Tabs.Screen name="plan" options={{ title: 'Plan', tabBarIcon: icon('list-outline') }} />
        <Tabs.Screen name="report" options={{ title: 'Report', tabBarIcon: icon('bar-chart-outline') }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('person-outline') }} />
      </Tabs>
      {ready ? (
        <>
          <CheckModal />
          <CelebrationModal />
        </>
      ) : null}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
