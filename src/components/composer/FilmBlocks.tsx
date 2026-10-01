import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { Easing, FadeIn, FadeInUp, FadeOutDown } from 'react-native-reanimated';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassCard } from '../glass/GlassCard';
import { PlatformLogo } from '../onboarding/PlatformLogo';
import { ds } from '../../theme/colors';
import { FILM_STYLES, type FilmPlan, type FilmStyle, type SoundIdea, type TrendStage } from '../../data';
import { HANDOFF_NAMES, type HandoffPlatform } from '../../utils/handoff';

// Short video only: film inside TikTok / Reels / Shorts (for trending sounds
// and filters) or upload a finished video. The "film it" path keeps PostStreak
// as the plan before and the tracker after.

export type FilmMethod = 'native' | 'camera' | 'upload';

function MethodRow({
  selected,
  title,
  body,
  icon,
  onPress,
}: {
  selected: boolean;
  title: string;
  body: string;
  icon: (color: string) => React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={`${title}. ${body}`}
      style={Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : undefined}
    >
      {({ pressed }) => (
        <View style={[styles.method, selected && styles.methodOn, pressed && { transform: [{ scale: 0.98 }] }]}>
          <View style={[styles.methodIcon, selected && styles.methodIconOn]}>{icon(selected ? '#FFFFFF' : ds.purple)}</View>
          <View style={styles.flex}>
            <Text style={styles.methodTitle}>{title}</Text>
            <Text style={styles.methodBody}>{body}</Text>
          </View>
          <View style={[styles.radio, selected && styles.radioOn]}>{selected && <View style={styles.radioDot} />}</View>
        </View>
      )}
    </Pressable>
  );
}

