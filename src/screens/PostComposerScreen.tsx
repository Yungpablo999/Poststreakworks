import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Rect } from 'react-native-svg';
import Reanimated, { Easing, FadeIn, FadeInUp, FadeOut, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text, TextInput } from '../components/ui/AppText';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { ScheduleSheet } from '../components/composer/ScheduleSheet';
import { PlatformLogo } from '../components/onboarding/PlatformLogo';
import { FilmMethodPicker, FilmPlanCard, PostedCheck, type FilmMethod } from '../components/composer/FilmBlocks';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FitLines } from '../components/ui/FitLines';
import { AppButton } from '../components/ui/AppButton';
import { JarvisOrb } from '../components/JarvisOrb';
import {
  StepHeader,
  PlatformChip,
  RecommendedFormat,
  FormatTile,
  MediaZone,
  TagChip,
  ModeSwitch,
  ReadinessCard,
  ComposerToast,
  type PublishMode,
} from '../components/composer/ComposerBlocks';
import { getDefaultFilmStyle, getFilmPlan, removeDraft, saveDraft, whenLabel, type FilmStyle, type IdeaGoal, type SavedDraft } from '../data';
import { HANDOFF_NAMES, HANDOFF_PLATFORMS, handOffToPlatform, isHandoffPlatform, postText, type HandoffPlatform } from '../utils/handoff';
import { captureWithCamera, pickFromLibrary, pickPhotos } from '../utils/media';
import { firstLine, newDraftId, readComposerDraft, type ComposerDraft } from '../utils/composerDraft';
import { plural } from '../utils/format';
import type { ApiResult } from '../backend/api';
import { loadIdeaFeed } from '../backend/ideas';
import { growthStore, loadGrowth, useGrowth } from '../backend/growth';
import { markPosted, planPost } from '../backend/posts';
import { nicheIds } from '../backend/sync';
import { ds } from '../theme/colors';
import type { FeedIdea, NewPostBody, Post } from '../../frontend/shared/types/phase1';

// The post composer: shape a post, then plan it, post it, or save it for later.
//
// PostStreak doesn't publish to TikTok, Instagram, YouTube, Threads or Facebook for the creator, so:
//   Schedule    → the post is planned for the time they pick; at that time the server marks it "ready" and the
//                 bell tells them; they post it in the app and tap "I posted it".
//   Post now    → the post is made ready this moment, the app opens with the caption copied, and when they
//                 come back they say whether they posted it.
//   Draft       → saved to their account with everything on this page, so it opens the way they left it.
// A video or photo they pick stays on their phone: it is for them to see, and they choose it again in the
// platform's app. Nothing on this page is written for them: the caption starts empty (or as the idea gave it).

type ContentFormatType = 'short_video' | 'carousel' | 'image' | 'text' | 'long_video';

