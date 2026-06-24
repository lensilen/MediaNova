  import { Tabs } from 'expo-router';

  import { colors } from '../../constants/theme';

  export function BottomNavbar() {
    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
          },
        }}>
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="add" options={{ title: 'Create' }} />
        <Tabs.Screen name="audio" options={{ href: null }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    );
  }
