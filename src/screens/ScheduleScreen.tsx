import React, { useState, useSyncExternalStore } from 'react';
import { Linking, Platform, Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Reanimated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { TourTarget, useTourScroll } from '../components/tour/GhostTour';
import { Text } from '../components/ui/AppText';
import { FitLines } from '../components/ui/FitLines';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { JarvisOrb } from '../components/JarvisOrb';
import { CalendarSheet } from '../components/home/CalendarSheet';
import { TodayCard, WeekStrip, PostRow, EmptyDay, PlatformMixCard, BestTimeCard } from '../components/schedule/ScheduleBlocks';
import { getWeekSchedule, subscribeToCheckIns, type CalendarPost } from '../data';
import { loadCalendarWeek } from '../backend/calendar';
import { loadBestTime } from '../backend/growth';
import { useAsync } from '../hooks/useAsync';
import { ds } from '../theme/colors';
import { sPadding } from '../utils/responsive';

// Schedule: this week at a glance, day by day, from the creator's real calendar (what they planned
// in PostStreak and what they posted on their connected accounts). Posts go out on their own only
// on platforms that allow it; everywhere else PostStreak reminds them at the time and they confirm
// it went out (the composer explains this when they plan a post).

interface ScheduleScreenProps {
  onBack?: () => void;
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenCreateIdea?: () => void;
  onOpenPostComposer?: (prefillTitle?: string, prefillPlatform?: string) => void;
  userProfile: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  tier?: 'free' | 'pro';
}

export const ScheduleScreen: React.FC<ScheduleScreenProps> = ({
  onNavigateTab,
  onLogout,
  onOpenJarvisPro,
  onOpenCreateIdea,
  onOpenPostComposer,
  userProfile,
  onSaveProfile,
  tier = 'free',
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const [showProfile, setShowProfile] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // This week's real posts: read when the page opens, and whenever the calendar's data changes
  const loaded = useAsync(() => loadCalendarWeek().then((ok) => (ok ? true : null)), []);
  useSyncExternalStore(subscribeToCheckIns, () => getWeekSchedule().plannedCount, () => 0);
  const week = getWeekSchedule();
  const bestTime = useAsync(loadBestTime, []).data;

  const [dayIndex, setDayIndex] = useState(week.todayIndex);
  const selectedDay = week.days[dayIndex];
  const dayLabel = selectedDay.isToday ? 'today' : new Date(selectedDay.key + 'T12:00:00').toLocaleDateString('en-GB', { weekday: 'long' });

  const openComposer = (title?: string, platform?: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onOpenPostComposer?.(title, platform);
  };
  const openPost = (post: CalendarPost) => {
    if (post.status === 'posted' && post.url) {
      void Linking.openURL(post.url).catch(() => undefined);
      return;
    }
    if (post.status !== 'posted') openComposer(post.title, post.platform);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader backgroundColor="transparent" onOpenJarvisPro={onOpenJarvisPro} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />

        <ScrollView {...tourScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
          {/* HEADLINE — same two-line structure on every screen size */}
          <Reanimated.View entering={FadeInUp.duration(500)} style={styles.headline}>
            <FitLines
              lines={['Your posts,', <Text key="p" style={styles.headlineAccent}>planned clearly</Text>]}
              textStyle={styles.headlineText}
              maxFontSize={34}
              align="left"
              accessibilityLabel="Your posts, planned clearly"
            />
          </Reanimated.View>

          {/* 1. TODAY */}
          <Reanimated.View entering={FadeInUp.delay(100).duration(550)}>
            <TourTarget id="schedule-card">
              <TodayCard today={week.days[week.todayIndex]} onSchedule={() => openComposer()} onIdea={() => (onOpenCreateIdea ? onOpenCreateIdea() : onNavigateTab?.('create'))} />
            </TourTarget>
          </Reanimated.View>

          {/* 2. THIS WEEK */}
          <Reanimated.View entering={FadeInUp.delay(200).duration(550)}>
            <View style={styles.weekHeader}>
              <Text style={[styles.sectionLabel, styles.flex]}>This week</Text>
              <Pressable onPress={() => setCalendarOpen(true)} hitSlop={8} style={styles.calLink} accessibilityRole="button">
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                  <Rect x="3" y="4" width="18" height="17" rx="3" stroke={ds.purple} strokeWidth={2.2} />
                  <Path d="M16 2v4M8 2v4M3 10h18" stroke={ds.purple} strokeWidth={2.2} strokeLinecap="round" />
                </Svg>
                <Text style={styles.calLinkText}>Calendar</Text>
              </Pressable>
            </View>
            <Text style={styles.sectionSub}>
              {loaded.loading && week.plannedCount === 0
                ? 'Loading your week…'
                : loaded.failed && week.plannedCount === 0
                  ? 'Couldn’t load your week. Check your connection.'
                  : week.plannedCount === 0
                    ? 'Nothing planned yet'
                    : `${week.plannedCount} planned${week.draftCount ? ` · ${week.draftCount} draft${week.draftCount === 1 ? '' : 's'}` : ''}${
                        week.openDays ? ` · ${week.openDays} open day${week.openDays === 1 ? '' : 's'}` : ''
                      }`}
            </Text>
            <WeekStrip days={week.days} selected={dayIndex} onSelect={setDayIndex} />
          </Reanimated.View>

          {/* 3. SELECTED DAY */}
          <Reanimated.View key={selectedDay.key} entering={FadeIn.duration(260)} style={styles.dayList}>
            <Text style={styles.dayTitle}>{selectedDay.isToday ? "Today's posts" : `${dayLabel}'s posts`}</Text>
            {selectedDay.posts.length === 0 ? (
              <EmptyDay label={dayLabel} isPast={selectedDay.isPast} onPlan={() => openComposer()} />
            ) : (
              selectedDay.posts.map((p, i) => (
                <Reanimated.View key={p.id} entering={FadeInUp.delay(60 * i).duration(300)}>
                  <PostRow post={p} onPress={() => openPost(p)} />
                </Reanimated.View>
              ))
            )}
          </Reanimated.View>

          {/* 4. PLATFORM MIX (only once there's something planned) */}
          {week.platformMix.length > 0 && (
            <Reanimated.View entering={FadeInUp.delay(300).duration(550)} style={styles.section}>
              <PlatformMixCard mix={week.platformMix} />
            </Reanimated.View>
          )}

          {/* 5. JARVIS BEST TIME: only once their posts say when they do best */}
          {bestTime && (
            <Reanimated.View entering={FadeInUp.delay(400).duration(550)} style={styles.section}>
              <BestTimeCard orb={<JarvisOrb size={32} />} time={bestTime.time} platform={bestTime.platformName} onUse={() => openComposer()} />
            </Reanimated.View>
          )}

          {/* Free plans: a quiet Pro note about what Pro adds */}
          {tier !== 'pro' && (
            <Pressable onPress={onOpenJarvisPro} hitSlop={6} style={styles.proNote} accessibilityRole="button">
              <Text style={styles.proNoteText}>
                Free plans let you plan and track posts. <Text style={styles.proNoteLink}>See what Pro adds.</Text>
              </Text>
            </Pressable>
          )}

          {/* Bottom Space for Floating Tab Bar */}
          <View style={{ height: 110 }} />
        </ScrollView>

        <CalendarSheet visible={calendarOpen} onClose={() => setCalendarOpen(false)} onPlanPost={() => openComposer()} />

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab="create" onTabPress={(tab) => onNavigateTab?.(tab)} />

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: ds.bg },
  container: { flex: 1, width: '100%' },
  flex: { flex: 1 },
  scrollContent: { paddingHorizontal: sPadding(18), paddingTop: 8 },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  headlineAccent: { color: ds.purple },
  sectionLabel: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  sectionSub: { fontSize: 13, fontWeight: '600', color: ds.text3, marginTop: 2, marginBottom: 12 },
  weekHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  calLink: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 30, borderRadius: 999, backgroundColor: ds.lavender },
  calLinkText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  dayList: { marginTop: 16, gap: 10 },
  dayTitle: { fontSize: 15, fontWeight: '800', color: ds.ink },
  section: { marginTop: 24 },
  proNote: { marginTop: 24, padding: 14, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.6)' },
  proNoteText: { fontSize: 13, lineHeight: 19, color: ds.text2, textAlign: 'center' },
  proNoteLink: { fontWeight: '800', color: ds.purple },
});
