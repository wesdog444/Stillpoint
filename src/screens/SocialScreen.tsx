import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { ALL_RULES } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';

type Props = {
  /** Called with the chosen site key when a card is tapped. */
  onOpenSite: (key: SiteKey) => void;
};

export function SocialScreen({ onOpenSite }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      testID="screen-social"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          Sanitized browsing
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          Social
        </Text>

        {ALL_RULES.map((rule) => (
          <Pressable
            key={rule.key}
            testID={`site-card-${rule.key}`}
            onPress={() => onOpenSite(rule.key)}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.bgRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.card,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {rule.displayName}
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              {rule.removed.join(' / ')}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  card: { borderWidth: 1, gap: 4 },
});
