import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { supabase } from '@repo/ai-engine'; // Your shared engine

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Listen for Auth State Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!session && !inAuthGroup) {
        // No user logged in -> Force Login screen
        router.replace('/(auth)/login');
      } else if (session && inAuthGroup) {
        // User logged in -> Send to Main App
        router.replace('/(tabs)');
      }
    });

    return () => subscription.unsubscribe();
  }, [segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* Auth Group (Login/Signup) */}
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        
        {/* Main App Group */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Modals/Others */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}