interface PostComposerScreenProps {
  /** The idea this post comes from. */
  ideaTitle?: string;
  /** What the Ideas page or the Caption writer handed over: a finished caption and tags, or the idea's opening line. */
  ideaGoal?: { goal?: IdeaGoal; hook?: string; caption?: string; tags?: string[] } | null;
  initialFormat?: ContentFormatType;
  initialPlatform?: string;
  /** Pre-pick the kind of video (e.g. from the Repurpose video studio). */
  initialFilmStyle?: FilmStyle;
  /** A saved draft to carry on from. */
  draft?: SavedDraft | null;
  onBack: () => void;
  onLogout?: () => void;
  onOpenSchedule?: () => void;
  onOpenJarvisPro?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

interface FormatOption {
  id: ContentFormatType;
  title: string;
  badge: string;
  description: string;
  mediaLabel: string;
  addLabel: string;
  supported: HandoffPlatform[];
}

const FORMATS: FormatOption[] = [
  {
    id: 'short_video',
    title: 'Short Video',
    badge: '9:16 Vertical',
    description: 'Best fit for this idea and your selected short-form channels.',
    mediaLabel: 'Add your short-form video',
    addLabel: 'Add Video',
    supported: ['tiktok', 'instagram', 'youtube', 'facebook'],
  },
  {
    id: 'carousel',
    title: 'Carousel',
    badge: '4:5 / 1:1',
    description: 'Great for educational breakdowns, step-by-step swipe posts & saves.',
    mediaLabel: 'Add carousel slides',
    addLabel: 'Add Slides',
    supported: ['instagram', 'tiktok', 'facebook'],
  },
  {
    id: 'image',
    title: 'Single Visual',
    badge: '4:5 Portrait',
    description: 'High-impact standalone visual or aesthetic graphic for feeds.',
    mediaLabel: 'Add high-res visual',
    addLabel: 'Add Image',
    supported: ['instagram', 'facebook', 'threads'],
  },
  {
    id: 'text',
    title: 'Text / Thread',
    badge: 'Text-First',
    description: 'Direct text takeaway, opinion, or multi-part insight thread.',
    mediaLabel: 'Media is optional for text posts',
    addLabel: 'Add Optional Visual',
    supported: ['threads', 'facebook'],
  },
  {
    id: 'long_video',
    title: 'Long Video',
    badge: '16:9 HD',
    description: 'In-depth tutorial, vlog, or full horizontal explanation video.',
    mediaLabel: 'Add your long-form video',
    addLabel: 'Add Video',
    supported: ['youtube', 'facebook'],
  },
];

const SHORT_NAME: Record<HandoffPlatform, string> = { tiktok: 'TikTok', instagram: 'IG', youtube: 'YT', threads: 'Threads', facebook: 'FB' };

const recommendedFormat = (platforms: string[]): ContentFormatType =>
  platforms.length === 1 && platforms[0] === 'threads' ? 'text' : 'short_video';

const joinNames = (names: string[]): string => (names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`);

/** A video or photos the creator picked. They stay on the phone. */
type Picked = { kind: 'video' | 'image'; count: number; duration?: number };

type Celebration = { title: string; subtitle: string; speech: string; badge: string; streak: number; toSchedule: boolean };

export const PostComposerScreen: React.FC<PostComposerScreenProps> = ({
  ideaTitle = '',
  ideaGoal,
  initialFormat,
  initialPlatform = '',
  initialFilmStyle,
  draft,
  onBack,
  onLogout,
  onOpenSchedule,
  onOpenJarvisPro,
  onNavigateTab,
  userProfile,
  onSaveProfile,
}) => {
  // A draft from before this composer saved its state (or from another screen) opens as an idea
  const saved: ComposerDraft | null = useMemo(() => readComposerDraft(draft?.payload), [draft?.id]);
  const [draftId, setDraftId] = useState(() => draft?.id ?? newDraftId());

  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [idea, setIdea] = useState(() => saved?.idea ?? (draft ? draft.title : ideaTitle));
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(() =>
    saved?.platforms.length ? saved.platforms : initialPlatform ? [initialPlatform] : draft?.platform ? [draft.platform] : [],
  );
  const [format, setFormat] = useState<ContentFormatType>(() => saved?.format ?? initialFormat ?? 'short_video');
  // Short video only: film in TikTok / Reels / Shorts, record here, or upload a finished video
  const [filmMethod, setFilmMethod] = useState<FilmMethod>(saved?.filmMethod ?? 'native');
  const [filmStyle, setFilmStyle] = useState<FilmStyle>(() => saved?.filmStyle ?? initialFilmStyle ?? getDefaultFilmStyle(nicheIds(userProfile?.niches ?? [])));
  const [overlay, setOverlay] = useState(saved?.overlay ?? '');
  const [picked, setPicked] = useState<Picked | null>(null);
  const [caption, setCaption] = useState(() => saved?.caption ?? ideaGoal?.caption ?? ideaGoal?.hook ?? '');
  const [tags, setTags] = useState<string[]>(() => saved?.tags ?? ideaGoal?.tags ?? []);
  const [newTag, setNewTag] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [captionFocused, setCaptionFocused] = useState(false);
  const [mode, setMode] = useState<PublishMode>('schedule');
  const [at, setAt] = useState<Date | null>(() => (saved?.at && Date.parse(saved.at) > Date.now() ? new Date(saved.at) : null));

  const [showSchedule, setShowSchedule] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const mainScroll = useRef<ScrollView>(null);
  // Steps are measured when tapped (sections above can change height)
  const sectionRefs = useRef<{ [key: string]: View | null }>({});
  const contentH = useRef(0);
  const viewportH = useRef(0);

  const showNotice = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((prev) => (prev === msg ? null : prev)), 3200);
  };
  const buzz = (kind: 'light' | 'ok' | 'warn') => {
    if (Platform.OS === 'web') return;
    if (kind === 'light') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else void Haptics.notificationAsync(kind === 'ok' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning);
  };

  // A new idea, caption or platform handed over while this page is open (Ghost's "write a post about…", say)
  const lastIdea = useRef(ideaTitle);
  useEffect(() => {
    if (ideaTitle && ideaTitle !== lastIdea.current) {
      lastIdea.current = ideaTitle;
      setIdea(ideaTitle);
    }
  }, [ideaTitle]);
  useEffect(() => {
    if (ideaGoal?.caption) {
      setCaption(ideaGoal.caption);
      if (ideaGoal.tags?.length) setTags(ideaGoal.tags);
    }
  }, [ideaGoal?.caption, ideaGoal?.tags]);
  useEffect(() => {
    if (initialFormat) setFormat(initialFormat);
  }, [initialFormat]);
  useEffect(() => {
    if (initialPlatform) setSelectedPlatforms([initialPlatform]);
  }, [initialPlatform]);

  // The creator's own best time, once their posts say what it is
  const growth = useGrowth();
  useEffect(() => {
    if (!growthStore.get()) void loadGrowth();
  }, []);
  const bestTime = growth?.bestTime ?? null;

  // ─── Platforms, format, media ──────────────────────────────────────────────

  const togglePlatform = (id: string) => {
    buzz('light');
    setSelectedPlatforms((cur) => (cur.includes(id) ? cur.filter((p) => p !== id) : [...cur, id]));
  };

  const formatConfig = FORMATS.find((f) => f.id === format) ?? FORMATS[0]!;
  const recommendedId = recommendedFormat(selectedPlatforms);
  const recommendedConfig = FORMATS.find((f) => f.id === recommendedId) ?? FORMATS[0]!;
  const otherFormats = FORMATS.filter((f) => f.id !== recommendedId);
  const incompatible = selectedPlatforms.filter((p) => isHandoffPlatform(p) && !formatConfig.supported.includes(p));

  const isNativeFilm = format === 'short_video' && filmMethod === 'native';
  const isCameraFilm = format === 'short_video' && filmMethod === 'camera';
  const wantsVideo = format === 'short_video' || format === 'long_video';
  const platformNames = selectedPlatforms.filter(isHandoffPlatform).map((p) => SHORT_NAME[p]).join(' + ');
  const mediaSub = (() => {
    switch (format) {
      case 'short_video':
        return `9:16 vertical • Recommended 15–60s${platformNames ? ` • Optimized for ${platformNames}` : ''}`;
      case 'carousel':
        return `Up to 10 photos • 4:5 or 1:1${platformNames ? ` • Optimized for ${platformNames}` : ' recommended'}`;
      case 'image':
        return `High resolution • 4:5 portrait${platformNames ? ` • Optimized for ${platformNames}` : ' or 9:16 vertical'}`;
      case 'long_video':
        return `16:9 landscape • HD/4K${platformNames ? ` • Optimized for ${platformNames}` : ' recommended'}`;
      default:
        return 'Direct text takeaway or insight thread';
    }
  })();

  const accept = (p: Picked | null) => {
    if (!p) return;
    buzz('ok');
    setPicked(p);
  };
  const addFromLibrary = async () => {
    if (format === 'carousel') {
      const uris = await pickPhotos(10);
      accept(uris.length ? { kind: 'image', count: uris.length } : null);
      return;
    }
    const m = await pickFromLibrary(wantsVideo ? 'video' : 'image');
    accept(m ? { kind: m.kind, count: 1, duration: m.duration } : null);
  };
  const addFromCamera = async () => {
    const m = await captureWithCamera(wantsVideo ? 'video' : 'image');
    accept(m ? { kind: m.kind, count: 1, duration: m.duration } : null);
  };
  const mediaSummary = !picked
    ? ''
    : picked.kind === 'video'
      ? `Video${picked.duration ? `, ${Math.floor(picked.duration / 60)}:${String(picked.duration % 60).padStart(2, '0')}` : ''}. It stays on your phone: you pick it again in the app you post to.`
      : `${plural(picked.count, 'photo')}. They stay on your phone: you pick them again in the app you post to.`;

  const filmPlan = useMemo(() => getFilmPlan(idea, filmStyle), [idea, filmStyle]);
  const handoffPlatforms = selectedPlatforms.filter(isHandoffPlatform);
  // With several platforms picked, the creator chooses which app to open first; the rest wait in Schedule
  const [appChoice, setAppChoice] = useState<HandoffPlatform | null>(null);
  const firstApp: HandoffPlatform | undefined = appChoice && handoffPlatforms.includes(appChoice) ? appChoice : handoffPlatforms[0];
  // Threads is for writing, not filming: only the video apps are "film in"
  const filming = isNativeFilm && firstApp !== undefined && firstApp !== 'threads';
  // Filming a dance / trend: the trend is the idea, so the idea card fades away
  const hideIdea = (isNativeFilm || isCameraFilm) && filmStyle === 'dance';

  // ─── The idea ──────────────────────────────────────────────────────────────

  const feed = useRef<FeedIdea[] | null>(null);
  const [ideaBusy, setIdeaBusy] = useState(false);
  const spin = useSharedValue(0);
  const spinStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 360}deg` }] }));
  // "Another": the next idea from the idea library (the same ones the Create tab shows)
  const nextIdea = async () => {
    if (ideaBusy) return;
    buzz('light');
    spin.value = withTiming(spin.value + 1, { duration: 500, easing: Easing.out(Easing.cubic) });
    setIdeaBusy(true);
    if (!feed.current) feed.current = await loadIdeaFeed();
    setIdeaBusy(false);
    const titles = (feed.current ?? []).map((i) => i.title);
    if (titles.length === 0) {
      showNotice('Couldn’t find an idea just now. Try again in a moment.');
      return;
    }
    setIdea(titles[(titles.indexOf(idea) + 1) % titles.length]!);
  };

  // ─── Tags ──────────────────────────────────────────────────────────────────

  const addTag = () => {
    const body = newTag.replace(/[\s#]+/g, '');
    if (!body) return;
    const tag = `#${body}`;
    setTags((cur) => (cur.some((t) => t.toLowerCase() === tag.toLowerCase()) ? cur : [...cur, tag]));
    setNewTag('');
    setAddingTag(false);
  };

  // ─── Readiness ─────────────────────────────────────────────────────────────

  const isPlatformsReady = selectedPlatforms.length > 0;
  const isCaptionReady = caption.trim().length > 0;
  const isTimingReady = mode !== 'schedule' || at !== null;
  const steps = [
    { key: 'platforms', label: 'Platforms', done: isPlatformsReady },
    { key: 'caption', label: 'Caption', done: isCaptionReady },
    { key: 'schedule', label: 'Timing', done: isTimingReady },
  ];
  const percent = Math.round((steps.filter((s) => s.done).length / steps.length) * 100);

  const scrollTo = (section: 'platforms' | 'format' | 'media' | 'caption' | 'schedule') => {
    buzz('light');
    const target = sectionRefs.current[section];
    const sv = mainScroll.current as (ScrollView & { getInnerViewRef?: () => unknown; getInnerViewNode?: () => unknown }) | null;
    const content = sv?.getInnerViewRef?.() ?? sv?.getInnerViewNode?.();
    if (target && sv && content) {
      target.measureLayout(
        content as never,
        (_x, y) => sv.scrollTo({ y: Math.min(Math.max(0, contentH.current - viewportH.current), Math.max(0, y - 12)), animated: true }),
        () => {},
      );
    }
    if (section === 'schedule' && mode === 'schedule') setTimeout(() => setShowSchedule(true), 350);
  };

  /** What is missing for a post to be planned or posted, with a message and where to fix it. */
  const missing = (): { message: string; section: 'platforms' | 'caption' | 'schedule' } | null => {
    if (!isPlatformsReady) return { message: 'Pick at least one platform', section: 'platforms' };
    if (!isCaptionReady) return { message: 'Write your caption first', section: 'caption' };
    if (!isTimingReady) return { message: 'Pick a time', section: 'schedule' };
    return null;
  };

  // ─── Saving, planning, posting ─────────────────────────────────────────────

  const payload = (): ComposerDraft => ({ v: 1, idea, caption, tags, platforms: selectedPlatforms, format, filmMethod, filmStyle, overlay, at: at ? at.toISOString() : null });

  const saveAsDraft = () => {
    if (!idea.trim() && !caption.trim() && selectedPlatforms.length === 0) {
      showNotice('Add an idea, a caption or a platform first');
      return;
    }
    saveDraft({
      id: draftId,
      title: idea.trim() || firstLine(caption) || 'Untitled post',
      kind: 'post',
      format: formatConfig.title,
      platform: selectedPlatforms[0],
      payload: payload() as unknown as Record<string, unknown>,
    });
    buzz('ok');
    showNotice('Draft saved. You’ll find it on Create.');
  };

  const body = (when: 'now' | 'schedule'): NewPostBody => ({
    caption,
    tags,
    platforms: selectedPlatforms as NewPostBody['platforms'],
    format,
    when,
    ...(when === 'schedule' && at ? { at: at.toISOString() } : {}),
    fromDraft: draftId, // the draft this post grew from, if there is one: the server removes it
  });

  /** The form is done with: a fresh page for the next post. */
  const startOver = () => {
    removeDraft(draftId);
    setDraftId(newDraftId());
    setCaption('');
    setTags([]);
    setSelectedPlatforms([]);
    setPicked(null);
    setOverlay('');
    setAt(null);
    setMode('schedule');
  };

  const plan = async () => {
    setBusy(true);
    const res = await planPost(body('schedule'));
    setBusy(false);
    if (!res.ok) {
      buzz('warn');
      showNotice(res.message);
      return;
    }
    buzz('ok');
    const names = joinNames(res.data.platforms.map((p) => (isHandoffPlatform(p.platform) ? HANDOFF_NAMES[p.platform] : p.platform)));
    setCelebration({
      title: isNativeFilm ? 'Reminder set' : 'Post planned',
      subtitle: `We’ll remind you ${whenLabel(Date.parse(res.data.at)).replace(' · ', ' at ')} to ${isNativeFilm ? 'film' : 'post'} it on ${names}.`,
      speech: 'All set. I’ll nudge you when it’s time.',
      badge: 'PLANNED',
      streak: 0,
      toSchedule: true,
    });
  };

  // Post now: the post is made ready and the app opens with the caption copied. The app is opened at
  // once (still inside the tap, which browsers insist on) while the post is saved alongside.
  const [pending, setPending] = useState<{ platform: HandoffPlatform; creating: Promise<ApiResult<Post>> } | null>(null);
  const [asking, setAsking] = useState(false);

  const postNow = () => {
    const platform = firstApp;
    if (!platform) return;
    buzz('light');
    const creating = planPost(body('now'));
    void creating.then((res) => {
      if (!res.ok) showNotice(res.message);
    });
    setPending({ platform, creating });
    showNotice(`Caption copied. Paste it in ${HANDOFF_NAMES[platform]}.`);
    void handOffToPlatform(platform, postText(caption, tags));
  };

  // When the creator comes back, ask whether it went out
  useEffect(() => {
    if (!pending) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setAsking(true);
    });
    // Web: the platform opens in a new tab, so ask shortly after
    const timer = Platform.OS === 'web' ? setTimeout(() => setAsking(true), 1500) : null;
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [pending]);

  const confirmPosted = async () => {
    if (!pending) return;
    setAsking(false);
    setBusy(true);
    let made = await pending.creating;
    if (!made.ok) made = await planPost(body('now')); // one more try if saving it failed
    if (!made.ok) {
      setBusy(false);
      setPending(null);
      showNotice(made.message);
      return;
    }
    const res = await markPosted(made.data.id, pending.platform);
    setBusy(false);
    const platformName = HANDOFF_NAMES[pending.platform];
    const others = made.data.platforms.filter((p) => p.platform !== pending.platform).map((p) => (isHandoffPlatform(p.platform) ? HANDOFF_NAMES[p.platform] : p.platform));
    setPending(null);
    if (!res.ok) {
      showNotice(res.message);
      return;
    }
    buzz('ok');
    const s = res.data.streak;
    setCelebration({
      title: 'Nice work!',
      subtitle: others.length
        ? `Your ${platformName} post is counted. ${joinNames(others)} ${others.length === 1 ? 'is' : 'are'} waiting for you in Schedule.`
        : `Your ${platformName} post is counted.`,
      speech: 'Posted is better than perfect.',
      badge: 'POSTED',
      streak: s?.qualified ? s.newStreak : 0,
      toSchedule: others.length > 0,
    });
  };

  const notYet = () => {
    setAsking(false);
    setPending(null);
    showNotice('No rush. It’s waiting for you in Schedule, under Ready to post.');
  };

  const primary = () => {
    if (busy) return;
    if (mode === 'draft') {
      saveAsDraft();
      return;
    }
    const gap = missing();
    if (gap) {
      buzz('warn');
      showNotice(gap.message);
      scrollTo(gap.section);
      return;
    }
    if (mode === 'now') postNow();
    else void plan();
  };

  const primaryTitle =
    mode === 'draft'
      ? 'Save draft'
      : mode === 'now'
        ? firstApp
          ? filming
            ? `Film in ${HANDOFF_NAMES[firstApp]}`
            : `Open ${HANDOFF_NAMES[firstApp]} to post`
          : 'Post now'
        : isNativeFilm
          ? 'Set reminder'
          : 'Plan this post';

  const dismissCelebration = () => {
    const done = celebration;
    setCelebration(null);
    if (done) startOver();
  };

  // ─── The page ──────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />

        <ScrollView
          ref={mainScroll}
          onContentSizeChange={(_w, h) => (contentH.current = h)}
          onLayout={(e) => (viewportH.current = e.nativeEvent.layout.height)}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headlineWrap}>
            <FitLines
              lines={['Shape your', <Text key="n" style={styles.headlineAccent}>next post</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Shape your next post"
            />
          </Reanimated.View>

          {/* IDEA (fades away when filming a dance / trend: the trend is the idea) */}
          {!hideIdea && (
            <Reanimated.View exiting={FadeOut.duration(200)} entering={FadeIn.duration(250)}>
              <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
                <GlassCard strong radius={26} padding={20}>
                  <View style={styles.ideaTop}>
                    <JarvisOrb size={26} />
                    <Text style={styles.ideaEyebrow}>YOUR IDEA</Text>
                    <Pressable
                      onPress={() => void nextIdea()}
                      hitSlop={8}
                      style={({ pressed }) => [styles.changeBtn, pressed && { transform: [{ scale: 0.92 }] }]}
                      accessibilityRole="button"
                      accessibilityLabel={idea ? 'Show me another idea' : 'Give me an idea'}
                    >
                      <Reanimated.View style={spinStyle}>
                        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                          <Path d="M4 12a8 8 0 0113.7-5.7L20 8M20 3v5h-5M20 12a8 8 0 01-13.7 5.7L4 16M4 21v-5h5" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </Reanimated.View>
                      <Text style={styles.changeBtnText}>{idea ? 'Another' : 'Get one'}</Text>
                    </Pressable>
                  </View>
                  {ideaBusy ? (
                    <Reanimated.View entering={FadeIn.duration(120)} style={styles.ideaThinking}>
                      <ActivityIndicator color={ds.purple} />
                      <Text style={styles.ideaThinkingText}>Finding one…</Text>
                    </Reanimated.View>
                  ) : idea ? (
                    <Reanimated.View key={idea} entering={FadeInUp.duration(300)} style={styles.ideaTitleWrap}>
                      <Text style={styles.ideaTitle}>“{idea}”</Text>
                    </Reanimated.View>
                  ) : (
                    <Text style={styles.ideaBody}>Start from an idea, or write your caption below.</Text>
                  )}
                  {idea ? <Text style={styles.ideaBody}>Shape this idea into a post your audience will want to see.</Text> : null}
                </GlassCard>
              </Reanimated.View>
            </Reanimated.View>
          )}

          {/* 1. PLATFORMS */}
          <StepHeader n={1} title="Where it goes" done={isPlatformsReady} viewRef={(v) => (sectionRefs.current.platforms = v)} />
          <View style={styles.chipsWrap}>
            {HANDOFF_PLATFORMS.map((id) => (
              <PlatformChip key={id} id={id} name={HANDOFF_NAMES[id]} selected={selectedPlatforms.includes(id)} onPress={() => togglePlatform(id)} />
            ))}
          </View>
          <Text style={styles.note}>
            We get your post ready and remind you at the time you pick. You post it in the app, then tap “I posted it” so it counts.
          </Text>

          {/* 2. FORMAT */}
          <StepHeader n={2} title="Format" done viewRef={(v) => (sectionRefs.current.format = v)} />
          <RecommendedFormat
            id={recommendedConfig.id}
            title={recommendedConfig.title}
            badge={recommendedConfig.badge}
            description={recommendedConfig.description}
            selected={format === recommendedConfig.id}
            onPress={() => setFormat(recommendedConfig.id)}
          />
          <View style={styles.tilesGrid}>
            {otherFormats.map((f) => (
              <FormatTile key={f.id} id={f.id} title={f.title} badge={f.badge} selected={format === f.id} onPress={() => setFormat(f.id)} />
            ))}
          </View>
          {format === 'short_video' && <FilmMethodPicker method={filmMethod} onChange={setFilmMethod} />}
          {incompatible.length > 0 && (
            <Text style={styles.note}>
              {joinNames(incompatible.map((p) => HANDOFF_NAMES[p as HandoffPlatform]))} will adapt your {formatConfig.title.toLowerCase()} to fit its feed.
            </Text>
          )}

          {/* 3. MEDIA */}
          <StepHeader n={3} title={isNativeFilm || isCameraFilm ? 'Film it' : 'Media (optional)'} done={isNativeFilm || isCameraFilm ? true : picked !== null} viewRef={(v) => (sectionRefs.current.media = v)} />
          {isNativeFilm || isCameraFilm ? (
            <FilmPlanCard
              plan={filmPlan}
              platforms={handoffPlatforms}
              onOpen={(p) => {
                setAppChoice(p);
                showNotice(`Caption copied. Paste it in ${HANDOFF_NAMES[p]}.`);
                void handOffToPlatform(p, postText(caption, tags));
              }}
              onStyleChange={setFilmStyle}
              mode={isCameraFilm ? 'camera' : 'native'}
              overlayText={overlay}
              onOverlayChange={setOverlay}
              recording={picked?.kind === 'video' ? { duration: picked.duration } : null}
              onRecord={addFromCamera}
              onRemoveRecording={() => setPicked(null)}
            />
          ) : (
            <MediaZone
              isText={format === 'text'}
              hasMedia={picked !== null}
              summary={mediaSummary}
              label={formatConfig.mediaLabel}
              sub={mediaSub}
              addLabel={formatConfig.addLabel}
              onAdd={() => void addFromLibrary()}
              onCamera={format === 'carousel' ? undefined : () => void addFromCamera()}
              cameraLabel={wantsVideo ? 'Record with camera' : 'Take a photo'}
              onRemove={() => setPicked(null)}
            />
          )}

          {/* 4. CAPTION */}
          <StepHeader n={4} title="Caption" done={isCaptionReady} viewRef={(v) => (sectionRefs.current.caption = v)} />
          <View style={[styles.captionCard, captionFocused && styles.captionCardFocused]}>
            <TextInput
              style={styles.captionField}
              multiline
              value={caption}
              onChangeText={setCaption}
              onFocus={() => setCaptionFocused(true)}
              onBlur={() => setCaptionFocused(false)}
              placeholder="Write your caption…"
              placeholderTextColor={ds.text3}
              selectionColor={ds.purple}
              cursorColor={ds.purple}
              maxLength={5000}
            />
            <Text style={styles.charCount}>{caption.length.toLocaleString('en-US')} characters</Text>
          </View>
          <Text style={styles.note}>
            {ideaGoal?.caption ? 'From the Caption writer. Edit it here any time.' : 'Tip: name the exact moment or mistake, and one thing people can try.'}
          </Text>

          {/* 5. TAGS */}
          <StepHeader n={5} title="Tags" done={tags.length > 0} />
          <GlassCard strong radius={22} padding={16}>
            <View style={styles.tagsWrap}>
              {tags.map((tag) => (
                <TagChip key={tag} tag={tag} onRemove={() => setTags((cur) => cur.filter((t) => t !== tag))} />
              ))}
              {tags.length === 0 && <Text style={styles.noTags}>No tags yet</Text>}
            </View>
            {addingTag && (
              <View style={styles.addTagRow}>
                <TextInput
                  style={styles.addTagField}
                  placeholder="#yourtag"
                  placeholderTextColor={ds.text3}
                  value={newTag}
                  onChangeText={setNewTag}
                  onSubmitEditing={addTag}
                  autoFocus
                  autoCapitalize="none"
                />
                <Pressable onPress={addTag} style={styles.addTagBtn} accessibilityRole="button">
                  <Text style={styles.addTagBtnText}>Add</Text>
                </Pressable>
              </View>
            )}
            <View style={styles.tagActions}>
              <View style={styles.flex1}>
                <AppButton title={addingTag ? 'Cancel' : 'Add tag'} variant="outline" onPress={() => setAddingTag(!addingTag)} />
              </View>
            </View>
          </GlassCard>

          {/* 6. WHEN */}
          <StepHeader n={6} title="When to post" done={isTimingReady} viewRef={(v) => (sectionRefs.current.schedule = v)} />
          <GlassCard strong radius={22} padding={16}>
            <ModeSwitch mode={mode} onChange={setMode} labels={isNativeFilm ? { now: 'Film now', schedule: 'Remind me' } : undefined} />
            {mode === 'schedule' && (
              <Reanimated.View entering={FadeInUp.duration(250)}>
                <Pressable
                  onPress={() => setShowSchedule(true)}
                  style={styles.whenRow}
                  accessibilityRole="button"
                  accessibilityLabel={at ? `We'll remind you ${whenLabel(at.getTime())}. Change` : 'Pick a time'}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.1} />
                    <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.1} strokeLinecap="round" />
                  </Svg>
                  <View style={styles.flex1}>
                    <Text style={styles.whenLabel}>{isNativeFilm ? 'REMIND ME AT' : 'WE’LL REMIND YOU AT'}</Text>
                    <Text style={styles.whenValue}>{at ? whenLabel(at.getTime()) : 'Pick a time'}</Text>
                  </View>
                  <Text style={styles.whenChange}>{at ? 'Change' : 'Pick'}</Text>
                </Pressable>
              </Reanimated.View>
            )}
            {mode === 'now' && <Text style={styles.whenNote}>We’ll open the app with your caption copied. Tell us when it’s up.</Text>}
            {mode === 'draft' && <Text style={styles.whenNote}>Saved to your drafts with everything on this page. Nothing is sent.</Text>}
            {bestTime && (
              <View style={styles.bestTime}>
                <JarvisOrb size={22} />
                <Text style={styles.bestTimeText}>
                  Your posts do best around <Text style={styles.bestTimeBold}>{bestTime.label}</Text> ({bestTime.postsAtBestTime} of your recent {bestTime.postsAtBestTime === 1 ? 'post' : 'posts'}).
                </Text>
              </View>
            )}
          </GlassCard>

          {/* READINESS + ACTIONS */}
          <View style={styles.readyWrap}>
            <ReadinessCard percent={percent} steps={steps} onStep={(k) => scrollTo(k as 'platforms' | 'caption' | 'schedule')} />
          </View>
          <View style={styles.actions}>
            {mode === 'now' && handoffPlatforms.length > 1 && firstApp && (
              <Reanimated.View entering={FadeIn.duration(200)}>
                <Text style={styles.chooseLabel}>{filming ? 'Film in' : 'Post first on'}</Text>
                <View style={styles.chooseRow}>
                  {handoffPlatforms.map((p) => {
                    const on = p === firstApp;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => {
                          if (Platform.OS !== 'web') void Haptics.selectionAsync();
                          setAppChoice(p);
                        }}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: on }}
                        accessibilityLabel={`${filming ? 'Film in' : 'Post first on'} ${HANDOFF_NAMES[p]}`}
                        style={[styles.chooseChip, on && styles.chooseChipOn]}
                      >
                        <PlatformLogo type={p} size={22} />
                        <Text style={[styles.chooseText, on && { color: ds.purple }]} numberOfLines={1}>
                          {HANDOFF_NAMES[p]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <Text style={styles.chooseNote}>
                  {filming ? 'Film once where you want the sound, then share the same video to ' : 'The others wait for you in Schedule: '}
                  {joinNames(handoffPlatforms.filter((p) => p !== firstApp).map((p) => HANDOFF_NAMES[p]))}.
                </Text>
              </Reanimated.View>
            )}
            <AppButton
              title={busy ? 'One moment…' : primaryTitle}
              size="lg"
              disabled={busy}
              onPress={primary}
              iconRight={
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              }
            />
            {mode !== 'draft' && (
              <View>
                <AppButton title="Save as draft" variant="glass" onPress={saveAsDraft} />
              </View>
            )}
          </View>
        </ScrollView>

        {toast && <ComposerToast message={toast} />}

        {asking && pending && <PostedCheck platform={pending.platform} onYes={() => void confirmPosted()} onNotYet={notYet} />}

        <FloatingTabBar
          activeTab={activeTab}
          onTabPress={(tab) => {
            buzz('light');
            setActiveTab(tab);
            onNavigateTab?.(tab);
          }}
        />

        {/* WHEN TO POST: their own best time (once their posts say what it is) + any day / time in the next two weeks */}
        <ScheduleSheet
          visible={showSchedule}
          onClose={() => setShowSchedule(false)}
          mode={isNativeFilm ? 'remind' : 'schedule'}
          bestTime={bestTime}
          initial={at}
          onConfirm={(when) => {
            setAt(when);
            setMode('schedule');
            setShowSchedule(false);
            showNotice(`We’ll remind you ${whenLabel(when.getTime()).replace(' · ', ' at ')}`);
          }}
        />

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />

        <AnimatedCompletionModal
          visible={celebration !== null}
          title={celebration?.title}
          subtitle={celebration?.subtitle}
          speechBubble={celebration?.speech}
          badgeText={celebration?.badge}
          streakCount={celebration?.streak ?? 0}
          actionText={celebration?.toSchedule ? 'See my schedule' : 'Keep going'}
          onAction={
            celebration?.toSchedule
              ? () => {
                  setCelebration(null);
                  startOver();
                  onOpenSchedule?.();
                }
              : undefined
          }
          onDismiss={dismissCelebration}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { flex: 1, width: '100%' },
  flex1: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  headlineWrap: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  ideaTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ideaEyebrow: { flex: 1, fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  changeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 30, paddingHorizontal: 10, borderRadius: 999, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  changeBtnText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  ideaTitleWrap: { minHeight: 68, justifyContent: 'center' },
  ideaTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: ds.ink, letterSpacing: -0.5, marginTop: 12 },
  ideaThinking: { minHeight: 68, marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  ideaThinkingText: { fontSize: 13, fontWeight: '700', color: ds.text3 },
  ideaBody: { fontSize: 14, lineHeight: 20, color: ds.text2, marginTop: 6 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  note: { fontSize: 12.5, lineHeight: 18, color: ds.text3, marginTop: 10 },
  tilesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  captionCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 16,
  },
  captionCardFocused: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  captionField: {
    minHeight: 120,
    maxHeight: 220,
    fontSize: 15.5,
    lineHeight: 23,
    color: ds.ink,
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  charCount: { alignSelf: 'flex-end', fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 6 },
  tagsWrap: { gap: 8 },
  noTags: { fontSize: 13, color: ds.text3 },
  addTagRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  addTagField: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    color: ds.ink,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  addTagBtn: { height: 42, paddingHorizontal: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.purple },
  addTagBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  tagActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  whenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(237, 233, 254, 0.6)',
  },
  whenLabel: { fontSize: 11.5, fontWeight: '800', color: ds.text3, letterSpacing: 0.4 },
  whenValue: { fontSize: 16, fontWeight: '800', color: ds.ink, marginTop: 1 },
  whenChange: { fontSize: 13, fontWeight: '800', color: ds.purple },
  whenNote: { fontSize: 13, lineHeight: 19, color: ds.text2, marginTop: 12 },
  bestTime: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  bestTimeText: { flex: 1, fontSize: 13, lineHeight: 18, color: ds.text2 },
  bestTimeBold: { fontWeight: '800', color: ds.ink },
  readyWrap: { marginTop: 26 },
  actions: { marginTop: 16, gap: 10 },
  chooseLabel: { fontSize: 13, fontWeight: '800', color: ds.text2, marginBottom: 8 },
  chooseRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  // Logo above name so the platforms fit side by side on 320
  chooseChip: {
    flexGrow: 1,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  chooseChipOn: { borderColor: ds.purple, backgroundColor: 'rgba(237, 233, 254, 0.9)' },
  chooseText: { fontSize: 12, fontWeight: '800', color: ds.ink },
  chooseNote: { fontSize: 12.5, lineHeight: 18, color: ds.text3, marginTop: 8, marginBottom: 4 },
});
