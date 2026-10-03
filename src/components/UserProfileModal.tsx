import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Image, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { Text, TextInput } from './ui/AppText';
import { AppButton } from './ui/AppButton';
import { AppToast } from './ui/AppToast';
import { AutoGrowInput } from './ui/AutoGrowInput';
import { GlassSheet } from './glass/GlassSheet';
import { GlassCard } from './glass/GlassCard';
import { AccountsPanel } from './accounts/AccountsPanel';
import { useAccounts } from '../backend/accounts';
import { ds, goldTokens } from '../theme/colors';
import { STAGE_2_ENABLED } from '../config/features';
import type { UserPersona, UserTier } from '../types/account';

// "Your profile": one glass sheet for every creator (free or Pro, new or
// returning). Tabs: Profile (photo, name, what you make, topics), Accounts
// (connect where you post) and Settings (reminders, sign out). The badge tab
// is Stage 2 (Creator Passport) and stays hidden until then.
// The hero card updates live while you type; one button saves (or closes).

export interface UserProfileData {
  name: string;
  handle: string;
  bio: string;
  niche: string;
  tier: UserTier;
  userPersona: UserPersona;
  avatarId?: string;
  avatarSource?: any;
  customAvatarUri?: string;
  streakCount: number;
  level: number;
  xp: number;
  postsCount?: number;
  tiktokHandle?: string;
  instagramHandle?: string;
  youtubeHandle?: string;
  facebookHandle?: string;
  threadsHandle?: string;
  pinterestHandle?: string;
  xHandle?: string;
  connectedPlatforms?: string[];
  niches: string[];
  isVerified?: boolean;
  portfolioUrl?: string;
}

