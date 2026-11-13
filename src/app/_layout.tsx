import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createRepository } from '../data/repository';
import { useFamilyStore } from '../stores/family-store';
import { colors, space, type } from '../ui/theme';

export default function RootLayout() {
  const status = useFamilyStore((s) => s.status);
  const error = useFamilyStore((s) => s.error);
  const init = useFamilyStore((s) => s.init);

  useEffect(() => {
    if (status === 'idle') void init(createRepository());
  }, [status, init]);

  if (status !== 'ready') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream, padding: space.lg }}>
        {status === 'error' ? (
          <Text style={[type.body, { color: colors.danger, textAlign: 'center' }]}>
            Couldn’t open your family’s saved data. {error}
          </Text>
        ) : (
          <ActivityIndicator color={colors.gold} />
        )}
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.yellow },
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.yellow },
          headerBackButtonDisplayMode: 'minimal',
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="unit/[id]" options={{ title: '' }} />
        <Stack.Screen name="lesson/[unitId]/[lessonId]" options={{ title: '', headerShown: false }} />
        <Stack.Screen name="project/[unitId]" options={{ title: 'Final Project' }} />
        <Stack.Screen name="crate/add" options={{ title: 'Add to My Crate', presentation: 'modal', headerStyle: { backgroundColor: colors.red }, headerTintColor: colors.paper }} />
        <Stack.Screen name="settings" options={{ title: 'Grown-up settings' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
