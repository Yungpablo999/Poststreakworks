import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, SafeAreaView, StatusBar, KeyboardAvoidingView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import Reanimated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useMascotThinking } from '../mascot/mascot';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { Text } from '../components/ui/AppText';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { AppToast } from '../components/ui/AppToast';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { JarvisOrb } from '../components/JarvisOrb';
import { ChipRow, SaveButton } from '../components/ideas/IdeasBlocks';
import { PlatformFitCard } from '../components/caption/PlatformFitCard';
import { CaptionOptionCard } from '../components/caption/CaptionBlocks';
import { NeedsJarvis, Problem, StandInNote, UsageLine } from '../components/studio/StudioBits';
import { removeDraft, saveDraft } from '../data';
import { useCapabilities } from '../backend/account';
import { IDEA_GOALS } from '../backend/ideas';
import { requestCaptionEdit, requestCaptions, studioProblem } from '../backend/studio';
import { newDraftId, firstLine, type ComposerDraft } from '../utils/composerDraft';
import type { CaptionEditAction, CaptionGoal, CaptionOptionDto, CaptionTone } from '../../frontend/shared/types/phase1';
import { ds } from '../theme/colors';

// Caption: Jarvis writes three captions for what the post is about, shaped by the goal and tone (on the
// server). The creator picks one, edits it, and can ask for a quick change (write it again, shorter, end
// on a question, new hashtags). What a free plan may have each day is the server's count.

