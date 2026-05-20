import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FocusOrb } from '../components/FocusOrb';
import { PresetTile } from '../components/PresetTile';
import { useTheme } from '../theme/theme';
import { usePresetStore, type PresetDraft } from '../state/presetStore';
import { useSessionStore } from '../state/sessionStore';

const STARTER_PRESETS: PresetDraft[] = [
  { name: 'Deep Work', durationMinutes: 50, frictionMode: 'hard' },
  { name: 'Reading', durationMinutes: 25, frictionMode: 'soft' },
  { name: 'Wind Down', durationMinutes: 20, frictionMode: 'intention' },
];

export function HomeScreen() {
  const theme = useTheme();
  const presets = usePresetStore((state) => state.presets);
  const createPreset = usePresetStore((state) => state.createPreset);
  const activeSession = useSessionStore((state) => state.activeSession);
  const startSession = useSessionStore((state) => state.startSession);
  const cancelSession = useSessionStore((state) => state.cancelSession);
  const dismissComplete = useSessionStore((state) => state.dismissComplete);
  const [seeded, setSeeded] = useState(false);

  const sessionStatus = activeSession?.status ?? 'idle';
  const remainingSeconds = activeSession?.remainingSeconds ?? 0;
  const durationSeconds = activeSession ? activeSession.durationMinutes * 60 : 0;
  const headline = useMemo(() => {
    if (activeSession?.status === 'running') return 'Stay with the session';
    if (activeSession?.status === 'complete') return 'Nice work';
    return 'Find your stillpoint';
  }, [activeSession?.status]);

  const seedStarterPresets = () => {
    STARTER_PRESETS.forEach((preset) => createPreset(preset));
    setSeeded(true);
  };

  return (
    <SafeAreaView testID="screen-home" style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={[theme.typography.label, styles.meta, { color: theme.colors.accent }]}>
            Today
          </Text>
          <Text style={[theme.typography.title, styles.title, { color: theme.colors.textPrimary }]}>
            {headline}
          </Text>
          <Text style={[theme.typography.body, styles.subtitle, { color: theme.colors.textSecondary }]}>
            Start small, keep the phone quiet, and make the calm version the easy path.
          </Text>
        </View>

        <FocusOrb
          durationSeconds={durationSeconds}
          remainingSeconds={remainingSeconds}
          status={sessionStatus}
        />

        {activeSession ? (
          <View style={styles.actions}>
            {activeSession.status === 'complete' ? (
              <Pressable
                accessibilityRole="button"
                onPress={dismissComplete}
                style={[styles.primaryButton, { backgroundColor: theme.colors.accentDeep }]}
              >
                <Text style={[theme.typography.label, styles.buttonText, { color: theme.colors.textPrimary }]}>
                  Done
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={cancelSession}
                style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
              >
                <Text style={[theme.typography.label, styles.buttonText, { color: theme.colors.textSecondary }]}>
                  Cancel
                </Text>
              </Pressable>
            )}
          </View>
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              Quick Presets
            </Text>
            {presets.length === 0 ? (
              <Pressable accessibilityRole="button" onPress={seedStarterPresets}>
                <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
                  Create starter presets
                </Text>
              </Pressable>
            ) : null}
          </View>

          {presets.length === 0 && !seeded ? (
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
              Add a few starter rituals to begin. You can tune them later in Blocks.
            </Text>
          ) : null}

          <View style={styles.presetList}>
            {presets.map((preset) => (
              <PresetTile
                key={preset.id}
                durationMinutes={preset.durationMinutes}
                frictionMode={preset.frictionMode}
                name={preset.name}
                onPress={() =>
                  startSession({
                    durationMinutes: preset.durationMinutes,
                    presetId: preset.id,
                  })
                }
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    gap: 28,
    padding: 24,
    paddingBottom: 40,
  },
  hero: {
    gap: 10,
  },
  meta: {
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 30,
  },
  subtitle: {
    lineHeight: 21,
  },
  actions: {
    alignItems: 'center',
    gap: 12,
  },
  primaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    minWidth: 144,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  secondaryButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 144,
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  buttonText: {
    textTransform: 'uppercase',
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  presetList: {
    gap: 12,
  },
});
