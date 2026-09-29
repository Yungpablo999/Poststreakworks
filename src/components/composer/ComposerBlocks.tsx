import React, { useEffect, useState } from 'react';
import { View, Pressable, StyleSheet, Platform, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  LinearTransition,
  interpolateColor,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo, type PlatformLogoType } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';

// Building blocks for the post composer. Each step shows a number that turns
// into a green tick once that part is done, so progress is visible as you go.

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const Check = ({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── Numbered step header ───────────────────────────────────────────────────
export function StepHeader({
  n,
  title,
  done,
  right,
  onLayout,
}: {
  n: number;
  title: string;
  done: boolean;
  right?: React.ReactNode;
  onLayout?: (e: LayoutChangeEvent) => void;
}) {
  return (
    <View style={styles.stepHeader} onLayout={onLayout}>
      <View style={[styles.stepNum, done && styles.stepNumDone]}>
        {done ? (
          <Animated.View key="d" entering={ZoomIn.springify().damping(12)}>
            <Check size={11} />
          </Animated.View>
        ) : (
          <Text style={styles.stepNumText}>{n}</Text>
        )}
      </View>
      <Text style={styles.stepTitle}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Platform chip (multi-select) ───────────────────────────────────────────
export function PlatformChip({ id, name, selected, onPress }: { id: string; name: string; selected: boolean; onPress: () => void }) {
  const on = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    on.value = withSpring(selected ? 1 : 0, { damping: 16, stiffness: 260 });
  }, [selected, on]);
  const style = useAnimatedStyle(() => ({
    borderColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0.95)', ds.purple]),
    backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0.7)', 'rgba(237,233,254,0.95)']),
    transform: [{ scale: 1 + 0.03 * on.value }],
  }));
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={name}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined}
    >
      <Animated.View style={[styles.platChip, style]}>
        <PlatformLogo type={id as PlatformLogoType} size={24} />
        <Text style={[styles.platName, selected && { color: ds.purple }]}>{name}</Text>
        {selected && (
          <Animated.View entering={ZoomIn.duration(180)} exiting={ZoomOut.duration(120)} style={styles.platCheck}>
            <Check size={9} />
          </Animated.View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ─── Formats ────────────────────────────────────────────────────────────────
export type FormatId = 'short_video' | 'carousel' | 'image' | 'text' | 'long_video';

export function FormatIcon({ id, color }: { id: FormatId; color: string }) {
  switch (id) {
    case 'short_video':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x="6" y="2" width="12" height="20" rx="3" stroke={color} strokeWidth={2} />
          <Path d="M10.5 9.5v5l4-2.5-4-2.5z" fill={color} />
        </Svg>
      );
    case 'carousel':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x="6" y="4" width="12" height="16" rx="2.5" stroke={color} strokeWidth={2} />
          <Path d="M3 7v10M21 7v10" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'image':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth={2} />
          <Circle cx="8.5" cy="8.5" r="1.8" fill={color} />
          <Path d="M21 15l-5-5L5 21" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
      );
    case 'text':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M4 6h16M4 12h16M4 18h10" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
        </Svg>
      );
    default:
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Rect x="2" y="5" width="20" height="14" rx="3" stroke={color} strokeWidth={2} />
          <Path d="M10 9.5v5l4-2.5-4-2.5z" fill={color} />
        </Svg>
      );
  }
}

export function RecommendedFormat({
  id,
  title,
  badge,
  description,
  selected,
  onPress,
}: {
  id: FormatId;
  title: string;
  badge: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined}
    >
      <View style={[styles.recCard, selected && styles.recCardOn]}>
        <View style={[styles.fmtIcon, selected && styles.fmtIconOn]}>
          <FormatIcon id={id} color={selected ? '#FFFFFF' : ds.purple} />
        </View>
        <View style={styles.flex}>
          <View style={styles.recTitleRow}>
            <Text style={styles.recTitle}>{title}</Text>
            <View style={styles.bestFit}>
              <Text style={styles.bestFitText}>Best fit</Text>
            </View>
          </View>
          <Text style={styles.recBadge}>{badge}</Text>
          <Text style={styles.recDesc}>{description}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioOn]}>{selected && <Check size={10} />}</View>
      </View>
    </Pressable>
  );
}

