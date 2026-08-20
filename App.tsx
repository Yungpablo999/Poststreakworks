import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from './src/screens/SplashScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { SignInScreen } from './src/screens/SignInScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
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
import { MatchScreen } from './src/screens/MatchScreen';
import { ProMatchScreen } from './src/screens/ProMatchScreen';
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
import { MessagesScreen } from './src/screens/MessagesScreen';
import { ProMessagesScreen } from './src/screens/ProMessagesScreen';
import { CollabIdeaScreen } from './src/screens/CollabIdeaScreen';
import { ProSquadScreen } from './src/screens/ProSquadScreen';
import { AudienceBreakdownScreen } from './src/screens/AudienceBreakdownScreen';
import { PostPerformanceScreen } from './src/screens/PostPerformanceScreen';
import { PlatformGrowthScreen } from './src/screens/PlatformGrowthScreen';
import { EarningsScreen } from './src/screens/EarningsScreen';
import { ProEarningsScreen } from './src/screens/ProEarningsScreen';
import { ProVoiceStudioScreen } from './src/screens/ProVoiceStudioScreen';
import { OpportunityReadinessScreen } from './src/screens/OpportunityReadinessScreen';
import { CreatorPassportScreen } from './src/screens/CreatorPassportScreen';
import { GhostLoadingScreen } from './src/components/GhostLoadingScreen';
import { TabType } from './src/components/FloatingTabBar';
import { UserProfileData } from './src/components/UserProfileModal';

