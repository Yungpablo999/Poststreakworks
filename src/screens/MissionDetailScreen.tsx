import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import type { UserPersona } from '../components/HeaderDualModePills';
import { JarvisPickCard, ProgressRing, PulsingTarget, type PickIdea } from '../components/quests/QuestBlocks';
import { getStarterIdeas } from '../data';
import { ds } from '../theme/colors';

// Today's quest, opened from the Quests tab. Three tappable steps, Jarvis's
// idea pick (shuffle through a few), and what finishing earns. No deadline,
// no streak warnings: post whenever suits you.

const XP = 80;
const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

interface MissionDetailScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenCreateIdea?: () => void;
  onOpenIdeaAngle?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  /** New creators: shape the idea in Script. */
  onOpenScript?: (title: string) => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  userPersona?: UserPersona;
  onTogglePersona?: () => void;
  onSwitchToPro?: () => void;
}

type StepIcon = 'idea' | 'make' | 'post';

interface Step {
  id: StepIcon;
  title: string;
  body: string;
  /** Button label; none = tracked automatically */
  action?: string;
  onPress?: () => void;
  /** Done from Jarvis's pick below, so no button of its own */
  hint?: boolean;
}

function StepGlyph({ id, color }: { id: StepIcon; color: string }) {
  const paths: Record<StepIcon, React.ReactNode> = {
    idea: (
      <Path
        d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.1 1 1.8V16h5v-.3c0-.7.4-1.4 1-1.8A6 6 0 0012 3z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
    make: <Path d="M15 10l5-3v10l-5-3M4 6h11v12H4z" stroke={color} strokeWidth={2} strokeLinejoin="round" />,
    post: <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />,
  };
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      {paths[id]}
    </Svg>
  );
}

// ─── Stepper ────────────────────────────────────────────────────────────────
function StepRow({
  step,
  index,
  last,
  open,
  next,
  onToggle,
}: {
  step: Step;
  index: number;
  last: boolean;
  open: boolean;
  next: boolean;
  onToggle: () => void;
}) {
  const [hover, setHover] = useState(false);
  return (
    <Animated.View style={styles.stepRow}>
      {/* Rail */}
      <View style={styles.rail}>
        <View style={[styles.stepCircle, next && styles.stepCircleNext]}>
          <StepGlyph id={step.id} color={next ? '#FFFFFF' : ds.purple} />
        </View>
        {!last && <View style={styles.railLine} />}
      </View>

      <Pressable
        onPress={onToggle}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`Step ${index + 1}: ${step.title}`}
        style={[styles.stepBody, open && styles.stepBodyOpen, hover && !open && styles.stepBodyHover, pointer]}
      >
        <View style={styles.stepTop}>
          <Text style={styles.stepNum}>STEP {index + 1}</Text>
          {next && (
            <View style={styles.nextChip}>
              <Text style={styles.nextChipText}>Next up</Text>
            </View>
          )}
          {!step.action && !step.hint && (
            <View style={styles.autoChip}>
              <Text style={styles.autoChipText}>Automatic</Text>
            </View>
          )}
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        {open && (
          <Animated.View entering={FadeIn.duration(220)}>
            <Text style={styles.stepText}>{step.body}</Text>
            {step.action && step.onPress && (
              <View style={styles.stepAction}>
                <AppButton title={step.action} onPress={step.onPress} variant={next ? 'primary' : 'glass'} />
              </View>
            )}
          </Animated.View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// Soft glow behind the finish badge
function BadgeGlow() {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduce) t.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, t]);
  const style = useAnimatedStyle(() => ({ opacity: 0.35 + 0.35 * t.value, transform: [{ scale: 0.92 + 0.12 * t.value }] }));
  return <Animated.View pointerEvents="none" style={[styles.badgeGlow, style]} />;
}

