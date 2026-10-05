import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useMascotThinking } from '../mascot/mascot';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { FitLines } from '../components/ui/FitLines';
import { AppToast } from '../components/ui/AppToast';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, type UserProfileData } from '../components/UserProfileModal';
import { PlatformChip } from '../components/composer/ComposerBlocks';
import { AllowanceMeter, UnlimitedChip } from '../components/create/CreateBlocks';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import { ChoiceRow, NeedsJarvis, Problem, StandInNote } from '../components/studio/StudioBits';
import { getRepurposeAllowance, subscribeToRepurposes } from '../data';
import { useCapabilities } from '../backend/account';
import { requestRepurpose, studioProblem } from '../backend/studio';
import type { AppPlatform, RepurposePrefer, RepurposeVersionDto } from '../../frontend/shared/types/phase1';
import { STAGE_1_PLATFORMS } from '../config/features';
import { ds } from '../theme/colors';

// Repurpose: one idea, or a post the creator already wrote, becomes a version for each platform they
// pick (Jarvis writes them on the server, in the way each platform works). Each run uses the week's
// repurpose on a free plan; the server counts it, and gives it back if the writing fails.

const NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

type Source = 'idea' | 'post';

const SOURCES: { id: Source; label: string }[] = [
  { id: 'idea', label: 'An idea' },
  { id: 'post', label: 'A post I wrote' },
];

const PREFERS: { id: RepurposePrefer; label: string }[] = [
  { id: 'video', label: 'Short videos' },
  { id: 'carousel', label: 'Carousels' },
  { id: 'text', label: 'Text posts' },
];

