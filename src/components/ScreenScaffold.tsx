import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
};

/**
 * Placeholder screen wrapper used for every tab in the Foundation phase.
 * Real screen content replaces `children` usage in later plans.
 */
export function ScreenScaffold({ title, subtitle, children }: Props) {
  const theme = useTheme();
  const testID = `screen-${title.toLowerCase()}`;

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.body, { padding: theme.spacing.lg }]}>
        {subtitle ? (
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.textMuted, textTransform: 'uppercase' },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={[theme.typography.title, { color: theme.colors.textPrimary }]}>
          {title}
        </Text>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, gap: 6 },
});
