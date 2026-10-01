import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import { useFonts } from 'expo-font';
import { fontAssets } from './src/theme/fonts';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { VerifyCodeScreen } from './src/screens/VerifyCodeScreen';
import { NicheSelectionScreen } from './src/screens/NicheSelectionScreen';
import { PlatformConnectScreen } from './src/screens/PlatformConnectScreen';
import { PlanPreviewScreen } from './src/screens/PlanPreviewScreen';
import type { FilmStyle, IdeaGoal, StudioVideo } from './src/data';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RepurposeScreen } from './src/screens/RepurposeScreen';
import { ProDashboardScreen } from './src/screens/ProDashboardScreen';
import { MissionDetailScreen } from './src/screens/MissionDetailScreen';
import { ProMissionDetailScreen } from './src/screens/ProMissionDetailScreen';
import { QuestsScreen } from './src/screens/QuestsScreen';
import { ProQuestsScreen } from './src/screens/ProQuestsScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { ProCreateScreen } from './src/screens/ProCreateScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { ProScheduleScreen } from './src/screens/ProScheduleScreen';
import { JarvisProScreen } from './src/screens/JarvisProScreen';
import { GrowthScreen } from './src/screens/GrowthScreen';
import { ProGrowthScreen } from './src/screens/ProGrowthScreen';
import { IdeaDetailScreen } from './src/screens/IdeaDetailScreen';
import { PostComposerScreen } from './src/screens/PostComposerScreen';
import { ProPostComposerScreen } from './src/screens/ProPostComposerScreen';
import { ProIdeaStrategyScreen } from './src/screens/ProIdeaStrategyScreen';
import { ProScriptScreen } from './src/screens/ProScriptScreen';
import { ProCaptionScreen } from './src/screens/ProCaptionScreen';
import { ProRepurposeScreen } from './src/screens/ProRepurposeScreen';
import { ContentAngleScreen } from './src/screens/ContentAngleScreen';
import { ScriptScreen } from './src/screens/ScriptScreen';
import { CaptionScreen } from './src/screens/CaptionScreen';
import { AudienceBreakdownScreen } from './src/screens/AudienceBreakdownScreen';
import { PostPerformanceScreen } from './src/screens/PostPerformanceScreen';
import { PlatformGrowthScreen } from './src/screens/PlatformGrowthScreen';
import { ProVoiceStudioScreen } from './src/screens/ProVoiceStudioScreen';
import { VoiceStudioScreen } from './src/screens/VoiceStudioScreen';
import { ProHookStudioScreen } from './src/screens/ProHookStudioScreen';
import { HookStudioScreen } from './src/screens/HookStudioScreen';
import { ScreenTransitionContainer, ScreenTransitionType } from './src/components/ScreenTransitionContainer';
import { EdgeSwipeBackWrapper } from './src/components/EdgeSwipeBackWrapper';
import { TabType } from './src/components/FloatingTabBar';
import { UserProfileData, UserProfileModal } from './src/components/UserProfileModal';
import { setNotificationHandler } from './src/components/notifications/NotificationsSheet';
import { UserPersona } from './src/components/HeaderDualModePills';

type Screen =
  | 'welcome'
  | 'signup'
  | 'signin'
  | 'verify-code'
  | 'reset-password'
  | 'niche'
  | 'platforms'
  | 'plan'
  | 'dashboard'
  | 'mission-detail'
  | 'create'
  | 'growth'
  | 'quests'
  | 'schedule'
  | 'challenge-detail'
  | 'idea-detail'
  | 'composer'
  | 'content-angle'
  | 'script'
  | 'caption'
  | 'repurpose'
  | 'jarvis-pro'
  | 'audience-breakdown'
  | 'post-performance'
  | 'platform-growth'
  | 'voice-studio'
  | 'hook-studio';

