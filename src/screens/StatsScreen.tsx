import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { WeeklyChart } from '../components/WeeklyChart';
import { getWeeklyFocusMinutes } from '../data/statsRepository';
import { getCurrentStreak, getLongestStreak } from '../data/streakRepository';
import { getAllIntentions } from '../data/intentionRepository';

type Props = {
  /** Opens the full intentions journal. */
  onOpenJournal: () => void;
};

export function StatsScreen({ onOpenJournal }: Props) {
  const theme = useTheme();
  const week = getWeeklyFocusMinutes();
  const weekTotal = week.reduce((sum, day) => sum + day.minutes, 0);
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();
  const intentions = getAllIntentions();
  const latestIntention = intentions[0];

  return (
    <SafeAreaView
      testID="screen-stats"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          This week
        </Text>
        <Text style={[theme.typography.heroNumber, { color: theme.colors.textPrimary }]}>
          {weekTotal} min this week
        </Text>

        <WeeklyChart data={week} />

        <View style={styles.statRow}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
              Current streak
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {currentStreak} days
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
            ]}
          >
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
              Longest streak
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {longestStreak} days
            </Text>
          </View>
        </View>

        <Pressable
          testID="journal-preview"
          onPress={onOpenJournal}
          accessibilityRole="button"
          style={[
            styles.journal,
            { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border, borderRadius: theme.radius.card },
          ]}
        >
          <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
            Intentions journal · {intentions.length}
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            {latestIntention ? `"${latestIntention.text}"` : 'No intentions logged yet'}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  statRow: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, borderWidth: 1, padding: 14, gap: 4 },
  journal: { borderWidth: 1, padding: 14, gap: 4 },
});
