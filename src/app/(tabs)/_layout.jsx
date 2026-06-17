import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "../../constants/theme";

const tabIcons = {
  index: ["home", "home-outline"],
  search: ["search", "search-outline"],
  add: ["add-circle", "add-circle-outline"],
  audio: ["musical-notes", "musical-notes-outline"],
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
          title: "Search",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={getTabIcon("search", focused)}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "Add",
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
          title: "Audio",
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={getTabIcon("audio", focused)}
              size={size}
            />
          ),
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