export function FormatTile({
  id,
  title,
  badge,
  selected,
  onPress,
}: {
  id: FormatId;
  title: string;
  badge: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}, ${badge}`}
      style={[styles.tileWrap, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
    >
      {({ pressed }) => (
        <View style={[styles.tile, selected && styles.tileOn, pressed && { transform: [{ scale: 0.97 }] }]}>
          <View style={[styles.fmtIconSm, selected && styles.fmtIconOn]}>
            <FormatIcon id={id} color={selected ? '#FFFFFF' : ds.purple} />
          </View>
          <Text style={styles.tileTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.tileBadge} numberOfLines={1}>
            {badge}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Media ──────────────────────────────────────────────────────────────────
function PulsingUpload() {
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    t.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduceMotion, t]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * t.value }] }));
  return (
    <View style={styles.uploadIcon}>
      <Animated.View style={style}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 16V4M7 9l5-5 5 5M4 20h16" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function MediaZone({
  isText,
  hasMedia,
  hasThumbnail,
  label,
  sub,
  addLabel,
  onAdd,
  onThumbnail,
  onRemove,
}: {
  isText: boolean;
  hasMedia: boolean;
  hasThumbnail: boolean;
  label: string;
  sub: string;
  addLabel: string;
  onAdd: () => void;
  onThumbnail: () => void;
  onRemove: () => void;
}) {
  if (hasMedia) {
    return (
      <Animated.View entering={FadeIn.duration(250)}>
        <GlassCard strong radius={22} padding={14}>
          <View style={styles.mediaRow}>
            <View style={styles.mediaThumb}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M8 5v14l11-7L8 5z" fill="#FFFFFF" />
              </Svg>
            </View>
            <View style={styles.flex}>
              <Text style={styles.mediaTitle}>Media added</Text>
              <Text style={styles.mediaSub} numberOfLines={1}>
                {hasThumbnail ? 'Thumbnail added' : 'No thumbnail yet'}
              </Text>
            </View>
            <View style={styles.readyChip}>
              <Check size={10} color={ds.greenFill} />
              <Text style={styles.readyChipText}>Ready</Text>
            </View>
          </View>
          <View style={styles.mediaActions}>
            <SmallAction label="Replace" onPress={onAdd} />
            <SmallAction label={hasThumbnail ? 'Thumbnail ✓' : 'Thumbnail'} onPress={onThumbnail} />
            <SmallAction label="Remove" onPress={onRemove} subtle />
          </View>
        </GlassCard>
      </Animated.View>
    );
  }
  return (
    <GlassCard strong radius={22} padding={14}>
      <Pressable
        onPress={() => {
          tick();
          onAdd();
        }}
        accessibilityRole="button"
        accessibilityLabel={isText ? 'Add an optional visual' : addLabel}
        style={[styles.dropZone, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
      >
        <PulsingUpload />
        <Text style={styles.dropTitle}>{isText ? 'Media is optional' : label}</Text>
        <Text style={styles.dropSub}>{isText ? 'Text posts can go out as they are' : sub}</Text>
        <View style={styles.dropBtn}>
          <Text style={styles.dropBtnText}>{isText ? 'Add a visual' : addLabel}</Text>
        </View>
      </Pressable>
    </GlassCard>
  );
}

function SmallAction({ label, onPress, subtle }: { label: string; onPress: () => void; subtle?: boolean }) {
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      style={({ pressed }) => [styles.smallAction, subtle && styles.smallActionSubtle, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
    >
      <Text style={[styles.smallActionText, subtle && { color: ds.text2 }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

// ─── Caption helpers ────────────────────────────────────────────────────────
export function CyclePill({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tick();
        onPress();
      }}
      style={({ pressed }) => [styles.cyclePill, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}. Tap to change`}
    >
      <Text style={styles.cycleLabel}>{label}</Text>
      <Animated.View key={value} entering={FadeIn.duration(200)}>
        <Text style={styles.cycleValue}>{value}</Text>
      </Animated.View>
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
        <Path d="M7 10l5 5 5-5" stroke={ds.text3} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

