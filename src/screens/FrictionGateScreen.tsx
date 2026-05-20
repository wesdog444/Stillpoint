import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';
import { getRule } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';
import type { FrictionMode } from '../state/presetStore';
import { insertIntention } from '../data/intentionRepository';
import {
  DEFAULT_CHEAT_PASS_LIMIT,
  getCheatPassStatus,
  useCheatPass,
} from '../data/cheatPassRepository';
import { todayKey } from '../lib/dates';

type Props = {
  mode: FrictionMode;
  siteKey: SiteKey;
  sessionId: number;
  onContinue: () => void;
  onEndSession: () => void;
  softDelaySeconds?: number;
  cheatPassLimit?: number;
};

const MODE_TITLE: Record<FrictionMode, string> = {
  hard: 'Stay with this session',
  soft: 'Pause before opening',
  intention: 'Set an intention',
  cheat: 'Use a cheat pass',
};

export function FrictionGateScreen({
  mode,
  siteKey,
  sessionId,
  onContinue,
  onEndSession,
  softDelaySeconds = 30,
  cheatPassLimit = DEFAULT_CHEAT_PASS_LIMIT,
}: Props) {
  const theme = useTheme();
  const rule = getRule(siteKey);
  const [remainingDelay, setRemainingDelay] = useState(softDelaySeconds);
  const [intention, setIntention] = useState('');
  const [error, setError] = useState<string | null>(null);
  const today = todayKey();
  const cheatStatus = getCheatPassStatus(today, siteKey, cheatPassLimit);

  useEffect(() => {
    if (mode !== 'soft' || remainingDelay <= 0) return undefined;
    const timer = setInterval(() => {
      setRemainingDelay((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode, remainingDelay]);

  const saveIntention = () => {
    const trimmed = intention.trim();
    if (trimmed.length < 8) {
      setError('Write at least 8 characters.');
      return;
    }
    insertIntention({
      createdAt: new Date().toISOString(),
      text: trimmed,
      siteKey,
      sessionId,
    });
    onContinue();
  };

  const consumePass = () => {
    if (useCheatPass(today, siteKey, cheatPassLimit)) {
      onContinue();
    }
  };

  return (
    <SafeAreaView
      testID="screen-friction-gate"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.panel, { padding: theme.spacing.lg, gap: theme.spacing.md }]}>
        <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
          {rule.displayName}
        </Text>
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {MODE_TITLE[mode]}
        </Text>
        <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
          Stillpoint can open the calm web version, but this focus session asks for one
          deliberate pause first.
        </Text>

        {mode === 'hard' && (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            This preset does not allow browsing until the session ends.
          </Text>
        )}

        {mode === 'intention' && (
          <View style={{ gap: theme.spacing.sm }}>
            <TextInput
              accessibilityLabel="Intention reason"
              placeholder="Why are you opening this?"
              placeholderTextColor={theme.colors.textMuted}
              value={intention}
              onChangeText={(value) => {
                setIntention(value);
                if (error) setError(null);
              }}
              multiline
              style={[
                styles.input,
                {
                  borderColor: error ? theme.colors.danger : theme.colors.border,
                  color: theme.colors.textPrimary,
                  backgroundColor: theme.colors.bgRaised,
                  borderRadius: theme.radius.card,
                  padding: theme.spacing.md,
                },
              ]}
            />
            {error ? (
              <Text
                accessibilityLiveRegion="polite"
                style={[theme.typography.body, { color: theme.colors.danger }]}
              >
                {error}
              </Text>
            ) : null}
          </View>
        )}

        {mode === 'cheat' && (
          <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
            {cheatStatus.remainingCount > 0
              ? `${cheatStatus.remainingCount} passes left today`
              : 'No passes left today'}
          </Text>
        )}

        <View style={{ gap: theme.spacing.sm }}>
          {mode === 'soft' && (
            <GateButton
              label={
                remainingDelay > 0
                  ? `Continue in ${remainingDelay}s`
                  : `Continue to ${rule.displayName}`
              }
              disabled={remainingDelay > 0}
              onPress={onContinue}
            />
          )}
          {mode === 'intention' && (
            <GateButton label={`Continue to ${rule.displayName}`} onPress={saveIntention} />
          )}
          {mode === 'cheat' && cheatStatus.remainingCount > 0 && (
            <GateButton label="Use pass" onPress={consumePass} />
          )}
          <GateButton label="End focus session" variant="secondary" onPress={onEndSession} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function GateButton({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: variant === 'primary' ? theme.colors.purple500 : theme.colors.bgRaised,
          borderColor: variant === 'primary' ? theme.colors.purple400 : theme.colors.border,
          opacity: disabled ? 0.5 : pressed ? 0.82 : 1,
          borderRadius: theme.radius.pill,
        },
      ]}
    >
      <Text style={[theme.typography.body, { color: theme.colors.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  panel: { flex: 1, justifyContent: 'center' },
  input: { minHeight: 104, borderWidth: 1, textAlignVertical: 'top' },
  button: {
    minHeight: 48,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
