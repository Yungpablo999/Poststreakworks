import React, { useState } from 'react';
import { View, StyleSheet, Platform, useWindowDimensions } from 'react-native';
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
import { setNotificationHandler, type NoteTarget } from './src/components/notifications/NotificationsSheet';
import { AppSidebar, type SidebarId } from './src/components/web/AppSidebar';
import { WebAuthHeader } from './src/components/web/WebAuthHeader';
import { WebTopBar } from './src/components/web/WebTopBar';
import { TodayRail } from './src/components/web/TodayRail';
import { StudioRail, type StudioKind } from './src/components/web/StudioRail';
import { setComposerOpener } from './src/components/web/webActions';
import { activity as mascotActivity, react as mascotReact, setBaseline as setMascotBaseline, tipOnce, type Emotion } from './src/mascot/mascot';
import { preloadMascot } from './src/components/mascot/LiveMascot';
import { JarvisChatPanel, JarvisLauncher } from './src/components/jarvis/JarvisChat';
import { closeJarvis, setGhostHands, setJarvisContext, type GhostPlace } from './src/jarvis/chat';
import { IS_WEB_APP, useBreakpoint, useWebSidebar } from './src/hooks/useBreakpoint';
import { MobileWebBar } from './src/components/web/MobileWebBar';
import { GlassBackdrop } from './src/components/glass/GlassBackdrop';
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
  // Web: the website's buttons open the app at the right place
  // (?start=signup → the first sign-up step, ?start=signin → sign in),
  // and skip the splash since the visitor has just seen the brand.
  const webStart: Screen | null = (() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
    const start = new URLSearchParams(window.location.search).get('start');
    // The web app has no welcome page (the website is the front door):
    // without ?start it opens on sign-in
    return start === 'signup' ? 'niche' : 'signin';
  })();
  const [showSplash, setShowSplash] = useState(!webStart);
  const [currentScreen, setCurrentScreen] = useState<Screen>(webStart ?? 'welcome');
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
  // The profile sheet opened from the desktop side menu
  const [showProfileFromMenu, setShowProfileFromMenu] = useState(false);
  React.useEffect(() => {
    const openPlace = (target: NoteTarget | GhostPlace) => {
      if (target === 'accounts') setShowAccountsFromNote(true);
      else if (target === 'home') navigateTo('dashboard');
      else if (target === 'challenge') navigateTo('challenge-detail');
      else navigateTo(target);
    };
    setNotificationHandler(openPlace);
    // Jarvis's chat sends Ghost to the same places, or to start a post
    setGhostHands({ open: openPlace, compose: (title) => openBlankComposer(title) });
    return () => {
      setNotificationHandler(null);
      setGhostHands(null);
    };
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

  // New here? Start sign-up from step 1 (topics), like Get started does
  const handleCreateAccountFromSignIn = () => {
    navigateTo('niche');
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
    navigateTo(Platform.OS === 'web' ? 'signin' : 'welcome');
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
        return Platform.OS === 'web' ? null : 'welcome';
      case 'verify-code':
        return verifyMode === 'signup' ? 'signup' : 'signin';
      case 'niche':
        return Platform.OS === 'web' ? null : 'welcome';
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

  // Desktop: the side menu replaces the bottom tab bar once you're in the app
  const breakpoint = useBreakpoint();
  const SIDEBAR_FOR: Partial<Record<Screen, SidebarId>> = {
    dashboard: 'home', 'mission-detail': 'home', 'jarvis-pro': 'home',
    create: 'create', 'idea-detail': 'create', composer: 'create', 'content-angle': 'create', script: 'create', caption: 'create',
    quests: 'quests', 'challenge-detail': 'quests',
    growth: 'growth', 'audience-breakdown': 'growth', 'post-performance': 'growth', 'platform-growth': 'growth',
    schedule: 'schedule', repurpose: 'repurpose', 'hook-studio': 'hook-studio', 'voice-studio': 'voice-studio',
  };
  const SCREEN_FOR: Record<SidebarId, Screen> = {
    home: 'dashboard', create: 'create', quests: 'quests', growth: 'growth',
    schedule: 'schedule', repurpose: 'repurpose', 'hook-studio': 'hook-studio', 'voice-studio': 'voice-studio',
  };
  const inApp = currentScreen in SIDEBAR_FOR;
  // Side menu: desktop, and tablets in a browser. Phones in a browser get the
  // slim web header with a menu drawer instead of the app's tab bar.
  const webSidebar = useWebSidebar();
  const showSidebar = webSidebar && inApp;
  const showMobileBar = IS_WEB_APP && inApp && !webSidebar;
  // Desktop web: sign-up and sign-in get a website header across the top
  const AUTH_STEP: Partial<Record<Screen, number | null>> = {
    niche: 0, platforms: 1, plan: 2, signup: 3,
    'verify-code': verifyMode === 'signup' ? 4 : null,
    signin: null, 'reset-password': null,
  };
  const showAuthHeader = (IS_WEB_APP || breakpoint === 'desktop') && currentScreen in AUTH_STEP;
  const authStep = AUTH_STEP[currentScreen] ?? null;
  const signingUp = authStep !== null;
  const authBack = getBackScreen(currentScreen);

  // Desktop web app: a top bar on every signed-in page, and the Today panel
  // on the right of the main pages when the window is wide enough
  const { width: windowW } = useWindowDimensions();
  const MAIN_PAGES: Screen[] = ['dashboard', 'create', 'quests', 'growth', 'schedule', 'repurpose', 'hook-studio', 'voice-studio'];
  // Every signed-in page except the studios (they have their own panel) gets the Today panel
  const RAIL_PAGES: Screen[] = [
    'dashboard', 'create', 'quests', 'growth', 'schedule',
    'composer', 'idea-detail', 'content-angle', 'script', 'caption', 'mission-detail', 'challenge-detail',
    'jarvis-pro', 'audience-breakdown', 'post-performance', 'platform-growth',
  ];
  const wideEnough = windowW >= 1360;
  const showRail = showSidebar && RAIL_PAGES.includes(currentScreen) && wideEnough;
  const STUDIO_FOR: Partial<Record<Screen, StudioKind>> = { repurpose: 'repurpose', 'hook-studio': 'hook', 'voice-studio': 'voice' };
  const studioRail = showSidebar && wideEnough ? STUDIO_FOR[currentScreen] : undefined;
  const PAGE_TITLE: Partial<Record<Screen, string>> = {
    composer: 'New post', 'idea-detail': 'Idea', 'content-angle': 'Ideas', script: 'Script', caption: 'Caption',
    'mission-detail': 'Today’s quest', 'challenge-detail': 'Weekly challenge', 'jarvis-pro': 'Jarvis Pro',
    'audience-breakdown': 'Your audience', 'post-performance': 'Post performance', 'platform-growth': 'Platform growth',
  };
  const innerBack = MAIN_PAGES.includes(currentScreen) ? null : getBackScreen(currentScreen);
  const desktopTier: 'free' | 'pro' = userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free';
  const desktopPersona: 'new' | 'returning' = (userPersona || userProfile?.userPersona) === 'returning' ? 'returning' : 'new';
  const openBlankComposer = (title?: string) => {
    setComposerQuestDraft(null);
    setComposerIdeaGoal(null);
    setComposerIdeaPlatform(undefined);
    setComposerFilmStyle(undefined);
    setComposerIdeaFormat(undefined);
    // A blank post still starts from a friendly idea Jarvis can reshape
    setComposerIdeaTitle(title || 'One thing I wish I knew before I started creating');
    navigateTo('composer');
  };
  setComposerOpener(openBlankComposer);

  // The side menu (desktop/tablet), also shown in the phone menu drawer
  const renderMenu = (close?: () => void) => (
    <AppSidebar
      fill={!!close}
      active={SIDEBAR_FOR[currentScreen] ?? null}
      profile={userProfile}
      onNavigate={(id) => { close?.(); navigateTo(SCREEN_FOR[id]); }}
      onOpenProfile={() => { close?.(); setShowProfileFromMenu(true); }}
      onOpenPro={() => { close?.(); navigateTo('jarvis-pro'); }}
      persona={desktopPersona}
      onToggleTier={() => setUserProfile((prev) => ({ ...prev, tier: prev.tier === 'pro' || prev.tier === 'founding' ? 'free' : 'pro' }))}
      onTogglePersona={handleTogglePersona}
    />
  );

  // The mascot's resting mood follows where you are, and it says hello when you
  // arrive (welcome back for returning creators). Never guilt, only warmth.
  const MASCOT_MOOD: Partial<Record<Screen, Emotion>> = {
    dashboard: 'calm', create: 'idea', 'idea-detail': 'idea', 'content-angle': 'thinking',
    composer: 'working', script: 'working', caption: 'working',
    quests: 'determined', 'mission-detail': 'determined', 'challenge-detail': 'determined',
    growth: 'happy', 'audience-breakdown': 'happy', 'post-performance': 'love', 'platform-growth': 'happy',
    schedule: 'calm', repurpose: 'idea', 'hook-studio': 'idea', 'voice-studio': 'happy', 'jarvis-pro': 'cool',
  };
  // Jarvis chat: the button shows on every signed-in page on wide screens, and
  // on the main pages on phones (inner pages have their own bottom buttons).
  // Not where the right panel already has its Ask Jarvis card (no doubles).
  const showJarvisButton = inApp && !showRail && (webSidebar || MAIN_PAGES.includes(currentScreen));
  const phoneTabBar = !IS_WEB_APP && !webSidebar;
  const jarvisBottom = (initialWindowMetrics?.insets.bottom ?? 0) + (phoneTabBar ? 104 : 20);
  React.useEffect(() => {
    setJarvisContext({ persona: desktopPersona, niches: selectedNiches.length ? selectedNiches : userProfile?.niches ?? [], platforms: connectedPlatforms });
  });
  React.useEffect(() => {
    if (!inApp) closeJarvis();
  }, [inApp]);
  const greeted = React.useRef(false);
  // The first time you open a page, the mascot points out what it's for
  const MASCOT_TIPS: Partial<Record<Screen, string>> = {
    create: 'Pick an idea you like, or ask Jarvis for a fresh one.',
    quests: 'Quests are small goals. Finish one to earn a badge!',
    growth: 'This is how your posts are doing. I’ll point out what works.',
    schedule: 'Plan your posts here and I’ll remind you when it’s time.',
    repurpose: 'Turn one video into posts for every platform.',
    'hook-studio': 'A strong first line keeps people watching. Let’s find yours.',
    'voice-studio': 'Teach me how you talk so everything sounds like you.',
  };
  React.useEffect(() => {
    preloadMascot();
    // Any activity keeps the mascot awake; leave the app alone and it naps
    mascotActivity();
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const wake = () => mascotActivity();
    const events = ['pointerdown', 'keydown', 'wheel'] as const;
    events.forEach((e) => document.addEventListener(e, wake, { passive: true }));
    return () => events.forEach((e) => document.removeEventListener(e, wake));
  }, []);
  React.useEffect(() => {
    const mood = MASCOT_MOOD[currentScreen];
    if (mood) setMascotBaseline(mood);
    const tip = MASCOT_TIPS[currentScreen];
    if (tip) tipOnce(currentScreen, tip);
    if (currentScreen === 'dashboard' && !greeted.current) {
      greeted.current = true;
      const returning = (userPersona || userProfile?.userPersona) === 'returning';
      setTimeout(() => mascotReact(returning ? 'welcomeBack' : 'hello'), 700);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScreen]);

  // Hold on the brand background for the split second fonts take to load,
  // so text never flashes in the system font. On error, fall back gracefully.
  if (!fontsLoaded && !fontError) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.container} onStartShouldSetResponderCapture={() => { if (Platform.OS !== 'web') mascotActivity(); return false; }}>
        <StatusBar style="dark" />

        <View style={showSidebar ? styles.desktopRow : styles.fill}>
          {showSidebar && renderMenu()}
          <View style={styles.fill}>
            {showAuthHeader && (
              <WebAuthHeader
                step={authStep}
                onBack={authBack ? () => navigateTo(authBack) : undefined}
                switchLabel={signingUp ? 'Already have an account?' : 'New here?'}
                switchAction={signingUp ? 'Sign in' : 'Create an account'}
                onSwitch={() => navigateTo(signingUp ? 'signin' : 'niche')}
              />
            )}
            {/* Tablet: the page sits in a centred column over the brand glows.
                Desktop: the page fills the space beside the side menu, under a
                top bar, with the Today panel on the right of the main pages. */}
            {inApp && breakpoint !== 'phone' && <GlassBackdrop />}
            {showSidebar && (
              <WebTopBar
                profile={userProfile}
                persona={desktopPersona}
                tier={desktopTier}
                title={innerBack ? PAGE_TITLE[currentScreen] : undefined}
                onBack={innerBack ? () => navigateTo(innerBack) : undefined}
                onNewPost={currentScreen === 'composer' ? undefined : () => openBlankComposer()}
              />
            )}
            {showMobileBar && (
              <MobileWebBar
                persona={desktopPersona}
                tier={desktopTier}
                title={innerBack ? PAGE_TITLE[currentScreen] : undefined}
                onBack={innerBack ? () => navigateTo(innerBack) : undefined}
                onNewPost={currentScreen === 'composer' ? undefined : () => openBlankComposer()}
                menu={(close) => renderMenu(close)}
              />
            )}
            <View style={showSidebar ? styles.desktopRow : styles.fill}>
            <View style={inApp && breakpoint === 'tablet' && !showSidebar ? [styles.column, { maxWidth: 720 }] : styles.fill}>
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
            onBack={Platform.OS === 'web' ? undefined : handleBackFromSignIn}
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
            onBack={Platform.OS === 'web' ? undefined : handleBackFromNiche}
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
            </View>
            {studioRail && <StudioRail kind={studioRail} persona={desktopPersona} tier={desktopTier} />}
            {showRail && (
              <TodayRail
                persona={desktopPersona}
                onUseIdea={(title) => openBlankComposer(title)}
                onPlan={() => navigateTo('schedule')}
                onOpenChallenge={() => navigateTo('challenge-detail')}
              />
            )}
            </View>
          </View>
        </View>

        <UserProfileModal
          visible={showAccountsFromNote}
          initialSubTab="accounts"
          onClose={() => setShowAccountsFromNote(false)}
          onLogout={handleLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
        />

        <UserProfileModal
          visible={showProfileFromMenu}
          onClose={() => setShowProfileFromMenu(false)}
          onLogout={handleLogout}
          initialProfile={userProfile}
          onSaveProfile={(updated) => setUserProfile(prev => ({ ...prev, ...updated, tier: updated.tier || prev.tier || 'free' }))}
        />

        {/* Ask Jarvis from anywhere in the app; Ghost does the jobs */}
        {showJarvisButton && <JarvisLauncher compact={breakpoint === 'phone'} bottom={jarvisBottom} />}
        {inApp && <JarvisChatPanel />}

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
  fill: { flex: 1 },
  column: { flex: 1, width: '100%', alignSelf: 'center' },
  desktopRow: { flex: 1, flexDirection: 'row' },
});
