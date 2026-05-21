import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { useSettingsStore } from '../state/settingsStore';
import { requestNotificationPermission } from '../lib/notifications';
import { ONBOARDING_STEPS } from './steps';

export function OnboardingFlow() {
  const theme = useTheme();
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding);
  const [index, setIndex] = useState(0);

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
  secondaryButton: { borderWidth: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backButton: { minHeight: 48, minWidth: 64, justifyContent: 'center' },
  nextButton: { minHeight: 48, minWidth: 104, alignItems: 'center', justifyContent: 'center' },
});
