import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#800000',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          color: '#800000',
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.grid.2x2" color="#800000" />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="list.bullet" color="#800000" />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="bag.fill" color="#800000" />,
        }}
      />
       <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="square.stack.fill" color="#800000" />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color="#800000" />,
        }}
      />
    </Tabs>
  );
}