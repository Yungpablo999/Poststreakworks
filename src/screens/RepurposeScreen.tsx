import React, { useCallback, useMemo, useState, useSyncExternalStore } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Text, TextInput } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { FitLines } from '../components/ui/FitLines';
import { AppToast } from '../components/ui/AppToast';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { PlatformChip } from '../components/composer/ComposerBlocks';
import { AllowanceMeter, UnlimitedChip } from '../components/create/CreateBlocks';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import type { UserProfileData } from '../components/UserProfileModal';
import type { UserPersona } from '../types/account';
import {
  SourceSwitch,
  VideoPicker,
  WatchingCard,
  MomentTimeline,
  RecipeGrid,
  IdeaDeck,
  type StudioSource,
} from '../components/repurpose/VideoStudio';
import { captureWithCamera, pickFromLibrary, pickPhotos, type PickedMedia } from '../utils/media';
import {
  readLink,
  makeVersion,
  PLATFORM_FORMATS,
  type OutFormat,
  getDefaultFilmStyle,
  getLikeThisIdeas,
  getVideoBreakdown,
  removeDraft,
  saveDraft,
  type FilmStyle,
  type LikeThisIdea,
  type StudioVideo,
  getRepurposeAllowance,
  getRepurposeVersions,
  spendRepurpose,
  subscribeToRepurposes,
  type RepurposeVersion,
} from '../data';
import { STAGE_1_PLATFORMS } from '../config/features';
import { ds, goldTokens } from '../theme/colors';

// Free Repurpose, two ways in:
//  - An idea: written the way each platform works.
//  - A video I made: Jarvis watches it (two passes), shows what stands out,
//    and deals out new video ideas with the same shape.
// Each run uses the free weekly repurpose; gold only appears for the Pro
// upgrade once it's used. No scores or streak numbers.

const NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

interface RepurposeScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onUseVersion?: (caption: string, platform: string, idea: string) => void;
  userProfile?: UserProfileData;
  userPersona?: UserPersona;
  /** Open on the video side with this video already added (e.g. from Growth). */
  initialVideo?: StudioVideo;
  /** Pro members: unlimited runs and "Plan the order" scheduling. */
  tier?: 'free' | 'pro';
  onFilmIdea?: (title: string, style: FilmStyle) => void;
}