export function FilmMethodPicker({ method, onChange }: { method: FilmMethod; onChange: (m: FilmMethod) => void }) {
  return (
    <Animated.View entering={FadeInUp.duration(300)}>
      <Text style={styles.pickerLabel}>How will you film it?</Text>
      <View style={styles.methods}>
        <MethodRow
          selected={method === 'native'}
          title="Film in TikTok, Reels or Shorts"
          body="Use their trending sounds and filters"
          onPress={() => onChange('native')}
          icon={(c) => (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18V5l12-2v13" stroke={c} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="6" cy="18" r="3" stroke={c} strokeWidth={2} />
              <Circle cx="18" cy="16" r="3" stroke={c} strokeWidth={2} />
            </Svg>
          )}
        />
        <MethodRow
          selected={method === 'camera'}
          title="Film with PostStreak"
          body="Record here with your camera, then schedule it"
          onPress={() => onChange('camera')}
          icon={(c) => (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Rect x="3" y="6" width="13" height="12" rx="3" stroke={c} strokeWidth={2} />
              <Path d="M16 10l5-3v10l-5-3" stroke={c} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          )}
        />
        <MethodRow
          selected={method === 'upload'}
          title="Upload a video"
          body="From your camera roll: edited, voiceover or original audio"
          onPress={() => onChange('upload')}
          icon={(c) => (
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M12 16V4M7 9l5-5 5 5M4 20h16" stroke={c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          )}
        />
      </View>
    </Animated.View>
  );
}

const STAGES: Record<TrendStage, { label: string; bg: string; fg: string }> = {
  rising: { label: 'Rising', bg: ds.greenBg, fg: ds.greenFill },
  peaking: { label: 'Peaking', bg: ds.lavender, fg: ds.purple },
  fading: { label: 'Fading', bg: 'rgba(23, 20, 32, 0.06)', fg: ds.text3 },
};

function StageChip({ stage }: { stage: TrendStage }) {
  const c = STAGES[stage];
  return (
    <View style={[styles.stage, { backgroundColor: c.bg }]}>
      {stage === 'rising' && (
        <Svg width={9} height={9} viewBox="0 0 24 24" fill="none">
          <Path d="M4 16l6-6 4 4 6-6M20 8v5M20 8h-5" stroke={c.fg} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
      <Text style={[styles.stageText, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

// What kind of video is it? Most TikToks aren't talking to camera.
function StylePicker({ style, onChange }: { style: FilmStyle; onChange: (s: FilmStyle) => void }) {
  return (
    <View>
      <Text style={styles.styleLabel}>What kind of video?</Text>
      <View style={styles.styles}>
        {FILM_STYLES.map((f) => {
          const on = f.id === style;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.selectionAsync();
                onChange(f.id);
              }}
              accessibilityRole="radio"
              accessibilityState={{ checked: on }}
              style={({ pressed }) => [
                styles.styleChip,
                on && styles.styleChipOn,
                pressed && { transform: [{ scale: 0.96 }] },
                Platform.OS === 'web' && ({ cursor: 'pointer' } as object),
              ]}
            >
              <Text style={[styles.styleChipText, on && styles.styleChipTextOn]} numberOfLines={1}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function FilmPlanCard({
  plan,
  sounds,
  platforms,
  onOpen,
  onStyleChange,
  mode,
  overlayText,
  onOverlayChange,
  recording,
  onRecord,
  onRemoveRecording,
}: {
  plan: FilmPlan;
  sounds: SoundIdea[];
  platforms: HandoffPlatform[];
  onOpen: (p: HandoffPlatform) => void;
  onStyleChange: (s: FilmStyle) => void;
  /** native: hand off to TikTok etc.; camera: record inside PostStreak */
  mode: 'native' | 'camera';
  overlayText: string;
  onOverlayChange: (t: string) => void;
  recording: { duration?: number } | null;
  onRecord: () => void;
  onRemoveRecording: () => void;
}) {
  // Dance: the on-screen line is the creator's own and optional (no idea needed)
  const hookBox =
    plan.style === 'dance' ? (
      <View style={styles.hookBox}>
        <Text style={styles.hookLabel}>ON-SCREEN TEXT (OPTIONAL)</Text>
        <TextInput
          value={overlayText}
          onChangeText={onOverlayChange}
          placeholder="e.g. POV: dancing at work"
          placeholderTextColor={ds.text3}
          style={styles.overlayInput}
          maxLength={80}
        />
      </View>
    ) : (
      <View style={styles.hookBox}>
        <Text style={styles.hookLabel}>{plan.hookLabel}</Text>
        <Text style={styles.hookText}>{plan.hook}</Text>
      </View>
    );
  const soundBlock = (
    <>
      <View style={styles.soundHead}>
        <Text style={[styles.subLabel, styles.flex]}>{plan.style === 'dance' ? 'The sound' : plan.soundFirst ? 'Pick the sound first' : 'Sound ideas'}</Text>
        <Text style={styles.sample}>Sample</Text>
      </View>
      <Text style={[styles.soundTip, plan.soundFirst && styles.soundTipStrong]}>{plan.soundTip}</Text>
      <View style={styles.sounds}>
        {sounds.map((s) => (
          <View key={s.id} style={styles.sound}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path d="M9 18V5l12-2v13" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
              <Circle cx="6" cy="18" r="3" stroke={ds.purple} strokeWidth={2.2} />
              <Circle cx="18" cy="16" r="3" stroke={ds.purple} strokeWidth={2.2} />
            </Svg>
            <View style={styles.flex}>
              <Text style={styles.soundName} numberOfLines={1}>
                {s.name}
              </Text>
              <Text style={styles.soundVibe} numberOfLines={1}>
                {s.vibe}
              </Text>
            </View>
            {s.stage && <StageChip stage={s.stage} />}
          </View>
        ))}
      </View>
      <Text style={styles.soundNote}>Search the sound in the app. Some trending sounds aren't available to business accounts.</Text>
    </>
  );
  return (
    <Animated.View entering={FadeIn.duration(250)}>
      <GlassCard strong radius={22} padding={16}>
        <StylePicker style={plan.style} onChange={onStyleChange} />

        {/* Everything below re-animates when the style changes */}
        <Animated.View key={plan.style} entering={FadeIn.duration(250)}>
          {plan.style === 'dance' ? (
            // Dance: only the sound, its timing and the text line — nothing
            // about the moves; creators have already seen and learnt the trend
            <>
              {soundBlock}
              <View style={styles.danceText}>{hookBox}</View>
            </>
          ) : (
            <>
              {hookBox}
              {plan.shots.length > 0 && (
                <>
                  <Text style={styles.subLabel}>{plan.listLabel}</Text>
                  {plan.shots.map((s, i) => (
                    <Animated.View key={s} entering={FadeInUp.delay(80 * i).duration(260)} style={styles.shot}>
                      {plan.style === 'skit' ? (
                        // Ideas, not steps
                        <View style={styles.ideaDot}>
                          <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                            <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
                          </Svg>
                        </View>
                      ) : (
                        <View style={styles.shotNum}>
                          <Text style={styles.shotNumText}>{i + 1}</Text>
                        </View>
                      )}
                      <Text style={styles.shotText}>{s}</Text>
                    </Animated.View>
                  ))}
                </>
              )}
              {soundBlock}
            </>
          )}
        </Animated.View>
        {mode === 'camera' ? (
          <View style={styles.recordArea}>
            {plan.soundFirst && (
              <Text style={styles.copyNote}>Play the sound out loud while you film, or add it later in the app you post to.</Text>
            )}
            {recording ? (
              <Animated.View entering={FadeIn.duration(250)} style={styles.recorded}>
                <View style={styles.recordedThumb}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M8 5v14l11-7L8 5z" fill="#FFFFFF" />
                  </Svg>
                </View>
                <View style={styles.flex}>
                  <Text style={styles.recordedTitle}>Video recorded</Text>
                  <Text style={styles.recordedSub}>
                    {recording.duration ? `${Math.floor(recording.duration / 60)}:${String(recording.duration % 60).padStart(2, '0')}` : 'Ready to post'}
                  </Text>
                </View>
                <Pressable onPress={onRecord} hitSlop={6} style={styles.recordedAction} accessibilityRole="button">
                  <Text style={styles.recordedActionText}>Retake</Text>
                </Pressable>
                <Pressable onPress={onRemoveRecording} hitSlop={6} style={[styles.recordedAction, styles.recordedRemove]} accessibilityRole="button">
                  <Text style={[styles.recordedActionText, { color: ds.text2 }]}>Remove</Text>
                </Pressable>
              </Animated.View>
            ) : (
              <AppButton
                title="Open camera"
                onPress={onRecord}
                iconRight={
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="6" width="13" height="12" rx="3" stroke="#FFFFFF" strokeWidth={2} />
                    <Path d="M16 10l5-3v10l-5-3" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" />
                  </Svg>
                }
              />
            )}
          </View>
        ) : (
          <>
        {platforms.length > 0 && <Text style={styles.copyNote}>Opening an app copies your caption and tags, ready to paste.</Text>}
  
          {platforms.length > 0 ? (
            <View style={styles.openList}>
              {platforms.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => onOpen(p)}
                  style={({ pressed }) => [styles.openBtn, pressed && { transform: [{ scale: 0.97 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
                  accessibilityRole="button"
                  accessibilityLabel={`Copy caption and open ${HANDOFF_NAMES[p]}`}
                >
                  <PlatformLogo type={p} size={26} />
                  <Text style={styles.openText} numberOfLines={1}>
                    Open {HANDOFF_NAMES[p]}
                  </Text>
                  {/* Copy icon: the caption is copied on the way out */}
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                    <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.text3} strokeWidth={2} />
                    <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.text3} strokeWidth={2} />
                  </Svg>
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.soundNote}>Pick TikTok, Instagram or YouTube above to film there.</Text>
          )}
          </>
        )}
      </GlassCard>
    </Animated.View>
  );
}

// "Did you post it?" — shown when the creator comes back after a handoff
export function PostedCheck({
  platform,
  onYes,
  onNotYet,
}: {
  platform: HandoffPlatform;
  onYes: () => void;
  onNotYet: () => void;
}) {
  return (
    <Animated.View
      // Calm entrance: a short rise with a fade, no spring overshoot
      entering={FadeInUp.duration(280).easing(Easing.out(Easing.cubic))}
      exiting={FadeOutDown.duration(180)}
      style={styles.checkWrap}
    >
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.checkTop}>
          <PlatformLogo type={platform} size={34} />
          <View style={styles.flex}>
            <Text style={styles.checkTitle}>Did you post it on {HANDOFF_NAMES[platform]}?</Text>
            <Text style={styles.checkBody}>We'll count it toward today's check-in.</Text>
          </View>
        </View>
        <View style={styles.checkBtns}>
          <View style={styles.flex}>
            <AppButton title="Not yet" variant="outline" onPress={onNotYet} />
          </View>
          <View style={styles.flex}>
            <AppButton title="I posted it" onPress={onYes} />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pickerLabel: { fontSize: 14, fontWeight: '800', color: ds.ink, marginTop: 16, marginBottom: 10 },
  methods: { gap: 8 },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  methodOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.85)' },
  methodIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(237, 233, 254, 0.95)',
  },
  methodIconOn: { backgroundColor: ds.purple },
  methodTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  methodBody: { fontSize: 12, lineHeight: 16, color: ds.text2, marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, borderColor: ds.line, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  radioOn: { borderColor: ds.purple },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: ds.purple },
  overlayInput: {
    fontSize: 15,
    fontWeight: '700',
    color: ds.ink,
    marginTop: 4,
    paddingVertical: 4,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  recordArea: { marginTop: 14, gap: 10 },
  recorded: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 16,
    backgroundColor: ds.greenBg,
  },
  recordedThumb: { width: 38, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8B72F5' },
  recordedTitle: { fontSize: 14, fontWeight: '800', color: ds.ink },
  recordedSub: { fontSize: 12, color: ds.text2, marginTop: 1 },
  recordedAction: { paddingHorizontal: 8, height: 30, justifyContent: 'center', borderRadius: 10, backgroundColor: '#FFFFFF' },
  recordedRemove: { backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  recordedActionText: { fontSize: 12, fontWeight: '800', color: ds.purple },
  styleLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 8 },
  styles: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  styleChip: {
    height: 32,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: '#FFFFFF',
  },
  styleChipOn: { borderColor: ds.purple, backgroundColor: ds.purple },
  styleChipText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  styleChipTextOn: { color: '#FFFFFF' },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 7, height: 20, borderRadius: 999 },
  stageText: { fontSize: 10.5, fontWeight: '800' },
  soundTip: { fontSize: 12.5, lineHeight: 17, color: ds.text2, marginBottom: 8 },
  soundTipStrong: { color: ds.purple, fontWeight: '700' },
  danceText: { marginTop: 14 },
  hookBox: { padding: 14, borderRadius: 16, backgroundColor: 'rgba(237, 233, 254, 0.65)' },
  hookLabel: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  hookText: { fontSize: 15, lineHeight: 21, fontWeight: '700', color: ds.ink, marginTop: 4 },
  subLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginTop: 14, marginBottom: 8 },
  shot: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  shotNum: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple },
  ideaDot: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  shotNumText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  shotText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.ink },
  soundHead: { flexDirection: 'row', alignItems: 'center' },
  sample: { fontSize: 10.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  sounds: { gap: 6 },
  sound: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(23, 20, 32, 0.04)',
  },
  soundName: { fontSize: 13, fontWeight: '800', color: ds.ink },
  soundVibe: { fontSize: 12, color: ds.text3, marginTop: 1 },
  soundNote: { fontSize: 12, lineHeight: 17, color: ds.text3, marginTop: 8 },
  openList: { gap: 8, marginTop: 8 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ds.line,
    borderBottomWidth: 3,
  },
  openText: { flex: 1, fontSize: 14.5, fontWeight: '800', color: ds.ink },
  copyNote: { fontSize: 12, lineHeight: 17, color: ds.text2, fontWeight: '600', marginTop: 12 },
  checkWrap: { position: 'absolute', left: 16, right: 16, bottom: 110 },
  checkTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  checkBody: { fontSize: 12.5, color: ds.text2, marginTop: 2 },
  checkBtns: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
