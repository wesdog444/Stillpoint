import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SocialScreen } from '../screens/SocialScreen';
import { BrowserScreen } from '../screens/BrowserScreen';
import { FrictionGateScreen } from '../screens/FrictionGateScreen';
import type { SiteKey } from '../sanitizer/types';
import type { FrictionMode } from '../state/presetStore';
import { usePresetStore } from '../state/presetStore';
import { useSessionStore } from '../state/sessionStore';
import { decideFrictionGate } from '../friction/gate';

export type SocialStackParamList = {
  SocialHome: undefined;
  FrictionGate: { siteKey: SiteKey; mode: FrictionMode; sessionId: number };
  Browser: { siteKey: SiteKey };
};

const Stack = createNativeStackNavigator<SocialStackParamList>();

export function SocialStack() {
  const activeSession = useSessionStore((state) => state.activeSession);
  const cancelSession = useSessionStore((state) => state.cancelSession);
  const presets = usePresetStore((state) => state.presets);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialHome">
        {({ navigation }) => (
          <SocialScreen
            onOpenSite={(siteKey) => {
              const activePreset = presets.find((preset) => preset.id === activeSession?.presetId);
              const decision = decideFrictionGate(activeSession, activePreset);
              if (decision.kind === 'allow') {
                navigation.navigate('Browser', { siteKey });
                return;
              }
              navigation.navigate('FrictionGate', {
                siteKey,
                mode: decision.mode,
                sessionId: decision.sessionId,
              });
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="FrictionGate">
        {({ navigation, route }) => (
          <FrictionGateScreen
            mode={route.params.mode}
            siteKey={route.params.siteKey}
            sessionId={route.params.sessionId}
            onContinue={() => navigation.replace('Browser', { siteKey: route.params.siteKey })}
            onEndSession={() => {
              cancelSession();
              navigation.popToTop();
            }}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Browser">
        {({ navigation, route }) => (
          <BrowserScreen siteKey={route.params.siteKey} onReturnHome={() => navigation.popToTop()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