export function AiAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.aiAction, disabled && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
    >
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
      </Svg>
      <Text style={styles.aiActionText}>{label}</Text>
    </Pressable>
  );
}

export function EditsMeter({ left, total }: { left: number; total: number }) {
  return (
    <View style={styles.editsRow} accessibilityLabel={`${left} of ${total} AI edits left`}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={[styles.editsDot, i < left && styles.editsDotOn]} />
      ))}
      <Text style={styles.editsText}>{left} AI edits left</Text>
    </View>
  );
}

// ─── Tags ───────────────────────────────────────────────────────────────────
export function TagChip({ tag, onRemove }: { tag: string; onRemove: () => void }) {
  return (
    <Animated.View entering={ZoomIn.duration(200)} exiting={ZoomOut.duration(150)} layout={LinearTransition.springify().damping(18)} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
      <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${tag}`}>
        <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
          <Path d="M18 6L6 18M6 6l12 12" stroke={ds.purple} strokeWidth={3} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </Animated.View>
  );
}

// ─── Publish mode switch (sliding pill) ─────────────────────────────────────
export type PublishMode = 'now' | 'schedule' | 'draft';
const MODES: { id: PublishMode; label: string }[] = [
  { id: 'now', label: 'Post now' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'draft', label: 'Draft' },
];

export function ModeSwitch({ mode, onChange }: { mode: PublishMode; onChange: (m: PublishMode) => void }) {
  const [w, setW] = useState(0);
  const idx = MODES.findIndex((m) => m.id === mode);
  const x = useSharedValue(0);
  const cell = w / MODES.length;
  useEffect(() => {
    if (cell > 0) x.value = withSpring(idx * cell, { damping: 18, stiffness: 240 });
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.modeTrack}
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / MODES.length);
        }
      }}
      accessibilityRole="tablist"
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.modePill, { width: cell }, pill]} />}
      {MODES.map((m) => {
        const on = m.id === mode;
        return (
          <Pressable
            key={m.id}
            onPress={() => {
              tick();
              onChange(m.id);
            }}
            style={[styles.modeCell, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.modeText, on && styles.modeTextOn]}>{m.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Readiness ──────────────────────────────────────────────────────────────
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function Ring({ percent }: { percent: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(percent / 100, { duration: 700, easing: Easing.out(Easing.cubic) });
  }, [percent, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  const done = percent === 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(91, 62, 232, 0.12)" strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={done ? ds.greenFill : ds.purple}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          animatedProps={props}
        />
      </Svg>
      <Text style={[styles.ringText, done && { color: ds.greenFill }]}>{percent}%</Text>
    </View>
  );
}

export function ReadinessCard({
  percent,
  steps,
  onStep,
}: {
  percent: number;
  steps: { key: string; label: string; done: boolean }[];
  onStep: (key: string) => void;
}) {
  const next = steps.find((s) => !s.done);
  return (
    <GlassCard strong radius={24} padding={16}>
      <View style={styles.readyTop}>
        <Ring percent={percent} />
        <View style={styles.flex}>
          <Text style={styles.readyTitle}>{percent === 100 ? 'Ready to post' : 'Almost there'}</Text>
          <Text style={styles.readySub}>{next ? `Next: ${next.label.toLowerCase()}` : 'Everything is in place.'}</Text>
        </View>
      </View>
      <View style={styles.readySteps}>
        {steps.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => onStep(s.key)}
            style={({ pressed }) => [styles.readyStep, s.done && styles.readyStepDone, pressed && { transform: [{ scale: 0.95 }] }]}
            accessibilityRole="button"
            accessibilityLabel={`${s.label}${s.done ? ', done' : ', to do'}`}
          >
            {s.done ? <Check size={9} color={ds.greenFill} /> : <View style={styles.readyDot} />}
            <Text style={[styles.readyStepText, s.done && { color: ds.greenFill }]}>{s.label}</Text>
          </Pressable>
        ))}
      </View>
    </GlassCard>
  );
}

export function ComposerToast({ message }: { message: string }) {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={styles.toast}>
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stepHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 26, marginBottom: 12 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.lavender,
  },
  stepNumDone: { backgroundColor: ds.greenFill },
  stepNumText: { fontSize: 12, fontWeight: '800', color: ds.purple },
  stepTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  platChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  platName: { fontSize: 14, fontWeight: '800', color: ds.ink },
  platCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.purple,
    marginLeft: -2,
  },
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  recCardOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.85)' },
  fmtIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  fmtIconSm: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
    marginBottom: 10,
  },
  fmtIconOn: { backgroundColor: ds.purple },
  recTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  recTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  bestFit: { paddingHorizontal: 7, height: 20, justifyContent: 'center', borderRadius: 999, backgroundColor: '#FFFFFF' },
  bestFitText: { fontSize: 10.5, fontWeight: '800', color: ds.purple },
  recBadge: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 2 },
  recDesc: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 4 },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: ds.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  radioOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  tileWrap: { width: '48%', flexGrow: 1 },
  tile: {
    padding: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  tileOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.85)' },
  tileTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  tileBadge: { fontSize: 12, fontWeight: '600', color: ds.text3, marginTop: 1 },
  dropZone: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C9BDFB',
    backgroundColor: 'rgba(237, 233, 254, 0.35)',
  },
  uploadIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ds.lavender,
  },
  dropTitle: { fontSize: 16, fontWeight: '800', color: ds.ink, marginTop: 12, textAlign: 'center' },
  dropSub: { fontSize: 12.5, lineHeight: 17, color: ds.text2, marginTop: 3, textAlign: 'center' },
  dropBtn: { marginTop: 14, paddingHorizontal: 16, height: 38, justifyContent: 'center', borderRadius: 999, backgroundColor: ds.purple },
  dropBtnText: { fontSize: 13.5, fontWeight: '800', color: '#FFFFFF' },
  mediaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mediaThumb: {
    width: 48,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B72F5',
  },
  mediaTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  mediaSub: { fontSize: 12.5, color: ds.text2, marginTop: 2 },
  readyChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: ds.greenBg },
  readyChipText: { fontSize: 11, fontWeight: '800', color: ds.greenFill },
  mediaActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  smallAction: { flex: 1, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender, paddingHorizontal: 6 },
  smallActionSubtle: { backgroundColor: 'rgba(23, 20, 32, 0.05)' },
  smallActionText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  cyclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
  },
  cycleLabel: { fontSize: 10.5, fontWeight: '800', color: ds.text3, letterSpacing: 0.5 },
  cycleValue: { fontSize: 12.5, fontWeight: '800', color: ds.ink },
  aiAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 38,
    borderRadius: 12,
    backgroundColor: ds.lavender,
  },
  aiActionText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  editsRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  editsDot: { width: 12, height: 5, borderRadius: 3, backgroundColor: 'rgba(91, 62, 232, 0.15)' },
  editsDotOn: { backgroundColor: ds.purple },
  editsText: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginLeft: 5 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  tagText: { fontSize: 13, fontWeight: '800', color: ds.purple },
  modeTrack: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
  },
  modePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  modeCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  modeText: { fontSize: 13.5, fontWeight: '700', color: ds.text2 },
  modeTextOn: { color: ds.purple, fontWeight: '800' },
  readyTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ringText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  readyTitle: { fontSize: 17, fontWeight: '800', color: ds.ink },
  readySub: { fontSize: 13, color: ds.text2, marginTop: 2 },
  readySteps: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 14 },
  readyStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(23, 20, 32, 0.05)',
  },
  readyStepDone: { backgroundColor: ds.greenBg },
  readyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.text3 },
  readyStepText: { fontSize: 12, fontWeight: '800', color: ds.text2 },
  toast: {
    alignSelf: 'center',
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: ds.ink,
  },
  toastText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
});
