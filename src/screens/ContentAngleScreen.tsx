import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Platform, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { Text } from '../components/ui/AppText';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { AppToast } from '../components/ui/AppToast';
import { ChipRow, TopPickCard, IdeaRow, SavedRow, TopicIdeasCard } from '../components/ideas/IdeasBlocks';
import { draftAgo, getDrafts, NICHE_LABELS, normalizeNiches, removeDraft, saveDraft, subscribeToDrafts, type SavedDraft } from '../data';
import { IDEA_GOALS, loadIdeaList, loadTopicIdeas, type IdeaGoal } from '../backend/ideas';
import type { ComposerDraft } from '../utils/composerDraft';
import type { FeedIdea, IdeaList } from '../../frontend/shared/types/phase1';
import { sPadding } from '../utils/responsive';
import { ds } from '../theme/colors';

// Ideas: post ideas for the creator's own topics (the niches on their profile), shaped by one goal. The
// server writes them (its idea library, or Jarvis when an AI is switched on there). Pro creators can also
// ask for ideas about a topic they type. Saving an idea keeps it as a draft, so it is there on every device.

interface ContentAngleScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseIdea?: (ideaTitle: string, format?: string, goal?: IdeaGoal, hook?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  /** Pro members: ideas about their own topic. */
  tier?: 'free' | 'pro';
}

type Load = { state: 'loading' } | { state: 'failed' } | { state: 'ready'; list: IdeaList };

/** Saved ideas are drafts with this id, so the same idea is never saved twice. */
const draftIdFor = (idea: FeedIdea) => `idea-${idea.id}`;
const isIdeaDraft = (d: SavedDraft) => d.id.startsWith('idea-');

