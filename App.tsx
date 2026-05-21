import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { fontAssets } from './src/theme/fonts';
import { theme } from './src/theme/theme';
import { initDatabase } from './src/data/database';
import { RootNavigator } from './src/nav/RootNavigator';
import { useSettingsStore } from './src/state/settingsStore';
import { OnboardingFlow } from './src/onboarding/OnboardingFlow';

export default function App() {
  const [fontsLoaded] = useFonts(fontAssets);
  const [dbReady, setDbReady] = useState(false);
  const onboardingComplete = useSettingsStore((s) => s.onboardingComplete);

  useEffect(() => {
    initDatabase();
    setDbReady(true);
  }, []);

  if (!fontsLoaded || !dbReady) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.bgDeep,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={theme.colors.purple400} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {onboardingComplete ? <RootNavigator /> : <OnboardingFlow />}
    </SafeAreaProvider>
  );
}
