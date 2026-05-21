import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/theme';
import type { DayFocus } from '../data/statsRepository';

type Props = {
  data: DayFocus[];
};

const CHART_HEIGHT = 120;

export function WeeklyChart({ data }: Props) {
  const theme = useTheme();
  const maxMinutes = Math.max(1, ...data.map((d) => d.minutes));

  return (
    <View style={styles.row}>
      {data.map((day) => {
        const fillHeight = Math.round((day.minutes / maxMinutes) * CHART_HEIGHT);
        return (
          <View key={day.dayKey} style={styles.column}>
            <Text style={[styles.value, { color: theme.colors.textMuted }]}>
              {day.minutes}
            </Text>
            <View style={[styles.track, { height: CHART_HEIGHT }]}>
              <View
                testID={`chart-bar-${day.dayKey}`}
                accessibilityLabel={`${day.weekday}: ${day.minutes} minutes focused`}
                style={[
                  styles.fill,
                  {
                    height: fillHeight,
                    backgroundColor: theme.colors.purple500,
                    borderRadius: theme.radius.sm,
                  },
                ]}
              />
            </View>
            <Text style={[styles.weekday, { color: theme.colors.textMuted }]}>
              {day.weekday}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  column: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 9 },
  track: { width: '100%', justifyContent: 'flex-end' },
  fill: { width: '100%', minHeight: 2 },
  weekday: { fontSize: 9 },
});