type Screen =
  | 'welcome'
  | 'signup'
  | 'signin'
  | 'reset-password'
  | 'niche'
  | 'platforms'
  | 'complete'
  | 'dashboard'
  | 'mission-detail'
  | 'create'
  | 'match'
  | 'squad'
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
  | 'messages'
  | 'collab-idea'
  | 'jarvis-pro'
  | 'audience-breakdown'
  | 'post-performance'
  | 'platform-growth'
  | 'earnings'
  | 'opportunity-readiness'
  | 'creator-passport'
  | 'voice-studio';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Studio...');

  // Creator Onboarding Data State
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['lifestyle', 'comedy']);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState('One thing I wish I knew before I started creating');
  const [composerIdeaTitle, setComposerIdeaTitle] = useState('One thing I wish I knew before I started creating');
  const [activeMessageThreadId, setActiveMessageThreadId] = useState<string | undefined>(undefined);
  const [userProfile, setUserProfile] = useState<UserProfileData>({
    name: 'Pablo',
    handle: '@pablocreates',
    bio: 'Consistency is my superpower. Building a 100-day creator streak with Jarvis AI.',
    niche: 'Tech & Lifestyle Creator • Lagos',
    avatarId: 'ghost',
    avatarSource: require('./assets/images/jarvis-ghost-clean.png'),
    tier: 'pro',
    streakCount: 47,
    level: 5,
    xp: 3450,
    partnersCount: 12,
    tiktokHandle: '@pablo.creates',
    instagramHandle: '@pablocreates',
    youtubeHandle: 'Pablo Creates',
    niches: ['Lifestyle', 'Tech & AI', 'Storytelling'],
  });
  const [collabPartnerData, setCollabPartnerData] = useState<{
    name: string;
    handle: string;
    niche: string;
    avatar: any;
    planIndex?: number;
  }>({
    name: 'Elena Rostova',
    handle: '@elenacreates',
    niche: 'Tech & Lifestyle, Lagos',
    avatar: require('./assets/images/elena-avatar.jpg'),
    planIndex: 0,
  });

  // Animated page transition handler
  const navigateTo = (nextScreen: Screen, customMessage?: string) => {
    if (nextScreen !== currentScreen) {
      const msg =
        customMessage ||
        (nextScreen === 'collab-idea'
          ? 'Opening Collab Blueprint...'
          : nextScreen === 'messages'
          ? 'Opening Creator Messages...'
          : nextScreen === 'caption'
          ? 'Writing Caption & Hashtags...'
          : nextScreen === 'script'
          ? 'Crafting Video Script...'
          : nextScreen === 'content-angle'
          ? 'Finding Content Angles...'
          : nextScreen === 'composer'
          ? 'Opening Post Composer...'
          : nextScreen === 'idea-detail'
          ? 'Crafting Viral Idea...'
          : nextScreen === 'challenge-detail'
          ? 'Entering Community Challenge'
          : nextScreen === 'mission-detail'
          ? "Entering Today's Mission"
          : nextScreen === 'quests'
          ? 'Entering Quests Hub'
          : nextScreen === 'growth'
          ? 'Opening Growth Analytics'
          : nextScreen === 'jarvis-pro'
          ? 'Entering Jarvis Pro Suite'
          : nextScreen === 'schedule'
          ? 'Loading Content Timeline'
          : nextScreen === 'create'
          ? 'Opening Creator Studio'
          : nextScreen === 'match'
          ? 'Scanning Match Radar'
          : nextScreen === 'dashboard'
          ? 'Syncing Creator Feed'
          : 'Switching screens');
      setLoadingMessage(msg);
      setIsPageLoading(true);
      setTimeout(() => {
        setPreviousScreen(currentScreen);
        setCurrentScreen(nextScreen);
        setTimeout(() => {
          setIsPageLoading(false);
        }, 200);
      }, 550);
    }
  };

  // Welcome Screen actions
  const handleGetStarted = () => {
    navigateTo('signup');
  };

  const handleOpenSignInFromWelcome = () => {
    navigateTo('signin');
  };

  // Sign Up Screen actions (Step 1)
  const handleBackFromSignUp = () => {
    setCurrentScreen('welcome');
  };

  const handleOpenSignInFromSignUp = () => {
    navigateTo('signin');
  };

  const handleSignUpSubmit = (_username: string, _email: string) => {
    // Advance to Step 2: Niche Selection
    navigateTo('niche');
  };

  // Sign In Screen actions
  const handleBackFromSignIn = () => {
    setCurrentScreen(previousScreen === 'signin' ? 'welcome' : previousScreen);
  };

  const handleCreateAccountFromSignIn = () => {
    navigateTo('signup');
  };

  const handleForgotPasswordFromSignIn = () => {
    navigateTo('reset-password');
  };

  const handleSignInSubmit = (_email: string) => {
    // Direct sign in straight to the creator dashboard
    navigateTo('dashboard');
  };

  // Reset Password Screen actions
  const handleBackFromResetPassword = () => {
    setCurrentScreen('signin');
  };

  const handleResetPasswordSuccess = (_email: string) => {
    navigateTo('dashboard');
  };

  // Niche Selection actions (Step 2)
  const handleBackFromNiche = () => {
    setCurrentScreen('signup');
  };

  const handleNicheContinue = (niches: string[]) => {
    setSelectedNiches(niches);
    // Advance to Step 3: Platform Connection
    navigateTo('platforms');
  };

  // Platform Connection actions (Step 3)
  const handleBackFromPlatforms = () => {
    setCurrentScreen('niche');
  };

  const handlePlatformsContinue = (platforms: string[]) => {
    setConnectedPlatforms(platforms);
    // Advance to Step 4: Onboarding Completion
    navigateTo('complete');
  };

  const handlePlatformsSkip = () => {
    // Advance to Step 4: Onboarding Completion with default platforms
    navigateTo('complete');
  };

  // Onboarding Complete actions (Step 4)
  const handleBackFromComplete = () => {
    setCurrentScreen('platforms');
  };

  const handleStartFirstMission = () => {
    // Launch to Mission Detail Page
    navigateTo('mission-detail');
  };

  const handleGoToDashboard = () => {
    // Launch directly to dashboard
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    navigateTo('welcome');
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="dark" />

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
            onForgotPassword={handleForgotPasswordFromSignIn}
            onSubmit={handleSignInSubmit}
          />
        )}

        {currentScreen === 'reset-password' && (
          <ResetPasswordScreen
            onBack={handleBackFromResetPassword}
            onSuccess={handleResetPasswordSuccess}
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
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenEarnings={() => navigateTo('earnings')}
              onOpenQuests={() => navigateTo('quests')}
              onOpenGrowth={() => navigateTo('growth')}
              onOpenMatch={() => navigateTo('match')}
              onOpenCreate={() => navigateTo('create')}
              onOpenVoiceStudio={() => navigateTo('voice-studio')}
              onOpenPostComposer={(ideaTitle) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <DashboardScreen
              onLogout={handleLogout}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenJarvisPro={() => {
                setUserProfile(prev => ({ ...prev, tier: 'pro' }));
              }}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'mission-detail' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProMissionDetailScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenPostComposer={(ideaTitle) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <MissionDetailScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'create' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProCreateScreen
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <CreateScreen
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'schedule' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProScheduleScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenPostComposer={(title) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <ScheduleScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'match' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProMatchScreen
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCollabIdea={(partnerData) => {
                if (partnerData) setCollabPartnerData(partnerData);
                navigateTo('collab-idea');
              }}
              onOpenSquad={() => navigateTo('squad')}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <MatchScreen
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'growth' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProGrowthScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
              onOpenPostPerformance={() => navigateTo('post-performance')}
              onOpenPlatformGrowth={() => navigateTo('platform-growth')}
              onOpenEarnings={() => navigateTo('earnings')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <GrowthScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
              onOpenPostPerformance={() => navigateTo('post-performance')}
              onOpenPlatformGrowth={() => navigateTo('platform-growth')}
              onOpenEarnings={() => navigateTo('earnings')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'jarvis-pro' && (
          <JarvisProScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
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
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenEarnings={() => navigateTo('earnings')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onOpenPassport={() => navigateTo('growth')}
              onOpenOpportunities={() => navigateTo('growth')}
              onSwitchToFree={() => {
                setUserProfile(prev => ({ ...prev, tier: 'free' }));
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                } else if ((tab as string) === 'schedule') {
                  navigateTo('schedule');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <QuestsScreen
              onBackToDashboard={() => navigateTo('dashboard')}
              onLogout={handleLogout}
              onOpenMissionDetail={() => navigateTo('mission-detail')}
              onOpenCommunityChallenge={() => navigateTo('challenge-detail')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenEarnings={() => navigateTo('earnings')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                } else if ((tab as string) === 'schedule') {
                  navigateTo('schedule');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'challenge-detail' && (
          <ChallengeDetailScreen
            onBackToDashboard={() => navigateTo('quests')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'idea-detail' && (
          <IdeaDetailScreen
            ideaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(title) => {
              if (title) setComposerIdeaTitle(title);
              navigateTo('composer');
            }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'composer' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProPostComposerScreen
              ideaTitle={composerIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <PostComposerScreen
              ideaTitle={composerIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'content-angle' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProIdeaStrategyScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseIdea={(title) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <ContentAngleScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                  setActiveMessageThreadId(threadId);
                  navigateTo('messages');
                }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseIdea={(title) => {
                if (title) setComposerIdeaTitle(title);
                navigateTo('composer');
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
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
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <ScriptScreen
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                  setActiveMessageThreadId(threadId);
                  navigateTo('messages');
                }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseAsPost={(scriptData) => {
                if (scriptData.hook) setComposerIdeaTitle(scriptData.hook);
                navigateTo('composer');
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
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
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <CaptionScreen
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenMessages={(threadId?: string) => {
                  setActiveMessageThreadId(threadId);
                  navigateTo('messages');
                }}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onAddToPost={(captionText) => {
                if (captionText) setComposerIdeaTitle(captionText);
                navigateTo('composer');
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

        {currentScreen === 'messages' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProMessagesScreen
              initialConversationId={activeMessageThreadId}
              onBack={() => {
                setActiveMessageThreadId(undefined);
                navigateTo(previousScreen ? previousScreen : 'dashboard');
              }}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreate={() => navigateTo('create')}
              onOpenPostComposer={(ideaTitle) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                navigateTo('composer');
              }}
              onOpenMatch={() => navigateTo('match')}
              onOpenCollabIdea={(partnerData) => {
                if (partnerData) setCollabPartnerData(partnerData);
                navigateTo('collab-idea');
              }}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <MessagesScreen
              initialConversationId={activeMessageThreadId}
              onBack={() => {
                setActiveMessageThreadId(undefined);
                navigateTo(previousScreen ? previousScreen : 'dashboard');
              }}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreate={() => navigateTo('create')}
              onOpenPostComposer={(ideaTitle) => {
                if (ideaTitle) setComposerIdeaTitle(ideaTitle);
                navigateTo('composer');
              }}
              onOpenMatch={() => navigateTo('match')}
              onOpenCollabIdea={(partnerData) => {
                if (partnerData) setCollabPartnerData(partnerData);
                navigateTo('collab-idea');
              }}
              onSwitchToPro={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'pro' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          )
        )}

                
        
        
        
        
        {currentScreen === 'creator-passport' && (
          <CreatorPassportScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'earnings')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenQuests={() => navigateTo('quests')}
            onOpenReadiness={() => navigateTo('opportunity-readiness')}
            onOpenPlatforms={() => navigateTo('platforms')}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'opportunity-readiness' && (
          <OpportunityReadinessScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'earnings')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPlatforms={() => navigateTo('platforms')}
            onOpenCreatorPassport={() => navigateTo('creator-passport')}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'earnings' && (
          (userProfile?.tier === 'pro' || userProfile?.tier === 'founding') ? (
            <ProEarningsScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
              onLogout={handleLogout}
              onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenQuests={() => navigateTo('quests')}
              onOpenPlatforms={() => navigateTo('platforms')}
              onOpenReadiness={() => navigateTo('opportunity-readiness')}
              onOpenCreatorPassport={() => navigateTo('creator-passport')}
              onSwitchToFree={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'free' });
                }
              }}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
            />
          ) : (
            <EarningsScreen
              onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
              onLogout={handleLogout}
              onOpenMessages={() => navigateTo('messages')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => {
                if (userProfile) {
                  setUserProfile({ ...userProfile, tier: 'pro' });
                }
              }}
              onOpenQuests={() => navigateTo('quests')}
              onOpenPlatforms={() => navigateTo('platforms')}
              onOpenReadiness={() => navigateTo('opportunity-readiness')}
              onOpenCreatorPassport={() => navigateTo('creator-passport')}
              onNavigateTab={(tab: TabType) => {
                if (tab === 'home') {
                  navigateTo('dashboard');
                } else if (tab === 'create') {
                  navigateTo('create');
                } else if (tab === 'match') {
                  navigateTo('match');
                } else if (tab === 'quests') {
                  navigateTo('quests');
                } else if (tab === 'growth') {
                  navigateTo('growth');
                }
              }}
              userProfile={userProfile}
              onSaveProfile={(updated) => setUserProfile(updated)}
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
            onOpenMessages={(threadId?: string) => {
              setActiveMessageThreadId(threadId);
              navigateTo('messages');
            }}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              navigateTo('composer');
            }}
            onSwitchToFree={() => {
              if (userProfile) {
                setUserProfile({ ...userProfile, tier: 'free' });
              }
            }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'platform-growth' && (
          <PlatformGrowthScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
            onOpenEarnings={() => navigateTo('earnings')}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'post-performance' && (
          <PostPerformanceScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
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
            onOpenEarnings={() => navigateTo('earnings')}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'audience-breakdown' && (
          <AudienceBreakdownScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onOpenPlatformConnect={() => navigateTo('platforms')}
            onOpenPostPerformance={() => navigateTo('post-performance')}
            onOpenPlatformGrowth={() => navigateTo('platform-growth')}
            onOpenEarnings={() => navigateTo('earnings')}
            onOpenCreate={(prefillTopic) => {
              if (prefillTopic) setComposerIdeaTitle(prefillTopic);
              navigateTo('create');
            }}
            onOpenPostComposer={(prefillTitle) => {
              if (prefillTitle) setComposerIdeaTitle(prefillTitle);
              navigateTo('composer');
            }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'collab-idea' && (
          <CollabIdeaScreen
            partnerName={collabPartnerData.name}
            partnerHandle={collabPartnerData.handle}
            partnerNiche={collabPartnerData.niche}
            partnerAvatar={collabPartnerData.avatar}
            initialPlanIndex={collabPartnerData.planIndex ?? 0}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'messages')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenMessages={(threadId?: string) => {
                setActiveMessageThreadId(threadId);
                navigateTo('messages');
              }}
            onStartCollaboration={(collabData) => {
              if (collabData?.title) setComposerIdeaTitle(collabData.title);
              navigateTo('composer');
            }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

        {currentScreen === 'squad' && (
          <ProSquadScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'match')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenCreate={() => navigateTo('create')}
            onOpenPostComposer={(ideaTitle) => {
              if (ideaTitle) setComposerIdeaTitle(ideaTitle);
              navigateTo('composer');
            }}
            onOpenMatch={() => navigateTo('match')}
            onOpenCollabIdea={(partnerData) => {
              if (partnerData) setCollabPartnerData(partnerData);
              navigateTo('collab-idea');
            }}
            onOpenMessages={(threadId?: string) => {
              setActiveMessageThreadId(threadId || 'conv_squad');
              navigateTo('messages');
            }}
            onNavigateTab={(tab: TabType) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('quests');
              } else if (tab === 'growth') {
                navigateTo('growth');
              }
            }}
            userProfile={userProfile}
            onSaveProfile={(updated) => setUserProfile(updated)}
          />
        )}

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
    backgroundColor: '#FAF8F5',
  },
});