interface CaptionScreenProps {
  /** What the post is about (may be empty: the creator types it here). */
  ideaTitle?: string;
  onBack: () => void;
  onLogout?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  /** Into the composer: the caption, its hashtags, and what the post is about. */
  onAddToPost?: (caption: string, tags: string[], topic: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  /** Pro members: the caption laid out for each platform. */
  tier?: 'free' | 'pro';
}

const TONES: CaptionTone[] = ['Helpful', 'Honest', 'Motivational', 'Funny', 'Professional'];
const MAX_TONES = 3;

const EDITS: { action: CaptionEditAction; label: string }[] = [
  { action: 'rewrite', label: 'Write it again' },
  { action: 'shorten', label: 'Shorter' },
  { action: 'ask', label: 'End with a question' },
  { action: 'tags', label: 'New hashtags' },
];

/** "#a #b, c" → ["#a", "#b", "#c"] */
const parseTags = (text: string): string[] =>
  [...new Set(text.split(/[\s,]+/).map((t) => t.replace(/^#+/, '').replace(/[^\p{L}\p{N}_]/gu, '')).filter(Boolean).map((t) => `#${t}`))].slice(0, 30);

const opening = (caption: string) => caption.trim().slice(0, 120);

const buzz = (kind: 'ok' | 'warn' | 'tap') => {
  if (Platform.OS === 'web') return;
  if (kind === 'tap') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else void Haptics.notificationAsync(kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
};

export const CaptionScreen: React.FC<CaptionScreenProps> = ({
  ideaTitle = '',
  onBack,
  onLogout,
  onOpenJarvisPro,
  onNavigateTab,
  onAddToPost,
  userProfile,
  onSaveProfile,
  tier = 'free',
}) => {
  const { ai } = useCapabilities();
  const onDesktop = useBreakpoint() === 'desktop';

  const [topic, setTopic] = useState(ideaTitle);
  const [goal, setGoal] = useState<CaptionGoal>('comments');
  const [tones, setTones] = useState<CaptionTone[]>(['Helpful', 'Honest']);
  const [options, setOptions] = useState<CaptionOptionDto[] | null>(null);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [tagsText, setTagsText] = useState('');
  // Openings already shown, so "New options" brings new ones
  const shownOpenings = useRef<string[]>([]);

  const [writing, setWriting] = useState(false);
  const [editing, setEditing] = useState<CaptionEditAction | null>(null);
  const [problem, setProblem] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [topicFocused, setTopicFocused] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // Saved as a post draft (opens in the composer); tap again to take it back out
  const [savedId, setSavedId] = useState<string | null>(null);
  useMascotThinking(writing || editing !== null);

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

  const busy = writing || editing !== null;
  const topicOk = topic.trim().length > 0;
  const tags = parseTags(tagsText);
  const fullCaption = caption.trim();

  const apply = (o: CaptionOptionDto) => {
    setPickedId(o.id);
    setCaption(o.caption);
    setTagsText(o.hashtags.join(' '));
    setSavedId(null);
  };

  const write = async (more: boolean) => {
    if (busy) return;
    if (!topicOk) {
      setProblem({ message: 'Say what the post is about first.', upgrade: false });
      return;
    }
    buzz('tap');
    setProblem(null);
    setWriting(true);
    if (!more) shownOpenings.current = [];
    const res = await requestCaptions({ topic: topic.trim(), goal, tones, avoid: shownOpenings.current.slice(-9) });
    if (!mounted.current) return;
    setWriting(false);
    if (!res.ok) {
      buzz('warn');
      setProblem(studioProblem(res));
      return;
    }
    buzz('ok');
    shownOpenings.current = [...shownOpenings.current, ...res.data.options.map((o) => opening(o.caption))].slice(-9);
    setOptions(res.data.options);
    if (res.data.options[0]) apply(res.data.options[0]);
  };

  const edit = async (action: CaptionEditAction) => {
    if (busy || !fullCaption) return;
    buzz('tap');
    setProblem(null);
    setEditing(action);
    const res = await requestCaptionEdit({ caption: fullCaption, action, idea: topic.trim() || undefined });
    if (!mounted.current) return;
    setEditing(null);
    if (!res.ok) {
      buzz('warn');
      setProblem(studioProblem(res));
      return;
    }
    buzz('ok');
    if ('tags' in res.data) setTagsText(res.data.tags.join(' '));
    else setCaption(res.data.caption);
    setPickedId(null);
    setSavedId(null);
  };

  const toggleTone = (id: string) => {
    const t = id as CaptionTone;
    setTones((prev) => {
      if (prev.includes(t)) return prev.length > 1 ? prev.filter((x) => x !== t) : prev;
      if (prev.length >= MAX_TONES) {
        showToast(`Pick up to ${MAX_TONES} tones`);
        return prev;
      }
      return [...prev, t];
    });
  };

  const saveCaption = () => {
    if (savedId) {
      removeDraft(savedId);
      setSavedId(null);
      showToast('Removed from drafts');
      return;
    }
    if (!fullCaption) return;
    const id = newDraftId();
    const payload: ComposerDraft = {
      v: 1,
      idea: topic.trim(),
      caption: fullCaption,
      tags,
      platforms: [],
      format: 'short_video',
      filmMethod: 'native',
      filmStyle: 'talking',
      overlay: '',
      at: null,
    };
    saveDraft({ id, title: topic.trim() || firstLine(fullCaption) || 'Untitled caption', kind: 'post', format: 'Caption', payload: payload as unknown as Record<string, unknown> });
    setSavedId(id);
    buzz('ok');
    showToast('Saved to drafts. Find it on Create.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ds.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <GlassBackdrop />
          <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfileModal(true)} userProfile={userProfile} />

          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines
                lines={['Write a caption', <Text key="c" style={styles.headlineAccent}>that fits your post</Text>]}
                textStyle={styles.headlineText}
                maxFontSize={32}
                align="left"
                accessibilityLabel="Write a caption that fits your post"
              />
            </Reanimated.View>

            {!ai ? (
              <NeedsJarvis tool="Caption writing" />
            ) : (
              <>
                <StandInNote />

                {/* TOPIC */}
                <Reanimated.View entering={FadeInUp.delay(80).duration(500)} style={styles.section}>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.topicHead}>
                      <JarvisOrb size={24} />
                      <Text style={styles.eyebrow}>WHAT'S THIS POST ABOUT?</Text>
                    </View>
                    <View style={[styles.field, topicFocused && styles.fieldOn]}>
                      <AutoGrowInput
                        value={topic}
                        onChangeText={(t) => {
                          setTopic(t);
                          if (problem && !problem.upgrade) setProblem(null);
                        }}
                        onFocus={() => setTopicFocused(true)}
                        onBlur={() => setTopicFocused(false)}
                        placeholder="e.g. My 5-minute morning reset"
                        minHeight={26}
                        maxLength={300}
                        accessibilityLabel="What this post is about"
                      />
                    </View>
                  </GlassCard>
                </Reanimated.View>

                {/* GOAL + TONE */}
                <Reanimated.View entering={FadeInUp.delay(140).duration(500)} style={styles.filters}>
                  <ChipRow label="Goal" items={IDEA_GOALS} selected={[goal]} onToggle={(id) => setGoal(id as CaptionGoal)} />
                  <ChipRow label={`Tone (up to ${MAX_TONES})`} items={TONES.map((t) => ({ id: t, label: t }))} selected={tones} onToggle={toggleTone} />
                </Reanimated.View>

                <View style={styles.writeRow}>
                  <AppButton
                    title={writing ? 'Jarvis is writing…' : options ? 'Write new options' : 'Write 3 captions'}
                    variant={options ? 'glass' : 'primary'}
                    size="lg"
                    disabled={busy || !topicOk}
                    onPress={() => void write(!!options)}
                  />
                  <View style={styles.center}>
                    <UsageLine kind="generate" />
                  </View>
                </View>

                {problem && (
                  <Reanimated.View entering={FadeIn.duration(200)} style={styles.section}>
                    <Problem message={problem.message} upgrade={problem.upgrade} onUpgrade={onOpenJarvisPro} />
                  </Reanimated.View>
                )}

                {writing && (
                  <Reanimated.View entering={FadeIn.duration(120)} style={styles.thinking}>
                    <JarvisOrb size={22} />
                    <Text style={styles.thinkingText}>Jarvis is writing three captions…</Text>
                  </Reanimated.View>
                )}

                {options && !writing && (
                  <>
                    <View style={styles.optionsHead}>
                      <JarvisOrb size={22} />
                      <Text style={styles.sectionLabel}>Jarvis's options</Text>
                    </View>
                    {onDesktop ? (
                      <View style={styles.optionsRow}>
                        {options.map((o, i) => (
                          <CaptionOptionCard key={o.id} fill option={o} index={i} selected={pickedId === o.id} onPress={() => apply(o)} />
                        ))}
                      </View>
                    ) : (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
                        {options.map((o, i) => (
                          <CaptionOptionCard key={o.id} option={o} index={i} selected={pickedId === o.id} onPress={() => apply(o)} />
                        ))}
                      </ScrollView>
                    )}
                  </>
                )}

                {options && (
                  <>
                    {/* YOUR CAPTION */}
                    <Text style={[styles.sectionLabel, styles.captionLabel]}>Your caption</Text>
                    <GlassCard strong radius={24} padding={16}>
                      <View style={[styles.field, captionFocused && styles.fieldOn]}>
                        {editing && editing !== 'tags' ? (
                          <Reanimated.View entering={FadeIn.duration(120)} style={styles.thinkingInline}>
                            <JarvisOrb size={20} />
                            <Text style={styles.thinkingText}>Jarvis is editing…</Text>
                          </Reanimated.View>
                        ) : (
                          <AutoGrowInput
                            value={caption}
                            onChangeText={(t) => {
                              setCaption(t);
                              setSavedId(null);
                            }}
                            onFocus={() => setCaptionFocused(true)}
                            onBlur={() => setCaptionFocused(false)}
                            minHeight={80}
                            maxLength={2200}
                            accessibilityLabel="Your caption"
                          />
                        )}
                      </View>
                      <Text style={[styles.count, fullCaption.length > 2200 && styles.countOver]}>{fullCaption.length.toLocaleString()} / 2,200 characters</Text>
                      <View style={styles.touches}>
                        {EDITS.map((e) => (
                          <Pressable
                            key={e.action}
                            onPress={() => void edit(e.action)}
                            disabled={busy || !fullCaption}
                            accessibilityRole="button"
                            accessibilityState={{ disabled: busy || !fullCaption, busy: editing === e.action }}
                            style={({ pressed }) => [styles.touch, (busy || !fullCaption) && styles.touchOff, pressed && { transform: [{ scale: 0.96 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
                          >
                            <Text style={styles.touchText}>{editing === e.action ? 'Working…' : e.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                      <View style={styles.editUsage}>
                        <UsageLine kind="edit" />
                      </View>

                      <Text style={styles.subLabel}>Hashtags</Text>
                      <View style={styles.field}>
                        <AutoGrowInput
                          value={tagsText}
                          onChangeText={(t) => {
                            setTagsText(t);
                            setSavedId(null);
                          }}
                          minHeight={24}
                          placeholder="#morningroutine #habits"
                          style={styles.tagsInput}
                          accessibilityLabel="Hashtags"
                        />
                      </View>
                    </GlassCard>

                    {/* PRO: laid out for each platform */}
                    {tier === 'pro' && fullCaption.length > 0 && (
                      <Reanimated.View entering={FadeInUp.duration(450)} style={styles.section}>
                        <PlatformFitCard body={fullCaption} ending="" tags={tags.join(' ')} onCopied={showToast} />
                      </Reanimated.View>
                    )}

                    <View style={styles.actions}>
                      <View style={styles.flex}>
                        <AppButton
                          title="Add to post"
                          size="lg"
                          disabled={busy || !fullCaption}
                          onPress={() => {
                            buzz('ok');
                            onAddToPost?.(fullCaption, tags, topic.trim());
                          }}
                          iconRight={
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                              <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          }
                        />
                      </View>
                      <SaveButton saved={savedId !== null} onPress={saveCaption} size={56} />
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>

          {toast && <AppToast message={toast} />}

          <FloatingTabBar activeTab="create" onTabPress={(tab) => onNavigateTab?.(tab)} />

          <UserProfileModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  section: { marginTop: 16 },
  topicHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  field: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  filters: { gap: 14, marginTop: 18 },
  writeRow: { marginTop: 18, gap: 8 },
  optionsHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24, marginBottom: 10 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  captionLabel: { marginTop: 24, marginBottom: 10 },
  options: { gap: 12, paddingRight: 20 },
  optionsRow: { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
  thinking: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 28 },
  thinkingInline: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 80 },
  thinkingText: { fontSize: 13.5, fontWeight: '700', color: ds.purple },
  count: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 8, textAlign: 'right' },
  countOver: { color: '#C2410C' },
  touches: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  touch: { height: 32, paddingHorizontal: 12, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  touchOff: { opacity: 0.5 },
  touchText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  editUsage: { marginTop: 8 },
  subLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginTop: 16 },
  tagsInput: { color: ds.purple },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18 },
});
