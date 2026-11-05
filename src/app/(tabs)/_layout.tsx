import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { Text, type ColorValue } from 'react-native';
import { useFamilyStore } from '../../stores/family-store';
import { colors } from '../../ui/theme';

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;
  };

export default function TabsLayout() {
  const settings = useFamilyStore((s) => s.settings);
  if (!settings) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.cream },
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '900', letterSpacing: 1 },
        tabBarActiveTintColor: colors.goldDeep,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.paper, borderTopColor: colors.rule },
        tabBarLabelStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', headerTitle: 'REQUIRED LISTENING', tabBarIcon: icon('◉') }} />
      <Tabs.Screen name="units" options={{ title: 'Artists', tabBarIcon: icon('▦') }} />
      <Tabs.Screen name="crate" options={{ title: 'My Crate', tabBarIcon: icon('▤') }} />
      <Tabs.Screen name="about" options={{ title: 'About', tabBarIcon: icon('✎') }} />
    </Tabs>
  );
}
