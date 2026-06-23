import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "../../constants/theme";

const tabIcons = {
  index: ["home", "home-outline"],
  add: ["add-circle", "add-circle-outline"],
  profile: ["person", "person-outline"],
};

function getTabIcon(routeName, focused) {
  const [activeIcon, inactiveIcon] = tabIcons[routeName] || tabIcons.index;

  return focused ? activeIcon : inactiveIcon;
}

export default function TabsLayout() {
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={getTabIcon("index", focused)}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Create",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={getTabIcon("add", focused)}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={getTabIcon("profile", focused)}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