export const formatCompactStat = (val: number | undefined | null): string => {
  if (val === undefined || val === null) return '0';
  if (val >= 1000000) return (val / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (val >= 1000) return (val / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return val.toString();
};

export const CREATOR_AVATARS = [
  { id: 'ghost', name: 'Ghost', source: require('../../assets/images/jarvis-ghost-clean.png'), tag: 'MASCOT' },
  { id: 'elena', name: 'Elena Rostova', source: require('../../assets/images/elena-avatar.jpg'), tag: 'LIFESTYLE' },
  { id: 'amara', name: 'Amara Okafor', source: require('../../assets/images/amara-avatar.jpg'), tag: 'TECH' },
  { id: 'david', name: 'David Adebayo', source: require('../../assets/images/david-avatar.jpg'), tag: 'CREATOR' },
  { id: 'kemi', name: 'Kemi Alabi', source: require('../../assets/images/kemi-avatar.jpg'), tag: 'STORY' },
  { id: 'marcus', name: 'Marcus Vance', source: require('../../assets/images/marcus-avatar.jpg'), tag: 'FITNESS' },
  { id: 'tomi', name: 'Tomiwa Kuti', source: require('../../assets/images/tomi-avatar.jpg'), tag: 'COMEDY' },
  { id: 'zainab', name: 'Zainab Bello', source: require('../../assets/images/zainab-avatar.jpg'), tag: 'BEAUTY' },
];

export const ALL_NICHES = [
  'Lifestyle',
  'Tech & AI',
  'Comedy & Relatable',
  'Storytelling',
  'Fitness & Health',
  'Business & Wealth',
  'Travel & Vlogs',
  'Fashion & Beauty',
  'Education',
];

const BIO_MAX = 150;
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// ─── Settings (kept for the session until there's a backend) ───────────────
type Prefs = { reminder: boolean; bestTime: boolean; weekly: boolean; vibration: boolean };
let prefs: Prefs = { reminder: true, bestTime: true, weekly: true, vibration: true };
const prefListeners = new Set<() => void>();
const setPrefs = (p: Prefs) => {
  prefs = p;
  prefListeners.forEach((l) => l());
};
const subscribePrefs = (l: () => void) => {
  prefListeners.add(l);
  return () => prefListeners.delete(l);
};

// ─── Small pieces ───────────────────────────────────────────────────────────
type Tab = 'profile' | 'accounts' | 'badge' | 'settings';
const TAB_LABELS: Record<Tab, string> = { profile: 'Profile', accounts: 'Accounts', badge: 'Badge', settings: 'Settings' };

function Tabs({ tabs, value, onChange }: { tabs: Tab[]; value: Tab; onChange: (t: Tab) => void }) {
  const [w, setW] = useState(0);
  const idx = tabs.indexOf(value);
  const cell = w / tabs.length;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(idx * cell, smooth);
  }, [idx, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.tabs}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = idx * (nw / tabs.length);
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.tabPill, { width: cell }, pill]} />}
      {tabs.map((t) => {
        const on = t === value;
        return (
          <Pressable
            key={t}
            onPress={() => {
              tick();
              onChange(t);
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={[styles.tab, pointer]}
          >
            <Text style={[styles.tabText, on && styles.tabTextOn]} numberOfLines={1}>
              {TAB_LABELS[t]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const PersonIcon = ({ size = 34, color = ds.purple }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={2} />
    <Path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const CheckIcon = ({ size = 12, color = '#FFFFFF' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke={color} strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

/** The profile photo with a soft breathing glow (gold ring for Pro). */
function HeroAvatar({ source, pro }: { source: any; pro: boolean }) {
  const reduceMotion = useReducedMotion();
  const glow = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    glow.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [reduceMotion, glow]);
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.35 + glow.value * 0.35, transform: [{ scale: 1 + glow.value * 0.06 }] }));
  const tint = pro ? ds.gold : ds.purple;
  return (
    <View style={styles.heroAvatarWrap}>
      <Animated.View pointerEvents="none" style={[styles.heroGlow, { backgroundColor: pro ? 'rgba(245, 158, 11, 0.35)' : 'rgba(91, 62, 232, 0.28)' }, glowStyle]} />
      <View style={[styles.heroRing, { borderColor: tint }]}>
        {source ? (
          <Animated.Image key={typeof source === 'object' && 'uri' in source ? source.uri : String(source)} entering={FadeIn.duration(260)} source={source} style={styles.heroImg} resizeMode="cover" />
        ) : (
          <View style={[styles.heroImg, styles.heroEmpty]}>
            <PersonIcon />
          </View>
        )}
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statVal}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, autoCapitalize, label }: { value: string; onChangeText: (t: string) => void; placeholder: string; autoCapitalize?: 'none' | 'words'; label: string }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={[styles.inputBox, focus && styles.inputBoxFocus]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={ds.text3}
        selectionColor={ds.purple}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        accessibilityLabel={label}
        style={styles.input}
      />
    </View>
  );
}

function TopicChip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const p = useSharedValue(on ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(on ? 1 : 0, smooth);
  }, [on, p]);
  const fill = useAnimatedStyle(() => ({ opacity: p.value }));
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, pointer, pressed && { transform: [{ scale: 0.96 }] }]}>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.chipOn, fill]} />
      {on ? (
        <Animated.View entering={FadeIn.duration(180)}>
          <CheckIcon size={11} color="#FFFFFF" />
        </Animated.View>
      ) : (
        <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke={ds.text2} strokeWidth={2.8} strokeLinecap="round" />
        </Svg>
      )}
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = withTiming(value ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [value, p]);
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: 2 + p.value * 20 }] }));
  const on = useAnimatedStyle(() => ({ opacity: p.value }));
  return (
    <Pressable
      onPress={() => {
        tick();
        onChange(!value);
      }}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={[styles.switch, pointer]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.switchOn, on]} />
      <Animated.View style={[styles.knob, knob]} />
    </Pressable>
  );
}

function SettingRow({ title, body, value, onChange }: { title: string; body: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.setRow}>
      <View style={styles.flex}>
        <Text style={styles.setTitle}>{title}</Text>
        <Text style={styles.setBody}>{body}</Text>
      </View>
      <Toggle value={value} onChange={onChange} label={title} />
    </View>
  );
}

