import React, { useEffect } from 'react';
import { LiveMascot } from '../mascot/LiveMascot';
import { View, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
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
const BARS = [0.45, 0.7, 0.9, 0.6, 1, 0.75, 0.95, 0.55, 0.4];

function WaveBar({ index, base }: { index: number; base: number }) {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(base);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withDelay(
      index * 70,
      withRepeat(withTiming(0.3 + (1 - base) * 0.4, { duration: 380 + index * 35, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
  }, [reduceMotion, index, base, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ scaleY: t.value }] }));
  return <Animated.View style={[styles.waveBar, index % 3 === 1 && styles.waveBarGold, style]} />;
}

export function VoiceStudioProCard({ onUnlock }: { onUnlock: () => void }) {
  return (
    <GlassCard strong radius={26} padding={20}>
      <View pointerEvents="none" style={styles.goldGlow}>
        <Svg width={240} height={240}>
          <Defs>
            <RadialGradient id="vsGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={ds.gold} stopOpacity={0.2} />
              <Stop offset="100%" stopColor={ds.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={120} cy={120} r={120} fill="url(#vsGlow)" />
        </Svg>
      </View>

      <View style={styles.vsTop}>
        <View style={styles.vsText}>
          <View style={styles.proChip}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
              <Rect x="5" y="11" width="14" height="10" rx="2" stroke={goldTokens.dark} strokeWidth={2.8} />
              <Path d="M8 11V8a4 4 0 118 0v3" stroke={goldTokens.dark} strokeWidth={2.8} strokeLinecap="round" />
            </Svg>
            <Text style={styles.proChipText}>PRO</Text>
          </View>
          <Text style={styles.vsTitle}>Voice Studio</Text>
          <Text style={styles.vsSub}>Your scripts, read aloud in your own voice.</Text>
        </View>
      </View>

      <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((b, i) => (
          <WaveBar key={i} index={i} base={b} />
        ))}
      </View>

      <AppButton title="Unlock Voice Studio" variant="gold" onPress={onUnlock} />
    </GlassCard>
  );
}

// Small gold "PRO" chip for Pro-only rows (gold = Pro)
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

// Voice Studio for Pro members: set up (new) or open (returning)
export function VoiceStudioCard({
  isNew,
  voiceName,
  minutesUsed,
  minutesIncluded,
  onOpen,
}: {
  isNew: boolean;
  voiceName: string | null;
  minutesUsed: number;
  minutesIncluded: number;
  onOpen: () => void;
}) {
  const left = Math.max(0, minutesIncluded - minutesUsed);
  return (
    <GlassCard strong radius={26} padding={20}>
      <View pointerEvents="none" style={styles.goldGlow}>
        <Svg width={240} height={240}>
          <Defs>
            <RadialGradient id="vsGlow2" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={ds.gold} stopOpacity={0.18} />
              <Stop offset="100%" stopColor={ds.gold} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={120} cy={120} r={120} fill="url(#vsGlow2)" />
        </Svg>
      </View>
      <View style={styles.vsTop}>
        <View style={styles.vsText}>
          <ProTag />
          <Text style={styles.vsTitle}>Voice Studio</Text>
          <Text style={styles.vsSub}>
            {isNew || !voiceName
              ? 'Read one short script aloud and Jarvis learns your voice. Takes about a minute.'
              : `Your voice “${voiceName}” is ready for your next voiceover.`}
          </Text>
        </View>
      </View>
      <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {BARS.map((b, i) => (
          <WaveBar key={i} index={i} base={b} />
        ))}
      </View>
      {!isNew && voiceName && (
        <View style={styles.minutes}>
          <View style={styles.minutesTrack}>
            <View style={[styles.minutesFill, { width: `${(left / minutesIncluded) * 100}%` }]} />
          </View>
          <Text style={styles.minutesText}>
            {left} of {minutesIncluded} minutes left this month
          </Text>
        </View>
      )}
      <AppButton title={isNew || !voiceName ? 'Set up my voice' : 'Open Voice Studio'} onPress={onOpen} />
    </GlassCard>
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
  minutes: { marginBottom: 14 },
  minutesTrack: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, overflow: 'hidden' },
  minutesFill: { height: 6, borderRadius: 3, backgroundColor: ds.purple },
  minutesText: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 6 },
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
  emptyIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: ds.ink, marginTop: 10 },
  emptyText: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 2, textAlign: 'center' },
  emptyBtn: { alignSelf: 'stretch', marginTop: 14 },
  goldGlow: { position: 'absolute', top: -110, right: -90 },
  vsTop: { flexDirection: 'row' },
  vsText: { flex: 1 },
  proChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: goldTokens.light,
    borderWidth: 1,
    borderColor: goldTokens.border,
  },
  proChipText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  vsTitle: { fontSize: 19, fontWeight: '800', color: ds.ink, letterSpacing: -0.3, marginTop: 10 },
  vsSub: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 2 },
  wave: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, height: 56, marginVertical: 12 },
  waveBar: { width: 6, height: 44, borderRadius: 3, backgroundColor: '#8B72F5' },
  waveBarGold: { backgroundColor: ds.gold },
});