export default function App() {
  // Brand fonts (Plus Jakarta Sans + Playfair Display italic for "Earn.").
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');

  // Lock horizontal shift/pan on web/mobile browsers to keep layout fixed and centralized
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.style.overflowX = 'hidden';
      document.body.style.overflowX = 'hidden';
      document.body.style.width = '100%';
      document.body.style.maxWidth = '100vw';
      const root = document.getElementById('root');
      if (root) {
        root.style.overflowX = 'hidden';
        root.style.width = '100%';
        root.style.maxWidth = '100%';
      }
    }
  }, []);

  // Creator Onboarding Data State
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [verifyMode, setVerifyMode] = useState<'signup' | 'signin'>('signup');
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState('One thing I wish I knew before I started creating');
  const [composerIdeaTitle, setComposerIdeaTitle] = useState('One thing I wish I knew before I started creating');
  // Goal picked on the Ideas page shapes the composer's caption
  // Also carries a ready caption + tags from the Caption writer
  // Platform to pre-select in the composer (e.g. from Repurpose)
  const [composerIdeaPlatform, setComposerIdeaPlatform] = useState<string | undefined>(undefined);
  const [composerFilmStyle, setComposerFilmStyle] = useState<FilmStyle | undefined>(undefined);
  // A post sent from Growth into the Repurpose video studio
  const [studioVideo, setStudioVideo] = useState<StudioVideo | undefined>(undefined);
  // A script sent from Script into Voice Studio
  const [voiceScript, setVoiceScript] = useState<string | undefined>(undefined);
  const [composerIdeaGoal, setComposerIdeaGoal] = useState<{ goal?: IdeaGoal; hook?: string; caption?: string; tags?: string[] } | null>(null);
  const [composerIdeaFormat, setComposerIdeaFormat] = useState<'short_video' | 'carousel' | 'image' | 'long_video' | 'text' | undefined>(undefined);
  const [composerQuestDraft, setComposerQuestDraft] = useState<{
    title: string;
    hook: string;
    story: string;
    lesson: string;
    cta: string;
    badgeLabel?: string;
    requirements?: string[];
    xpReward?: number;
  } | null>(null);
  const [composerAttachedAudio, setComposerAttachedAudio] = useState<{
    title: string;
    voiceName: string;
    duration: string;
    speed: string;
  } | null>(null);

  const handleUseIdea = (title: string, format?: string, goal?: IdeaGoal, hook?: string) => {
    setComposerQuestDraft(null);
    setComposerIdeaGoal(goal ? { goal, hook } : null);
    setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
    setComposerAttachedAudio(null);
    if (title) setComposerIdeaTitle(title);
    if (format) {
      const f = format.toLowerCase();
      if (f.includes('carousel')) {
        setComposerIdeaFormat('carousel');
      } else if (f.includes('image') || f.includes('visual') || f.includes('photo')) {
        setComposerIdeaFormat('image');
      } else if (f.includes('long') || f.includes('youtube') || f.includes('tutorial')) {
        setComposerIdeaFormat('long_video');
      } else if (f.includes('text') || f.includes('thread')) {
        setComposerIdeaFormat('text');
      } else {
        setComposerIdeaFormat('short_video');
      }
    } else {
      setComposerIdeaFormat(undefined);
    }
    navigateTo('composer');
  };
  const [userPersona, setUserPersona] = useState<UserPersona>('new');

  const handleTogglePersona = () => {
    setUserPersona((prev) => {
      const nextPersona = prev === 'returning' ? 'new' : 'returning';
      setUserProfile((profile) => ({
        ...profile,
        userPersona: nextPersona,
        streakCount: nextPersona === 'new' ? 1 : 17,
        level: nextPersona === 'new' ? 1 : 5,
        xp: nextPersona === 'new' ? 0 : 3450,
        postsCount: nextPersona === 'new' ? 0 : 24,
        connectedPlatforms: nextPersona === 'new' ? [] : ['tiktok', 'instagram', 'youtube'],
      }));
      return nextPersona;
    });
  };

  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: 'Pablo',
    handle: '@pablocreates',
    bio: 'Consistency is my superpower. Building my creator streak with Jarvis AI.',
    niche: 'Tech & Lifestyle Creator • Lagos',
    tier: 'free',
    userPersona: 'new',
    streakCount: 1,
    level: 1,
    xp: 0,
    postsCount: 0,
    connectedPlatforms: [],
    niches: ['Lifestyle', 'Tech & AI', 'Storytelling'],
  });

  // Smart Navigation Handler: Instant (0ms) for bottom tabs & regular screens; Smart AI loader for generation workflows
  // Every page opens straight away. (There used to be a timed "Jarvis is
  // working..." screen before Ideas, Caption, Script and Repurpose; it wasn't
  // real loading, so it only slowed things down. Pages show Jarvis thinking
  // in place when they actually generate something.)
  const navigateTo = (nextScreen: Screen) => {
    if (nextScreen !== 'composer') {
      setComposerQuestDraft(null);
    }
    if (nextScreen === currentScreen) return;
    setPreviousScreen(currentScreen);
    setCurrentScreen(nextScreen);
  };

  // Notifications that involve doing something open the right place
  const [showAccountsFromNote, setShowAccountsFromNote] = useState(false);
  React.useEffect(() => {
    setNotificationHandler((target) => {
      if (target === 'accounts') setShowAccountsFromNote(true);
      else if (target === 'home') navigateTo('dashboard');
      else if (target === 'challenge') navigateTo('challenge-detail');
      else navigateTo(target);
    });
    return () => setNotificationHandler(null);
  });

  const handleTabNavigation = (tab: TabType) => {
    if (tab === 'home') {
      navigateTo('dashboard');
    } else {
      navigateTo(tab);
    }
  };

  // Welcome Screen actions
  const handleGetStarted = () => {
    navigateTo('niche');
  };

  const handleOpenSignInFromWelcome = () => {
    navigateTo('signin');
  };

  // Niche Selection actions (Step 1 of Onboarding - 25%)
  const handleBackFromNiche = () => {
    setCurrentScreen('welcome');
  };

  const handleNicheContinue = (niches: string[]) => {
    setSelectedNiches(niches);
    navigateTo('platforms');
  };

  // Platform Connection actions (Step 2 of Onboarding - 50%)
  const handleBackFromPlatforms = () => {
    setCurrentScreen('niche');
  };

  const handlePlatformsContinue = (platforms: string[]) => {
    setConnectedPlatforms(platforms);
    navigateTo('plan');
  };

  // "Your plan" (value before sign-up): keep the chosen idea for their first post
  const handleBackFromPlan = () => {
    setCurrentScreen('platforms');
  };

  const handlePlanContinue = (idea: { title: string }) => {
    setSelectedIdeaTitle(idea.title);
    setComposerIdeaTitle(idea.title);
    setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
    navigateTo('signup');
  };

  const handlePlatformsSkip = () => {
    navigateTo('signup');
  };

  // Sign Up Screen actions (Step 3 of Onboarding - 75%)
  const handleBackFromSignUp = () => {
    setCurrentScreen('plan');
  };

  const handleOpenSignInFromSignUp = () => {
    navigateTo('signin');
  };

  const handleSignUpSubmit = (_username: string, _email: string) => {
    setAuthUsername(_username);
    setAuthEmail(_email);
    setVerifyMode('signup');
    setUserProfile(prev => ({ ...prev, name: _username || prev.name, tier: 'free' }));
    navigateTo('verify-code');
  };

  // One-tap Apple / Google sign-up (mock): the provider has already verified the
  // person, so skip the email code and go straight to Home
  const handleSocialSignUp = (_provider: 'apple' | 'google') => {
    setVerifyMode('signup');
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    navigateTo('dashboard');
  };

  // Sign In Screen actions
  const handleBackFromSignIn = () => {
    setCurrentScreen(previousScreen === 'signin' ? 'welcome' : previousScreen);
  };

  const handleCreateAccountFromSignIn = () => {
    navigateTo('signup');
  };

  const handleSignInSubmit = (_email: string) => {
    setAuthEmail(_email);
    setVerifyMode('signin');
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    navigateTo('verify-code');
  };

  // Verify Code Screen actions
  const handleBackFromVerifyCode = () => {
    if (verifyMode === 'signup') {
      setCurrentScreen('signup');
    } else {
      setCurrentScreen('signin');
    }
  };

  const handleEditEmailFromVerifyCode = () => {
    if (verifyMode === 'signup') {
      setCurrentScreen('signup');
    } else {
      setCurrentScreen('signin');
    }
  };

  const handleVerifyCodeSuccess = (_email: string) => {
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    // Sign-up and sign-in both land on Home; Home's day-0 welcome greets new creators
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    navigateTo('welcome');
  };

  const getTransitionType = (screen: Screen): ScreenTransitionType => {
    if (
      screen === 'dashboard' ||
      screen === 'quests' ||
      screen === 'growth' ||
      screen === 'create' ||
      screen === 'schedule'
    ) {
      return 'tab';
    }
    if (
      screen === 'welcome' ||
      screen === 'signup' ||
      screen === 'signin' ||
      screen === 'niche' ||
      screen === 'platforms' ||
      screen === 'plan' ||
      screen === 'verify-code'
    ) {
      return 'push';
    }
    return 'modal';
  };

  const getBackScreen = (screen: Screen): Screen | null => {
    switch (screen) {
      case 'signup':
        return 'plan';
      case 'plan':
        return 'platforms';
      case 'signin':
        return 'welcome';
      case 'verify-code':
        return verifyMode === 'signup' ? 'signup' : 'signin';
      case 'niche':
        return 'welcome';
      case 'platforms':
        return 'niche';
      case 'mission-detail':
        return 'dashboard';
      case 'challenge-detail':
        return 'quests';
      case 'idea-detail':
        return 'create';
      case 'composer':
        return previousScreen && previousScreen !== 'composer' ? previousScreen : 'create';
      case 'content-angle':
        return 'create';
      case 'script':
        return 'create';
      case 'caption':
        return 'create';
      case 'repurpose':
        return 'create';
      case 'jarvis-pro':
        return 'dashboard';
      case 'audience-breakdown':
        return 'growth';
      case 'post-performance':
        return 'growth';
      case 'platform-growth':
        return 'growth';
      case 'voice-studio':
        return 'create';
      case 'hook-studio':
        return 'create';
      case 'schedule':
        return 'dashboard';
      default:
        return null;
    }
  };

  // Hold on the brand background for the split second fonts take to load,
  // so text never flashes in the system font. On error, fall back gracefully.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.container}>
        <StatusBar style="dark" />

        <EdgeSwipeBackWrapper
          enabled={Boolean(getBackScreen(currentScreen))}
          onSwipeBack={() => {
            const backTarget = getBackScreen(currentScreen);
            if (backTarget) {
              navigateTo(backTarget);
            }
          }}
        >
          <ScreenTransitionContainer
            screenKey={currentScreen}
            previousScreenKey={previousScreen}
            transitionType={getTransitionType(currentScreen)}
          >
          {currentScreen === 'welcome' && (
            <WelcomeScreen
              onGetStarted={handleGetStarted}
              onSignIn={handleOpenSignInFromWelcome}
            />
          )}

        {currentScreen === 'plan' && (
          <PlanPreviewScreen
            niches={selectedNiches}
            platforms={connectedPlatforms}
            onBack={handleBackFromPlan}
            onContinue={handlePlanContinue}
          />
        )}

        {currentScreen === 'signup' && (
          <SignUpScreen
            onBack={handleBackFromSignUp}
            onSignIn={handleOpenSignInFromSignUp}
            onSubmit={handleSignUpSubmit}
            onSocialSignUp={handleSocialSignUp}
            savedIdeaTitle={selectedIdeaTitle}
          />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen
            onBack={handleBackFromSignIn}
            onCreateAccount={handleCreateAccountFromSignIn}
            onSubmit={handleSignInSubmit}
            onSocialSignIn={() => {
              setUserProfile(prev => ({ ...prev, tier: 'free' }));
              navigateTo('dashboard');
            }}
          />
        )}

        {currentScreen === 'verify-code' && (
          <VerifyCodeScreen
            mode={verifyMode}
            email={authEmail}
            username={authUsername}
            onBack={handleBackFromVerifyCode}
            onEditEmail={handleEditEmailFromVerifyCode}
            onSuccess={handleVerifyCodeSuccess}
          />
        )}

        {currentScreen === 'niche' && (
          <NicheSelectionScreen
            onBack={handleBackFromNiche}
            onContinue={handleNicheContinue}
          />
        )}

        {currentScreen === 'platforms' && (
          <PlatformConnectScreen
            onBack={handleBackFromPlatforms}
            onContinue={handlePlatformsContinue}
            onSkipLater={handlePlatformsSkip}
          />
        )}


        {currentScreen === 'dashboard' && (
          (
            <DashboardScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              onOpenVoiceStudio={() => {
                setVoiceScript(undefined);
                navigateTo('voice-studio');
              }}
              onOpenHookStudio={() => navigateTo('hook-studio')}
              onLogout={handleLogout}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenQuest={() => navigateTo('quests')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onSwitchToPro={() => {
                setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              }}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onOpenSchedule={() => navigateTo('schedule')}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'mission-detail' && (
          (
            <MissionDetailScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'quests')}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onSwitchToPro={() => setUserProfile(prev => ({ ...prev, tier: 'pro' }))}
              onLogout={handleLogout}
              onOpenCreateIdea={() => navigateTo('create')}
              onOpenScript={(title) => {
                setSelectedIdeaTitle(title);
                navigateTo('script');
              }}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'create' && (
          (
            <CreateScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onOpenVoiceStudio={() => {
                setVoiceScript(undefined);
                navigateTo('voice-studio');
              }}
              onOpenHookStudio={() => navigateTo('hook-studio')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenIdeaDetail={(title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('idea-detail');
              }}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onOpenScript={(title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('script');
              }}
              onOpenCaption={(title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('caption');
              }}
              onOpenRepurpose={(title?: string) => {
                if (title) setSelectedIdeaTitle(title);
                setStudioVideo(undefined);
                navigateTo('repurpose');
              }}
              onNavigateTab={handleTabNavigation}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSwitchToPro={() => {
                setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'schedule' && (
          (
            <ScheduleScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToPro={() => setUserProfile(prev => ({ ...prev, tier: 'pro' }))}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'growth' && (
          (
            <GrowthScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onSwitchToPro={() => {
                setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              }}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
              onOpenPostPerformance={() => navigateTo('post-performance')}
              onOpenPlatformGrowth={() => navigateTo('platform-growth')}
              onNavigateTab={handleTabNavigation}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenIdeas={() => navigateTo('content-angle')}
              onOpenChallenge={() => navigateTo('challenge-detail')}
              onMakeMoreLikeThis={(video) => {
                setStudioVideo(video);
                setSelectedIdeaTitle(video.name);
                navigateTo('repurpose');
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'jarvis-pro' && (
          <JarvisProScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onUpgraded={() => {
              setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              navigateTo('dashboard');
            }}
            onLogout={handleLogout}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'quests' && (
          (
            <QuestsScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onOpenVoiceStudio={() => {
                setVoiceScript(undefined);
                navigateTo('voice-studio');
              }}
              onOpenHookStudio={() => navigateTo('hook-studio')}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMissionDetail={() => navigateTo('mission-detail')}
              onOpenCommunityChallenge={() => navigateTo('challenge-detail')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onSwitchToPro={() => {
                setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              }}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'challenge-detail' && (
          <ChallengeDetailScreen
            onBackToDashboard={() => navigateTo('quests')}
            userPersona={userPersona}
            onTogglePersona={handleTogglePersona}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onSwitchToPro={() => setUserProfile(prev => ({ ...prev, tier: 'pro' }))}
            onLogout={handleLogout}
            onOpenComposer={(idea?: string, platform?: string, questDraft?: any) => {
              if (idea) setComposerIdeaTitle(idea);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              if (questDraft) {
                setComposerQuestDraft(questDraft);
              } else {
                setComposerQuestDraft(null);
              }
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'idea-detail' && (
          <IdeaDetailScreen
            ideaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(title) => {
              if (title) setComposerIdeaTitle(title);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              setComposerQuestDraft(null);
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'composer' && (
          <PostComposerScreen
            ideaTitle={composerIdeaTitle}
            ideaGoal={composerIdeaGoal}
            initialPlatform={composerIdeaPlatform}
            initialFilmStyle={composerFilmStyle}
            questDraft={composerQuestDraft}
            initialFormat={composerIdeaFormat}
            attachedAudio={composerAttachedAudio}
            onClearAttachedAudio={() => setComposerAttachedAudio(null)}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'content-angle' && (
          (
            <ContentAngleScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseIdea={handleUseIdea}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'script' && (
          (
            <ScriptScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              onOpenVoiceStudio={(script) => {
                setVoiceScript(script);
                navigateTo('voice-studio');
              }}
              ideaTitle={selectedIdeaTitle}
              format={composerIdeaFormat}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseAsPost={(scriptData) => {
                if (scriptData.hook) setComposerIdeaTitle(scriptData.hook);
                setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'caption' && (
          (
            <CaptionScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onAddToPost={(captionText, hashtags, topic) => {
                // The caption goes into the composer's caption box (not the idea title)
                if (topic) setComposerIdeaTitle(topic);
                setComposerIdeaGoal({
                  caption: captionText,
                  tags: (hashtags || '').split(/\s+/).filter((t) => t.startsWith('#')),
                });
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'repurpose' &&
          ((
            // Free and Pro share the glass Repurpose studio (Pro: unlimited + plan the order)
            <RepurposeScreen
              tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
              onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
              ideaTitle={selectedIdeaTitle}
              userProfile={userProfile}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSwitchToPro={() => setUserProfile(prev => ({ ...prev, tier: 'pro' }))}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onNavigateTab={handleTabNavigation}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              initialVideo={studioVideo}
              onFilmIdea={(title, style) => {
                handleUseIdea(title, 'short video');
                setComposerFilmStyle(style);
              }}
              onUseVersion={(caption, platform, idea) => {
                setComposerIdeaTitle(idea);
                setComposerIdeaGoal({ caption });
                setComposerIdeaPlatform(platform);
                setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
            />
          ))}

        {currentScreen === 'voice-studio' && (
          <VoiceStudioScreen
            initialScript={voiceScript}
            userPersona={userPersona}
            onTogglePersona={handleTogglePersona}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(prefillTitle, attachedAudio) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              if (attachedAudio) setComposerAttachedAudio(attachedAudio);
              navigateTo('composer');
            }}
            onSwitchToFree={() => {
              if (userProfile) {
                setUserProfile({ ...userProfile, tier: 'free' });
              }
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'hook-studio' && (
          <HookStudioScreen
            ideaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onSwitchToFree={() => setUserProfile(prev => ({ ...prev, tier: 'free' }))}
            onUseHook={(title, hook, style) => {
              setComposerQuestDraft(null);
              setComposerIdeaTitle(title);
              setComposerIdeaGoal({ hook });
              setComposerIdeaPlatform(undefined);
              setComposerFilmStyle(style);
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'platform-growth' && (
          <PlatformGrowthScreen
            tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onOpenRepurpose={() => {
              setStudioVideo(undefined);
              navigateTo('repurpose');
            }}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              navigateTo('composer');
            }}
            onOpenScript={(prefillTitle) => {
              if (prefillTitle) setSelectedIdeaTitle(prefillTitle);
              navigateTo('script');
            }}
            onOpenContentAngle={() => navigateTo('content-angle')}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'post-performance' && (
          <PostPerformanceScreen
            tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onMakeMoreLikeThis={(video) => {
              setStudioVideo(video);
              setSelectedIdeaTitle(video.name);
              navigateTo('repurpose');
            }}
            onReuseOpening={(title, hook) => {
              setComposerQuestDraft(null);
              setComposerIdeaTitle(title);
              setComposerIdeaGoal({ hook });
              setComposerIdeaPlatform('tiktok');
              setComposerFilmStyle('talking');
              navigateTo('composer');
            }}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              navigateTo('composer');
            }}
            onOpenScript={(prefillTitle) => {
              if (prefillTitle) setSelectedIdeaTitle(prefillTitle);
              navigateTo('script');
            }}
            onOpenContentAngle={() => navigateTo('content-angle')}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'audience-breakdown' && (
          <AudienceBreakdownScreen
            tier={userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free'}
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPlatformConnect={() => navigateTo('platforms')}
            onOpenPostPerformance={() => navigateTo('post-performance')}
            onOpenPlatformGrowth={() => navigateTo('platform-growth')}
            onOpenCreate={(prefillTopic) => {
              if (prefillTopic) setComposerIdeaTitle(prefillTopic);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              navigateTo('create');
            }}
            onOpenPostComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              setComposerIdeaGoal(null);
                setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}
          </ScreenTransitionContainer>
        </EdgeSwipeBackWrapper>

        <UserProfileModal
          visible={showAccountsFromNote}
          initialSubTab="accounts"
          onClose={() => setShowAccountsFromNote(false)}
          onLogout={handleLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
        />

        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}

        {/* Global Animated Ghost Page Transition Loader */}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#FAF8F5',
  },
});
