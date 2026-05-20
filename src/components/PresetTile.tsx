import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { FrictionMode } from '../state/presetStore';
import { useTheme } from '../theme/theme';
import { formatDurationLabel } from '../ui/time';

type Props = {
  name: string;
  durationMinutes: number;
  frictionMode: FrictionMode;
  onPress: () => void;
};

const FRICTION_LABEL: Record<FrictionMode, string> = {
  hard: 'Hard',
  soft: 'Soft',
  intention: 'Intention',
  cheat: 'Cheat',
};

export function PresetTile({ name, durationMinutes, frictionMode, onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.colors.bgRaised,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text style={[theme.typography.cardTitle, styles.name, { color: theme.colors.textPrimary }]}>
          {name}
        </Text>
        <Text style={[theme.typography.label, styles.mode, { color: theme.colors.accent }]}>
          {FRICTION_LABEL[frictionMode]}
        </Text>
      </View>
      <Text style={[theme.typography.body, { color: theme.colors.textSecondary }]}>
        {formatDurationLabel(durationMinutes)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    minHeight: 92,
    padding: 16,
  },
  headerRow: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  name: {
    flex: 1,
  },
  mode: {
    textTransform: 'uppercase',
  },
});