// ─── The sheet ──────────────────────────────────────────────────────────────
export interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onLogout?: () => void;
  initialProfile?: Partial<UserProfileData>;
  /** Older callers pass 'socials' / 'verification'; they map to Accounts / Badge. */
  initialSubTab?: 'profile' | 'socials' | 'verification' | 'settings' | 'accounts';
  onSaveProfile?: (updatedProfile: UserProfileData) => void;
}

const DEFAULT_NICHES = ['Lifestyle', 'Tech & AI', 'Storytelling'];

const toTab = (t?: UserProfileModalProps['initialSubTab']): Tab => {
  if (t === 'socials' || t === 'accounts') return 'accounts';
  if (t === 'settings') return 'settings';
  if (t === 'verification') return STAGE_2_ENABLED ? 'badge' : 'profile';
  return 'profile';
};

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ visible, onClose, onLogout, initialProfile, initialSubTab, onSaveProfile }) => {
  const isPro = initialProfile?.tier === 'pro' || initialProfile?.tier === 'founding';
  const isNew = (initialProfile?.userPersona ?? 'new') === 'new';
  const tabs: Tab[] = STAGE_2_ENABLED ? ['profile', 'accounts', 'badge', 'settings'] : ['profile', 'accounts', 'settings'];

  const [tab, setTab] = useState<Tab>(toTab(initialSubTab));
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [niche, setNiche] = useState('');
  const [bio, setBio] = useState('');
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [customUri, setCustomUri] = useState<string | null>(null);
  const [niches, setNiches] = useState<string[]>(DEFAULT_NICHES);
  const nConnected = useAccounts().length;
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOut, setConfirmOut] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settings = useSyncExternalStore(subscribePrefs, () => prefs, () => prefs);

  // Fresh copy of the profile each time the sheet opens
  useEffect(() => {
    if (!visible) return;
    setTab(toTab(initialSubTab));
    setName(initialProfile?.name ?? 'Pablo');
    setHandle(initialProfile?.handle ?? '@pablocreates');
    setNiche(initialProfile?.niche ?? '');
    setBio(initialProfile?.bio ?? '');
    setAvatarId(initialProfile?.avatarId ?? null);
    setCustomUri(initialProfile?.customAvatarUri ?? null);
    setNiches(initialProfile?.niches?.length ? initialProfile.niches : DEFAULT_NICHES);
    setConfirmOut(false);
    setToast(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);


  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (outTimer.current) clearTimeout(outTimer.current);
    },
    []
  );

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  };

  const cleanHandle = (h: string) => {
    const t = h.replace(/\s+/g, '').replace(/^@+/, '');
    return t ? `@${t}` : initialProfile?.handle ?? '@pablocreates';
  };

  const avatarSource = customUri
    ? { uri: customUri }
    : avatarId
      ? CREATOR_AVATARS.find((a) => a.id === avatarId)?.source ?? null
      : null;

  const build = (overrides: Partial<UserProfileData> = {}): UserProfileData => ({
    ...(initialProfile as UserProfileData),
    name: name.trim() || initialProfile?.name || 'Pablo',
    handle: cleanHandle(handle),
    niche: niche.trim(),
    bio: bio.trim(),
    avatarId: customUri ? 'custom' : avatarId ?? undefined,
    avatarSource: avatarSource ?? undefined,
    customAvatarUri: customUri ?? undefined,
    niches,
    streakCount: initialProfile?.streakCount ?? 1,
    level: initialProfile?.level ?? 1,
    xp: initialProfile?.xp ?? 0,
    ...overrides,
  });

  const dirty =
    name.trim() !== (initialProfile?.name ?? 'Pablo') ||
    cleanHandle(handle) !== (initialProfile?.handle ?? '@pablocreates') ||
    niche.trim() !== (initialProfile?.niche ?? '') ||
    bio.trim() !== (initialProfile?.bio ?? '') ||
    (avatarId ?? null) !== (initialProfile?.avatarId ?? null) ||
    (customUri ?? null) !== (initialProfile?.customAvatarUri ?? null) ||
    niches.join('|') !== (initialProfile?.niches?.length ? initialProfile.niches : DEFAULT_NICHES).join('|');

  const save = () => {
    if (dirty) {
      if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaveProfile?.(build());
    }
    onClose();
  };

  const pickAvatar = (id: string) => {
    tick();
    setAvatarId(id);
    setCustomUri(null);
  };

  const uploadPhoto = () => {
    tick();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          setCustomUri(String(reader.result));
          showToast('Photo added');
        };
        reader.readAsDataURL(file);
      };
      input.click();
      return;
    }
    ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 })
      .then((res) => {
        if (!res.canceled && res.assets?.[0]?.uri) {
          setCustomUri(res.assets[0].uri);
          showToast('Photo added');
        }
      })
      .catch(() => showToast('Couldn’t open your photos. Try again.'));
  };

  const toggleNiche = (n: string) => {
    tick();
    if (niches.includes(n)) {
      if (niches.length === 1) {
        showToast('Keep at least one topic');
        return;
      }
      setNiches(niches.filter((x) => x !== n));
    } else setNiches([...niches, n]);
  };

  const signOut = () => {
    if (!confirmOut) {
      tick();
      setConfirmOut(true);
      if (outTimer.current) clearTimeout(outTimer.current);
      outTimer.current = setTimeout(() => setConfirmOut(false), 3500);
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
    onLogout?.();
  };

  const posts = initialProfile?.postsCount ?? 0;
  const displayName = name.trim() || 'Your name';
  const displayHandle = cleanHandle(handle);

  // ── Tabs ──
  const profileTab = (
    <>
      <GlassCard strong radius={26} padding={18}>
        <View style={styles.heroTop}>
          <HeroAvatar source={avatarSource} pro={isPro} />
          <View style={styles.flex}>
            <Text style={styles.heroName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.heroHandle} numberOfLines={1}>
              {displayHandle}
            </Text>
            {niche.trim() ? (
              <Text style={styles.heroNiche} numberOfLines={2}>
                {niche.trim()}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={styles.stats}>
          <Stat value={formatCompactStat(posts)} label={posts === 1 ? 'Post' : 'Posts'} />
          <View style={styles.statLine} />
          <Stat value={String(initialProfile?.level ?? 1)} label="Level" />
          <View style={styles.statLine} />
          <Stat value={formatCompactStat(initialProfile?.xp ?? 0)} label="XP" />
        </View>
        {isNew ? <Text style={styles.heroNote}>Your numbers fill in as you post.</Text> : null}
      </GlassCard>

      <Text style={styles.section}>Photo</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatars}>
        <Pressable onPress={uploadPhoto} accessibilityRole="button" accessibilityLabel="Upload a photo" style={({ pressed }) => [styles.avItem, pointer, pressed && { transform: [{ scale: 0.95 }] }]}>
          <View style={[styles.avCircle, styles.avUpload, customUri ? styles.avSelected : null]}>
            {customUri ? (
              <Image source={{ uri: customUri }} style={styles.avImg} resizeMode="cover" />
            ) : (
              <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                <Rect x="3" y="6" width="18" height="14" rx="3" stroke={ds.purple} strokeWidth={2} />
                <Circle cx="12" cy="13" r="3.5" stroke={ds.purple} strokeWidth={2} />
                <Path d="M9 6l1.5-2.5h3L15 6" stroke={ds.purple} strokeWidth={2} strokeLinejoin="round" />
              </Svg>
            )}
            {customUri ? (
              <Animated.View entering={FadeIn.duration(200)} style={styles.avCheck}>
                <CheckIcon size={9} />
              </Animated.View>
            ) : null}
          </View>
          <Text style={[styles.avName, customUri ? styles.avNameOn : null]}>{customUri ? 'Yours' : 'Upload'}</Text>
        </Pressable>
        {CREATOR_AVATARS.map((av) => {
          const on = !customUri && avatarId === av.id;
          return (
            <Pressable key={av.id} onPress={() => pickAvatar(av.id)} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={av.name} style={({ pressed }) => [styles.avItem, pointer, pressed && { transform: [{ scale: 0.95 }] }]}>
              <View style={[styles.avCircle, on && styles.avSelected]}>
                <Image source={av.source} style={styles.avImg} resizeMode="cover" />
                {on ? (
                  <Animated.View entering={FadeIn.duration(200)} style={styles.avCheck}>
                    <CheckIcon size={9} />
                  </Animated.View>
                ) : null}
              </View>
              <Text style={[styles.avName, on && styles.avNameOn]} numberOfLines={1}>
                {av.name.split(' ')[0]}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Field label="Name">
        <Input value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" label="Name" />
      </Field>
      <Field label="Username">
        <Input value={handle} onChangeText={setHandle} placeholder="@yourname" autoCapitalize="none" label="Username" />
      </Field>
      <Field label="What you make">
        <Input value={niche} onChangeText={setNiche} placeholder="e.g. Dance videos from Lagos" label="What you make" />
      </Field>
      <Field label="About you" hint={`${bio.length}/${BIO_MAX}`}>
        <View style={styles.inputBox}>
          <AutoGrowInput value={bio} onChangeText={(t) => setBio(t.slice(0, BIO_MAX))} placeholder="A line or two about you" minHeight={44} maxLength={BIO_MAX} accessibilityLabel="About you" style={styles.bioInput} />
        </View>
      </Field>

      <Text style={styles.section}>Your topics</Text>
      <Text style={styles.sectionSub}>Jarvis uses these to suggest ideas.</Text>
      <View style={styles.chips}>
        {ALL_NICHES.map((n) => (
          <TopicChip key={n} label={n} on={niches.includes(n)} onPress={() => toggleNiche(n)} />
        ))}
      </View>
    </>
  );

  // Accounts connect on the spot through each platform's own sign-in (nothing to save)
  const accountsTab = <AccountsPanel />;

  // Stage 2 (Creator Passport): the badge checklist, built from real profile state
  const steps = [
    { id: 'photo', label: 'Add a photo', done: !!avatarSource, go: 'profile' as Tab },
    { id: 'bio', label: 'Write a line about you', done: bio.trim().length >= 10, go: 'profile' as Tab },
    { id: 'account', label: 'Connect an account', done: nConnected > 0, go: 'accounts' as Tab },
    { id: 'post', label: 'Share your first post', done: posts > 0, go: null },
  ];
  const badgeTab = (
    <>
      <GlassCard strong radius={22} padding={16}>
        <Text style={styles.cardTitle}>Get your badge</Text>
        <Text style={styles.sectionSub}>
          {steps.filter((s) => s.done).length} of {steps.length} done
        </Text>
        <ProgressBar value={steps.filter((s) => s.done).length / steps.length} />
      </GlassCard>
      <View style={styles.list}>
        {steps.map((s) => (
          <View key={s.id} style={styles.stepRow}>
            <View style={[styles.stepDot, s.done && styles.stepDotDone]}>{s.done ? <CheckIcon size={11} /> : null}</View>
            <Text style={[styles.stepText, s.done && styles.stepTextDone]}>{s.label}</Text>
            {!s.done && s.go ? (
              <Pressable onPress={() => setTab(s.go!)} hitSlop={8} style={pointer}>
                <Text style={styles.link}>Do it</Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>
    </>
  );

  const settingsTab = (
    <>
      <Text style={[styles.section, { marginTop: 0 }]}>Notifications</Text>
      <GlassCard strong radius={22} padding={0}>
        <SettingRow title="Posting reminder" body="A gentle note at the time you usually post" value={settings.reminder} onChange={(v) => setPrefs({ ...settings, reminder: v })} />
        <View style={styles.setLine} />
        <SettingRow title="Best time to post" body="When most of your audience is online" value={settings.bestTime} onChange={(v) => setPrefs({ ...settings, bestTime: v })} />
        <View style={styles.setLine} />
        <SettingRow title="Weekly recap" body="A short look at your week, every Monday" value={settings.weekly} onChange={(v) => setPrefs({ ...settings, weekly: v })} />
      </GlassCard>

      {Platform.OS !== 'web' ? (
        <>
          <Text style={styles.section}>Feel</Text>
          <GlassCard strong radius={22} padding={0}>
            <SettingRow title="Vibration" body="Small taps when you press things" value={settings.vibration} onChange={(v) => setPrefs({ ...settings, vibration: v })} />
          </GlassCard>
        </>
      ) : null}

      <Text style={styles.section}>Your plan</Text>
      <GlassCard strong radius={22} padding={14}>
        <View style={styles.planRow}>
          <View style={[styles.planDot, isPro ? styles.planDotPro : null]}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6L12 16.4 6.6 19.4l1.2-6L3.3 9.3l6.1-.7L12 3z" fill={isPro ? goldTokens.dark : ds.purple} />
            </Svg>
          </View>
          <View style={styles.flex}>
            <Text style={styles.setTitle}>{isPro ? 'Pro' : 'Free'}</Text>
            <Text style={styles.setBody}>{isPro ? 'Unlimited ideas, repurposing and Voice Studio' : 'Everything you need to start posting'}</Text>
          </View>
        </View>
      </GlassCard>

      {onLogout ? (
        <Pressable onPress={signOut} accessibilityRole="button" style={({ pressed }) => [styles.signOut, confirmOut && styles.signOutConfirm, pointer, pressed && { transform: [{ scale: 0.98 }] }]}>
          <Animated.View key={confirmOut ? 'c' : 'n'} entering={FadeIn.duration(180)} style={styles.signOutInner}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path d="M15 4h3a2 2 0 012 2v12a2 2 0 01-2 2h-3M10 17l-5-5 5-5M5 12h11" stroke={confirmOut ? '#FFFFFF' : '#B91C1C'} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={[styles.signOutText, confirmOut && { color: '#FFFFFF' }]}>{confirmOut ? 'Tap again to sign out' : 'Sign out'}</Text>
          </Animated.View>
        </Pressable>
      ) : null}
    </>
  );

  const body = tab === 'profile' ? profileTab : tab === 'accounts' ? accountsTab : tab === 'badge' ? badgeTab : settingsTab;

  return (
    <GlassSheet
      visible={visible}
      onClose={onClose}
      title="Your profile"
      fill
      badge={
        <View style={[styles.plan, isPro && styles.planPro]}>
          <Text style={[styles.planText, isPro && styles.planTextPro]}>{isPro ? 'PRO' : 'FREE'}</Text>
        </View>
      }
      overlay={<AppToast message={toast} bottom={86} />}
      footer={<AppButton title={dirty ? 'Save changes' : 'Done'} size="lg" onPress={save} />}
    >
      <View style={styles.tabsWrap}>
        <Tabs tabs={tabs} value={tab} onChange={setTab} />
      </View>
      <ScrollView key={tab} style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <Animated.View entering={FadeInUp.duration(240).easing(Easing.out(Easing.cubic))}>
          {body}
        </Animated.View>
      </ScrollView>
    </GlassSheet>
  );
};

function ProgressBar({ value }: { value: number }) {
  const w = useSharedValue(0);
  useEffect(() => {
    w.value = withTiming(value, { duration: 420, easing: Easing.out(Easing.cubic) });
  }, [value, w]);
  const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.trackFill, fill]} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  plan: { paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  planPro: { backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  planText: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.6, color: ds.purple },
  planTextPro: { color: goldTokens.dark },

  tabsWrap: { paddingHorizontal: 20, paddingTop: 8 },
  tabs: { flexDirection: 'row', padding: 4, height: 44, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  tabPill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 999, backgroundColor: ds.purple },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2 },
  tabText: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  tabTextOn: { color: '#FFFFFF' },

  body: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24 },

  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroAvatarWrap: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  heroGlow: { position: 'absolute', width: 84, height: 84, borderRadius: 42 },
  heroRing: { width: 80, height: 80, borderRadius: 40, borderWidth: 2.5, padding: 3, backgroundColor: '#FFFFFF' },
  heroImg: { width: '100%', height: '100%', borderRadius: 40 },
  heroEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavenderSoft },
  heroName: { fontSize: 20, fontWeight: '800', color: ds.ink, letterSpacing: -0.4 },
  heroHandle: { fontSize: 14, fontWeight: '700', color: ds.purple, marginTop: 1 },
  heroNiche: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 4, lineHeight: 17 },
  heroNote: { fontSize: 12.5, fontWeight: '600', color: ds.text3, textAlign: 'center', marginTop: 10 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingVertical: 10, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: ds.ink },
  statLabel: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 1 },
  statLine: { width: 1, height: 24, backgroundColor: ds.lavender },

  section: { fontSize: 15, fontWeight: '800', color: ds.ink, marginTop: 20, marginBottom: 8 },
  sectionSub: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: -4, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: ds.ink, marginBottom: 6 },

  avatars: { gap: 12, paddingRight: 8 },
  avItem: { alignItems: 'center', width: 60 },
  avCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'transparent', padding: 2 },
  avUpload: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderColor: ds.lavender, borderStyle: 'dashed' },
  avSelected: { borderColor: ds.purple, borderStyle: 'solid' },
  avImg: { width: '100%', height: '100%', borderRadius: 26 },
  avCheck: { position: 'absolute', right: -2, bottom: -2, width: 18, height: 18, borderRadius: 9, backgroundColor: ds.purple, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avName: { fontSize: 11.5, fontWeight: '700', color: ds.text3, marginTop: 4 },
  avNameOn: { color: ds.purple, fontWeight: '800' },

  field: { marginTop: 14 },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '800', color: ds.text2 },
  fieldHint: { fontSize: 12, fontWeight: '700', color: ds.text3 },
  inputBox: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  inputBoxFocus: { borderColor: ds.purple },
  input: { fontSize: 15.5, fontWeight: '600', color: ds.ink, paddingVertical: 10, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}) },
  bioInput: { paddingVertical: 10 },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 38, paddingHorizontal: 13, borderRadius: 999, overflow: 'hidden', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  chipOn: { backgroundColor: ds.purple },
  chipText: { fontSize: 13, fontWeight: '700', color: ds.text2 },
  chipTextOn: { color: '#FFFFFF', fontWeight: '800' },

  logoRow: { flexDirection: 'row', gap: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: ds.lavender, marginTop: 12, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3, backgroundColor: ds.greenFill },
  summary: { fontSize: 13, fontWeight: '700', color: ds.text2, marginTop: 8 },
  list: { gap: 10, marginTop: 14 },
  privacy: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 12, borderRadius: 16, backgroundColor: 'rgba(245, 243, 255, 0.9)' },
  privacyText: { flex: 1, fontSize: 12.5, lineHeight: 18, color: ds.text2 },

  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.8)' },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  stepDotDone: { backgroundColor: ds.greenFill, borderColor: ds.greenFill },
  stepText: { flex: 1, fontSize: 14, fontWeight: '700', color: ds.ink },
  stepTextDone: { color: ds.text3 },
  link: { fontSize: 13.5, fontWeight: '800', color: ds.purple },

  setRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  setLine: { height: 1, marginHorizontal: 14, backgroundColor: 'rgba(23, 20, 32, 0.06)' },
  setTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  setBody: { fontSize: 12.5, lineHeight: 17, fontWeight: '600', color: ds.text3, marginTop: 2 },
  switch: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#DDD8CE', overflow: 'hidden', justifyContent: 'center' },
  switchOn: { backgroundColor: ds.purple },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },

  planRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  planDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavender },
  planDotPro: { backgroundColor: goldTokens.light },

  signOut: { marginTop: 20, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(254, 242, 242, 0.9)', borderWidth: 1, borderColor: '#FECACA' },
  signOutConfirm: { backgroundColor: '#DC2626', borderColor: '#DC2626' },
  signOutInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  signOutText: { fontSize: 15, fontWeight: '800', color: '#B91C1C' },
});
