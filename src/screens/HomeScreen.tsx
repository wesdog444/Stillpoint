import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FocusOrb } from '../components/FocusOrb';
import { PresetTile } from '../components/PresetTile';
import { useTheme } from '../theme/theme';
import { usePresetStore, type FrictionMode, type Preset, type PresetDraft } from '../state/presetStore';
import { useSessionStore } from '../state/sessionStore';
import { getCompletedFocusMinutesForDay } from '../data/sessionRepository';
import { getCurrentStreak, getLongestStreak } from '../data/streakRepository';
import { todayKey } from '../lib/dates';

const STARTER_PRESETS: PresetDraft[] = [
  { name: 'Deep Work', durationMinutes: 50, frictionMode: 'hard' },
  { name: 'Reading', durationMinutes: 25, frictionMode: 'soft' },
  { name: 'Wind Down', durationMinutes: 20, frictionMode: 'intention' },
];

const FRICTION_MODES: FrictionMode[] = ['hard', 'soft', 'intention', 'cheat'];

const FRICTION_LABELS: Record<FrictionMode, string> = {
  hard: 'Hard',
  soft: 'Soft',
  intention: 'Intention',
  cheat: 'Cheat',
};

type PresetEditorDraft = {
  id: number | null;
  name: string;
  durationMinutes: string;
  frictionMode: FrictionMode;
};

