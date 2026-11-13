import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import { useFamilyStore } from '../../stores/family-store';
import { colors } from '../../ui/theme';

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <View style={[styles.icon, { borderColor: color }]}><Text style={[styles.iconText, { color }]}>{glyph}</Text></View>;
  };

export default function TabsLayout() {
  const settings = useFamilyStore((s) => s.settings);
  if (!settings) return <Redirect href="/welcome" />;
  if (!settings.fieldManualCompletedAt) return <Redirect href="/field-manual" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.yellow },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 1 },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.ink, borderTopWidth: 2 },
        tabBarLabelStyle: { fontWeight: '800', fontSize: 11 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerShown: false, tabBarIcon: icon('H') }} />
      <Tabs.Screen name="units" options={{ title: 'Artists', headerTitle: 'ROUTE DIRECTORY', tabBarIcon: icon('A') }} />
      <Tabs.Screen name="crate" options={{ title: 'My Crate', headerTitle: 'MY CRATE', tabBarIcon: icon('C') }} />
      <Tabs.Screen name="about" options={{ title: 'About', headerTitle: 'FIELD MANUAL', tabBarIcon: icon('i') }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  icon: { width: 25, height: 25, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconText: { fontSize: 12, lineHeight: 14, fontWeight: '900' },
});
