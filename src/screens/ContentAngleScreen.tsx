import React, { useState, useRef, useEffect } from 'react';
import { useMascotThinking } from '../mascot/mascot';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Platform,
  Animated,
  Modal,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Text } from '../components/ui/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, isNarrowScreen } from '../utils/responsive';
import Reanimated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FitLines } from '../components/ui/FitLines';
import { ChipRow, TopPickCard, IdeaRow, IdeaRowSkeleton, QuotaCard, SavedRow, TopicIdeasCard, UnlimitedIdeasCard } from '../components/ideas/IdeasBlocks';
import { ComposerToast } from '../components/composer/ComposerBlocks';
import { getIdeaFeed, getTopicIdeas, IDEA_GOALS, NICHE_LABELS, normalizeNiches, type IdeaGoal } from '../data';
import { ds } from '../theme/colors';

interface ContentAngleScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onUseIdea?: (ideaTitle: string, format?: string, goal?: IdeaGoal, hook?: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  /** Pro members: unlimited ideas and ideas about their own topic. */
  tier?: 'free' | 'pro';
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  iconEmoji: string;
  badgeBg: string;
  badgeBorder: string;
}

interface IdeaCardItem {
  id: string;
  title: string;
  desc?: string;
  tags: string[];
  format: string;
  goal: string;
  bookmarked: boolean;
}

interface SavedIdeaItem {
  id: string;
  title: string;
  format: string;
  savedTime: string;
}

const INITIAL_SAVED_IDEAS: SavedIdeaItem[] = [
  {
    id: 'saved_1',
    title: 'My morning setup routine',
    format: 'Short Reel',
    savedTime: 'Saved 2 h ago',
  },
  {
    id: 'saved_2',
    title: 'My simple content planning routine',
    format: 'Carousel',
    savedTime: 'Saved Yesterday',
  },
  {
    id: 'saved_3',
    title: 'How I turn 1 idea into 4 different posts across platforms',
    format: 'Carousel / Reel',
    savedTime: 'Saved 3 days ago',
  },
  {
    id: 'saved_4',
    title: '3 creator habits that made posting easier',
    format: 'Short Reel',
    savedTime: 'Saved 5 days ago',
  },
];

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'Peak Reach Window Active',
    body: '7:30 PM is your optimal viral slot on TikTok & Instagram.',
    time: '5m ago',
    unread: true,
    iconEmoji: '⚡',
    badgeBg: '#EDE9FE',
    badgeBorder: '#DDD6FE',
  },
  {
    id: 'n2',
    title: 'Streak Saver Ready',
    body: "Convert today's idea into a post to kick off your creator streak.",
    time: '2h ago',
    unread: true,
    iconEmoji: '🔥',
    badgeBg: '#FEF3C7',
    badgeBorder: '#FDE68A',
  },
];

const ALL_IDEAS_LIST: IdeaCardItem[] = [
  {
    id: 'idea_1',
    title: '3 creator habits that made posting easier',
    format: 'Short Reel',
    goal: 'Build consistency',
    tags: ['Reel', 'Habits'],
    bookmarked: false,
  },
  {
    id: 'idea_2',
    title: 'My simple content planning routine',
    format: 'Carousel',
    goal: 'Get saves',
    tags: ['Carousel', 'Planning'],
    bookmarked: true,
  },
  {
    id: 'idea_3',
    title: 'The exact gear I use to film in 10 minutes',
    format: 'TikTok / Short',
    goal: 'Gear review',
    tags: ['Short', 'Gear'],
    bookmarked: false,
  },
  {
    id: 'idea_4',
    title: 'How I turn 1 idea into 4 different posts across platforms',
    format: 'Carousel / Reel',
    goal: 'Content Repurposing',
    tags: ['Growth', 'Repurposing'],
    bookmarked: false,
  },
  {
    id: 'idea_5',
    title: 'The #1 mistake that cost me 3 months of momentum',
    format: 'Talking Head',
    goal: 'Relatable Story',
    tags: ['Story', 'Retention'],
    bookmarked: false,
  },
  {
    id: 'idea_6',
    title: 'My 15-minute morning batch-filming routine',
    format: 'Mini Vlog',
    goal: 'Protect streak',
    tags: ['Routine', 'Vlog'],
    bookmarked: false,
  },
  {
    id: 'idea_7',
    title: 'Stop doing this if you want your posts to get shared',
    format: 'Short Reel',
    goal: 'High shares',
    tags: ['Viral Hook', 'Shares'],
    bookmarked: false,
  },
];

