import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Home as HomeIcon,
  Menu,
  RotateCw,
  Settings,
  SlidersHorizontal,
  UserRound,
  X as XIcon,
} from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { getRule } from '../sanitizer/rules';
import { buildInjection } from '../sanitizer/injection';
import type { SiteKey } from '../sanitizer/types';
import { formatElapsedSeconds } from '../ui/sessionTimer';

type Props = {
  siteKey: SiteKey;
  onReturnHome?: () => void;
};

export function BrowserScreen({ siteKey, onReturnHome }: Props) {
  const theme = useTheme();
  const rule = getRule(siteKey);
  const injection = buildInjection(rule);
  const webViewRef = useRef<WebView>(null);
  const startedAtRef = useRef(Date.now());
  const [currentUrl, setCurrentUrl] = useState(rule.url);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [toolbarOpen, setToolbarOpen] = useState(false);
  const [applying, setApplying] = useState(true);
  const [accountManagerOpen, setAccountManagerOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <SafeAreaView testID="screen-browser" style={styles.safe}>
      <View style={styles.browserPane}>
        <WebView
          ref={webViewRef}
          source={{ uri: currentUrl }}
          injectedJavaScriptBeforeContentLoaded={injection}
          injectedJavaScript={injection}
          sharedCookiesEnabled
          domStorageEnabled
          thirdPartyCookiesEnabled
          incognito={false}
          onLoadEnd={() => setApplying(false)}
          style={styles.webview}
        />

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

        <View testID="browser-timer-overlay" pointerEvents="none" style={styles.timerOverlay}>
          <Clock3 size={17} color="#85858B" />
          <Text style={[theme.typography.cardTitle, styles.statText]}>
            {formatElapsedSeconds(elapsedSeconds)}
          </Text>
        </View>

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
              accessibilityLabel="Return to Stillpoint Social"
              hitSlop={8}
              onPress={() => onReturnHome?.()}
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
              accessibilityLabel="Open account manager"
              hitSlop={8}
              onPress={() => setAccountManagerOpen(true)}
              style={styles.toolbarButton}
            >
              <UserRound size={30} color="#000000" />
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

        {accountManagerOpen ? (
          <View testID="account-manager" style={styles.accountSheet}>
            <View style={styles.accountCard}>
              <Text style={[theme.typography.cardTitle, styles.accountTitle]}>
                Account manager
              </Text>
              <Text style={[theme.typography.body, styles.accountBody]}>
                Logins are remembered by {rule.displayName} inside this WebView. Use these destinations to switch accounts, edit profile details, or return to login.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAccountManagerOpen(false)}
                style={styles.accountAction}
              >
                <Text style={[theme.typography.label, styles.accountActionText]}>
                  Continue in {rule.displayName}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAccountManagerOpen(false)}
                style={styles.accountClose}
              >
                <Text style={[theme.typography.label, styles.accountCloseText]}>Close</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  statText: { color: '#111111', fontSize: 18 },
  browserPane: { flex: 1, overflow: 'hidden' },
  webview: { flex: 1 },
  timerOverlay: {
    position: 'absolute',
    left: 14,
    top: 14,
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 20,
  },
  menuButton: {
    position: 'absolute',
    right: 22,
    top: 22,
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
    zIndex: 20,
  },
  toolbar: {
    position: 'absolute',
    left: 34,
    right: 34,
    top: 156,
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
    zIndex: 22,
  },
  toolbarButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  toolbarDivider: { width: 1, height: 36, backgroundColor: 'rgba(0,0,0,0.12)', marginHorizontal: 4 },
  accountSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.24)',
    justifyContent: 'flex-end',
    padding: 18,
  },
  accountCard: {
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    padding: 20,
    gap: 12,
  },
  accountTitle: { color: '#111111' },
  accountBody: { color: '#5F6065' },
  accountAction: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#F1F2F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountActionText: { color: '#111111' },
  accountClose: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  accountCloseText: { color: '#777777' },
  applyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    backgroundColor: '#E94F89',
    zIndex: 5,
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
