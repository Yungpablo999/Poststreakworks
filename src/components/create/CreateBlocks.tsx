import React from 'react';
import { LiveMascot } from '../mascot/LiveMascot';
import { View, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PressableCard } from '../ui/PressableCard';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds, goldTokens } from '../../theme/colors';

// Building blocks for the Create tab: tool tiles, glass list rows, drafts and
// the Voice Studio (Pro) card.

// ─── Tool tile (2 × 2 grid) ─────────────────────────────────────────────────
function TiltIcon({ hover, featured, children }: { hover: SharedValue<number>; featured?: boolean; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${-8 * hover.value}deg` }, { scale: 1 + 0.08 * hover.value }] }));
  return <Animated.View style={[styles.toolIcon, featured && styles.toolIconFeatured, style]}>{children}</Animated.View>;
}

export function ToolTile({
  title,
  subtitle,
  icon,
  featured,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  featured?: boolean;
  onPress: () => void;
}) {
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`${title}. ${subtitle}`} wrapStyle={styles.toolWrap} style={styles.toolWrap}>
      {(hover) => (
        <GlassCard strong radius={22} padding={16} style={styles.toolWrap}>
          <TiltIcon hover={hover} featured={featured}>
            {icon}
          </TiltIcon>
          <Text style={styles.toolTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.toolSub} numberOfLines={2}>
            {subtitle}
          </Text>
        </GlassCard>
      )}
    </PressableCard>
  );
}

// ─── Glass row with icon, text and a nudging chevron ────────────────────────
function Chevron({ hover }: { hover: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: 4 * hover.value }] }));
  return (
    <Animated.View style={style}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M9 6l6 6-6 6" stroke={ds.text3} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

export function GlassRow({
  title,
  subtitle,
  icon,
  extra,
  onPress,
  accessibilityLabel,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  extra?: React.ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <PressableCard onPress={onPress} accessibilityLabel={accessibilityLabel ?? `${title}. ${subtitle}`}>
      {(hover) => (
        <GlassCard strong radius={22} padding={14}>
          <View style={styles.row}>
            <View style={styles.rowIcon}>{icon}</View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {title}
              </Text>
              <Text style={styles.rowSub} numberOfLines={2}>
                {subtitle}
              </Text>
              {extra}
            </View>
            {onPress && <Chevron hover={hover} />}
          </View>
        </GlassCard>
      )}
    </PressableCard>
  );
}

// Free repurposes left this month, as small segments (no pressure copy)
export function AllowanceMeter({ left, limit }: { left: number; limit: number }) {
  return (
    <View style={styles.meterRow} accessibilityLabel={`${left} of ${limit} free this week`}>
      <View style={styles.meterBars}>
        {Array.from({ length: limit }).map((_, i) => (
          <View key={i} style={[styles.meterBar, i < left && styles.meterBarOn]} />
        ))}
      </View>
      <Text style={styles.meterText}>
        {left} of {limit} free this week
      </Text>
    </View>
  );
}

// ─── Drafts ─────────────────────────────────────────────────────────────────
export function DraftRow({
  title,
  platform,
  edited,
  image,
  onPress,
}: {
  title: string;
  platform?: string;
  edited: string;
  image?: ImageSourcePropType;
  onPress: () => void;
}) {
  const logo = platform ? (platform.toLowerCase() as PlatformLogoType) : null;
  const isPlatform = !!logo && ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'].includes(logo);
  return (
    <PressableCard onPress={onPress} accessibilityLabel={`Draft: ${title}`}>
      {(hover) => (
        <GlassCard strong radius={20} padding={12}>
          <View style={styles.row}>
            {image ? (
              <Image source={image} style={styles.draftThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.draftThumb, styles.draftDoc]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
                  <Path d="M14 3v5h5M9 13h6M9 17h4" stroke={ds.purple} strokeWidth={2} strokeLinecap="round" />
                </Svg>
              </View>
            )}
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={2}>
                {title}
              </Text>
              <View style={styles.draftMeta}>
                {isPlatform && logo && <PlatformLogo type={logo} size={16} />}
                <Text style={styles.rowSub}>
                  {platform ?? 'Draft'} · {edited}
                </Text>
              </View>
            </View>
            <Chevron hover={hover} />
          </View>
        </GlassCard>
      )}
    </PressableCard>
  );
}

export function DraftsEmpty({ onStart }: { onStart: () => void }) {
  return (
    <GlassCard radius={22} padding={18}>
      <View style={styles.emptyWrap}>
        <LiveMascot size={76} emotion="calm" />
        <Text style={styles.emptyTitle}>No drafts yet</Text>
        <Text style={styles.emptyText}>Save a post or a script as a draft and it waits here.</Text>
        <View style={styles.emptyBtn}>
          <AppButton title="Start a draft" variant="quiet" onPress={onStart} />
        </View>
      </View>
    </GlassCard>
  );
}

// ─── Voice Studio (Pro only) ────────────────────────────────────────────────
export function ProTag({ label = 'PRO' }: { label?: string }) {
  return (
    <View style={styles.proTag}>
      <Text style={styles.proChipText}>{label}</Text>
    </View>
  );
}

// Pro: Repurpose has no weekly limit
export function UnlimitedChip() {
  return (
    <View style={styles.unlimited}>
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
        <Path d="M20 6L9 17l-5-5" stroke={goldTokens.dark} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <Text style={styles.unlimitedText}>Unlimited with Pro</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  proTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    height: 20,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: goldTokens.light,
    borderWidth: 1,
    borderColor: goldTokens.border,
  },
  unlimited: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: goldTokens.light,
  },
  unlimitedText: { fontSize: 11.5, fontWeight: '800', color: goldTokens.dark },
  toolWrap: { flex: 1 },
  toolIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
    marginBottom: 12,
  },
  toolIconFeatured: { backgroundColor: ds.purple },
  toolTitle: { fontSize: 16, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  toolSub: { fontSize: 12.5, lineHeight: 17, color: ds.text2, marginTop: 2, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  rowSub: { fontSize: 12.5, lineHeight: 17, color: ds.text2, marginTop: 2 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  meterBars: { flexDirection: 'row', gap: 3 },
  meterBar: { width: 18, height: 6, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.1)' },
  meterBarOn: { backgroundColor: ds.purple },
  meterText: { fontSize: 11.5, fontWeight: '700', color: ds.text3 },
  draftThumb: { width: 48, height: 48, borderRadius: 12, backgroundColor: ds.lavender },
  draftDoc: { alignItems: 'center', justifyContent: 'center' },
  draftMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  emptyWrap: { alignItems: 'center' },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: ds.ink, marginTop: 10 },
  emptyText: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2, textAlign: 'center' },
  emptyBtn: { alignSelf: 'stretch', marginTop: 14 },
  proChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
});
