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
import { OnboardingCompleteScreen } from './src/screens/OnboardingCompleteScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';
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
import { ProHookStudioScreen } from './src/screens/ProHookStudioScreen';
import { GhostLoadingScreen } from './src/components/GhostLoadingScreen';
import { ScreenTransitionContainer, ScreenTransitionType } from './src/components/ScreenTransitionContainer';
import { EdgeSwipeBackWrapper } from './src/components/EdgeSwipeBackWrapper';
import { TabType } from './src/components/FloatingTabBar';
import { UserProfileData } from './src/components/UserProfileModal';
import { UserPersona } from './src/components/HeaderDualModePills';

type Screen =
  | 'welcome'
  | 'signup'
  | 'signin'
  | 'verify-code'
  | 'reset-password'
  | 'niche'
  | 'platforms'
  | 'complete'
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
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Studio...');

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

  const handleUseIdea = (title: string, format?: string) => {
    setComposerQuestDraft(null);
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
  const navigateTo = (nextScreen: Screen, customMessage?: string) => {
    if (nextScreen !== 'composer') {
      setComposerQuestDraft(null);
    }
    if (nextScreen === currentScreen) return;

    // AI Generation workflows that genuinely benefit from showing Jarvis AI at work
    const isAiWorkflow =
      Boolean(customMessage) ||
      nextScreen === 'caption' ||
      nextScreen === 'script' ||
      nextScreen === 'content-angle' ||
      nextScreen === 'repurpose';

    if (isAiWorkflow) {
      const msg =
        customMessage ||
        (nextScreen === 'caption'
          ? 'Writing Caption & Hashtags...'
          : nextScreen === 'script'
          ? 'Crafting Video Script...'
          : nextScreen === 'content-angle'
          ? 'Finding Content Angles...'
          : nextScreen === 'repurpose'
          ? 'Formatting Multi-Platform Assets...'
          : 'Jarvis Co-Pilot Processing...');

      setLoadingMessage(msg);
      setIsPageLoading(true);

      setTimeout(() => {
        setPreviousScreen(currentScreen);
        setCurrentScreen(nextScreen);
        setTimeout(() => {
          setIsPageLoading(false);
        }, 150);
      }, 400);
    } else {
      // Instant, snappy native transition for bottom tabs, dashboards, and standard views
      setPreviousScreen(currentScreen);
      setCurrentScreen(nextScreen);
    }
  };

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
    navigateTo('signup');
  };

  const handlePlatformsSkip = () => {
    navigateTo('signup');
  };

  // Sign Up Screen actions (Step 3 of Onboarding - 75%)
  const handleBackFromSignUp = () => {
    setCurrentScreen('platforms');
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
    if (verifyMode === 'signup') {
      navigateTo('complete');
    } else {
      navigateTo('dashboard');
    }
  };

  // Onboarding Complete actions (Step 4 of Onboarding - 100%)
  const handleBackFromComplete = () => {
    setCurrentScreen('signup');
  };

  const handleStartFirstMission = () => {
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    navigateTo('mission-detail');
  };

  const handleGoToDashboard = () => {
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
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
      screen === 'complete' ||
      screen === 'verify-code'
    ) {
      return 'push';
    }
    return 'modal';
  };

  const getBackScreen = (screen: Screen): Screen | null => {
    switch (screen) {
      case 'signup':
        return 'platforms';
      case 'signin':
        return 'welcome';
      case 'verify-code':
        return verifyMode === 'signup' ? 'signup' : 'signin';
      case 'niche':
        return 'welcome';
      case 'platforms':
        return 'niche';
      case 'complete':
        return 'signup';
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

        {currentScreen === 'signup' && (
          <SignUpScreen
            onBack={handleBackFromSignUp}
            onSignIn={handleOpenSignInFromSignUp}
            onSubmit={handleSignUpSubmit}
          />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen
            onBack={handleBackFromSignIn}
            onCreateAccount={handleCreateAccountFromSignIn}
            onSubmit={handleSignInSubmit}
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

        {currentScreen === 'complete' && (
          <OnboardingCompleteScreen
            onBack={handleBackFromComplete}
            onStartMission={handleStartFirstMission}
            onGoToDashboard={handleGoToDashboard}
            selectedNiches={selectedNiches}
            connectedPlatforms={connectedPlatforms}
          />
        )}

        {currentScreen === 'dashboard' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProDashboardScreen
              onLogout={handleLogout}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenQuests={() => navigateTo('quests')}
              onOpenGrowth={() => navigateTo('growth')}
              onOpenCreate={() => navigateTo('create')}
              onOpenVoiceStudio={() => navigateTo('voice-studio')}
              onOpenPostComposer={(ideaTitle) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <DashboardScreen
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
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProMissionDetailScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenPostComposer={(ideaTitle, platform, questDraft, format) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                if (questDraft) setComposerQuestDraft(questDraft);
                if (format) setComposerIdeaFormat(format as any);
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
          ) : (
            <MissionDetailScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenCreateIdea={() => navigateTo('create')}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'create' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProCreateScreen
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenIdeaDetail={(title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('idea-detail');
              }}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onOpenVoiceStudio={() => navigateTo('voice-studio')}
              onOpenHookStudio={() => navigateTo('hook-studio')}
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
                navigateTo('repurpose');
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <CreateScreen
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenIdeaDetail={(title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('idea-detail');
              }}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
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
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProScheduleScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
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
          ) : (
            <ScheduleScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'growth' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProGrowthScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
              onOpenPostPerformance={() => navigateTo('post-performance')}
              onOpenPlatformGrowth={() => navigateTo('platform-growth')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onOpenScript={() => navigateTo('script')}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <GrowthScreen
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
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'jarvis-pro' && (
          <JarvisProScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'quests' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProQuestsScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMissionDetail={() => navigateTo('mission-detail')}
              onOpenCommunityChallenge={() => navigateTo('challenge-detail')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenPostComposer={(title, platform, questDraft, format) => {
                if (title) setComposerIdeaTitle(title);
                if (questDraft) setComposerQuestDraft(questDraft);
                if (format) setComposerIdeaFormat(format as any);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              userPersona={userPersona}
              onTogglePersona={handleTogglePersona}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <QuestsScreen
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
            onLogout={handleLogout}
            onOpenComposer={(idea?: string, platform?: string, questDraft?: any) => {
              if (idea) setComposerIdeaTitle(idea);
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
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProIdeaStrategyScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseIdea={handleUseIdea}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <ContentAngleScreen
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
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProScriptScreen
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenVoiceStudio={(text, title) => {
                if (title) setSelectedIdeaTitle(title);
                navigateTo('voice-studio');
              }}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <ScriptScreen
              ideaTitle={selectedIdeaTitle}
              format={composerIdeaFormat}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseAsPost={(scriptData) => {
                if (scriptData.hook) setComposerIdeaTitle(scriptData.hook);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'caption' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProCaptionScreen
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onAddToPost={(captionText, hashtags) => {
                if (captionText) setComposerIdeaTitle(captionText);
                navigateTo('composer');
              }}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          ) : (
            <CaptionScreen
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onAddToPost={(captionText) => {
                if (captionText) setComposerIdeaTitle(captionText);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
            />
          )
        )}

        {currentScreen === 'repurpose' && (
          <ProRepurposeScreen
            userProfile={userProfile}
            initialIdeaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onNavigate={(screen) => navigateTo(screen as Screen)}
          />
        )}

        {currentScreen === 'voice-studio' && (
          <ProVoiceStudioScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(prefillTitle, attachedAudio) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
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
          <ProHookStudioScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(prefillTitle, prefillPlatform) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              navigateTo('composer');
            }}
            onOpenScript={(title) => {
              if (title) setSelectedIdeaTitle(title);
              navigateTo('script');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}

        {currentScreen === 'platform-growth' && (
          <PlatformGrowthScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
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
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
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
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPlatformConnect={() => navigateTo('platforms')}
            onOpenPostPerformance={() => navigateTo('post-performance')}
            onOpenPlatformGrowth={() => navigateTo('platform-growth')}
            onOpenCreate={(prefillTopic) => {
              if (prefillTopic) setComposerIdeaTitle(prefillTopic);
              navigateTo('create');
            }}
            onOpenPostComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
          />
        )}
          </ScreenTransitionContainer>
        </EdgeSwipeBackWrapper>

        {showSplash && (
          <SplashScreen onFinish={() => setShowSplash(false)} />
        )}

        {/* Global Animated Ghost Page Transition Loader */}
        <GhostLoadingScreen visible={isPageLoading} message={loadingMessage} />
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
