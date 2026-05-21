import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/theme';
import { TABS } from './tabs';
import { linking } from './linking';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const theme = useTheme();

  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.purple400,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: {
            backgroundColor: theme.colors.bgDeep,
            borderTopColor: theme.colors.border,
          },
          tabBarLabelStyle: {
            fontFamily: theme.fontFamily.bodyMedium,
            fontSize: 10,
          },
        }}
      >
        {TABS.map((tab) => (
          <Tab.Screen
            key={tab.name}
            name={tab.name}
            component={tab.component}
            options={{
              tabBarLabel: tab.label,
              tabBarIcon: ({ size, color }) => <tab.icon size={size} color={color} />,
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
