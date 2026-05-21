import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, ShieldCheck, Sparkles, TimerReset } from 'lucide-react-native';
import { getCompletedFocusMinutesForDay } from '../data/sessionRepository';
import { getCurrentStreak, getLongestStreak } from '../data/streakRepository';
import { todayKey } from '../lib/dates';
import { useTheme } from '../theme/theme';

export function ProfileScreen() {
  const theme = useTheme();
  const focusedToday = getCompletedFocusMinutesForDay(todayKey());
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();

  return (
    <SafeAreaView testID="screen-profile" style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[theme.typography.label, styles.meta, { color: theme.colors.accent }]}>
            Personal Edition
          </Text>
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
            Your Stillpoint
          </Text>
          <Text style={[theme.typography.body, styles.subtitle, { color: theme.colors.textSecondary }]}>
            A quick read on focus, social friction, shortcuts, and what this sideloaded build can honestly control.
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>Focused today</Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {focusedToday} min
            </Text>
          </View>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>Current streak</Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.accent }]}>
              {currentStreak} day
            </Text>
          </View>
          <View style={[styles.statCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
            <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>Best streak</Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {longestStreak} days
            </Text>
          </View>
        </View>

        <InfoCard
          icon={<ShieldCheck size={24} color={theme.colors.accent} />}
          title="Sanitized Social"
          body="Instagram, YouTube, X, TikTok, Facebook, and Snapchat open inside Stillpoint's mini-app shell with calmer defaults."
        />
        <InfoCard
          icon={<Link size={24} color={theme.colors.purple300} />}
          title="Shortcut routes"
          body="Use stillpoint://breathe for app-open automations that should land on the breathing reset."
        />
        <InfoCard
          icon={<TimerReset size={24} color={theme.colors.accent} />}
          title="Logins are remembered"
          body="Social logins are remembered by each site inside the persistent WebView. Stillpoint does not store your passwords."
        />
        <InfoCard
          icon={<Sparkles size={24} color={theme.colors.purple300} />}
          title="Personal Edition"
          body="This sideloaded build uses Shortcuts redirects and Stillpoint friction. Native Screen Time controls require Apple's restricted entitlement."
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.infoCard, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
      <View style={styles.infoHeader}>
        {icon}
        <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>{title}</Text>
      </View>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 18 },
  hero: { gap: 8 },
  meta: { textTransform: 'uppercase' },
  subtitle: { lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 12, gap: 6 },
  infoCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 10 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
