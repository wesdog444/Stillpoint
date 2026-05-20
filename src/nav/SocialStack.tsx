import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialScreen } from '../screens/SocialScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import type { SiteKey } from '../sanitizer/types';

export type SocialStackParamList = {
  SocialHome: undefined;
  Browser: { siteKey: SiteKey };
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome">
        {({ navigation }) => (
          <SocialScreen onOpenSite={(siteKey) => navigation.navigate('Browser', { siteKey })} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Browser">
        {({ route }) => <BrowserScreen siteKey={route.params.siteKey} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
