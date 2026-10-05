import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import Reanimated, { FadeInUp } from 'react-native-reanimated';
import { useTourScroll } from '../components/tour/GhostTour';
import { IdeasStrip } from '../components/web/IdeasStrip';
import { useBreakpoint, useWebChrome } from '../hooks/useBreakpoint';
import { HomeDayZero } from '../components/home/HomeDayZero';
import { HomeReturning } from '../components/home/HomeReturning';
import { ProUpsellCard } from '../components/home/ProUpsellCard';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { loadHome } from '../backend/home';

// Home. Creators who haven't started get the first-day Home (no numbers, one clear next step);
// creators who post get theirs, with the figures read from their own account (HomeReturning).
// Which one is decided by the server (userProfile.userPersona), never by the app.

interface DashboardScreenProps {
  onLogout?: () => void;
  onStartMission?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenSchedule?: () => void;
  /** Opens the connected accounts. */
  onOpenAccounts?: () => void;
  userProfile: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onOpenHookStudio?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onLogout,
  onStartMission,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenSchedule,
  onOpenAccounts,
  userProfile,
  onSaveProfile,
  onOpenHookStudio,
}) => {
  // Lets Ghost's tour scroll this page
  const tourScroll = useTourScroll();
  const isNewUser = userProfile.userPersona === 'new';
  const pro = userProfile.tier === 'pro' || userProfile.tier === 'founding';
  // Desktop shows the logo and the Pro card in the side menu
  const onDesktop = useWebChrome();
  // Two-column extras (ideas row) only where there's room
  const wideHome = useBreakpoint() === 'desktop';
  const [showProfile, setShowProfile] = useState(false);

  // Read the figures each time Home opens (it is rebuilt every time the creator comes back to it)
  useEffect(() => {
    if (!isNewUser) void loadHome();
  }, [isNewUser]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <GlassBackdrop />
        <FreeAppHeader
          backgroundColor="transparent"
          showMascot={false}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenProfile={() => setShowProfile(true)}
          userProfile={userProfile}
        />

        <ScrollView {...tourScroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} bounces>
          {isNewUser ? (
            <HomeDayZero
              firstName={userProfile.name.split(' ')[0] || undefined}
              onPlanFirstPost={() => onNavigateTab?.('create')}
              onOpenSchedule={onOpenSchedule}
              onOpenGrowth={() => onNavigateTab?.('growth')}
              onOpenQuests={() => onNavigateTab?.('quests')}
            />
          ) : (
            <HomeReturning
              firstName={userProfile.name.split(' ')[0] || undefined}
              onPlanPost={() => onNavigateTab?.('create')}
              onOpenSchedule={onOpenSchedule}
              onOpenGrowth={() => onNavigateTab?.('growth')}
              onOpenAccounts={onOpenAccounts}
              onOpenQuests={() => onNavigateTab?.('quests')}
              onStartQuest={() => onStartMission?.()}
              pro={pro}
              onOpenHookStudio={onOpenHookStudio}
              onOpenCreate={() => onNavigateTab?.('create')}
            />
          )}

          {/* Desktop web: ready-to-start ideas across the page */}
          {wideHome && (
            <IdeasStrip niches={userProfile.niches} />
          )}

          {/* Unlock Jarvis Pro (gold = Pro only; members don't see it).
              On desktop the side menu already offers Pro, so it isn't repeated here. */}
          {!pro && !onDesktop && (
            <Reanimated.View entering={FadeInUp.delay(360).duration(550)} style={styles.proUpsell}>
              <ProUpsellCard onUpgrade={() => onOpenJarvisPro?.()} />
            </Reanimated.View>
          )}
        </ScrollView>

        <FloatingTabBar activeTab="home" onTabPress={(tab) => onNavigateTab?.(tab)} />

        <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7F5F0' },
  container: { flex: 1, width: '100%' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 120 },
  proUpsell: { marginTop: 14 },
});
