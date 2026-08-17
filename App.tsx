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
import { CreateScreen } from './src/screens/CreateScreen';
import { MatchScreen } from './src/screens/MatchScreen';
import { GhostLoadingScreen } from './src/components/GhostLoadingScreen';

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
  | 'match';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [previousScreen, setPreviousScreen] = useState<Screen>('welcome');
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Loading Studio...');

  // Creator Onboarding Data State
  const [selectedNiches, setSelectedNiches] = useState<string[]>(['lifestyle', 'comedy']);
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube']);

  // Animated page transition handler
  const navigateTo = (nextScreen: Screen, customMessage?: string) => {
    if (nextScreen !== currentScreen) {
      const msg =
        customMessage ||
        (nextScreen === 'create'
          ? 'Opening Creator Studio'
          : nextScreen === 'match'
          ? 'Scanning Match Radar'
          : nextScreen === 'dashboard'
          ? 'Syncing Creator Feed'
          : nextScreen === 'mission-detail'
          ? 'Loading Quest Engine'
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
            onNavigateTab={(tab) => {
              if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('mission-detail');
              }
            }}
          />
        )}

        {currentScreen === 'mission-detail' && (
          <MissionDetailScreen
            onBackToDashboard={() => navigateTo('dashboard')}
            onLogout={handleLogout}
            onNavigateTab={(tab) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'match') {
                navigateTo('match');
              }
            }}
          />
        )}

        {currentScreen === 'create' && (
          <CreateScreen
            onLogout={handleLogout}
            onNavigateTab={(tab) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'match') {
                navigateTo('match');
              } else if (tab === 'quests') {
                navigateTo('mission-detail');
              }
            }}
          />
        )}

        {currentScreen === 'match' && (
          <MatchScreen
            onLogout={handleLogout}
            onNavigateTab={(tab) => {
              if (tab === 'home') {
                navigateTo('dashboard');
              } else if (tab === 'create') {
                navigateTo('create');
              } else if (tab === 'quests') {
                navigateTo('mission-detail');
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
