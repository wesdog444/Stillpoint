import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { useSettingsStore } from '../state/settingsStore';
import { requestNotificationPermission } from '../lib/notifications';
import { ONBOARDING_STEPS } from './steps';
import { SITE_KEYS } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';

const SOCIAL_PICKER_LABELS: Record<SiteKey, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  x: 'X',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  snapchat: 'Snapchat',
};

export function OnboardingFlow() {
  const theme = useTheme();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);
  const [selectedSites, setSelectedSites] = useState<SiteKey[]>([]);

  const step = ONBOARDING_STEPS[index];
  const isLast = index === ONBOARDING_STEPS.length - 1;

  const goNext = () => {
    if (isLast) {
      completeOnboarding();
      return;
    }
    setIndex((i) => i + 1);
  };

  const goBack = () => setIndex((i) => Math.max(0, i - 1));
  const toggleSite = (siteKey: SiteKey) => {
    setSelectedSites((current) =>
      current.includes(siteKey)
        ? current.filter((key) => key !== siteKey)
        : [...current, siteKey],
    );
  };

  return (
    <SafeAreaView
      testID="onboarding-flow"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <ScrollView contentContainerStyle={{ padding: theme.spacing.lg, gap: theme.spacing.md }}>
        <Text
          style={[
            theme.typography.label,
            { color: theme.colors.textMuted, textTransform: 'uppercase' },
          ]}
        >
          {`Step ${index + 1} of ${ONBOARDING_STEPS.length}`}
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {step.title}
        </Text>

        {step.body.map((paragraph, i) => (
          <Text
            key={`body-${i}`}
            style={[theme.typography.body, { color: theme.colors.textSecondary }]}
          >
            {paragraph}
          </Text>
        ))}

        {step.key === 'welcome' ? (
          <View
            style={[
              styles.choicePanel,
              {
                backgroundColor: theme.colors.bgRaised,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.lg,
              },
            ]}
          >
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Choose your defaults
            </Text>
            <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
              Pick the apps you want Stillpoint to make quieter first.
            </Text>
            <View style={styles.siteGrid}>
              {SITE_KEYS.map((siteKey) => {
                const selected = selectedSites.includes(siteKey);
                return (
                  <Pressable
                    key={siteKey}
                    testID={`onboarding-site-${siteKey}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${selected ? 'Selected' : 'Select'} ${SOCIAL_PICKER_LABELS[siteKey]}`}
                    hitSlop={8}
                    onPress={() => toggleSite(siteKey)}
                    style={({ pressed }) => [
                      styles.siteChip,
                      {
                        borderRadius: theme.radius.pill,
                        borderColor: selected ? theme.colors.accent : theme.colors.border,
                        backgroundColor: selected ? 'rgba(110,231,183,0.14)' : 'rgba(255,255,255,0.05)',
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.label,
                        { color: selected ? theme.colors.accent : theme.colors.textSecondary },
                      ]}
                    >
                      {SOCIAL_PICKER_LABELS[siteKey]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step.steps?.map((line, i) => (
          <Text
            key={`line-${i}`}
            style={[theme.typography.body, { color: theme.colors.textPrimary }]}
          >
            {`${i + 1}. ${line}`}
          </Text>
        ))}

        {step.requestsNotificationPermission ? (
          <Pressable
            testID="onboarding-enable-notifications"
            accessibilityRole="button"
            onPress={() => {
              void requestNotificationPermission();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              {
                borderColor: theme.colors.accent,
                borderRadius: theme.radius.card,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <Text style={[theme.typography.body, { color: theme.colors.accent }]}>
              Enable reminders
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>

      <View style={[styles.nav, { padding: theme.spacing.lg }]}>
        {index > 0 ? (
          <Pressable
            testID="onboarding-back"
            accessibilityRole="button"
            onPress={goBack}
            style={styles.backButton}
          >
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
              Back
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        <Pressable
          testID="onboarding-next"
          accessibilityRole="button"
          onPress={goNext}
          style={({ pressed }) => [
            styles.nextButton,
            {
              backgroundColor: theme.colors.purple500,
              borderRadius: theme.radius.card,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
        >
          <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
            {isLast ? 'Finish' : 'Next'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  choicePanel: { borderWidth: 1, gap: 12, padding: 16 },
  siteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  siteChip: { borderWidth: 1, minHeight: 44, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  secondaryButton: { borderWidth: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { minHeight: 48, minWidth: 64, justifyContent: 'center' },
  nextButton: { minHeight: 48, minWidth: 104, alignItems: 'center', justifyContent: 'center' },
});
