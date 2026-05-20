import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/theme';
import { formatTimer } from '../ui/time';

type Props = {
  remainingSeconds: number;
  durationSeconds: number;
  status: 'idle' | 'running' | 'complete';
  onPress?: () => void;
};

export function FocusOrb({ remainingSeconds, durationSeconds, status, onPress }: Props) {
  const theme = useTheme();
  const progress =
    status === 'complete'
      ? 1
      : durationSeconds > 0
        ? Math.min(1, Math.max(0, 1 - remainingSeconds / durationSeconds))
        : 0;
  const progressLabel = `${Math.round(progress * 100)}%`;
  const radius = 86;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const primaryText =
    status === 'idle' ? 'Ready' : status === 'complete' ? 'Complete' : formatTimer(remainingSeconds);
  const secondaryText =
    status === 'idle'
      ? 'Tap a preset to begin'
      : status === 'complete'
        ? 'Session finished'
        : 'Focus in progress';

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      testID="focus-orb"
      style={[styles.shell, { borderColor: theme.colors.border }]}
    >
      <Svg height={220} width={220} viewBox="0 0 220 220" style={styles.svg}>
        <Defs>
          <RadialGradient id="orbGlow" cx="50%" cy="42%" rx="55%" ry="55%">
            <Stop offset="0%" stopColor={theme.colors.purple300} stopOpacity="0.95" />
            <Stop offset="58%" stopColor={theme.colors.purple500} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={theme.colors.purple900} stopOpacity="0.2" />
          </RadialGradient>
        </Defs>
        <Circle cx="110" cy="110" r="74" fill="url(#orbGlow)" />
        <Circle
          cx="110"
          cy="110"
          fill="transparent"
          opacity={0.22}
          r={radius}
          stroke={theme.colors.purple300}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx="110"
          cy="110"
          fill="transparent"
          r={radius}
          rotation="-90"
          origin="110, 110"
          stroke={status === 'complete' ? theme.colors.accent : theme.colors.purple400}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
        />
      </Svg>
      <View style={styles.copy}>
        <Text style={[theme.typography.heroNumber, styles.primaryText, { color: theme.colors.textPrimary }]}>
          {primaryText}
        </Text>
        <Text style={[theme.typography.label, styles.secondaryText, { color: theme.colors.textSecondary }]}>
          {secondaryText}
        </Text>
        <Text testID="focus-orb-progress" style={styles.hiddenProgress}>
          {progressLabel}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 120,
    borderWidth: 1,
    height: 240,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 240,
  },
  svg: {
    position: 'absolute',
  },
  copy: {
    alignItems: 'center',
    gap: 8,
  },
  primaryText: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  secondaryText: {
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  hiddenProgress: {
    height: 0,
    opacity: 0,
  },
});
