import React from 'react';
import { Text, Pressable, StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Grid2X2, HelpCircle, PartyPopper, Settings, Share2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { ALL_RULES } from '../sanitizer/rules';
import type { SiteKey } from '../sanitizer/types';

type Props = {
  /** Called with the chosen site key when a card is tapped. */
  onOpenSite: (key: SiteKey) => void;
};

const SITE_VISUALS: Record<SiteKey, { label: string; bg: string; fg: string; beta?: boolean }> = {
  instagram: { label: 'IG', bg: '#F0528A', fg: '#FFFFFF' },
  youtube: { label: 'YT', bg: '#F22828', fg: '#FFFFFF' },
  x: { label: 'X', bg: '#121212', fg: '#FFFFFF', beta: true },
  tiktok: { label: 'TT', bg: '#15151E', fg: '#FFFFFF', beta: true },
  facebook: { label: 'f', bg: '#1877F2', fg: '#FFFFFF', beta: true },
  snapchat: { label: 'SC', bg: '#FFE44D', fg: '#171717', beta: true },
};

export function SocialScreen({ onOpenSite }: Props) {
  const theme = useTheme();

  return (
    <SafeAreaView
      testID="screen-social"
      style={[styles.safe, { backgroundColor: '#F4F0E7' }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[theme.typography.title, styles.lightTitle]}>
              Stillpoint Social
            </Text>
            <Text style={[theme.typography.cardTitle, styles.lightSubtitle]}>
              Focus forward
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open social settings"
            hitSlop={10}
            style={({ pressed }) => [styles.topIconButton, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Settings size={34} color="#8E8E8E" />
          </Pressable>
        </View>

        {ALL_RULES.map((rule) => (
          <View key={rule.key} style={styles.cardShell}>
            <Pressable
              testID={`site-card-${rule.key}`}
              accessibilityRole="button"
              accessibilityLabel={`Open sanitized ${rule.displayName}`}
              accessibilityHint={`Opens ${rule.displayName} with Stillpoint preferences applied`}
              hitSlop={6}
              onPress={() => onOpenSite(rule.key)}
              style={({ pressed }) => [
                styles.cardMain,
                {
                  opacity: pressed ? 0.78 : 1,
                  transform: [{ scale: pressed ? 0.99 : 1 }],
                },
              ]}
            >
              <View style={[styles.appIcon, { backgroundColor: SITE_VISUALS[rule.key].bg }]}>
                <Text style={[theme.typography.cardTitle, { color: SITE_VISUALS[rule.key].fg }]}>
                  {SITE_VISUALS[rule.key].label}
                </Text>
              </View>
              <View style={styles.cardText}>
                <View style={styles.nameRow}>
                  <Text style={[theme.typography.cardTitle, styles.siteName]}>
                    {rule.displayName}
                  </Text>
                  {SITE_VISUALS[rule.key].beta ? (
                    <View style={styles.betaPill}>
                      <Text style={[theme.typography.label, styles.betaText]}>BETA</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
            <Pressable
              testID={`site-settings-${rule.key}`}
              accessibilityRole="button"
              accessibilityLabel={`Adjust ${rule.displayName} preferences`}
              hitSlop={10}
              style={({ pressed }) => [styles.settingsButton, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Settings size={24} color="#969696" />
            </Pressable>
            <ChevronRight size={28} color="#A8A8A8" />
          </View>
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add Stillpoint social shortcuts to Home Screen"
          style={({ pressed }) => [styles.homeCard, { opacity: pressed ? 0.82 : 1 }]}
        >
          <View style={styles.homeIcon}>
            <Grid2X2 size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={[theme.typography.cardTitle, styles.homeTitle]}>
              Add apps to Home Screen
            </Text>
            <Text style={[theme.typography.body, styles.homeSubtitle]}>
              One-tap access to every platform
            </Text>
          </View>
        </Pressable>

        <View style={styles.dots} accessibilityLabel="Social pages, page 2 of 3">
          <View style={styles.dotMuted} />
          <View style={styles.dotActive} />
          <View style={styles.dotMuted} />
        </View>

        <View style={styles.footerActions}>
          <HelpCircle size={32} color="#8F8F98" />
          <View style={styles.shareRow}>
            <Share2 size={26} color="#8F8F98" />
            <Text style={[theme.typography.cardTitle, styles.shareText]}>
              Help a friend take back their life
            </Text>
          </View>
          <PartyPopper size={32} color="#8F8F98" />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 34, paddingBottom: 32, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  lightTitle: { color: '#111111', letterSpacing: 0 },
  lightSubtitle: { color: '#9D9A95', marginTop: 2 },
  topIconButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cardShell: {
    minHeight: 92,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.64)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    shadowColor: '#D7D1C6',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  cardMain: { flex: 1, minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: 18 },
  appIcon: {
    width: 58,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  cardText: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  siteName: { color: '#111111', fontSize: 21 },
  betaPill: { backgroundColor: '#E1585C', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  betaText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 0 },
  settingsButton: {
    minWidth: 54,
    minHeight: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(225,223,217,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  homeCard: {
    marginTop: 28,
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(215,211,198,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 16,
  },
  homeIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0528A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeTitle: { color: '#111111' },
  homeSubtitle: { color: '#8F8B86' },
  dots: { flexDirection: 'row', alignSelf: 'center', gap: 8, paddingTop: 10 },
  dotMuted: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#C8C3BA' },
  dotActive: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#77736D' },
  footerActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18 },
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexShrink: 1 },
  shareText: { color: '#8F8F98', textAlign: 'center', flexShrink: 1 },
});
