import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { useTheme } from '../theme/theme';
import { getRule } from '../sanitizer/rules';
import { buildInjection } from '../sanitizer/injection';
import type { SiteKey } from '../sanitizer/types';

type Props = {
  siteKey: SiteKey;
};

export function BrowserScreen({ siteKey }: Props) {
  const theme = useTheme();
  const rule = getRule(siteKey);
  const injection = buildInjection(rule);

  return (
    <SafeAreaView
      testID="screen-browser"
      style={[styles.safe, { backgroundColor: theme.colors.bgDeep }]}
    >
      <View style={[styles.header, { padding: theme.spacing.md }]}>
        <Text style={[theme.typography.cardTitle, { color: theme.colors.textPrimary }]}>
          {rule.displayName}
        </Text>
        <Text style={[theme.typography.label, { color: theme.colors.accent }]}>
          Sanitized
        </Text>
      </View>
      <WebView
        source={{ uri: rule.url }}
        injectedJavaScript={injection}
        sharedCookiesEnabled
        domStorageEnabled
        style={styles.webview}
      />
      {/* sharedCookiesEnabled and domStorageEnabled keep site login sessions persisted. */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webview: { flex: 1 },
});
