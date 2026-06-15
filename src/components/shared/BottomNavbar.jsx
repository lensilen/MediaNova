import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const tabBarStyle = {
  backgroundColor: '#FFFFFF',
  borderTopColor: '#EFE5DE',
  borderTopWidth: 1,
  height: 76,
  paddingBottom: 10,
  paddingTop: 8,
};

function TabIcon({ color, focused, name }) {
  return (
    <View style={[styles.iconSlot, focused && styles.focusedIconSlot]}>
      <Ionicons color={color} name={name} size={22} />
    </View>
  );
}

function AddIcon({ focused }) {
  return (
    <View style={[styles.addButton, focused && styles.addButtonFocused]}>
      <Ionicons color="#FFFFFF" name="add" size={30} />
    </View>
  );
}

export function BottomNavbar() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#162D44',
        tabBarInactiveTintColor: '#7A8087',
        tabBarItemStyle: styles.tabItem,
        tabBarLabelStyle: styles.tabLabel,
        tabBarStyle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => <AddIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="audio"
        options={{
          title: 'Audio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="musical-notes" />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} name="person" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    minHeight: 58,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  iconSlot: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 38,
  },
  focusedIconSlot: {
    transform: [{ translateY: -1 }],
  },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#162D44',
    borderColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 4,
    height: 58,
    justifyContent: 'center',
    marginTop: -22,
    shadowColor: '#162D44',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    width: 58,
  },
  addButtonFocused: {
    backgroundColor: '#0F2438',
    transform: [{ scale: 1.04 }],
  },
});
