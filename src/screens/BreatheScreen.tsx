import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Wind } from 'lucide-react-native';
import { useTheme } from '../theme/theme';

const PHASES = ['Inhale', 'Hold', 'Exhale', 'Rest'] as const;

export function BreatheScreen() {
  const theme = useTheme();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const phase = PHASES[phaseIndex];

  return (
    <SafeAreaView testID="screen-breathe" style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}>
      <View style={styles.content}>
        <Text style={[theme.typography.label, { color: theme.colors.accent, textTransform: 'uppercase' }]}>
          Shortcut reset
        </Text>
        <Text style={[theme.typography.title, styles.title, { color: theme.colors.textPrimary }]}>
          Breathe
        </Text>
        <Text style={[theme.typography.body, styles.subtitle, { color: theme.colors.textSecondary }]}>
          Open this from Shortcuts when the reflex hits. Tap the orb to move through one quiet cycle.
        </Text>

        <Pressable
          testID="breathe-orb"
          accessibilityRole="button"
          accessibilityLabel={`Breathing phase: ${phase}`}
          hitSlop={12}
          onPress={() => setPhaseIndex((current) => (current + 1) % PHASES.length)}
          style={({ pressed }) => [
            styles.orb,
            {
              backgroundColor: pressed ? theme.colors.purple600 : theme.colors.purple500,
              borderColor: theme.colors.purple300,
              shadowColor: theme.colors.purple400,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          <Wind size={44} color={theme.colors.textPrimary} />
          <Text style={[theme.typography.cardTitle, styles.phase, { color: theme.colors.textPrimary }]}>
            {phase}
          </Text>
        </Pressable>

        <Text style={[theme.typography.body, styles.cue, { color: theme.colors.textMuted }]}>
          Four counts in. Four counts still. Four counts out.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 28 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', maxWidth: 320 },
  orb: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 14 },
    elevation: 8,
  },
  phase: { textAlign: 'center' },
  cue: { textAlign: 'center' },
});
