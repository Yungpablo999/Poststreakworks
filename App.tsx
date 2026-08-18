import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
import { MissionDetailScreen } from './src/screens/MissionDetailScreen';
import { QuestsScreen } from './src/screens/QuestsScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { JarvisProScreen } from './src/screens/JarvisProScreen';
import { GrowthScreen } from './src/screens/GrowthScreen';
import { IdeaDetailScreen } from './src/screens/IdeaDetailScreen';
import { PostComposerScreen } from './src/screens/PostComposerScreen';
import { ContentAngleScreen } from './src/screens/ContentAngleScreen';
import { ScriptScreen } from './src/screens/ScriptScreen';
import { GhostLoadingScreen } from './src/components/GhostLoadingScreen';
import { TabType } from './src/components/FloatingTabBar';

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
  | 'growth'
  | 'quests'
  | 'schedule'
  | 'challenge-detail'
  | 'idea-detail'
  | 'composer'
  | 'content-angle'
  | 'script'
  | 'jarvis-pro';

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

  // Animated page transition handler
  const navigateTo = (nextScreen: Screen, customMessage?: string) => {
    if (nextScreen !== currentScreen) {
      const msg =
        customMessage ||
        (nextScreen === 'script'
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
          <DashboardScreen
            onLogout={handleLogout}
            onStartMission={() => navigateTo('mission-detail')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenSchedule={() => navigateTo('schedule')}
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
          />
        )}

        {currentScreen === 'mission-detail' && (
          <MissionDetailScreen
            onBackToDashboard={() => navigateTo('dashboard')}
            onLogout={handleLogout}
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
          />
        )}

        {currentScreen === 'create' && (
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
          />
        )}

        {currentScreen === 'schedule' && (
          <ScheduleScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'dashboard')}
            onLogout={handleLogout}
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
          />
        )}

        {currentScreen === 'match' && (
          <MatchScreen
            onLogout={handleLogout}
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
          />
        )}

        {currentScreen === 'growth' && (
          <GrowthScreen
            onBackToDashboard={() => navigateTo('dashboard')}
            onLogout={handleLogout}
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
              }
            }}
          />
        )}

        {currentScreen === 'jarvis-pro' && (
          <JarvisProScreen
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
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
          />
        )}

        {currentScreen === 'quests' && (
          <QuestsScreen
            onBackToDashboard={() => navigateTo('dashboard')}
            onLogout={handleLogout}
            onOpenMissionDetail={() => navigateTo('mission-detail')}
            onOpenCommunityChallenge={() => navigateTo('challenge-detail')}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
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
          />
        )}

        {currentScreen === 'challenge-detail' && (
          <ChallengeDetailScreen
            onBackToDashboard={() => navigateTo('quests')}
            onLogout={handleLogout}
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
          />
        )}

        {currentScreen === 'composer' && (
          <PostComposerScreen
            ideaTitle={composerIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
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
          />
        )}

        {currentScreen === 'content-angle' && (
          <ContentAngleScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
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
          />
        )}

        {currentScreen === 'script' && (
          <ScriptScreen
            ideaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
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
