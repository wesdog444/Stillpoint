import React from 'react';
import { getFocusedRouteNameFromRoute, NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../theme/theme';
import { TABS } from './tabs';
import { linking } from './linking';
import { BreatheScreen } from '../screens/BreatheScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  const theme = useTheme();
  const visibleTabBarStyle = {
    backgroundColor: theme.colors.bgDeep,
    borderTopColor: theme.colors.border,
  };

  return (
    <NavigationContainer linking={linking}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.purple400,
          tabBarInactiveTintColor: theme.colors.textMuted,
          tabBarStyle: visibleTabBarStyle,
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
            options={({ route }) => {
              const focusedRoute = getFocusedRouteNameFromRoute(route);
              const socialRoute = tab.name === 'Social' ? focusedRoute ?? 'SocialHome' : undefined;
              return {
                tabBarLabel: tab.label,
                tabBarIcon: ({ size, color }) => <tab.icon size={size} color={color} />,
                tabBarStyle:
                  socialRoute === 'Browser'
                    ? { ...visibleTabBarStyle, display: 'none' }
                    : visibleTabBarStyle,
              };
            }}
          />
        ))}
        <Tab.Screen
          name="Breathe"
          component={BreatheScreen}
          options={{
            tabBarButton: () => null,
            tabBarItemStyle: { display: 'none' },
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
