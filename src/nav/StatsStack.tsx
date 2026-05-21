import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatsScreen } from '../screens/StatsScreen';
import { IntentionsJournalScreen } from '../screens/IntentionsJournalScreen';

export type StatsStackParamList = {
  StatsHome: undefined;
  IntentionsJournal: undefined;
};

const Stack = createNativeStackNavigator<StatsStackParamList>();

export function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StatsHome">
        {({ navigation }) => (
          <StatsScreen onOpenJournal={() => navigation.navigate('IntentionsJournal')} />
        )}
      </Stack.Screen>
      <Stack.Screen name="IntentionsJournal" component={IntentionsJournalScreen} />
    </Stack.Navigator>
  );
}