export const ContentAngleScreen: React.FC<ContentAngleScreenProps> = ({
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  onUseIdea,

  userProfile,
  onSaveProfile,
  tier = 'free',}) => {
  const isDark = false;
  const [activeTab, setActiveTab] = useState<TabType>('create');

  // Niche & Goal Filters (Select & Unselect)
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['Creator Advice']);
  const [selectedGoals, setSelectedGoals] = useState<string[]>(['Grow engagement', 'Protect streak']);

  // Idea items state
  const [isHeroSaved, setIsHeroSaved] = useState(false);
  const [allIdeas, setAllIdeas] = useState<IdeaCardItem[]>(ALL_IDEAS_LIST);
  const [showAllIdeas, setShowAllIdeas] = useState(false);
  const [savedIdeasList, setSavedIdeasList] = useState<SavedIdeaItem[]>(INITIAL_SAVED_IDEAS);
  const [showAllSavedIdeas, setShowAllSavedIdeas] = useState(false);
  const [quotaUsed, setQuotaUsed] = useState(3);
  const [selectedAngleFilters, setSelectedAngleFilters] = useState<string[]>(['faster']);
  const [selectedJarvisChips, setSelectedJarvisChips] = useState<string[]>([]);

  // Three-dot Idea Action Menu & Filter States
  const [selectedIdeaForMenu, setSelectedIdeaForMenu] = useState<IdeaCardItem | null>(null);
  const [showIdeaMenuModal, setShowIdeaMenuModal] = useState(false);
  const [hiddenIdeaIds, setHiddenIdeaIds] = useState<string[]>([]);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Modals
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [celebrationTitle, setCelebrationTitle] = useState('Idea Generated!');
  const [celebrationSubtitle, setCelebrationSubtitle] = useState('New batch of viral content angles added to your vault.');
  const [celebrationSpeech, setCelebrationSpeech] = useState('Great work exploring new creator angles!');

  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(NOTIFICATIONS);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.9)).current;


  const triggerModalAnim = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      tension: 65,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => {
      setActionToast((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleOpenIdeaMenu = (idea: IdeaCardItem) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedIdeaForMenu(idea);
    triggerModalAnim();
    setShowIdeaMenuModal(true);
  };

  const handleMenuAction = (action: 'save' | 'hide' | 'not_relevant' | 'report') => {
    if (!selectedIdeaForMenu) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const currentIdea = selectedIdeaForMenu;
    setShowIdeaMenuModal(false);

    if (action === 'save') {
      toggleBookmark(currentIdea.id);
      triggerToast(currentIdea.bookmarked ? 'Idea removed from saved' : 'Idea saved to bookmarks');
    } else if (action === 'hide') {
      setHiddenIdeaIds((prev) => [...prev, currentIdea.id]);
      triggerToast('Idea hidden from feed');
    } else if (action === 'not_relevant') {
      setHiddenIdeaIds((prev) => [...prev, currentIdea.id]);
      triggerToast('Thanks! Jarvis will recommend fewer ideas like this');
    } else if (action === 'report') {
      triggerToast('Report received. Thank you for your feedback');
    }
  };

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const toggleNiche = (niche: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedNiches.includes(niche)) {
      setSelectedNiches(selectedNiches.filter((n) => n !== niche));
    } else {
      setSelectedNiches([...selectedNiches, niche]);
    }
  };

  const toggleGoal = (goal: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  const toggleAngleFilter = (filterId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedAngleFilters.includes(filterId)) {
      setSelectedAngleFilters(selectedAngleFilters.filter((f) => f !== filterId));
    } else {
      setSelectedAngleFilters([...selectedAngleFilters, filterId]);
    }
  };

  const toggleJarvisChip = (chipId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedJarvisChips.includes(chipId)) {
      setSelectedJarvisChips(selectedJarvisChips.filter((c) => c !== chipId));
    } else {
      setSelectedJarvisChips([...selectedJarvisChips, chipId]);
    }
  };

  const handleToggleHeroSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const nextSaved = !isHeroSaved;
    setIsHeroSaved(nextSaved);

    if (nextSaved) {
      setSavedIdeasList((prev) => [
        {
          id: 'saved_hero',
          title: 'One thing I wish I knew before I started creating',
          format: 'Short Reel',
          savedTime: 'Saved just now',
        },
        ...prev.filter((s) => s.id !== 'saved_hero'),
      ]);
      setCelebrationTitle('Idea Saved!');
      setCelebrationSubtitle('"One thing I wish I knew before I started creating" has been saved to your vault.');
      setCelebrationSpeech('Day 1 idea saved! Ready to turn into a post anytime.');
      setShowCelebrationModal(true);
    } else {
      setSavedIdeasList((prev) => prev.filter((s) => s.id !== 'saved_hero'));
    }
  };

  const toggleBookmark = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    let savedTitle = '';
    let savedFormat = 'Short Reel';
    let becameSaved = false;

    setAllIdeas((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const next = !item.bookmarked;
          becameSaved = next;
          savedTitle = item.title;
          savedFormat = item.format;
          return { ...item, bookmarked: next };
        }
        return item;
      })
    );

    if (becameSaved) {
      setSavedIdeasList((prev) => [
        {
          id: `saved_${id}`,
          title: savedTitle,
          format: savedFormat,
          savedTime: 'Saved just now',
        },
        ...prev.filter((s) => s.id !== `saved_${id}`),
      ]);
      setCelebrationTitle('Idea Saved!');
      setCelebrationSubtitle(`"${savedTitle}" has been saved to your vault.`);
      setCelebrationSpeech('Day 1 idea saved! Ready in your vault.');
      setShowCelebrationModal(true);
    } else {
      setSavedIdeasList((prev) => prev.filter((s) => s.id !== `saved_${id}`));
    }
  };

  const handleSelectIdea = (ideaTitle: string, format?: string, hook?: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    if (onUseIdea) {
      onUseIdea(ideaTitle, format, goal, hook);
    }
  };

  const handleToggleViewAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowAllIdeas((prev) => !prev);
  };

  const handleGenerateMoreIdeas = () => {
    if (quotaUsed >= 5) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      if (onOpenJarvisPro) onOpenJarvisPro();
      return;
    }
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setQuotaUsed((q) => Math.min(5, q + 1));

    const newIdea: IdeaCardItem = {
      id: `idea_${Date.now()}`,
      title: 'How I turn 1 idea into 4 different posts across platforms',
      format: 'Short Reel',
      goal: 'Content Repurposing',
      tags: ['Growth', 'Workflow'],
      bookmarked: false,
    };

    setAllIdeas([newIdea, ...allIdeas]);
    setCelebrationTitle('New Ideas Generated!');
    setCelebrationSubtitle('Fresh angles tailored for your niche are ready to create.');
    setCelebrationSpeech('Day 1 momentum active! Keep up this awesome focus.');
    setShowCelebrationModal(true);
  };

  const unreadNotifCount = notificationsList.filter((n) => n.unread).length;

  // ── Ideas feed: the creator's niches + one goal drive the ideas ──────────
  const [niches, setNiches] = useState<string[]>(() => {
    const n = normalizeNiches(userProfile?.niches);
    return n.length ? n : ['lifestyle'];
  });
  const [goal, setGoal] = useState<IdeaGoal>('followers');
  const [editNiches, setEditNiches] = useState(false);
  const feed = React.useMemo(
    () => getIdeaFeed(niches, goal, userProfile?.connectedPlatforms ?? []),
    [niches, goal, userProfile?.connectedPlatforms],
  );
  const [topIndex, setTopIndex] = useState(0);
  const [pickThinking, setPickThinking] = useState(false);
  const [listCount, setListCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  useMascotThinking(generating);
  const top = feed[topIndex % feed.length];
  const isPro = tier === 'pro';
  const [topicIdeas, setTopicIdeas] = useState<typeof feed>([]);
  const [topicBusy, setTopicBusy] = useState(false);
  const [lastTopic, setLastTopic] = useState('');
  const [topicRound, setTopicRound] = useState(0);
  const askTopic = (t: string, g: IdeaGoal = goal, fresh = false) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopicBusy(true);
    // Same topic again = the next 3; new topic or goal = start over
    const round = !fresh && t === lastTopic && g === goal && topicIdeas.length ? topicRound + 1 : 0;
    setTopicRound(round);
    setLastTopic(t);
    setTimeout(() => {
      setTopicIdeas(getTopicIdeas(t, g, feed[0]?.format, round));
      setTopicBusy(false);
    }, 800);
  };
  // Changing the goal reshapes the topic ideas
  useEffect(() => {
    if (lastTopic) askTopic(lastTopic, goal, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal]);
  const listIdeas = feed.filter((i) => i.id !== top.id).slice(0, listCount);
  const savedIds = savedIdeasList.map((s) => s.id);
  const isSaved = (id: string) => savedIds.includes(`feed_${id}`);

  useEffect(() => {
    setTopIndex(0);
    setListCount(3);
  }, [niches, goal]);

  const toggleNicheId = (id: string) =>
    setNiches((prev) => (prev.includes(id) ? (prev.length > 1 ? prev.filter((n) => n !== id) : prev) : [...prev, id]));

  const showAnotherPick = () => {
    if (pickThinking) return;
    setPickThinking(true);
    setTimeout(() => {
      setTopIndex((i) => i + 1);
      setPickThinking(false);
    }, 550);
  };

  const toggleSaveIdea = (idea: { id: string; title: string; format: string }) => {
    const key = `feed_${idea.id}`;
    if (savedIds.includes(key)) {
      setSavedIdeasList((prev) => prev.filter((s) => s.id !== key));
      triggerToast('Removed from saved ideas');
    } else {
      setSavedIdeasList((prev) => [{ id: key, title: idea.title, format: idea.format, savedTime: 'Saved just now' }, ...prev]);
      triggerToast('Saved. Find it under Saved ideas');
    }
  };

  const generateIdeas = () => {
    if (generating || (!isPro && quotaUsed >= 5)) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGenerating(true);
    setTimeout(() => {
      setQuotaUsed((q) => Math.min(5, q + 1));
      setListCount((c) => c + 2);
      setGenerating(false);
    }, 900);
  };
  const displayedIdeas = allIdeas
    .filter((item) => !hiddenIdeaIds.includes(item.id))
    .slice(0, showAllIdeas ? allIdeas.length : 2);
  const displayedSavedIdeas = showAllSavedIdeas ? savedIdeasList : savedIdeasList.slice(0, 2);

  return (
    <SafeAreaView style={[styles.safeArea, isDark && { backgroundColor: '#0C0A12' }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#0C0A12" : "#FAF8F5"} />
      <View style={[styles.container, isDark && { backgroundColor: '#0C0A12' }]}>
        <GlassBackdrop />
        {/* 1. TOP AIRY HEADER BAR */}
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenProfile={() => {
            triggerModalAnim();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
          isDark={isDark}
        />

        {/* 2. MAIN SCROLLABLE CONTENT */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Find your next', <Text key="i" style={styles.headlineAccent}>post idea</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Find your next post idea"
            />
          </Reanimated.View>

          {/* NICHES + GOAL */}
          <Reanimated.View entering={FadeInUp.delay(80).duration(500)} style={styles.filters}>
            {/* Niches come from onboarding; one line, with Change if they want other ideas */}
            <View style={styles.nicheLine}>
              <Text style={styles.nicheText} numberOfLines={1}>
                Ideas for <Text style={styles.nicheBold}>{niches.map((n) => NICHE_LABELS[n]).join(' · ')}</Text>
              </Text>
              <Pressable onPress={() => setEditNiches((v) => !v)} hitSlop={8} accessibilityRole="button">
                <Text style={styles.link}>{editNiches ? 'Done' : 'Change'}</Text>
              </Pressable>
            </View>
            {editNiches && (
              <Reanimated.View entering={FadeInUp.duration(220)} exiting={FadeOut.duration(150)}>
                <ChipRow
                  label="Pick your niches"
                  items={Object.keys(NICHE_LABELS).map((id) => ({ id, label: NICHE_LABELS[id] }))}
                  selected={niches}
                  onToggle={toggleNicheId}
                />
              </Reanimated.View>
            )}
            <ChipRow label="Goal" items={IDEA_GOALS} selected={[goal]} onToggle={(id) => setGoal(id as IdeaGoal)} />
          </Reanimated.View>

          {/* PRO: ideas about your own topic */}
          {isPro && (
            <Reanimated.View entering={FadeInUp.delay(120).duration(550)} style={styles.section}>
              <TopicIdeasCard
                busy={topicBusy}
                onAsk={(t) => askTopic(t)}
                goalLabel={IDEA_GOALS.find((g) => g.id === goal)?.label ?? 'Grow followers'}
                results={topicIdeas}
                isSaved={isSaved}
                onUse={(idea) => handleSelectIdea(idea.title, idea.format, idea.hook)}
                onSave={toggleSaveIdea}
              />
            </Reanimated.View>
          )}

          {/* TOP PICK */}
          <Reanimated.View entering={FadeInUp.delay(160).duration(550)} style={styles.section}>
            <TopPickCard
              idea={top}
              thinking={pickThinking}
              saved={isSaved(top.id)}
              onAnother={showAnotherPick}
              onUse={() => handleSelectIdea(top.title, top.format, top.hook)}
              onSave={() => toggleSaveIdea(top)}
            />
          </Reanimated.View>


          {/* MORE IDEAS */}
          <Text style={styles.sectionLabel}>More ideas</Text>
          <View style={styles.stack}>
            {generating && <IdeaRowSkeleton />}
            {listIdeas.map((idea, i) => (
              <Reanimated.View
                key={`${goal}-${idea.id}`}
                entering={FadeInUp.delay(i < 3 ? 60 * i : 0).duration(320)}
                exiting={FadeOut.duration(150)}
               
              >
                <IdeaRow
                  idea={idea}
                  saved={isSaved(idea.id)}
                  onUse={() => handleSelectIdea(idea.title, idea.format, idea.hook)}
                  onSave={() => toggleSaveIdea(idea)}
                />
              </Reanimated.View>
            ))}
          </View>

          {/* DAILY IDEAS */}
          <View style={styles.section}>
            {isPro ? (
              <UnlimitedIdeasCard generating={generating} onGenerate={generateIdeas} />
            ) : (
              <QuotaCard used={quotaUsed} limit={5} generating={generating} onGenerate={generateIdeas} onPro={() => onOpenJarvisPro?.()} />
            )}
          </View>

          {/* SAVED IDEAS */}
          {savedIdeasList.length > 0 && (
            <>
              <View style={styles.savedHead}>
                <Text style={[styles.sectionLabel, styles.sectionLabelInline]}>Saved ideas</Text>
                {savedIdeasList.length > 2 && (
                  <Pressable onPress={() => setShowAllSavedIdeas((v) => !v)} hitSlop={8} accessibilityRole="button">
                    <Text style={styles.link}>{showAllSavedIdeas ? 'Show less' : `See all ${savedIdeasList.length}`}</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.stack}>
                {displayedSavedIdeas.map((s) => (
                  <Reanimated.View key={s.id} entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)}>
                    <SavedRow
                      title={s.title}
                      meta={`${s.savedTime} · ${s.format}`}
                      onPress={() => handleSelectIdea(s.title, s.format)}
                      onUnsave={() => {
                        setSavedIdeasList((prev) => prev.filter((x) => x.id !== s.id));
                        triggerToast('Removed from saved ideas');
                      }}
                    />
                  </Reanimated.View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        {actionToast && <ComposerToast message={actionToast} />}

        {/* UNIFIED SIGNATURE FLOATING TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        {/* MODAL: NOTIFICATIONS CENTER */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Streak updates &amp; creator alerts</Text>
                </View>
                <Pressable
                  onPress={() => setShowNotificationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 260 }} showsVerticalScrollIndicator={false}>
                {notificationsList.map((notif) => (
                  <View key={notif.id} style={[styles.notifCard, notif.unread && styles.notifCardUnread]}>
                    <View style={[styles.notifBadge, { backgroundColor: notif.badgeBg, borderColor: notif.badgeBorder }]}>
                      <Text style={{ fontSize: 16 }}>{notif.iconEmoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.notifTitle}>{notif.title}</Text>
                      <Text style={styles.notifBody}>{notif.body}</Text>
                      <Text style={styles.notifTime}>{notif.time}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>

              <Pressable
                style={styles.modalFullBtn}
                onPress={() => {
                  setNotificationsList(notificationsList.map((n) => ({ ...n, unread: false })));
                  setShowNotificationModal(false);
                }}
              >
                <Text style={styles.modalFullBtnText}>Mark All Read &amp; Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* MODAL: CREATOR PROFILE PASSPORT */}
        {/* UNIVERSAL CREATOR PASSPORT & PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* IDEA OPTIONS THREE-DOT MENU MODAL */}
        <Modal
          visible={showIdeaMenuModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIdeaMenuModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.ideaMenuCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.ideaMenuHeaderRow}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={styles.ideaMenuSubtitle}>IDEA OPTIONS</Text>
                  <Text style={styles.ideaMenuTitle} numberOfLines={1}>
                    &ldquo;{selectedIdeaForMenu?.title}&rdquo;
                  </Text>
                </View>
                <Pressable
                  onPress={() => setShowIdeaMenuModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.ideaMenuList}>
                {/* 1. Save / Unsave */}
                <Pressable
                  style={({ pressed }) => [styles.ideaMenuItem, pressed && styles.btnPressed]}
                  onPress={() => handleMenuAction('save')}
                >
                  <View style={styles.ideaMenuIconCircle}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill={selectedIdeaForMenu?.bookmarked ? '#582CDB' : 'none'}>
                      <Path
                        d="M19 21L12 16L5 21V5C5 3.89543 5.89543 3 7 3H17C18.1046 3 19 3.89543 19 5V21Z"
                        stroke="#582CDB"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ideaMenuItemTitle}>
                      {selectedIdeaForMenu?.bookmarked ? 'Remove from Saved' : 'Save idea'}
                    </Text>
                    <Text style={styles.ideaMenuItemSub}>
                      {selectedIdeaForMenu?.bookmarked ? 'Remove bookmark from your vault' : 'Bookmark to your inspiration vault'}
                    </Text>
                  </View>
                </Pressable>

                {/* 2. Hide idea */}
                <Pressable
                  style={({ pressed }) => [styles.ideaMenuItem, pressed && styles.btnPressed]}
                  onPress={() => handleMenuAction('hide')}
                >
                  <View style={styles.ideaMenuIconCircle}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" stroke="#64748B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ideaMenuItemTitle}>Hide idea</Text>
                    <Text style={styles.ideaMenuItemSub}>Hide from your current idea feed</Text>
                  </View>
                </Pressable>

                {/* 3. Not relevant */}
                <Pressable
                  style={({ pressed }) => [styles.ideaMenuItem, pressed && styles.btnPressed]}
                  onPress={() => handleMenuAction('not_relevant')}
                >
                  <View style={styles.ideaMenuIconCircle}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Circle cx="12" cy="12" r="10" stroke="#64748B" strokeWidth="2" />
                      <Path d="M4.93 4.93l14.14 14.14" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ideaMenuItemTitle}>Not relevant</Text>
                    <Text style={styles.ideaMenuItemSub}>Tune Jarvis to suggest fewer like this</Text>
                  </View>
                </Pressable>

                {/* 4. Report */}
                <Pressable
                  style={({ pressed }) => [styles.ideaMenuItem, styles.ideaMenuItemLast, pressed && styles.btnPressed]}
                  onPress={() => handleMenuAction('report')}
                >
                  <View style={[styles.ideaMenuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1zM4 22v-7" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.ideaMenuItemTitle, { color: '#DC2626' }]}>Report</Text>
                    <Text style={styles.ideaMenuItemSub}>Flag inappropriate or broken idea</Text>
                  </View>
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>

        {/* SIGNATURE ANIMATED GHOST CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title={celebrationTitle}
          subtitle={celebrationSubtitle}
          speechBubble={celebrationSpeech}
          badgeText="IDEAS READY"
          xpEarned={30}
          streakCount={userProfile?.streakCount || 1}
          actionText="Keep Exploring ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ds.bg,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  filters: { gap: 14 },
  section: { marginTop: 20 },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 10 },
  sectionLabelInline: { marginTop: 0, marginBottom: 0 },
  savedHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: 10 },
  link: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  nicheLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nicheText: { flex: 1, fontSize: 13.5, color: ds.text2 },
  nicheBold: { fontWeight: '800', color: ds.ink },
  stack: { gap: 10 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 120,
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    backgroundColor: '#FAF8F5',
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  headerLogoWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 40,
    height: 40,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.2,
    borderColor: '#FFFFFF',
  },

  // Top Pill Badges
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  freeIdeasPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    paddingVertical: 4.5,
    paddingHorizontal: 11,
    borderRadius: 100,
    gap: 6,
  },
  freeIdeasDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
  },
  freeIdeasPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
    letterSpacing: 0.4,
  },

  mainTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(15px, 3.8vw, 17px)' as any) : sFont(16),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    lineHeight: 22,
    marginBottom: 4,
    marginTop: 4,
  },
  mainSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },

  // Filter Pills Rows
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#EFECE6',
    paddingVertical: 7,
    paddingHorizontal: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  filterPillActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Hero Streak Saver Card
  heroIdeaCard: {
    backgroundColor: '#FAF8FE',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    padding: 18,
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  streakSaverPickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 5,
  },
  streakSaverPickStar: {
    fontSize: 12,
  },
  streakSaverPickText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
    letterSpacing: 0.5,
  },
  heroIdeaTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 23,
    marginBottom: 8,
  },
  heroIdeaDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  whyItWorksBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    padding: 12,
    marginBottom: 14,
  },
  whyItWorksLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  whyItWorksText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
  },
  heroTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 6,
    marginBottom: 16,
  },
  heroTagPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  heroTagPillText: {
    fontSize: sFont(11),
    fontWeight: '700',
    color: '#475569',
  },
  heroSaveTagPill: {
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 100,
    flexShrink: 0,
  },
  heroSaveTagPillText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#6D28D9',
  },
  heroActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  useIdeaMainBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  useIdeaMainGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  useIdeaMainBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  bookmarkIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bookmarkIconBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // 4. More Ideas Section
  moreIdeasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  moreIdeasTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  quickFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  quickFilterPill: {
    backgroundColor: '#F1F5F9',
    borderRadius: 100,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  quickFilterPillActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  quickFilterPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  quickFilterPillTextActive: {
    color: '#6D28D9',
    fontWeight: '800',
  },

  // More Idea Card (Clean, Compact & Elegant)
  moreIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 15,
    marginBottom: 11,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  moreIdeaCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  moreIdeaCardTitle: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 20,
    paddingRight: 10,
  },
  moreIdeaDots: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '800',
  },
  moreIdeaMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  moreIdeaMetaText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  moreIdeaActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moreIdeaUseBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIdeaUseBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },
  moreIdeaBookmarkBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    borderWidth: 1,
    borderColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreIdeaBookmarkBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },

  // 5. Daily Quota
  quotaCard: {
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    padding: 16,
    marginTop: 6,
    marginBottom: 16,
  },
  quotaHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  quotaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  quotaUpgradeLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  quotaCountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 10,
  },
  quotaCardReached: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  quotaProgressTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 14,
  },
  quotaProgressFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 4,
  },
  quotaProgressFillMax: {
    backgroundColor: '#D97706',
  },
  quotaGenerateBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quotaGenerateBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  quotaReachedBtn: {
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  quotaReachedBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },

  // 6. Jarvis Insight Card
  jarvisCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E8E1F7',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  jarvisHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  jarvisFlameIconBox: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisFlameImage: {
    width: 18,
    height: 18,
  },
  jarvisTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#582CDB',
  },
  jarvisBodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  jarvisChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    rowGap: 8,
  },
  jarvisChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    paddingVertical: 5,
    paddingHorizontal: 11,
    flexShrink: 0,
  },
  jarvisChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#DDD6FE',
  },
  jarvisChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  jarvisChipTextActive: {
    color: '#582CDB',
    fontWeight: '700',
  },

  // 7. Saved Ideas Section
  savedIdeasSection: {
    marginBottom: 16,
  },
  savedIdeasHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
  },
  viewAllSavedLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  savedIdeasList: {
    gap: 8,
  },
  savedIdeaItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 14,
    gap: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  savedIdeaIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savedIdeaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  savedIdeaTime: {
    fontSize: 11,
    color: '#94A3B8',
  },
  viewAllSavedBottomBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  viewAllSavedBottomBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // 8. Generate More Ideas Main Action
  generateMoreMainBtn: {
    height: 50,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  generateMoreMainGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateMoreMainBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#171420',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseCross: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
  },
  notifCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F5F2EC',
  },
  notifCardUnread: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  notifBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  modalFullBtn: {
    backgroundColor: '#582CDB',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileModalCardInner: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  profileModalIconRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileModalName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
  },
  profileModalNiche: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  profileModalLevelPill: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  profileModalLevelText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  chatCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 12,
    marginBottom: 10,
  },
  chatSpeaker: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chatMsg: {
    fontSize: 12.5,
    color: '#171420',
    lineHeight: 18,
  },

  // Action Toast Notice
  actionToastBanner: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionToastText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    textAlign: 'center',
  },

  // Idea Options Three-Dot Menu
  ideaMenuCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  ideaMenuHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  ideaMenuSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  ideaMenuTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
  },
  ideaMenuList: {
    paddingTop: 4,
  },
  ideaMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  ideaMenuItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 4,
  },
  ideaMenuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ideaMenuItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  ideaMenuItemSub: {
    fontSize: 11,
    color: '#64748B',
  },
});
