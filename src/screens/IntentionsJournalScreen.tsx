import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { getAllIntentions } from '../data/intentionRepository';

export function IntentionsJournalScreen() {
  const theme = useTheme();
  const intentions = getAllIntentions();

  return (
    <SafeAreaView
      testID="screen-intentions-journal"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          Intentions journal
        </Text>

        {intentions.length === 0 ? (
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            No intentions logged yet
          </Text>
        ) : (
          intentions.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entry,
                { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
              ]}
            >
              <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                {`"${entry.text}"`}
              </Text>
              <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
                {entry.created_at}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  entry: { borderWidth: 1, padding: 14, gap: 4 },
});