export const ContentAngleScreen: React.FC<ContentAngleScreenProps> = ({
  onBack,
  onLogout,
  onOpenJarvisPro,
  onNavigateTab,
  onUseIdea,
  userProfile,
  onSaveProfile,
  tier = 'free',
}) => {
  const isPro = tier === 'pro';
  const niches = normalizeNiches(userProfile?.niches);
  const nicheKey = niches.join('|');

  const [goal, setGoal] = useState<IdeaGoal>('followers');
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [topIndex, setTopIndex] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Pro: ideas about a topic the creator types
  const [topicIdeas, setTopicIdeas] = useState<FeedIdea[]>([]);
  const [topicBusy, setTopicBusy] = useState(false);
  const [lastTopic, setLastTopic] = useState('');
  const [topicRound, setTopicRound] = useState(0);

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

  const fetchFeed = useCallback(async (g: IdeaGoal) => {
    setLoad({ state: 'loading' });
    const list = await loadIdeaList(g);
    if (!mounted.current) return;
    setTopIndex(0);
    setLoad(list && list.ideas.length ? { state: 'ready', list } : { state: 'failed' });
  }, []);

  // A new goal, or new topics on the profile: read the ideas again
  useEffect(() => {
    void fetchFeed(goal);
  }, [goal, nicheKey, fetchFeed]);

  const askTopic = async (t: string, g: IdeaGoal = goal, fresh = false) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Same topic again = the next 3; new topic or goal = start over
    const round = !fresh && t === lastTopic && topicIdeas.length ? topicRound + 1 : 0;
    setTopicBusy(true);
    const ideas = await loadTopicIdeas(t, g, undefined, round);
    if (!mounted.current) return;
    setTopicBusy(false);
    if (!ideas) {
      showToast('Couldn’t get ideas just now. Try again.');
      return;
    }
    setTopicRound(round);
    setLastTopic(t);
    setTopicIdeas(ideas);
  };
  // Changing the goal reshapes the topic ideas
  const firstGoal = useRef(true);
  useEffect(() => {
    if (firstGoal.current) {
      firstGoal.current = false;
      return;
    }
    if (isPro && lastTopic) void askTopic(lastTopic, goal, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);

  // Saved ideas are drafts: they follow the creator to every device
  const drafts = React.useSyncExternalStore(subscribeToDrafts, getDrafts, getDrafts);
  const savedIdeas = drafts.filter(isIdeaDraft);
  const [showAllSaved, setShowAllSaved] = useState(false);
  const isSaved = (id: string) => drafts.some((d) => d.id === `idea-${id}`);

  const toggleSave = (idea: FeedIdea) => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    const id = draftIdFor(idea);
    if (drafts.some((d) => d.id === id)) {
      removeDraft(id);
      showToast('Removed from saved ideas');
      return;
    }
    const payload: ComposerDraft = {
      v: 1,
      idea: idea.title,
      caption: idea.hook,
      tags: [],
      platforms: [],
      format: /carousel/i.test(idea.format) ? 'carousel' : /text|thread/i.test(idea.format) ? 'text' : 'short_video',
      filmMethod: 'native',
      filmStyle: 'talking',
      overlay: '',
      at: null,
    };
    saveDraft({ id, title: idea.title, kind: 'post', format: idea.format, payload: payload as unknown as Record<string, unknown> });
    showToast('Saved. It’s in your drafts too.');
  };

  const use = (title: string, format?: string, hook?: string) => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onUseIdea?.(title, format, goal, hook);
  };

  const ideas = load.state === 'ready' ? load.list.ideas : [];
  const top = ideas.length ? ideas[topIndex % ideas.length] : null;
  const more = top ? ideas.filter((i) => i.id !== top.id) : [];
  const shownSaved = showAllSaved ? savedIdeas : savedIdeas.slice(0, 2);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={ds.bg} />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfileModal(true)} userProfile={userProfile} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Find your next', <Text key="i" style={styles.headlineAccent}>post idea</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Find your next post idea"
            />
          </Reanimated.View>

          {/* TOPICS + GOAL */}
          <Reanimated.View entering={FadeInUp.delay(80).duration(500)} style={styles.filters}>
            <View style={styles.nicheLine}>
              <Text style={styles.nicheText} numberOfLines={1}>
                {niches.length ? (
                  <>
                    Ideas for <Text style={styles.nicheBold}>{niches.map((n) => NICHE_LABELS[n]).join(' · ')}</Text>
                  </>
                ) : (
                  'Ideas for creators starting out'
                )}
              </Text>
              {onSaveProfile && (
                <Pressable onPress={() => setShowProfileModal(true)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Change your topics">
                  <Text style={styles.link}>Change</Text>
                </Pressable>
              )}
            </View>
            <ChipRow label="Goal" items={IDEA_GOALS} selected={[goal]} onToggle={(id) => setGoal(id as IdeaGoal)} />
          </Reanimated.View>

          {/* PRO: ideas about your own topic */}
          {isPro && (
            <Reanimated.View entering={FadeInUp.delay(120).duration(550)} style={styles.section}>
              <TopicIdeasCard
                busy={topicBusy}
                onAsk={(t) => void askTopic(t)}
                goalLabel={IDEA_GOALS.find((g) => g.id === goal)?.label ?? 'Grow followers'}
                results={topicIdeas}
                isSaved={isSaved}
                onUse={(idea) => use(idea.title, idea.format, idea.hook)}
                onSave={toggleSave}
              />
            </Reanimated.View>
          )}

          {load.state === 'loading' && (
            <View style={styles.loading}>
              <ActivityIndicator color={ds.purple} />
            </View>
          )}

          {load.state === 'failed' && (
            <View style={styles.section}>
              <GlassCard strong radius={22} padding={18}>
                <Text style={styles.failedText}>Couldn’t load ideas just now.</Text>
                <View style={styles.failedBtn}>
                  <AppButton title="Try again" variant="quiet" onPress={() => void fetchFeed(goal)} />
                </View>
              </GlassCard>
            </View>
          )}

          {top && (
            <>
              <Reanimated.View entering={FadeInUp.delay(160).duration(550)} style={styles.section}>
                <TopPickCard
                  idea={top}
                  saved={isSaved(top.id)}
                  onAnother={ideas.length > 1 ? () => setTopIndex((i) => i + 1) : undefined}
                  onUse={() => use(top.title, top.format, top.hook)}
                  onSave={() => toggleSave(top)}
                />
              </Reanimated.View>

              {more.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>More ideas</Text>
                  <View style={styles.stack}>
                    {more.map((idea, i) => (
                      <Reanimated.View key={`${goal}-${idea.id}`} entering={FadeInUp.delay(i < 3 ? 60 * i : 0).duration(320)} exiting={FadeOut.duration(150)}>
                        <IdeaRow idea={idea} saved={isSaved(idea.id)} onUse={() => use(idea.title, idea.format, idea.hook)} onSave={() => toggleSave(idea)} />
                      </Reanimated.View>
                    ))}
                  </View>
                </>
              )}
              {load.state === 'ready' && (
                <Text style={styles.source}>{load.list.source === 'ai' ? 'Written by Jarvis for your topics' : 'Picked for your topics and goal'}</Text>
              )}
            </>
          )}

          {/* SAVED IDEAS */}
          {savedIdeas.length > 0 && (
            <>
              <View style={styles.savedHead}>
                <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>Saved ideas</Text>
                {savedIdeas.length > 2 && (
                  <Pressable onPress={() => setShowAllSaved((v) => !v)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.link}>{showAllSaved ? 'Show less' : `See all ${savedIdeas.length}`}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.stack}>
                {shownSaved.map((d) => (
                  <Reanimated.View key={d.id} entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
                    <SavedRow
                      title={d.title}
                      meta={`Saved ${draftAgo(d.savedAt).toLowerCase()} · ${d.format}`}
                      onPress={() => {
                        const hook = typeof d.payload?.caption === 'string' ? d.payload.caption : undefined;
                        use(d.title, d.format, hook);
                      }}
                      onUnsave={() => {
                        removeDraft(d.id);
                        showToast('Removed from saved ideas');
                      }}
                    />
                  </Reanimated.View>
                ))}
              </View>
            </>
          )}
          <View style={{ height: 110 }} />
        </ScrollView>

        {toast && <AppToast message={toast} />}

        <FloatingTabBar activeTab="create" onTabPress={(tab) => onNavigateTab?.(tab)} />

        <UserProfileModal visible={showProfileModal} onClose={() => setShowProfileModal(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: sPadding(20), paddingTop: 8 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  filters: { gap: 14 },
  nicheLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  nicheText: { flex: 1, fontSize: 14, color: ds.text2 },
  nicheBold: { fontWeight: '800', color: ds.ink },
  link: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  section: { marginTop: 18 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 10 },
  sectionLabelInline: { marginTop: 0, marginBottom: 0 },
  savedHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  stack: { gap: 12 },
  loading: { paddingVertical: 48, alignItems: 'center' },
  failedText: { fontSize: 14.5, fontWeight: '700', color: ds.text2, textAlign: 'center' },
  failedBtn: { marginTop: 12 },
  source: { fontSize: 12, fontWeight: '600', color: ds.text3, textAlign: 'center', marginTop: 14 },
});