function VersionCard({
  v,
  index,
  onChange,
  onCopy,
  onUse,
  onFormat,
}: {
  v: RepurposeVersion;
  index: number;
  onChange: (body: string) => void;
  onCopy: () => void;
  onUse: () => void;
  onFormat: (f: OutFormat) => void;
}) {
  const [focused, setFocused] = useState(false);
  const formats = PLATFORM_FORMATS[v.platform] ?? [];
  return (
    <Animated.View entering={FadeInUp.delay(140 * index).duration(360)}>
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.vHead}>
          <PlatformLogo type={v.platform as PlatformLogoType} size={34} />
          <View style={styles.flex}>
            <Text style={styles.vName}>{NAMES[v.platform]}</Text>
            <Text style={styles.vFormat}>{v.format}</Text>
          </View>
          <View style={styles.ready}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={ds.greenFill} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.readyText}>Ready</Text>
          </View>
        </View>
        {formats.length > 1 && (
          <View style={styles.fmtRow} accessibilityRole="radiogroup">
            {formats.map((f) => {
              const on = f.id === v.formatId;
              return (
                <Pressable
                  key={f.id}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.selectionAsync();
                    onFormat(f.id);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [styles.fmt, on && styles.fmtOn, pressed && { transform: [{ scale: 0.96 }] }, Platform.OS === 'web' && ({ cursor: 'pointer' } as object)]}
                >
                  <Text style={[styles.fmtText, on && styles.fmtTextOn]}>{f.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Animated.View key={v.formatId} entering={FadeIn.duration(220)}>
        <Text style={styles.vTitle}>{v.title}</Text>
        {v.slides && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slidesBar} contentContainerStyle={styles.slides}>
            {v.slides.map((sl, i) => (
              <View key={i} style={[styles.slide, i === 0 && styles.slideCover]}>
                <Text style={[styles.slideNum, i === 0 && { color: 'rgba(255,255,255,0.8)' }]}>{i + 1}/{v.slides!.length}</Text>
                <Text style={[styles.slideText, i === 0 && { color: '#FFFFFF' }]}>{sl}</Text>
              </View>
            ))}
          </ScrollView>
        )}
        {v.posts && (
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
        {(v.slides || v.posts) && <Text style={styles.captionLabel}>Caption</Text>}
        <View style={[styles.field, focused && styles.fieldOn]}>
          <AutoGrowInput
            value={v.body}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            minHeight={60}
            style={styles.vBody}
            accessibilityLabel={`${NAMES[v.platform]} version`}
          />
        </View>
        </Animated.View>
        <View style={styles.vActions}>
          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel={`Copy the ${NAMES[v.platform]} version`}
            style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.96 }] }]}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.purple} strokeWidth={2.2} />
              <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.purple} strokeWidth={2.2} />
            </Svg>
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>
          <View style={styles.flex}>
            <AppButton title="Use this" onPress={onUse} />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export const RepurposeScreen: React.FC<RepurposeScreenProps> = ({
  ideaTitle = '3 mistakes new creators make',
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onUseVersion,
  userProfile,
  userPersona,
  initialVideo,
  onFilmIdea,
  tier = 'free',
}) => {
  const pageWidth = usePageWidth();
  const isPro = tier === 'pro';
  const persona = (userPersona || userProfile?.userPersona) === 'returning' ? 'returning' : 'new';
  const allowance = useSyncExternalStore(subscribeToRepurposes, getRepurposeAllowance, getRepurposeAllowance);
  const limit = allowance.weeklyLimit ?? 0;
  const left = isPro ? Infinity : Math.max(0, limit - allowance.usedThisWeek);
  const [scheduled, setScheduled] = useState(false);

  const [idea, setIdea] = useState(ideaTitle);
  const [ideaFocused, setIdeaFocused] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube', 'threads']);
  const [versions, setVersions] = useState<RepurposeVersion[]>([]);
  const [working, setWorking] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Video side
  const [source, setSource] = useState<StudioSource>(initialVideo ? 'video' : 'idea');
  const [video, setVideo] = useState<StudioVideo | null>(initialVideo ?? null);
  const [vStyle, setVStyle] = useState<FilmStyle>(() => getDefaultFilmStyle(userProfile?.niches));
  const [phase, setPhase] = useState<'idle' | 'watching' | 'done'>('idle');
  const [round, setRound] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2400);
  };
  const toggle = (id: string) =>
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const make = (opts?: { text?: string; spent?: boolean; prefer?: 'video' | 'carousel' | 'text' }) => {
    if (!platforms.length) {
      showToast('Pick at least one platform');
      return;
    }
    if (!opts?.spent && !spendRepurpose()) {
      onOpenJarvisPro?.();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const src = opts?.text ?? idea;
    setVersionSource(src);
    const next = getRepurposeVersions(src, platforms, opts?.prefer ?? 'video');
    setScheduled(false);
    setVersions([]);
    // Jarvis "writes" each platform in turn
    setWorking(next.map((v) => v.platform));
    next.forEach((v, i) => {
      setTimeout(() => {
        setVersions((prev) => [...prev, v]);
        setWorking((w) => w.filter((p) => p !== v.platform));
        if (i === next.length - 1 && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 450 + i * 380);
    });
  };

  const addVideo = async (how: 'library' | 'camera') => {
    let picked: PickedMedia | null = null;
    try {
      picked = how === 'camera' && Platform.OS !== 'web' ? await captureWithCamera('video') : await pickFromLibrary('video');
    } catch {
      picked = null;
    }
    if (!picked) return;
    if (picked.kind !== 'video') {
      showToast('Pick a video, not a photo');
      return;
    }
    setVideo({ uri: picked.uri, name: 'Your video', seconds: picked.duration ?? 30, source: how === 'camera' ? 'camera' : 'upload' });
    setPhase('idle');
  };

  const watch = () => {
    if (!video) {
      showToast('Add a video first');
      return;
    }
    if (!platforms.length) {
      showToast('Pick at least one platform');
      return;
    }
    if (!spendRepurpose()) {
      onOpenJarvisPro?.();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRound(0);
    setPhase('watching');
  };

  const finishWatching = useCallback(() => setPhase('done'), []);

  // ── My post: video, photos (carousel) or text ────────────────────────────
  const [versionSource, setVersionSource] = useState(ideaTitle);
  const [postKind, setPostKind] = useState<'video' | 'photos' | 'text'>('video');
  const [photos, setPhotos] = useState<string[]>([]);
  const [postAbout, setPostAbout] = useState('');
  const [postText, setPostText] = useState('');
  const addPhotos = async () => {
    try {
      const uris = await pickPhotos(10);
      if (uris.length) setPhotos(uris);
    } catch {
      showToast('Couldn’t open your photos');
    }
  };
  const makeFromPost = () => {
    if (postKind === 'photos') {
      if (!photos.length) return showToast('Add your photos first');
      make({ text: postAbout.trim() || 'My latest carousel', prefer: 'carousel' });
    } else {
      if (!postText.trim()) return showToast('Paste your post first');
      const first = postText.trim().match(/^[^.!?\n]*[.!?]?/)?.[0]?.trim() ?? '';
      make({ text: first.length > 8 ? first : postText.trim(), prefer: 'text' });
    }
  };

  // ── From a link ──────────────────────────────────────────────────────────
  const [linkText, setLinkText] = useState('');
  const [linkFocused, setLinkFocused] = useState(false);
  const [owner, setOwner] = useState<'mine' | 'other'>('mine');
  const [linkPhase, setLinkPhase] = useState<'idle' | 'reading' | 'done'>('idle');
  const [readStep, setReadStep] = useState(0);
  const preview = useMemo(() => readLink(linkText), [linkText]);
  const pasteLink = async () => {
    try {
      const t = await Clipboard.getStringAsync();
      if (t) {
        setLinkText(t.trim());
        setLinkPhase('idle');
      } else showToast('Nothing copied yet');
    } catch {
      showToast('Couldn’t paste. Try typing it.');
    }
  };
  const readLinkNow = () => {
    if (!preview) {
      showToast('That doesn’t look like a link');
      return;
    }
    if (!platforms.length) {
      showToast('Pick at least one platform');
      return;
    }
    if (!spendRepurpose()) {
      onOpenJarvisPro?.();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setVersions([]);
    setRound(0);
    setLinkPhase('reading');
    setReadStep(0);
    [1, 2, 3].forEach((n) => setTimeout(() => setReadStep(n), n * 600));
    setTimeout(() => {
      setLinkPhase('done');
      if (owner === 'mine') make({ text: preview.title, spent: true, prefer: preview.kind === 'carousel' ? 'carousel' : preview.kind === 'video' ? 'video' : 'text' });
    }, 2100);
  };
  const linkIdeas = useMemo(
    () => (preview ? getLikeThisIdeas(preview.style, 30, platforms, round) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preview?.style, platforms.join(','), round],
  );

  // Ideas follow the platforms picked; "different ideas" is free once watched
  const seconds = video?.seconds ?? 30;
  const breakdown = useMemo(() => getVideoBreakdown(vStyle, seconds), [vStyle, seconds]);
  const platformKey = platforms.join(',');
  const ideas = useMemo(
    () => getLikeThisIdeas(vStyle, seconds, platformKey ? platformKey.split(',') : [], round),
    [vStyle, seconds, platformKey, round],
  );
  const moreIdeas = () => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    setRound((r) => r + 1);
  };
  const toggleSave = (idea: LikeThisIdea) => {
    const id = `like-${idea.id}`;
    if (savedIds.includes(idea.id)) {
      removeDraft(id);
      setSavedIds((s) => s.filter((x) => x !== idea.id));
      showToast('Removed from drafts');
    } else {
      saveDraft({ id, title: idea.title, kind: 'post', format: 'Video idea', platform: platforms[0] });
      setSavedIds((s) => [...s, idea.id]);
      showToast('Saved to drafts');
    }
  };

  const copy = async (v: RepurposeVersion) => {
    try {
      await Clipboard.setStringAsync(v.body);
      showToast(`${NAMES[v.platform]} version copied`);
    } catch {
      showToast('Couldn’t copy. Try again.');
    }
  };

  const order = versions.map((v) => NAMES[v.platform]);
  // Most-used first
  const stage1 = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'].filter((p) => (STAGE_1_PLATFORMS as readonly string[]).includes(p));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          userPersona={userPersona}
          userProfile={userProfile}
        />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines
                key={`${source}-${postKind}`}
                lines={
                  source === 'idea'
                    ? ['One idea,', <Text key="e" style={styles.accent}>every platform</Text>]
                    : source === 'link'
                      ? ['Paste a link,', <Text key="e" style={styles.accent}>make it yours</Text>]
                      : postKind === 'video'
                        ? ['Your video,', <Text key="e" style={styles.accent}>your next one</Text>]
                        : ['Your post,', <Text key="e" style={styles.accent}>every platform</Text>]
                }
                textStyle={styles.headlineText}
                maxFontSize={34}
                align="left"
                accessibilityLabel={source === 'idea' ? 'One idea, every platform' : source === 'link' ? 'Paste a link, make it yours' : 'Your video, your next one'}
              />
              <View style={styles.meter}>
                {isPro ? <UnlimitedChip /> : <AllowanceMeter left={left} limit={limit} />}
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(40).duration(500)} style={styles.switchWrap}>
              <SourceSwitch value={source} onChange={setSource} />
            </Animated.View>

            {/* Idea */}
            {source === 'idea' && (
            <Animated.View key="idea" entering={FadeIn.duration(260)}>
              <GlassCard strong radius={24} padding={16}>
                <View style={styles.ideaHead}>
                  <JarvisOrb size={24} />
                  <Text style={styles.eyebrow}>YOUR IDEA</Text>
                </View>
                <View style={[styles.field, ideaFocused && styles.fieldOn]}>
                  <AutoGrowInput
                    value={idea}
                    onChangeText={setIdea}
                    onFocus={() => setIdeaFocused(true)}
                    onBlur={() => setIdeaFocused(false)}
                    minHeight={26}
                    style={styles.ideaInput}
                    accessibilityLabel="Your idea"
                  />
                </View>
              </GlassCard>
            </Animated.View>
            )}

            {/* Video */}
            {source === 'video' && (
              <View style={styles.kindRow} accessibilityRole="radiogroup">
                {([['video', 'Video'], ['photos', 'Photos / carousel'], ['text', 'Text']] as const).map(([k, label]) => {
                  const on = postKind === k;
                  return (
                    <Pressable
                      key={k}
                      onPress={() => {
                        if (Platform.OS !== 'web') Haptics.selectionAsync();
                        setPostKind(k);
                        setVersions([]);
                      }}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: on }}
                      style={({ pressed }) => [styles.kindChip, on && styles.kindChipOn, pressed && { transform: [{ scale: 0.96 }] }]}
                    >
                      <Text style={[styles.kindText, on && styles.kindTextOn]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
            {source === 'video' && postKind === 'photos' && (
              <Animated.View key="photos" entering={FadeIn.duration(240)}>
                <GlassCard strong radius={24} padding={16}>
                  {photos.length ? (
                    <>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slidesBar} contentContainerStyle={styles.slides}>
                        {photos.map((u, i) => (
                          <View key={u} style={styles.photoThumb}>
                            <Image source={{ uri: u }} style={styles.photoImg} resizeMode="cover" />
                            <View style={styles.photoNum}>
                              <Text style={styles.photoNumText}>{i + 1}</Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                      <Pressable onPress={addPhotos} accessibilityRole="button">
                        <Text style={styles.changeLink}>Change photos ({photos.length})</Text>
                      </Pressable>
                    </>
                  ) : (
                    <>
                      <Text style={styles.eyebrow}>YOUR PHOTOS</Text>
                      <Text style={styles.linkHelp}>Pick the photos from your carousel or post, in order.</Text>
                      <View style={styles.photoBtn}>
                        <AppButton title="Choose photos" onPress={addPhotos} />
                      </View>
                    </>
                  )}
                  <Text style={styles.ownerQ}>What’s it about?</Text>
                  <View style={styles.field}>
                    <AutoGrowInput value={postAbout} onChangeText={setPostAbout} placeholder="e.g. my 5-step posting system" minHeight={24} accessibilityLabel="What the post is about" />
                  </View>
                </GlassCard>
              </Animated.View>
            )}
            {source === 'video' && postKind === 'text' && (
              <Animated.View key="text" entering={FadeIn.duration(240)}>
                <GlassCard strong radius={24} padding={16}>
                  <Text style={styles.eyebrow}>YOUR POST</Text>
                  <Text style={styles.linkHelp}>Paste a caption, thread or text post you wrote.</Text>
                  <View style={[styles.field, { marginTop: 10 }]}>
                    <AutoGrowInput value={postText} onChangeText={setPostText} placeholder="Paste your post here" minHeight={90} accessibilityLabel="Your post" />
                  </View>
                </GlassCard>
              </Animated.View>
            )}
            {source === 'video' && postKind === 'video' && (
              <Animated.View key="video" entering={FadeIn.duration(260)}>
                {phase === 'watching' && video ? (
                  <WatchingCard video={video} onDone={finishWatching} />
                ) : (
                  <VideoPicker
                    video={video}
                    style={vStyle}
                    onChoose={() => addVideo('library')}
                    onFilm={() => addVideo('camera')}
                    onClear={() => {
                      setVideo(null);
                      setPhase('idle');
                    }}
                    onStyle={(st) => {
                      setVStyle(st);
                      setRound(0);
                    }}
                  />
                )}
              </Animated.View>
            )}

            {/* Link */}
            {source === 'link' && (
              <Animated.View key="link" entering={FadeIn.duration(260)}>
                <GlassCard strong radius={24} padding={16}>
                  <Text style={styles.eyebrow}>PASTE ANY LINK</Text>
                  <Text style={styles.linkHelp}>A video, reel, carousel, text post or web page.</Text>
                  <View style={styles.linkRow}>
                    <View style={[styles.field, styles.linkField, linkFocused && styles.fieldOn]}>
                      <TextInput
                        value={linkText}
                        onChangeText={(t) => {
                          setLinkText(t);
                          setLinkPhase('idle');
                        }}
                        onFocus={() => setLinkFocused(true)}
                        onBlur={() => setLinkFocused(false)}
                        placeholder="https://"
                        placeholderTextColor={ds.text3}
                        autoCapitalize="none"
                        autoCorrect={false}
                        keyboardType="url"
                        selectionColor={ds.purple}
                        style={styles.linkInput}
                        accessibilityLabel="Link"
                      />
                    </View>
                    <Pressable onPress={pasteLink} accessibilityRole="button" style={({ pressed }) => [styles.pasteBtn, pressed && { transform: [{ scale: 0.96 }] }]}>
                      <Text style={styles.pasteText}>Paste</Text>
                    </Pressable>
                  </View>
                  {preview && (
                    <Animated.View key={`${preview.platform}-${preview.kind}`} entering={FadeIn.duration(220)} style={styles.detected}>
                      {preview.platform !== 'web' && preview.platform !== 'x' ? (
                        <PlatformLogo type={preview.platform as PlatformLogoType} size={28} />
                      ) : (
                        <View style={styles.webIcon}>
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Path d="M10 13a5 5 0 007.5.5l3-3a5 5 0 00-7-7l-1.7 1.7M14 11a5 5 0 00-7.5-.5l-3 3a5 5 0 007 7l1.7-1.7" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
                          </Svg>
                        </View>
                      )}
                      <View style={styles.flex}>
                        <Text style={styles.detectedTitle}>{preview.platformName} · {preview.kindLabel}</Text>
                        <Text style={styles.detectedSub} numberOfLines={1}>{preview.url.replace(/^https?:\/\//, '')}</Text>
                      </View>
                    </Animated.View>
                  )}
                  {linkText.trim().length > 6 && !preview && <Text style={styles.linkError}>That doesn’t look like a link yet.</Text>}

                  <Text style={styles.ownerQ}>Is this yours?</Text>
                  <View style={styles.ownerRow}>
                    {(['mine', 'other'] as const).map((o) => {
                      const on = owner === o;
                      return (
                        <Pressable
                          key={o}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.selectionAsync();
                            setOwner(o);
                            setLinkPhase('idle');
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                          style={({ pressed }) => [styles.ownerChip, on && styles.ownerChipOn, pressed && { transform: [{ scale: 0.97 }] }]}
                        >
                          <Text style={[styles.ownerText, on && styles.ownerTextOn]}>{o === 'mine' ? 'Yes, it’s mine' : 'Someone else’s'}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Animated.View key={owner} entering={FadeIn.duration(200)}>
                    <Text style={styles.ownerNote}>
                      {owner === 'mine'
                        ? 'Jarvis turns it into a version for each platform you pick.'
                        : 'Jarvis gives you new ideas in the same style, in your own words. It won’t copy their words or re-post their content.'}
                    </Text>
                  </Animated.View>
                </GlassCard>
              </Animated.View>
            )}

            {/* Platforms */}
            <Text style={styles.section}>Where should it go?</Text>
            <View style={styles.chips}>
              {stage1.map((id) => (
                <PlatformChip key={id} id={id} name={NAMES[id]} selected={platforms.includes(id)} onPress={() => toggle(id)} />
              ))}
            </View>

            {!(source === 'video' && postKind === 'video' && phase !== 'idle') && !(source === 'link' && linkPhase !== 'idle') && (
            <View style={styles.cta}>
              {left > 0 && source === 'link' ? (
                <AppButton
                  title={owner === 'mine' ? 'Read and repurpose' : 'Get ideas from it'}
                  size="lg"
                  disabled={!preview}
                  onPress={readLinkNow}
                  iconRight={
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="#FFFFFF" />
                    </Svg>
                  }
                />
              ) : left > 0 && source === 'video' && postKind !== 'video' ? (
                <AppButton
                  title={working.length ? 'Jarvis is writing…' : `Make ${platforms.length} version${platforms.length === 1 ? '' : 's'}`}
                  size="lg"
                  disabled={!!working.length}
                  onPress={makeFromPost}
                  iconRight={
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="#FFFFFF" />
                    </Svg>
                  }
                />
              ) : left > 0 && source === 'video' ? (
                <AppButton
                  title="Watch my video"
                  size="lg"
                  onPress={watch}
                  iconRight={
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" stroke="#FFFFFF" strokeWidth={2.2} strokeLinejoin="round" />
                      <Path d="M12 15a3 3 0 100-6 3 3 0 000 6z" fill="#FFFFFF" />
                    </Svg>
                  }
                />
              ) : left > 0 ? (
                <AppButton
                  title={
                    working.length
                      ? 'Jarvis is writing…'
                      : `Make ${platforms.length} version${platforms.length === 1 ? '' : 's'}`
                  }
                  size="lg"
                  disabled={!!working.length}
                  onPress={() => make()}
                  iconRight={
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="#FFFFFF" />
                    </Svg>
                  }
                />
              ) : (
                <>
                  <Text style={styles.outText}>You've used this week's free repurpose. You get a new one next week.</Text>
                  <AppButton title="Get unlimited with Pro" variant="gold" size="lg" onPress={() => onOpenJarvisPro?.()} />
                </>
              )}
              {left > 0 && !isPro && <Text style={styles.useNote}>Uses your free repurpose for this week</Text>}
            </View>
            )}

            {/* Video results */}
            {source === 'video' && postKind === 'video' && phase === 'done' && video && (
              <Animated.View entering={FadeInUp.duration(420).easing(Easing.out(Easing.cubic))}>
                <View style={styles.doneHead}>
                  <JarvisOrb size={26} />
                  <Text style={styles.doneText}>Watched twice. Here's what stands out.</Text>
                </View>
                <RecipeGrid recipe={breakdown.recipe} />

                <Text style={styles.section}>Moments in your video</Text>
                <MomentTimeline key={`${vStyle}-${seconds}`} seconds={seconds} moments={breakdown.moments} />

                <Text style={styles.section}>Make another like this</Text>
                <IdeaDeck
                  ideas={ideas}
                  platforms={platforms}
                  savedIds={savedIds}
                  onFilm={(idea) => onFilmIdea?.(idea.title, vStyle)}
                  onToggleSave={toggleSave}
                  onMore={moreIdeas}
                />
              </Animated.View>
            )}

            {/* Link: reading, then what's in it */}
            {source === 'link' && linkPhase === 'reading' && preview && (
              <Animated.View entering={FadeIn.duration(220)} style={styles.readCard}>
                <GlassCard strong radius={22} padding={16}>
                  <View style={styles.writing}>
                    <JarvisOrb size={28} />
                    <Text style={styles.readTitle}>Jarvis is reading your link</Text>
                  </View>
                  {['Opening the link', 'Reading the caption', preview.kind === 'video' ? 'Watching the video' : preview.kind === 'carousel' ? 'Looking at each slide' : 'Reading the post', 'Finding what stands out'].map((st, i) => (
                    <View key={st} style={styles.readRow}>
                      <View style={[styles.readDot, i < readStep && styles.readDotDone, i === readStep && styles.readDotNow]} />
                      <Text style={[styles.readText, i > readStep && { color: ds.text3 }]}>{st}</Text>
                    </View>
                  ))}
                </GlassCard>
              </Animated.View>
            )}
            {source === 'link' && linkPhase === 'done' && preview && (
              <Animated.View entering={FadeInUp.duration(380).easing(Easing.out(Easing.cubic))}>
                <Text style={styles.section}>{owner === 'mine' ? 'What’s in it' : 'What stands out'}</Text>
                <GlassCard strong radius={22} padding={14}>
                  <View style={styles.detected}>
                    {preview.platform !== 'web' && preview.platform !== 'x' ? <PlatformLogo type={preview.platform as PlatformLogoType} size={30} /> : <JarvisOrb size={28} />}
                    <View style={styles.flex}>
                      <Text style={styles.detectedTitle}>“{preview.title}”</Text>
                      <Text style={styles.detectedSub}>{preview.platformName} · {preview.kindLabel}</Text>
                    </View>
                  </View>
                </GlassCard>
                {owner === 'other' && (
                  <>
                    <Text style={styles.section}>New ideas in the same style</Text>
                    <IdeaDeck
                      ideas={linkIdeas}
                      platforms={platforms}
                      savedIds={savedIds}
                      onFilm={(it) => onFilmIdea?.(it.title, preview.style)}
                      onToggleSave={toggleSave}
                      onMore={moreIdeas}
                    />
                  </>
                )}
                <Pressable onPress={() => { setLinkText(''); setLinkPhase('idle'); setVersions([]); }} accessibilityRole="button" style={styles.anotherLink}>
                  <Text style={styles.anotherLinkText}>Try another link</Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Versions */}
            {(source === 'idea' || (source === 'video' && postKind !== 'video') || (source === 'link' && owner === 'mine' && linkPhase === 'done')) && (versions.length > 0 || working.length > 0) && (
              <>
                <Text style={styles.section}>Your versions</Text>
                <View style={styles.stack}>
                  {versions.map((v, i) => (
                    <VersionCard
                      key={v.platform}
                      v={v}
                      index={0}
                      onChange={(body) => setVersions((prev) => prev.map((x, j) => (j === i ? { ...x, body } : x)))}
                      onFormat={(f) => setVersions((prev) => prev.map((x, j) => (j === i ? makeVersion(versionSource, x.platform, f) : x)))}
                      onCopy={() => copy(v)}
                      onUse={() => onUseVersion?.(v.body, v.platform, versionSource)}
                    />
                  ))}
                  {working.map((p) => (
                    <Animated.View key={`w-${p}`} entering={FadeIn.duration(200)}>
                      <GlassCard radius={20} padding={14}>
                        <View style={styles.writing}>
                          <PlatformLogo type={p as PlatformLogoType} size={26} />
                          <JarvisOrb size={20} />
                          <Text style={styles.writingText}>Writing the {NAMES[p]} version…</Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))}
                </View>

                {/* Pro: post them in order, one tap */}
                {isPro && !working.length && versions.length > 0 && (
                  <Animated.View entering={FadeInUp.duration(350)}>
                    <GlassCard strong radius={22} padding={16} style={styles.planCard}>
                      <View style={styles.planHead}>
                        <JarvisOrb size={26} />
                        <Text style={styles.planTitle}>Plan the order</Text>
                        <View style={styles.planPro}>
                          <Text style={styles.planProText}>PRO</Text>
                        </View>
                      </View>
                      <Text style={styles.planSub}>Jarvis spaces them 30 minutes apart so each platform gets its moment.</Text>
                      {versions.map((v, i) => {
                        const mins = 19 * 60 + 30 + i * 30;
                        const time = `${((Math.floor(mins / 60) + 11) % 12) + 1}:${String(mins % 60).padStart(2, '0')} PM`;
                        return (
                          <View key={v.platform} style={styles.planRow}>
                            <Text style={styles.planNum}>{i + 1}</Text>
                            <PlatformLogo type={v.platform as PlatformLogoType} size={26} />
                            <Text style={styles.planName}>{NAMES[v.platform]}</Text>
                            <View style={[styles.planTime, scheduled && styles.planTimeDone]}>
                              {scheduled && (
                                <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                                  <Path d="M20 6L9 17l-5-5" stroke={ds.greenFill} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
                                </Svg>
                              )}
                              <Text style={[styles.planTimeText, scheduled && { color: ds.greenFill }]}>{time}</Text>
                            </View>
                          </View>
                        );
                      })}
                      <View style={styles.planCta}>
                        <AppButton
                          title={scheduled ? 'All scheduled for tonight' : `Schedule all ${versions.length}`}
                          variant={scheduled ? 'quiet' : 'primary'}
                          disabled={scheduled}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            setScheduled(true);
                            showToast(`${versions.length} posts scheduled for tonight`);
                          }}
                        />
                      </View>
                    </GlassCard>
                  </Animated.View>
                )}

                {!isPro && !working.length && order.length > 1 && (
                  <Animated.View entering={FadeInUp.duration(350)} style={styles.tip}>
                    <JarvisOrb size={24} />
                    <Text style={styles.tipText}>
                      Jarvis suggests: post on <Text style={styles.tipBold}>{order[0]}</Text> first, then{' '}
                      <Text style={styles.tipBold}>{order[1]}</Text> about 30 minutes later.
                    </Text>
                  </Animated.View>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
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
  meter: { marginTop: 4 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kindChip: { paddingHorizontal: 14, height: 38, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  kindChipOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  kindText: { fontSize: 13.5, fontWeight: '800', color: ds.text2 },
  kindTextOn: { color: '#FFFFFF' },
  photoThumb: { width: 90, height: 112, borderRadius: 14, overflow: 'hidden', backgroundColor: ds.lavender },
  photoImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  photoNum: { position: 'absolute', top: 6, left: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  photoNumText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  changeLink: { fontSize: 13, fontWeight: '800', color: ds.purple },
  photoBtn: { marginTop: 12 },
  fmtRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  fmt: { paddingHorizontal: 12, height: 32, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: ds.lavender },
  fmtOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  fmtText: { fontSize: 12.5, fontWeight: '800', color: ds.text2 },
  fmtTextOn: { color: '#FFFFFF' },
  slidesBar: { flexGrow: 0, marginHorizontal: -16, marginBottom: 10 },
  slides: { gap: 8, paddingHorizontal: 16 },
  slide: { width: 120, height: 150, borderRadius: 16, padding: 10, justifyContent: 'space-between', backgroundColor: 'rgba(245, 243, 255, 0.95)', borderWidth: 1, borderColor: ds.lavender },
  slideCover: { backgroundColor: ds.purple, borderColor: ds.purple },
  slideNum: { fontSize: 10.5, fontWeight: '800', color: ds.text3 },
  slideText: { fontSize: 14, lineHeight: 18, fontWeight: '800', color: ds.ink },
  thread: { marginBottom: 10 },
  threadRow: { flexDirection: 'row', gap: 10 },
  threadRail: { alignItems: 'center', width: 24 },
  threadDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  threadNum: { fontSize: 11.5, fontWeight: '800', color: ds.purple },
  threadLine: { flex: 1, width: 2, minHeight: 10, backgroundColor: ds.lavender, marginVertical: 2 },
  threadText: { flex: 1, fontSize: 14, lineHeight: 20, color: ds.ink, paddingBottom: 12, paddingTop: 2 },
  captionLabel: { fontSize: 12, fontWeight: '800', color: ds.text3, marginBottom: 6 },
  linkHelp: { fontSize: 13, color: ds.text2, marginTop: 4 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  linkField: { flex: 1, paddingVertical: 0, height: 48, justifyContent: 'center' },
  linkInput: { fontSize: 15, fontWeight: '600', color: ds.ink, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  pasteBtn: { height: 48, paddingHorizontal: 16, borderRadius: 16, justifyContent: 'center', backgroundColor: ds.purple },
  pasteText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
  detected: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  webIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  detectedTitle: { fontSize: 14.5, fontWeight: '800', color: ds.ink },
  detectedSub: { fontSize: 12, fontWeight: '600', color: ds.text3, marginTop: 1 },
  linkError: { fontSize: 12.5, fontWeight: '700', color: '#B45309', marginTop: 8 },
  ownerQ: { fontSize: 13.5, fontWeight: '800', color: ds.ink, marginTop: 16, marginBottom: 8 },
  ownerRow: { flexDirection: 'row', gap: 8 },
  ownerChip: { flex: 1, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  ownerChipOn: { borderColor: ds.purple, backgroundColor: ds.lavenderSoft },
  ownerText: { fontSize: 13.5, fontWeight: '700', color: ds.text2 },
  ownerTextOn: { color: ds.purple, fontWeight: '800' },
  ownerNote: { fontSize: 12.5, lineHeight: 18, color: ds.text2, marginTop: 10 },
  readCard: { marginTop: 18 },
  readTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  readDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: ds.lavender },
  readDotNow: { borderColor: ds.purple },
  readDotDone: { backgroundColor: ds.greenFill, borderColor: ds.greenFill },
  readText: { fontSize: 13.5, fontWeight: '700', color: ds.ink },
  anotherLink: { alignSelf: 'center', height: 44, justifyContent: 'center', marginTop: 6 },
  anotherLinkText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  planCard: { marginTop: 16 },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: ds.ink },
  planPro: { paddingHorizontal: 7, height: 20, borderRadius: 999, justifyContent: 'center', backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  planProText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: goldTokens.dark },
  planSub: { fontSize: 13, lineHeight: 18, color: ds.text2, marginTop: 6, marginBottom: 6 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  planNum: { width: 18, fontSize: 13, fontWeight: '800', color: ds.text3 },
  planName: { flex: 1, fontSize: 14.5, fontWeight: '800', color: ds.ink },
  planTime: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 28, borderRadius: 999, backgroundColor: ds.lavender },
  planTimeDone: { backgroundColor: ds.greenBg },
  planTimeText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  planCta: { marginTop: 12 },
  switchWrap: { marginBottom: 14 },
  doneHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 12 },
  doneText: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '800', color: ds.ink },
  ideaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  field: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  ideaInput: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  cta: { marginTop: 18, gap: 8 },
  useNote: { fontSize: 12.5, color: ds.text3, textAlign: 'center' },
  outText: { fontSize: 13.5, lineHeight: 19, color: ds.text2, textAlign: 'center', marginBottom: 4 },
  stack: { gap: 12 },
  vHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vName: { fontSize: 16, fontWeight: '800', color: ds.ink },
  vFormat: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 1 },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: ds.greenBg },
  readyText: { fontSize: 11, fontWeight: '800', color: ds.greenFill },
  vTitle: { fontSize: 13.5, fontWeight: '800', color: ds.text2, marginTop: 12, marginBottom: 8 },
  vBody: { fontSize: 14.5, lineHeight: 21 },
  vActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ds.lavender },
  copyText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  writing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  writingText: { fontSize: 13.5, fontWeight: '700', color: ds.purple },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  tipBold: { fontWeight: '800', color: ds.ink },
});
