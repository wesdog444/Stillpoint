import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarClock, ExternalLink, Moon, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../theme/theme';

const SCHEDULE_ROWS = [
  { label: 'Morning guardrail', time: '7:00 AM - 9:00 AM', mode: 'Open to Breathe first' },
  { label: 'Deep work', time: '10:00 AM - 12:00 PM', mode: 'Soft friction before Social' },
  { label: 'Wind down', time: '9:30 PM - 11:30 PM', mode: 'Shortcut redirects to Breathe' },
];

export function BlocksScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView testID="screen-blocks" style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[theme.typography.label, styles.meta, { color: theme.colors.accent }]}>
            Control center
          </Text>
          <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
            Redirect scheduler
          </Text>
          <Text style={[theme.typography.body, styles.subtitle, { color: theme.colors.textSecondary }]}>
            Plan when Stillpoint should feel gentle, strict, or breathe-first. iOS keeps automation toggles under your control, so this screen gives you the schedule and the exact Shortcut routes to wire up.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
          <View style={styles.cardHeader}>
            <CalendarClock size={24} color={theme.colors.accent} />
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Active hours
            </Text>
          </View>
          {SCHEDULE_ROWS.map((row) => (
            <View key={row.label} style={styles.scheduleRow}>
              <View style={styles.scheduleText}>
                <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
                  {row.label}
                </Text>
                <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
                  {row.time}
                </Text>
              </View>
              <Text style={[theme.typography.label, styles.modePill, { color: theme.colors.accent }]}>
                {row.mode}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
          <View style={styles.cardHeader}>
            <ExternalLink size={24} color={theme.colors.purple300} />
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Shortcut routes
            </Text>
          </View>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Use this URL when a redirect should land on the breathing reset:
          </Text>
          <Text style={[theme.typography.cardTitle, styles.urlText, { color: theme.colors.accent }]}>
            stillpoint://breathe
          </Text>
          <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
            For sanitized social, use stillpoint://sanitized/instagram, stillpoint://sanitized/youtube, stillpoint://sanitized/x, stillpoint://sanitized/tiktok, stillpoint://sanitized/facebook, or stillpoint://sanitized/snapchat.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
          <View style={styles.cardHeader}>
            <ShieldCheck size={24} color={theme.colors.accent} />
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Automation reality
            </Text>
          </View>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Stillpoint can guide, deep-link, and change its own friction. Apple does not let apps silently create, enable, or disable your personal Shortcuts automations.
          </Text>
        </View>

        <View style={[styles.card, { borderColor: theme.colors.border, backgroundColor: theme.colors.bgRaised }]}>
          <View style={styles.cardHeader}>
            <Moon size={24} color={theme.colors.purple300} />
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Tonight's suggestion
            </Text>
          </View>
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            Set app-open automations for Instagram and TikTok to open Stillpoint immediately, then choose the breathe route during wind-down hours.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 24, gap: 18 },
  hero: { gap: 8, marginBottom: 6 },
  meta: { textTransform: 'uppercase' },
  subtitle: { lineHeight: 22 },
  card: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  scheduleText: { flex: 1, gap: 2 },
  modePill: { flexShrink: 1, textAlign: 'right' },
  urlText: { paddingVertical: 4 },
});