interface RepurposeScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  /** Into the composer: the version's text, its platform, and the idea behind it. */
  onUseVersion?: (caption: string, platform: string, idea: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

/** Everything a version holds, as text to paste. */
function versionText(v: RepurposeVersionDto): string {
  if (v.slides?.length) return [v.slides.map((s, i) => `${i + 1}. ${s}`).join('\n'), v.body].filter(Boolean).join('\n\n');
  if (v.posts?.length) return v.posts.join('\n\n');
  return v.body;
}

function VersionCard({ v, index, onChange, onCopy, onUse }: { v: RepurposeVersionDto; index: number; onChange: (body: string) => void; onCopy: () => void; onUse?: () => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View entering={FadeInUp.delay(120 * index).duration(360)}>
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.vHead}>
          <PlatformLogo type={v.platform as PlatformLogoType} size={34} />
          <View style={styles.flex}>
            <Text style={styles.vName}>{NAMES[v.platform] ?? v.platform}</Text>
            <Text style={styles.vFormat}>{v.formatLabel}</Text>
          </View>
        </View>
        {v.title ? <Text style={styles.vTitle}>{v.title}</Text> : null}
        {v.slides && v.slides.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slidesBar} contentContainerStyle={styles.slides}>
            {v.slides.map((sl, i) => (
              <View key={i} style={[styles.slide, i === 0 && styles.slideCover]}>
                <Text style={[styles.slideNum, i === 0 && styles.slideNumCover]}>
                  {i + 1}/{v.slides!.length}
                </Text>
                <Text style={[styles.slideText, i === 0 && styles.slideTextCover]}>{sl}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        {v.posts && v.posts.length > 0 && (
          <View style={styles.thread}>
            {v.posts.map((pt, i) => (
              <View key={i} style={styles.threadRow}>
                <View style={styles.threadRail}>
                  <View style={styles.threadDot}>
                    <Text style={styles.threadNum}>{i + 1}</Text>
                  </View>
                  {i < v.posts!.length - 1 && <View style={styles.threadLine} />}
                </View>
                <Text style={styles.threadText}>{pt}</Text>
              </View>
            ))}
          </View>
        )}
        {(v.slides?.length || v.posts?.length) ? <Text style={styles.captionLabel}>Caption</Text> : null}
        <View style={[styles.field, focused && styles.fieldOn]}>
          <AutoGrowInput
            value={v.body}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            minHeight={60}
            style={styles.vBody}
            accessibilityLabel={`${NAMES[v.platform] ?? v.platform} version`}
          />
        </View>
        <View style={styles.vActions}>
          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel={`Copy the ${NAMES[v.platform] ?? v.platform} version`}
            style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.96 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.purple} strokeWidth={2.2} />
              <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.purple} strokeWidth={2.2} />
            </Svg>
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>
          {onUse && (
            <View style={styles.flex}>
              <AppButton title="Use this" onPress={onUse} />
            </View>
          )}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export const RepurposeScreen: React.FC<RepurposeScreenProps> = ({
  ideaTitle = '',
  onBack,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onUseVersion,
  userProfile,
  onSaveProfile,
}) => {
  const pageWidth = usePageWidth();
  const { ai } = useCapabilities();
  const allowance = useSyncExternalStore(subscribeToRepurposes, getRepurposeAllowance, getRepurposeAllowance);
  const unlimited = allowance.weeklyLimit === null;
  const left = unlimited ? Infinity : Math.max(0, (allowance.weeklyLimit ?? 0) - allowance.usedThisWeek);

  // Most-used first, only the platforms this version of the app offers
  const offered = (['tiktok', 'instagram', 'youtube', 'threads', 'facebook'] as AppPlatform[]).filter((p) => (STAGE_1_PLATFORMS as readonly string[]).includes(p));
  // Start with the creator's connected platforms when they have any
  const connected = (userProfile?.connectedPlatforms ?? []).filter((p): p is AppPlatform => (offered as string[]).includes(p));

  const [source, setSource] = useState<Source>('idea');
  const [idea, setIdea] = useState(ideaTitle);
  const [post, setPost] = useState('');
  const [prefer, setPrefer] = useState<RepurposePrefer>('video');
  const [platforms, setPlatforms] = useState<AppPlatform[]>(connected.length ? connected : offered.slice(0, 3));
  const [focused, setFocused] = useState(false);
  const [versions, setVersions] = useState<RepurposeVersionDto[] | null>(null);
  // What the versions were written from (the idea, or the post)
  const [madeFrom, setMadeFrom] = useState('');
  const [writing, setWriting] = useState(false);
  const [problem, setProblem] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  useMascotThinking(writing);

  const mounted = useRef(true);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      mounted.current = false;
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const showToast = (m: string) => {
    setToast(m);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => mounted.current && setToast(null), 2400);
  };

  const text = (source === 'idea' ? idea : post).trim();
  const toggle = (id: AppPlatform) => setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const make = async () => {
    if (writing) return;
    if (!text) {
      setProblem({ message: source === 'idea' ? 'Say what the idea is first.' : 'Paste your post first.', upgrade: false });
      return;
    }
    if (!platforms.length) {
      setProblem({ message: 'Pick at least one platform.', upgrade: false });
      return;
    }
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProblem(null);
    setWriting(true);
    const res = await requestRepurpose({ text, platforms, prefer });
    if (!mounted.current) return;
    setWriting(false);
    if (!res.ok) {
      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setProblem(studioProblem(res));
      return;
    }
    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMadeFrom(text);
    setVersions(res.data.versions);
  };

  const copy = async (v: RepurposeVersionDto) => {
    try {
      await Clipboard.setStringAsync(versionText(v));
      showToast(`${NAMES[v.platform] ?? v.platform} version copied`);
    } catch {
      showToast('Couldn’t copy. Try again.');
    }
  };

  // The idea a version came from: the typed idea, or the post's first line
  const ideaFor = () => (source === 'idea' ? madeFrom : madeFrom.split('\n')[0].slice(0, 120));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Animated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines lines={['One idea,', <Text key="a" style={styles.accent}>every platform</Text>]} textStyle={styles.headlineText} maxFontSize={36} align="left" accessibilityLabel="One idea, every platform" />
              <Text style={styles.sub}>A version for each platform, written the way it works there.</Text>
            </Animated.View>

            {!ai ? (
              <NeedsJarvis tool="Repurpose" />
            ) : (
              <>
                <StandInNote />

                <Animated.View entering={FadeInUp.delay(60).duration(500)} style={styles.block}>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.cardHead}>
                      <JarvisOrb size={24} />
                      <Text style={styles.eyebrow}>START FROM</Text>
                      {unlimited ? <UnlimitedChip /> : <AllowanceMeter left={left} limit={allowance.weeklyLimit ?? 0} />}
                    </View>
                    <View style={styles.sourceRow}>
                      <ChoiceRow label="" items={SOURCES} value={source} onChange={setSource} disabled={writing} />
                    </View>
                    <View style={[styles.field, focused && styles.fieldOn]}>
                      {source === 'idea' ? (
                        <AutoGrowInput
                          key="idea"
                          value={idea}
                          onChangeText={setIdea}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          placeholder="e.g. 3 mistakes new creators make"
                          minHeight={26}
                          maxLength={300}
                          style={styles.ideaInput}
                          accessibilityLabel="Your idea"
                        />
                      ) : (
                        <AutoGrowInput
                          key="post"
                          value={post}
                          onChangeText={setPost}
                          onFocus={() => setFocused(true)}
                          onBlur={() => setFocused(false)}
                          placeholder="Paste the caption or text of a post you made"
                          minHeight={90}
                          maxLength={2000}
                          accessibilityLabel="Your post"
                        />
                      )}
                    </View>
                    {source === 'post' && <Text style={styles.count}>{post.trim().length.toLocaleString()} / 2,000</Text>}
                  </GlassCard>
                </Animated.View>

                <Text style={styles.section}>Where should it go?</Text>
                <View style={styles.chips}>
                  {offered.map((id) => (
                    <PlatformChip key={id} id={id} name={NAMES[id]} selected={platforms.includes(id)} onPress={() => toggle(id)} />
                  ))}
                </View>

                <View style={styles.block}>
                  <ChoiceRow label="What do you want to make?" items={PREFERS} value={prefer} onChange={setPrefer} disabled={writing} />
                </View>

                <View style={styles.cta}>
                  {left > 0 ? (
                    <>
                      <AppButton
                        title={writing ? 'Jarvis is writing…' : platforms.length ? `Make ${platforms.length} version${platforms.length === 1 ? '' : 's'}` : 'Make versions'}
                        size="lg"
                        disabled={writing || !text || platforms.length === 0}
                        onPress={() => void make()}
                        iconRight={
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="#FFFFFF" />
                          </Svg>
                        }
                      />
                      {!unlimited && <Text style={styles.useNote}>Uses {allowance.weeklyLimit === 1 ? 'your free repurpose' : 'one of your repurposes'} for this week</Text>}
                    </>
                  ) : (
                    <>
                      <Text style={styles.outText}>You've used this week's free repurpose. You get a new one next week.</Text>
                      <AppButton title="Get unlimited with Pro" variant="gold" size="lg" onPress={() => onOpenJarvisPro?.()} />
                    </>
                  )}
                </View>

                {problem && (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.block}>
                    <Problem message={problem.message} upgrade={problem.upgrade} onUpgrade={onOpenJarvisPro} />
                  </Animated.View>
                )}

                {writing && (
                  <Animated.View entering={FadeIn.duration(150)} style={styles.thinking}>
                    <JarvisOrb size={26} />
                    <Text style={styles.thinkingText}>Jarvis is writing a version for each platform…</Text>
                  </Animated.View>
                )}

                {versions && !writing && (
                  <>
                    <Text style={styles.section}>Your versions</Text>
                    <View style={styles.stack}>
                      {versions.map((v, i) => (
                        <VersionCard
                          key={`${v.platform}-${i}`}
                          v={v}
                          index={i}
                          onChange={(body) => setVersions((all) => all && all.map((x, j) => (j === i ? { ...x, body } : x)))}
                          onCopy={() => void copy(v)}
                          onUse={onUseVersion ? () => onUseVersion(versionText(v), v.platform, ideaFor()) : undefined}
                        />
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  accent: { color: ds.purple },
  sub: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 6 },
  block: { marginTop: 16 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  sourceRow: { marginTop: 4 },
  field: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  ideaInput: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  count: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 6, textAlign: 'right' },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cta: { marginTop: 22, gap: 10 },
  useNote: { fontSize: 12.5, fontWeight: '700', color: ds.text3, textAlign: 'center' },
  outText: { fontSize: 14, lineHeight: 20, color: ds.text2, textAlign: 'center' },
  thinking: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28 },
  thinkingText: { fontSize: 13.5, fontWeight: '700', color: ds.purple, flexShrink: 1 },
  stack: { gap: 12 },
  vHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vName: { fontSize: 16, fontWeight: '800', color: ds.ink },
  vFormat: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 1 },
  vTitle: { fontSize: 13.5, fontWeight: '800', color: ds.text2, marginTop: 12, marginBottom: 8 },
  slidesBar: { flexGrow: 0, marginHorizontal: -16, marginBottom: 10, marginTop: 4 },
  slides: { gap: 8, paddingHorizontal: 16 },
  slide: { width: 120, height: 150, borderRadius: 16, padding: 10, justifyContent: 'space-between', backgroundColor: 'rgba(245, 243, 255, 0.95)', borderWidth: 1, borderColor: ds.lavender },
  slideCover: { backgroundColor: ds.purple, borderColor: ds.purple },
  slideNum: { fontSize: 10.5, fontWeight: '800', color: ds.text3 },
  slideNumCover: { color: 'rgba(255,255,255,0.8)' },
  slideText: { fontSize: 14, lineHeight: 18, fontWeight: '800', color: ds.ink },
  slideTextCover: { color: '#FFFFFF' },
  thread: { marginBottom: 10, marginTop: 4 },
  threadRow: { flexDirection: 'row', gap: 10 },
  threadRail: { alignItems: 'center', width: 24 },
  threadDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  threadNum: { fontSize: 11.5, fontWeight: '800', color: ds.purple },
  threadLine: { flex: 1, width: 2, minHeight: 10, backgroundColor: ds.lavender, marginVertical: 2 },
  threadText: { flex: 1, fontSize: 14, lineHeight: 20, color: ds.ink, paddingBottom: 12, paddingTop: 2 },
  captionLabel: { fontSize: 12, fontWeight: '800', color: ds.text3, marginBottom: 2 },
  vBody: { fontSize: 14.5, lineHeight: 21 },
  vActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ds.lavender },
  copyText: { fontSize: 14, fontWeight: '800', color: ds.purple },
});