export function HomeScreen() {
  const theme = useTheme();
  const presets = usePresetStore((state) => state.presets);
  const createPreset = usePresetStore((state) => state.createPreset);
  const editPreset = usePresetStore((state) => state.editPreset);
  const removePreset = usePresetStore((state) => state.removePreset);
  const activeSession = useSessionStore((state) => state.activeSession);
  const startSession = useSessionStore((state) => state.startSession);
  const tick = useSessionStore((state) => state.tick);
  const cancelSession = useSessionStore((state) => state.cancelSession);
  const dismissComplete = useSessionStore((state) => state.dismissComplete);
  const [seeded, setSeeded] = useState(false);
  const [presetDraft, setPresetDraft] = useState<PresetEditorDraft | null>(null);

  const sessionStatus = activeSession?.status ?? 'idle';
  const remainingSeconds = activeSession?.remainingSeconds ?? 0;
  const durationSeconds = activeSession ? activeSession.durationMinutes * 60 : 0;
  const focusedTodayMinutes = getCompletedFocusMinutesForDay(todayKey());
  const currentStreak = getCurrentStreak();
  const longestStreak = getLongestStreak();
  const headline = useMemo(() => {
    if (activeSession?.status === 'running') return 'Stay with the session';
    if (activeSession?.status === 'complete') return 'Nice work';
    return 'Find your stillpoint';
  }, [activeSession?.status]);

  useEffect(() => {
    if (activeSession?.status !== 'running') return undefined;

    const timer = setInterval(() => {
      tick();
    }, 1000);

    return () => clearInterval(timer);
  }, [activeSession?.status, tick]);

  const seedStarterPresets = () => {
    STARTER_PRESETS.forEach((preset) => createPreset(preset));
    setSeeded(true);
  };

  const openNewPreset = () => {
    setPresetDraft({
      id: null,
      name: '',
      durationMinutes: '25',
      frictionMode: 'soft',
    });
  };

  const openEditPreset = (preset: Preset) => {
    setPresetDraft({
      id: preset.id,
      name: preset.name,
      durationMinutes: String(preset.durationMinutes),
      frictionMode: preset.frictionMode,
    });
  };

  const savePreset = () => {
    if (!presetDraft) return;
    const name = presetDraft.name.trim();
    const durationMinutes = Number(presetDraft.durationMinutes);
    if (!name || !Number.isFinite(durationMinutes) || durationMinutes <= 0) return;

    const draft: PresetDraft = {
      name,
      durationMinutes,
      frictionMode: presetDraft.frictionMode,
    };
    if (presetDraft.id === null) {
      createPreset(draft);
    } else {
      editPreset(presetDraft.id, draft);
    }
    setPresetDraft(null);
  };

  const deletePreset = () => {
    if (presetDraft?.id === null || !presetDraft) return;
    removePreset(presetDraft.id);
    setPresetDraft(null);
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

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border }]}>
            <Text style={[theme.typography.label, styles.statLabel, { color: theme.colors.textMuted }]}>
              Focused
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {focusedTodayMinutes} min focused
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border }]}>
            <Text style={[theme.typography.label, styles.statLabel, { color: theme.colors.textMuted }]}>
              Current
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.accent }]}>
              {currentStreak} {currentStreak === 1 ? 'day' : 'day'} streak
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border }]}>
            <Text style={[theme.typography.label, styles.statLabel, { color: theme.colors.textMuted }]}>
              Best
            </Text>
            <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
              {longestStreak} longest
            </Text>
          </View>
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
            <View style={styles.headerActions}>
              <Pressable accessibilityRole="button" onPress={openNewPreset}>
                <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
                  New preset
                </Text>
              </Pressable>
              {presets.length === 0 ? (
                <Pressable accessibilityRole="button" onPress={seedStarterPresets}>
                  <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
                    Create starter presets
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {presets.length === 0 && !seeded ? (
            <Text style={[theme.typography.body, { color: theme.colors.textMuted }]}>
              Add a few starter rituals to begin. You can tune them later in Blocks.
            </Text>
          ) : null}

          {presetDraft ? (
            <View style={[styles.editor, { backgroundColor: theme.colors.bgRaised, borderColor: theme.colors.border }]}>
              <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
                {presetDraft.id === null ? 'New preset' : 'Edit preset'}
              </Text>
              <TextInput
                onChangeText={(name) => setPresetDraft((draft) => (draft ? { ...draft, name } : draft))}
                placeholder="Preset name"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.body,
                  },
                ]}
                value={presetDraft.name}
              />
              <TextInput
                keyboardType="number-pad"
                onChangeText={(durationMinutes) =>
                  setPresetDraft((draft) => (draft ? { ...draft, durationMinutes } : draft))
                }
                placeholder="Duration minutes"
                placeholderTextColor={theme.colors.textMuted}
                style={[
                  styles.input,
                  {
                    borderColor: theme.colors.border,
                    color: theme.colors.textPrimary,
                    fontFamily: theme.fontFamily.body,
                  },
                ]}
                value={presetDraft.durationMinutes}
              />
              <View style={styles.modeRow}>
                {FRICTION_MODES.map((mode) => {
                  const selected = presetDraft.frictionMode === mode;
                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={mode}
                      onPress={() =>
                        setPresetDraft((draft) => (draft ? { ...draft, frictionMode: mode } : draft))
                      }
                      style={[
                        styles.modeButton,
                        {
                          backgroundColor: selected ? theme.colors.purple600 : 'transparent',
                          borderColor: selected ? theme.colors.purple400 : theme.colors.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.label,
                          { color: selected ? theme.colors.textPrimary : theme.colors.textSecondary },
                        ]}
                      >
                        {FRICTION_LABELS[mode]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.editorActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={savePreset}
                  style={[styles.primaryButton, styles.editorButton, { backgroundColor: theme.colors.accentDeep }]}
                >
                  <Text style={[theme.typography.label, styles.buttonText, { color: theme.colors.textPrimary }]}>
                    Save preset
                  </Text>
                </Pressable>
                {presetDraft.id !== null ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={deletePreset}
                    style={[styles.secondaryButton, styles.editorButton, { borderColor: theme.colors.danger }]}
                  >
                    <Text style={[theme.typography.label, styles.buttonText, { color: theme.colors.danger }]}>
                      Delete preset
                    </Text>
                  </Pressable>
                ) : null}
                <Pressable accessibilityRole="button" onPress={() => setPresetDraft(null)}>
                  <Text style={[theme.typography.label, { color: theme.colors.textMuted }]}>
                    Cancel edit
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.presetList}>
            {presets.map((preset) => (
              <View key={preset.id} style={styles.presetShell}>
                <PresetTile
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
                <Pressable accessibilityRole="button" onPress={() => openEditPreset(preset)}>
                  <Text style={[theme.typography.label, styles.editLink, { color: theme.colors.textMuted }]}>
                    Edit {preset.name}
                  </Text>
                </Pressable>
              </View>
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
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    gap: 6,
    minHeight: 72,
    padding: 12,
  },
  statLabel: {
    textTransform: 'uppercase',
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
  headerActions: {
    alignItems: 'flex-end',
    gap: 10,
  },
  editor: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editorActions: {
    alignItems: 'center',
    gap: 12,
  },
  editorButton: {
    minWidth: 170,
  },
  presetList: {
    gap: 12,
  },
  presetShell: {
    gap: 8,
  },
  editLink: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    textTransform: 'uppercase',
  },
});
