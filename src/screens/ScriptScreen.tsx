import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Platform, SafeAreaView, StatusBar, KeyboardAvoidingView } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import Svg, { Path } from 'react-native-svg';
import Reanimated, { FadeIn, FadeInUp } from 'react-native-reanimated';
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
import { ScriptTimeline, PartCard, ReadThrough, secondsFor, type PartKey } from '../components/script/ScriptBlocks';
import { ChoiceRow, NeedsJarvis, Problem, StandInNote, UsageLine } from '../components/studio/StudioBits';
import { FILM_STYLES, saveDraft, type SavedDraft } from '../data';
import { useCapabilities } from '../backend/account';
import { requestScript, requestScriptPart, studioProblem } from '../backend/studio';
import { newScriptDraftId, readScriptDraft, scriptAsText, type ScriptLength } from '../utils/scriptDraft';
import type { FilmStyle, ScriptParts } from '../../frontend/shared/types/phase1';
import { ds } from '../theme/colors';

// Script: Jarvis writes a short video script for the creator's idea (hook, story, lesson, ask), on the
// server. Each part can be edited by hand, or written again by Jarvis (a quick edit). What a free plan
// may have each day is the server's count, shown under the buttons. Saved as a draft with everything
// on the page, so it opens again the way it was left.

interface ScriptScreenProps {
  /** The idea the creator came with (may be empty: they can type one here). */
  ideaTitle?: string;
  /** A saved script to carry on from. */
  draft?: SavedDraft | null;
  onBack: () => void;
  onLogout?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  /** Take the script to the composer: the idea, the opening line and the kind of video. */
  onUseAsPost?: (post: { idea: string; hook: string; style: FilmStyle }) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

const LENGTHS: { id: ScriptLength; label: string }[] = [
  { id: 15, label: '15 sec' },
  { id: 30, label: '30 sec' },
  { id: 60, label: '60 sec' },
];

const PARTS: { key: PartKey; title: string; short: string; hint: string }[] = [
  { key: 'hook', title: 'Hook', short: 'Hook', hint: 'The first 3 seconds: make them stop scrolling' },
  { key: 'story', title: 'Story', short: 'Story', hint: 'The story or tips, in your own words' },
  { key: 'lesson', title: 'Key lesson', short: 'Lesson', hint: 'One line people will remember' },
  { key: 'cta', title: 'Ask viewers', short: 'Ask', hint: 'End with one thing for them to do' },
];

const buzz = (kind: 'ok' | 'warn' | 'tap') => {
  if (Platform.OS === 'web') return;
  if (kind === 'tap') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  else void Haptics.notificationAsync(kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
};

export const ScriptScreen: React.FC<ScriptScreenProps> = ({
  ideaTitle = '',
  draft,
  onBack,
  onLogout,
  onOpenJarvisPro,
  onNavigateTab,
  onUseAsPost,
  userProfile,
  onSaveProfile,
}) => {
  const { ai } = useCapabilities();
  const saved = useRef(readScriptDraft(draft?.payload)).current;

  const [idea, setIdea] = useState(saved?.idea || draft?.title || ideaTitle);
  const [length, setLength] = useState<ScriptLength>(saved?.length ?? 30);
  const [style, setStyle] = useState<FilmStyle>(saved?.style ?? 'talking');
  const [script, setScript] = useState<ScriptParts | null>(saved?.script ?? null);
  const [draftId, setDraftId] = useState(() => (saved && draft ? draft.id : newScriptDraftId()));

  const [writing, setWriting] = useState(false);
  const [rewriting, setRewriting] = useState<PartKey | null>(null);
  const [problem, setProblem] = useState<{ message: string; upgrade: boolean } | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const mounted = useRef(true);
  useEffect(
    () => () => {
      mounted.current = false;
    },
    [],
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => mounted.current && setToast(null), 2400);
  };
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const busy = writing || rewriting !== null;
  const ideaOk = idea.trim().length > 0;

  const write = async () => {
    if (busy) return;
    if (!ideaOk) {
      setProblem({ message: 'Say what the video is about first.', upgrade: false });
      return;
    }
    buzz('tap');
    setProblem(null);
    setWriting(true);
    const res = await requestScript({ idea: idea.trim(), length, style });
    if (!mounted.current) return;
    setWriting(false);
    if (!res.ok) {
      buzz('warn');
      setProblem(studioProblem(res));
      return;
    }
    buzz('ok');
    // A new script is a new draft: the one saved before stays as it was
    if (script) setDraftId(newScriptDraftId());
    setScript(res.data.script);
    setJustSaved(false);
  };

  const rewrite = async (part: PartKey) => {
    if (!script || busy) return;
    if (!ideaOk) {
      setProblem({ message: 'Say what the video is about first.', upgrade: false });
      return;
    }
    setProblem(null);
    setRewriting(part);
    // Every part goes along so the new one fits the others; a part left empty is said to be empty
    const context: ScriptParts = {
      hook: script.hook.trim() || '(empty)',
      story: script.story.trim() || '(empty)',
      lesson: script.lesson.trim() || '(empty)',
      cta: script.cta.trim() || '(empty)',
    };
    const res = await requestScriptPart({ idea: idea.trim(), part, script: context, length, style, direction: 'different' });
    if (!mounted.current) return;
    setRewriting(null);
    if (!res.ok) {
      buzz('warn');
      setProblem(studioProblem(res));
      return;
    }
    buzz('ok');
    setScript((s) => (s ? { ...s, [part]: res.data.text } : s));
    setJustSaved(false);
  };

  const editPart = (part: PartKey, text: string) => {
    setScript((s) => (s ? { ...s, [part]: text } : s));
    setJustSaved(false);
  };

  const copyScript = async () => {
    if (!script) return;
    try {
      await Clipboard.setStringAsync(scriptAsText(script));
      showToast('Script copied. Paste it into your notes or teleprompter.');
    } catch {
      showToast('Couldn’t copy. Try again.');
    }
  };

  const saveScriptDraft = () => {
    if (!script) return;
    const title = idea.trim() || script.hook.trim().slice(0, 80) || 'Untitled script';
    saveDraft({ id: draftId, title, kind: 'script', format: 'Script', payload: { v: 1, idea: idea.trim(), length, style, script } });
    buzz('ok');
    setJustSaved(true);
    showToast('Saved to drafts. Find it on Create.');
  };

  const useAsPost = () => {
    if (!script) return;
    buzz('ok');
    onUseAsPost?.({ idea: idea.trim(), hook: script.hook.trim(), style });
  };

  // Jump to a part from the timeline
  const partRefs = useRef<Partial<Record<PartKey, View | null>>>({});
  const scrollRef = useRef<ScrollView>(null);
  const jumpTo = (k: PartKey) => {
    const target = partRefs.current[k];
    const sv = scrollRef.current as (ScrollView & { getInnerViewRef?: () => unknown; getInnerViewNode?: () => unknown }) | null;
    const content = sv?.getInnerViewRef?.() ?? sv?.getInnerViewNode?.();
    if (target && sv && content) {
      target.measureLayout(content as never, (_x, y) => sv.scrollTo({ y: Math.max(0, y - 12), animated: true }), () => {});
    }
  };

  const timeline = script
    ? PARTS.filter((p) => p.key !== 'lesson' || script.lesson.trim()).map((p) => ({ key: p.key, label: p.short, seconds: secondsFor(script[p.key]) }))
    : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ds.bg} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.container}>
          <GlassBackdrop />
          <FreeAppHeader
            backgroundColor="transparent"
            onBack={onBack}
            onOpenJarvisPro={onOpenJarvisPro}
            onOpenProfile={() => setShowProfileModal(true)}
            userProfile={userProfile}
          />

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines
                lines={['Turn your idea', <Text key="s" style={styles.headlineAccent}>into a script</Text>]}
                textStyle={styles.headlineText}
                maxFontSize={34}
                align="left"
                accessibilityLabel="Turn your idea into a script"
              />
            </Reanimated.View>

            {!ai ? (
              <NeedsJarvis tool="Script writing" />
            ) : (
              <>
                <StandInNote />

                {/* THE IDEA, AND WHAT KIND OF VIDEO */}
                <Reanimated.View entering={FadeInUp.delay(80).duration(500)} style={styles.section}>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.ideaTop}>
                      <JarvisOrb size={24} />
                      <Text style={styles.ideaEyebrow}>YOUR IDEA</Text>
                    </View>
                    <View style={styles.ideaField}>
                      <AutoGrowInput
                        value={idea}
                        onChangeText={(t) => {
                          setIdea(t);
                          if (problem && !problem.upgrade) setProblem(null);
                        }}
                        placeholder="e.g. One thing I wish I knew before I started creating"
                        maxLength={300}
                        minHeight={44}
                        accessibilityLabel="What the video is about"
                        style={styles.ideaInput}
                      />
                    </View>
                    <View style={styles.choiceBlock}>
                      <ChoiceRow label="What kind of video?" items={FILM_STYLES} value={style} onChange={setStyle} disabled={busy} />
                    </View>
                    <View style={styles.choiceBlock}>
                      <ChoiceRow label="How long?" items={LENGTHS} value={length} onChange={setLength} disabled={busy} />
                    </View>
                    <View style={styles.writeRow}>
                      <AppButton
                        title={writing ? 'Jarvis is writing…' : script ? 'Write a new script' : 'Write my script'}
                        variant={script ? 'glass' : 'primary'}
                        size="lg"
                        disabled={busy || !ideaOk}
                        onPress={write}
                      />
                      <View style={styles.usage}>
                        <UsageLine kind="generate" />
                      </View>
                    </View>
                  </GlassCard>
                </Reanimated.View>

                {problem && (
                  <Reanimated.View entering={FadeIn.duration(200)} style={styles.section}>
                    <Problem message={problem.message} upgrade={problem.upgrade} onUpgrade={onOpenJarvisPro} />
                  </Reanimated.View>
                )}

                {writing && !script && (
                  <Reanimated.View entering={FadeIn.duration(200)} style={styles.section}>
                    <GlassCard strong radius={24} padding={20}>
                      <View style={styles.writing}>
                        <JarvisOrb size={28} />
                        <Text style={styles.writingText}>Jarvis is writing your script…</Text>
                      </View>
                    </GlassCard>
                  </Reanimated.View>
                )}

                {script && (
                  <>
                    <Reanimated.View entering={FadeInUp.duration(400)} style={styles.section}>
                      <ScriptTimeline parts={timeline} onJump={jumpTo} />
                    </Reanimated.View>

                    <View style={styles.partsStack}>
                      {PARTS.map((p, i) => (
                        <PartCard
                          key={p.key}
                          n={i + 1}
                          partKey={p.key}
                          title={p.title}
                          hint={p.hint}
                          optional={p.key === 'lesson'}
                          value={script[p.key]}
                          onChange={(t) => editPart(p.key, t)}
                          rewriting={rewriting === p.key || (writing && rewriting === null)}
                          busy={busy}
                          onRewrite={() => void rewrite(p.key)}
                          viewRef={(v) => {
                            partRefs.current[p.key] = v;
                          }}
                        />
                      ))}
                      <View style={styles.editUsage}>
                        <UsageLine kind="edit" />
                      </View>
                    </View>

                    <View style={styles.section}>
                      <ReadThrough parts={PARTS.map((p) => ({ label: p.title, text: script[p.key] }))} onCopy={copyScript} />
                    </View>

                    <View style={styles.actions}>
                      {onUseAsPost && (
                        <AppButton
                          title="Use as post"
                          size="lg"
                          disabled={busy}
                          onPress={useAsPost}
                          iconRight={
                            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                              <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          }
                        />
                      )}
                      <AppButton
                        title={justSaved ? 'Saved to drafts' : 'Save draft'}
                        variant="glass"
                        disabled={busy}
                        onPress={saveScriptDraft}
                        iconRight={
                          justSaved ? (
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path d="M20 6L9 17l-5-5" stroke={ds.greenFill} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          ) : undefined
                        }
                      />
                    </View>
                  </>
                )}
              </>
            )}
          </ScrollView>

          {toast && <AppToast message={toast} />}

          <FloatingTabBar activeTab="create" onTabPress={(tab) => onNavigateTab?.(tab)} />

          <UserProfileModal
            visible={showProfileModal}
            onClose={() => setShowProfileModal(false)}
            onLogout={onLogout}
            initialProfile={userProfile}
            onSaveProfile={onSaveProfile}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  section: { marginTop: 16 },
  ideaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ideaEyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  ideaField: {
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ideaInput: { fontSize: 17, lineHeight: 23, fontWeight: '800' },
  choiceBlock: { marginTop: 14 },
  writeRow: { marginTop: 16, gap: 8 },
  usage: { alignItems: 'center' },
  writing: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  writingText: { fontSize: 15, fontWeight: '800', color: ds.purple },
  partsStack: { gap: 14, marginTop: 16 },
  editUsage: { alignItems: 'center' },
  actions: { gap: 10, marginTop: 18 },
});
