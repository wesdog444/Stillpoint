import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Frown,
  Home as HomeIcon,
  Menu,
  RotateCw,
  Settings,
  SlidersHorizontal,
  X as XIcon,
} from 'lucide-react-native';
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
  const webViewRef = useRef<WebView>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [applying, setApplying] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const elapsedLabel = `0:${String(elapsedSeconds).padStart(2, '0')}`;

  return (
    <SafeAreaView
      testID="screen-browser"
      style={styles.safe}
    >
      <View style={styles.statusBar}>
        <View style={styles.stats}>
          <Clock3 size={19} color="#85858B" />
          <Text style={[theme.typography.cardTitle, styles.statText]}>{elapsedLabel}</Text>
          <Text style={[theme.typography.cardTitle, styles.dotText]}>·</Text>
          <Text style={[theme.typography.cardTitle, styles.statText]}>0 ads</Text>
          <Text style={[theme.typography.cardTitle, styles.dotText]}>·</Text>
          <Text style={[theme.typography.cardTitle, styles.statText]}>0 suggested</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open sanitizer preferences"
          hitSlop={8}
          style={({ pressed }) => [styles.prefButton, { opacity: pressed ? 0.78 : 1 }]}
        >
          <Text style={[theme.typography.cardTitle, styles.prefText]}>Block these</Text>
        </Pressable>
      </View>
      <View style={styles.browserPane}>
        <WebView
          ref={webViewRef}
          source={{ uri: rule.url }}
          injectedJavaScript={injection}
          sharedCookiesEnabled
          domStorageEnabled
          onLoadEnd={() => setApplying(false)}
          style={styles.webview}
        />
        <Pressable
          testID="browser-toolbar-toggle"
          accessibilityRole="button"
          accessibilityLabel={toolbarOpen ? 'Close browser controls' : 'Open browser controls'}
          hitSlop={10}
          onPress={() => setToolbarOpen((open) => !open)}
          style={({ pressed }) => [
            styles.menuButton,
            {
              opacity: pressed ? 0.78 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
        >
          {toolbarOpen ? <XIcon size={33} color="#000000" /> : <Menu size={33} color="#000000" />}
        </Pressable>
        {toolbarOpen ? (
          <View testID="browser-floating-toolbar" style={styles.toolbar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              hitSlop={8}
              onPress={() => webViewRef.current?.goBack()}
              style={styles.toolbarButton}
            >
              <ArrowLeft size={28} color="#9D9D9D" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Go to ${rule.displayName} home`}
              hitSlop={8}
              onPress={() => webViewRef.current?.reload()}
              style={styles.toolbarButton}
            >
              <HomeIcon size={30} color="#000000" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh"
              hitSlop={8}
              onPress={() => webViewRef.current?.reload()}
              style={styles.toolbarButton}
            >
              <RotateCw size={28} color="#000000" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go forward"
              hitSlop={8}
              onPress={() => webViewRef.current?.goForward()}
              style={styles.toolbarButton}
            >
              <ArrowRight size={28} color="#B8B8B8" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Report a stressful surface"
              hitSlop={8}
              style={styles.toolbarButton}
            >
              <Frown size={30} color="#000000" />
            </Pressable>
            <View style={styles.toolbarDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open site preferences"
              hitSlop={8}
              style={styles.toolbarButton}
            >
              <Settings size={30} color="#000000" />
            </Pressable>
          </View>
        ) : null}
        {applying ? (
          <View pointerEvents="none" style={styles.applyingOverlay}>
            <View style={styles.applyingIcon}>
              <SlidersHorizontal size={42} color="#FFFFFF" />
            </View>
            <Text style={[theme.typography.label, styles.applyingSite]}>
              {rule.displayName}
            </Text>
            <Text style={[theme.typography.title, styles.applyingTitle]}>
              Applying your preferences
            </Text>
            <Text style={[theme.typography.cardTitle, styles.applyingSubtitle]}>
              Setting up content filters for {rule.displayName}
            </Text>
            <View style={styles.loadingDots}>
              <View style={styles.loadingDotMuted} />
              <View style={styles.loadingDotActive} />
              <View style={styles.loadingDotMuted} />
            </View>
          </View>
        ) : null}
      </View>
      {/* sharedCookiesEnabled and domStorageEnabled keep site login sessions persisted. */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  statusBar: {
    minHeight: 78,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D7D7D7',
    backgroundColor: '#FFFFFF',
  },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 7, flexShrink: 1 },
  statText: { color: '#111111', fontSize: 18 },
  dotText: { color: '#767676', fontSize: 18 },
  prefButton: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A95EA',
  },
  prefText: { color: '#FFFFFF' },
  browserPane: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1 },
  menuButton: {
    position: 'absolute',
    right: 22,
    top: 34,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(242,244,244,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7,
  },
  toolbar: {
    position: 'absolute',
    left: 34,
    right: 34,
    top: 190,
    minHeight: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(238,240,238,0.88)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 14,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  toolbarButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  toolbarDivider: { width: 1, height: 36, backgroundColor: 'rgba(0,0,0,0.12)', marginHorizontal: 4 },
  applyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#E94F89',
  },
  applyingIcon: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  applyingSite: { color: 'rgba(255,255,255,0.72)', textTransform: 'uppercase' },
  applyingTitle: { color: '#FFFFFF', textAlign: 'center' },
  applyingSubtitle: { color: 'rgba(255,255,255,0.66)', textAlign: 'center', paddingHorizontal: 28 },
  loadingDots: { flexDirection: 'row', gap: 8, paddingTop: 4 },
  loadingDotMuted: { width: 9, height: 9, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.38)' },
  loadingDotActive: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#FFFFFF' },
});