export const MissionDetailScreen: React.FC<MissionDetailScreenProps> = ({
  onBack,
  onLogout,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenCreateIdea,
  onOpenIdeaAngle,
  onOpenPostComposer,
  onOpenScript,
  userProfile,
  onSaveProfile,
  userPersona,
  onTogglePersona,
  onSwitchToPro,
}) => {
  const isNew = (userPersona || userProfile?.userPersona || 'new') === 'new';
  const [showProfile, setShowProfile] = useState(false);
  const [open, setOpen] = useState(0);

  const ideas = useMemo(
    () => getStarterIdeas(userProfile?.niches ?? [], (userProfile as { platforms?: string[] } | undefined)?.platforms ?? []).slice(0, 5),
    [userProfile],
  );

  const findIdeas = () => (onOpenIdeaAngle ? onOpenIdeaAngle() : onOpenCreateIdea ? onOpenCreateIdea() : onNavigateTab?.('create'));
  const useIdea = (idea: PickIdea) => {
    if (isNew) {
      if (onOpenScript) onOpenScript(idea.title);
      else if (onOpenCreateIdea) onOpenCreateIdea();
      else onNavigateTab?.('create');
    } else {
      onOpenPostComposer?.(idea.title);
    }
  };

  const steps: Step[] = isNew
    ? [
        { id: 'idea', title: 'Pick an idea', body: 'Use Jarvis’s pick below, or look through more ideas.', action: 'Find ideas', onPress: findIdeas },
        { id: 'make', title: 'Write the script', body: 'Tap “Use this idea” below and Jarvis helps you turn it into a short script.', hint: true },
        { id: 'post', title: 'Save it', body: 'We tick this off when you save a draft or schedule it.' },
      ]
    : [
        { id: 'idea', title: 'Pick an idea', body: 'Use Jarvis’s pick below, or find one that fits today.', action: 'Find ideas', onPress: findIdeas },
        { id: 'make', title: 'Make your post', body: 'Tap “Use this idea” below to film, write or design it.', hint: true },
        { id: 'post', title: 'Post it', body: 'We tick this off when your post goes live. Whenever suits you.' },
      ];

  const title = isNew ? ['Your first', 'Studio session'] : ['Share one', 'post today'];

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onSwitchToPro={onSwitchToPro}
          onTogglePersona={onTogglePersona}
          onOpenProfile={() => setShowProfile(true)}
          userPersona={userPersona}
          userProfile={userProfile}
        />
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View entering={FadeInUp.duration(500).easing(Easing.out(Easing.cubic))}>
            <GlassCard strong radius={28} padding={20}>
              <View style={styles.heroTop}>
                <View style={styles.flex}>
                  <View style={styles.eyebrow}>
                    <PulsingTarget />
                    <Text style={styles.eyebrowText}>TODAY'S QUEST</Text>
                  </View>
                  <FitLines
                    key={title.join()}
                    lines={[title[0], <Text key="a" style={styles.accent}>{title[1]}</Text>]}
                    textStyle={styles.heroTitle}
                    maxFontSize={30}
                    align="left"
                    accessibilityLabel={title.join(' ')}
                  />
                </View>
                <View style={styles.ring} accessibilityLabel={`${XP} XP when you finish`}>
                  <ProgressRing progress={0.04} size={70} />
                  <View style={styles.ringCenter}>
                    <Text style={styles.ringXp}>+{XP}</Text>
                    <Text style={styles.ringLabel}>XP</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.heroBody}>
                {isNew ? 'Get one idea ready. No need to post yet.' : 'Whenever suits you. There’s no deadline.'}
              </Text>
              <View style={styles.segments} accessibilityLabel="0 of 3 steps done">
                {steps.map((s) => (
                  <View key={s.id} style={styles.segment} />
                ))}
              </View>
              <Text style={styles.segmentsLabel}>0 of 3 steps done</Text>
            </GlassCard>
          </Animated.View>

          {/* Steps */}
          <Animated.View entering={FadeInUp.delay(100).duration(500).easing(Easing.out(Easing.cubic))}>
            <Text style={styles.section}>How to finish</Text>
            <GlassCard radius={24} padding={14}>
              {steps.map((s, i) => (
                <StepRow
                  key={s.id}
                  step={s}
                  index={i}
                  last={i === steps.length - 1}
                  open={open === i}
                  next={i === 0}
                  onToggle={() => {
                    tick();
                    setOpen(open === i ? -1 : i);
                  }}
                />
              ))}
            </GlassCard>
          </Animated.View>

          {/* Jarvis's pick */}
          {ideas.length > 0 && (
            <Animated.View entering={FadeInUp.delay(200).duration(500).easing(Easing.out(Easing.cubic))}>
              <Text style={styles.section}>Jarvis’s pick for today</Text>
              <JarvisPickCard orb={<JarvisOrb size={30} />} ideas={ideas} onUse={useIdea} />
            </Animated.View>
          )}

          {/* Reward */}
          <Animated.View entering={FadeInUp.delay(300).duration(500).easing(Easing.out(Easing.cubic))}>
            <Text style={styles.section}>When you finish</Text>
            <View style={styles.rewards}>
              <GlassCard radius={22} padding={14} style={styles.rewardTile}>
                <View style={styles.rewardIcon}>
                  <Svg width={18} height={18} viewBox="0 0 24 24">
                    <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill={ds.purple} />
                  </Svg>
                </View>
                <Text style={styles.rewardValue}>+{XP} XP</Text>
                <Text style={styles.rewardSub}>Towards your next level</Text>
              </GlassCard>
              <GlassCard radius={22} padding={14} style={styles.rewardTile}>
                <View style={styles.rewardIcon}>
                  <BadgeGlow />
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Circle cx="12" cy="9" r="6" stroke={ds.purple} strokeWidth={2.2} />
                    <Path d="M8.5 14L7 22l5-3 5 3-1.5-8" stroke={ds.purple} strokeWidth={2.2} strokeLinejoin="round" />
                  </Svg>
                </View>
                <Text style={styles.rewardValue}>Momentum</Text>
                <Text style={styles.rewardSub}>A badge for your profile</Text>
              </GlassCard>
            </View>
          </Animated.View>

        </ScrollView>
      </SafeAreaView>

      <FloatingTabBar activeTab="quests" onTabPress={(t) => onNavigateTab?.(t)} />

      <UserProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        onLogout={onLogout}
        initialProfile={userProfile}
        onSaveProfile={onSaveProfile}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },

  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  eyebrow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 24,
    borderRadius: 999,
    backgroundColor: ds.lavender,
    marginBottom: 10,
  },
  eyebrowText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: ds.purple },
  heroTitle: { fontWeight: '800', letterSpacing: -0.7, color: ds.ink },
  accent: { color: ds.purple },
  ring: { width: 70, height: 70, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center' },
  ringXp: { fontSize: 16, fontWeight: '800', color: ds.purple },
  ringLabel: { fontSize: 10, fontWeight: '800', color: ds.text3, marginTop: -2 },
  heroBody: { fontSize: 14.5, lineHeight: 21, color: ds.text2, marginTop: 10 },
  segments: { flexDirection: 'row', gap: 6, marginTop: 14 },
  segment: { flex: 1, height: 6, borderRadius: 3, backgroundColor: ds.lavender },
  segmentsLabel: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 6 },

  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },

  stepRow: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 38 },
  stepCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  stepCircleNext: {
    backgroundColor: ds.purple,
    shadowColor: ds.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  railLine: { flex: 1, width: 2, minHeight: 12, marginVertical: 4, borderRadius: 1, backgroundColor: ds.lavender },
  stepBody: { flex: 1, padding: 12, borderRadius: 18, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  stepBodyHover: { backgroundColor: 'rgba(245, 243, 255, 0.6)' },
  stepBodyOpen: { backgroundColor: 'rgba(245, 243, 255, 0.9)', borderColor: ds.lavender },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepNum: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: ds.text3 },
  nextChip: { paddingHorizontal: 8, height: 20, borderRadius: 999, backgroundColor: ds.purple, justifyContent: 'center' },
  nextChipText: { fontSize: 10.5, fontWeight: '800', color: '#FFFFFF' },
  autoChip: { paddingHorizontal: 8, height: 20, borderRadius: 999, backgroundColor: ds.greenBg, justifyContent: 'center' },
  autoChipText: { fontSize: 10.5, fontWeight: '800', color: ds.greenFill },
  stepTitle: { fontSize: 16, lineHeight: 21, fontWeight: '800', color: ds.ink, marginTop: 4 },
  stepText: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 4 },
  stepAction: { marginTop: 12 },


  rewards: { flexDirection: 'row', gap: 10 },
  rewardTile: { flex: 1 },
  rewardIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  badgeGlow: { position: 'absolute', width: 36, height: 36, borderRadius: 12, backgroundColor: '#C4B5FD' },
  rewardValue: { fontSize: 16, fontWeight: '800', color: ds.ink },
  rewardSub: { fontSize: 12.5, lineHeight: 17, color: ds.text2, marginTop: 2 },

});
