import React, { useState } from 'react';
import { View, StyleSheet, Platform, Linking, AppState, useWindowDimensions } from 'react-native';
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
import { MissionDetailScreen } from './src/screens/MissionDetailScreen';
import { QuestsScreen } from './src/screens/QuestsScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { JarvisProScreen } from './src/screens/JarvisProScreen';
import { GrowthScreen } from './src/screens/GrowthScreen';
import { IdeaDetailScreen } from './src/screens/IdeaDetailScreen';
import { PostComposerScreen } from './src/screens/PostComposerScreen';
import { ContentAngleScreen } from './src/screens/ContentAngleScreen';
import { ScriptScreen } from './src/screens/ScriptScreen';
import { CaptionScreen } from './src/screens/CaptionScreen';
import { AudienceBreakdownScreen } from './src/screens/AudienceBreakdownScreen';
import { PostPerformanceScreen } from './src/screens/PostPerformanceScreen';
import { PlatformGrowthScreen } from './src/screens/PlatformGrowthScreen';
import { VoiceStudioScreen } from './src/screens/VoiceStudioScreen';
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
import { GhostTour } from './src/components/tour/GhostTour';
import { setTourNavigator, startTour } from './src/tour/tour';
import { closeJarvis, resetJarvis, setGhostHands, setJarvisContext, type GhostPlace } from './src/jarvis/chat';
import { IS_WEB_APP, useBreakpoint, useWebSidebar } from './src/hooks/useBreakpoint';
import { MobileWebBar } from './src/components/web/MobileWebBar';
import { GlassBackdrop } from './src/components/glass/GlassBackdrop';
import { UserPersona } from './src/components/HeaderDualModePills';
import { BrandToast } from './src/components/BrandToast';
import { BackendBootScreen } from './src/screens/BackendBootScreen';
// The backend connection: inert unless the app is given the backend's address (src/config/backend.ts).
import { BACKEND } from './src/config/backend';
import {
  getSessionState,
  handleAuthLink,
  initSession,
  onSessionLost,
  sendEmailCode,
  signInWithProvider,
  signOut,
  verifyEmailCode,
} from './src/backend/session';
import {
  applyBootstrap,
  clearAccountData,
  connectBackend,
  connectionsPatch,
  isDataLoaded,
  loadBootstrap,
  profileFromBootstrap,
  rememberOnboarding,
  saveOnboarding,
  saveProfile,
  syncTimezone,
  takeOnboarding,
} from './src/backend/sync';
import {
  appReturnLink,
  clearTikTokReturn,
  completeTikTokConnect,
  getAccounts,
  parseTikTokLink,
  readTikTokReturn,
  startedInPhoneApp,
  subscribeToAccounts,
  type TikTokReturn,
} from './src/backend/accounts';
import { notify, useNotice } from './src/backend/notice';

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

// The sample creator the app shows when it isn't connected to a backend.
const SAMPLE_PROFILE: UserProfileData = {
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
};

// Connected to the backend, nothing of the sample creator shows: this is what the
// app holds before sign-in and after sign-out, until the creator's own profile loads.
const BLANK_PROFILE: UserProfileData = {
  name: '',
  handle: '',
  bio: '',
  niche: '',
  tier: 'free',
  userPersona: 'new',
  streakCount: 0,
  level: 1,
  xp: 0,
  postsCount: 0,
  connectedPlatforms: [],
  niches: [],
};

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
  // Brand-new sign-ups (free) get Ghost's tour when they first reach Home.
  // On web, ?tour=1 shows it any time (to preview it).
  const justSignedUp = React.useRef(
    Platform.OS === 'web' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tour') === '1'
  );
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
    // A signed-in account has one real history; the sample "returning" view is only for the preview build
    if (BACKEND.enabled) return;
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

  const [userProfile, setUserProfileRaw] = useState<UserProfileData>(BACKEND.enabled ? BLANK_PROFILE : SAMPLE_PROFILE);
  // Every place in the app that edits the profile goes through this. Connected to the
  // backend, the plan (tier) and the New/Returning view are the server's to decide, so
  // no screen can change them locally (the many "switch to Pro" handlers become no-ops).
  const setUserProfile: typeof setUserProfileRaw = (action) =>
    setUserProfileRaw((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return BACKEND.enabled ? { ...next, tier: prev.tier, userPersona: prev.userPersona } : next;
    });

  // ─── Backend state ────────────────────────────────────────────────────────
  // Whether we're still restoring the saved sign-in at launch (a holding page shows meanwhile)
  const [booting, setBooting] = useState(BACKEND.enabled);
  const [bootMessage, setBootMessage] = useState('One moment…');
  // Sending a code / why it couldn't be sent, for the sign-up and sign-in forms
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Phone creators approve TikTok in a browser; this page then hands them back to the app
  const [phoneHandoff, setPhoneHandoff] = useState<TikTokReturn | null>(null);
  const notice = useNotice();
  // What the account holds of the editable profile fields, to save only real changes
  const savedProfile = React.useRef<UserProfileData | null>(null);
  // The sign-in in progress, kept in refs so async handlers always see the latest values
  const authRef = React.useRef({ email: '', username: '', niches: [] as string[], signingUp: false });
  const enteringApp = React.useRef<Promise<boolean> | null>(null);
  // Supabase sends one code per address per minute. Going back and forth between the form and the
  // code page shouldn't hit that limit: a code sent under a minute ago still works, so don't send another.
  const lastCodeSent = React.useRef<{ email: string; at: number; signingUp: boolean } | null>(null);
  const sendCode = async (email: string, signingUp: boolean, force = false) => {
    const last = lastCodeSent.current;
    if (!force && last && last.signingUp === signingUp && last.email.toLowerCase() === email.toLowerCase() && Date.now() - last.at < 55_000) {
      return { ok: true } as const;
    }
    const sent = await sendEmailCode(email, signingUp);
    if (sent.ok) lastCodeSent.current = { email, at: Date.now(), signingUp };
    return sent;
  };

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
    setAuthError(null);
    setPreviousScreen(currentScreen);
    setCurrentScreen(nextScreen);
  };

  // Notifications that involve doing something open the right place
  const [showAccountsFromNote, setShowAccountsFromNote] = useState(false);
  // The profile sheet opened from the desktop side menu
  const [showProfileFromMenu, setShowProfileFromMenu] = useState(false);

  // ─── Backend: signing in, loading the creator's account, TikTok ─────────────
  // None of this runs unless the app was given the backend's address (src/config/backend.ts).

  // Loads the signed-in creator's account into the app (profile, drafts, saved hooks,
  // check-ins, connected accounts…). Resolves false if it couldn't be loaded.
  const enterInFlight = React.useRef<Promise<boolean> | null>(null);
  const enterApp = (opts: { newAccount?: boolean; niches?: string[] } = {}): Promise<boolean> => {
    if (enterInFlight.current) return enterInFlight.current;
    const run = (async () => {
      try {
        const res = await loadBootstrap();
        if (!res.ok) return false;
        let b = res.data;
        if (opts.newAccount && !b.profile.name && b.profile.niches.length === 0) {
          // First time in: keep what they picked while signing up
          const picked = opts.niches ?? authRef.current.niches;
          await saveOnboarding({ displayName: authRef.current.username || b.profile.email.split('@')[0], niches: picked });
          const again = await loadBootstrap();
          if (again.ok) b = again.data;
        }
        applyBootstrap(b);
        // The account is the whole truth: start from a blank profile so nothing of a previous creator or the sample one survives
        const profile = profileFromBootstrap(b, BLANK_PROFILE, authRef.current.username);
        savedProfile.current = profile;
        setUserProfileRaw(profile);
        setUserPersona('new');
        void syncTimezone(b);
        // Ghost's welcome tour is once per account
        justSignedUp.current = !b.tour.done;
        return true;
      } catch (err) {
        // An unexpected reply from the server must not strand the creator on a spinner
        console.warn('Could not load the account', err);
        return false;
      }
    })().finally(() => {
      enterInFlight.current = null;
    });
    enterInFlight.current = run;
    return run;
  };

  // TikTok has sent the creator back (web: this page load; phone: an app link): finish the connection
  const finishTikTok = async (ret: TikTokReturn) => {
    if (ret.error || !ret.code || !ret.state) {
      notify('TikTok wasn’t connected. You can try again any time.');
      return;
    }
    const r = await completeTikTokConnect(ret.code, ret.state);
    if (r.ok) {
      notify(r.name ? `TikTok connected: ${r.name}` : 'TikTok connected');
      setShowAccountsFromNote(true); // shows the account that just connected
    } else {
      notify(r.message);
    }
  };

  // Launch: restore the saved sign-in and the creator's account, and finish a TikTok round trip if one is landing.
  // App links that arrive while this runs (a phone opened by TikTok's "allowed") wait on `bootDone`.
  const bootGate = React.useRef<{ done: Promise<void>; finish: () => void } | null>(null);
  if (!bootGate.current) {
    let finish: () => void = () => {};
    const done = new Promise<void>((resolve) => {
      finish = resolve;
    });
    bootGate.current = { done, finish };
  }
  React.useEffect(() => {
    if (!BACKEND.enabled) return;
    let alive = true;
    (async () => {
      connectBackend();
      const ret = readTikTokReturn();
      if (ret && startedInPhoneApp(ret)) {
        // Approved in a phone browser: this page only hands the creator back to the app
        setPhoneHandoff(ret);
        try {
          window.location.replace(appReturnLink(ret));
        } catch {
          // the page's "Open PostStreak" button does the same
        }
        return;
      }
      await initSession();
      if (getSessionState().status === 'signedIn') {
        setBootMessage(ret ? 'Connecting your TikTok…' : 'Signing you in…');
        const remembered = takeOnboarding(); // set when they signed up with Google / Apple on the web
        const loaded = await enterApp({ newAccount: remembered !== null, niches: remembered?.niches });
        if (!alive) return;
        if (!loaded) notify('We couldn’t load your account. Check your connection.');
        setCurrentScreen('dashboard');
        if (ret) {
          clearTikTokReturn(); // so a refresh can't replay the one-time code
          await finishTikTok(ret);
        }
      } else if (ret) {
        clearTikTokReturn();
        notify('Sign in, then connect TikTok again.');
      }
    })().finally(() => {
      if (alive) setBooting(false);
      bootGate.current?.finish();
    });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signed out (here, or from another tab): forget the last creator's data and go back to sign-in
  React.useEffect(() => {
    if (!BACKEND.enabled) return;
    return onSessionLost(() => {
      clearAccountData();
      savedProfile.current = null;
      setUserProfileRaw(BLANK_PROFILE);
      setSelectedNiches([]);
      setConnectedPlatforms([]);
      resetJarvis();
      closeJarvis();
      setShowAccountsFromNote(false);
      setShowProfileFromMenu(false);
      setCurrentScreen(Platform.OS === 'web' ? 'signin' : 'welcome');
    });
  }, []);

  // A real connection changed (TikTok connected, disconnected, needs reconnecting): update the profile's list
  React.useEffect(() => {
    if (!BACKEND.enabled) return;
    return subscribeToAccounts(() => setUserProfileRaw((prev) => ({ ...prev, ...connectionsPatch(getAccounts()) })));
  }, []);

  // Edits to the profile (name, @handle, topics, bio) are saved to the account a moment after they're made
  const nichesKey = userProfile.niches.join('|');
  React.useEffect(() => {
    const saved = savedProfile.current;
    if (!BACKEND.enabled || !saved || getSessionState().status !== 'signedIn') return;
    const same =
      saved.name === userProfile.name && saved.handle === userProfile.handle && saved.bio === userProfile.bio &&
      saved.niche === userProfile.niche && saved.niches.join('|') === nichesKey;
    if (same) return;
    const next = userProfile;
    const timer = setTimeout(async () => {
      const problem = await saveProfile(next, saved);
      const res = await loadBootstrap(); // the account is the truth either way
      if (res.ok) {
        const fresh = profileFromBootstrap(res.data, BLANK_PROFILE);
        savedProfile.current = fresh;
        setUserProfileRaw((prev) => ({ ...prev, name: fresh.name, handle: fresh.handle, bio: fresh.bio, niche: fresh.niche, niches: fresh.niches }));
      }
      if (problem) notify(problem);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile.name, userProfile.handle, userProfile.bio, userProfile.niche, nichesKey]);

  // Came back online / back to the app and the account never loaded: try again
  React.useEffect(() => {
    if (!BACKEND.enabled) return;
    const retry = () => {
      if (getSessionState().status === 'signedIn' && !isDataLoaded()) void enterApp();
    };
    if (Platform.OS === 'web') {
      window.addEventListener('focus', retry);
      window.addEventListener('online', retry);
      return () => {
        window.removeEventListener('focus', retry);
        window.removeEventListener('online', retry);
      };
    }
    const sub = AppState.addEventListener('change', (s) => s === 'active' && retry());
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phone: links back into the app — TikTok's "allowed" (poststreak://tiktok?…) and Google / Apple sign-in
  React.useEffect(() => {
    if (!BACKEND.enabled || Platform.OS === 'web') return;
    const handle = async (url: string | null) => {
      if (!url) return;
      await bootGate.current?.done; // the saved sign-in is back before we act on a link
      if (await handleAuthLink(url)) {
        if (getSessionState().status === 'signedIn') {
          const loaded = await enterApp({ newAccount: authRef.current.signingUp });
          if (!loaded) notify('We couldn’t load your account. Check your connection.');
          setCurrentScreen('dashboard');
        }
        return;
      }
      const ret = parseTikTokLink(url);
      if (ret) await finishTikTok(ret);
    };
    void Linking.getInitialURL().then(handle);
    const sub = Linking.addEventListener('url', (e) => void handle(e.url));
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const openPlace = (target: NoteTarget | GhostPlace) => {
      if (target === 'accounts') setShowAccountsFromNote(true);
      else if (target === 'home') navigateTo('dashboard');
      else if (target === 'challenge') navigateTo('challenge-detail');
      else navigateTo(target);
    };
    setNotificationHandler(openPlace);
    // Ghost's tour visits the main pages
    setTourNavigator((page) => navigateTo(page));
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

  const handleSignUpSubmit = async (_username: string, _email: string) => {
    if (BACKEND.enabled) {
      // The backend emails a 6-digit code
      if (authBusy) return;
      setAuthBusy(true);
      setAuthError(null);
      const sent = await sendCode(_email, true);
      setAuthBusy(false);
      if (!sent.ok) {
        setAuthError(sent.message);
        return;
      }
    }
    authRef.current = { email: _email, username: _username, niches: selectedNiches, signingUp: true };
    setAuthUsername(_username);
    setAuthEmail(_email);
    setVerifyMode('signup');
    if (!BACKEND.enabled) setUserProfile(prev => ({ ...prev, name: _username || prev.name, tier: 'free' }));
    navigateTo('verify-code');
  };

  // One-tap Apple / Google sign-up. Sample build: the provider has already verified
  // the person, so skip the email code and go straight to Home. Connected: hands off
  // to the provider (the web page leaves and comes back signed in; on a phone the
  // session arrives through an app link).
  const handleSocialSignUp = async (_provider: 'apple' | 'google') => {
    if (BACKEND.enabled) {
      setAuthError(null);
      authRef.current = { email: '', username: '', niches: selectedNiches, signingUp: true };
      rememberOnboarding(selectedNiches);
      const r = await signInWithProvider(_provider);
      if (!r.ok) setAuthError(r.message);
      return;
    }
    justSignedUp.current = true;
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

  const handleSignInSubmit = async (_email: string) => {
    if (BACKEND.enabled) {
      if (authBusy) return;
      setAuthBusy(true);
      setAuthError(null);
      const sent = await sendCode(_email, false);
      setAuthBusy(false);
      if (!sent.ok) {
        setAuthError(sent.message);
        return;
      }
    }
    authRef.current = { email: _email, username: '', niches: [], signingUp: false };
    setAuthEmail(_email);
    setVerifyMode('signin');
    if (!BACKEND.enabled) setUserProfile(prev => ({ ...prev, tier: 'free' }));
    navigateTo('verify-code');
  };

  const handleSocialSignIn = async (provider: 'apple' | 'google') => {
    if (BACKEND.enabled) {
      setAuthError(null);
      authRef.current = { email: '', username: '', niches: [], signingUp: false };
      const r = await signInWithProvider(provider);
      if (!r.ok) setAuthError(r.message);
      return;
    }
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    navigateTo('dashboard');
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

  // Connected: checks the 6-digit code with the backend. null = it was right, otherwise
  // the message to show. The creator's account starts loading straight away, so the
  // "You're verified" celebration covers the wait.
  const verifyCode = async (code: string): Promise<string | null> => {
    const r = await verifyEmailCode(authRef.current.email, code);
    if (!r.ok) return r.message;
    enteringApp.current = enterApp({ newAccount: authRef.current.signingUp });
    return null;
  };

  const resendCode = async (): Promise<string | null> => {
    const r = await sendCode(authRef.current.email, authRef.current.signingUp, true);
    return r.ok ? null : r.message;
  };

  const handleVerifyCodeSuccess = async (_email: string) => {
    if (BACKEND.enabled) {
      const loaded = (await enteringApp.current) ?? false;
      enteringApp.current = null;
      if (!loaded) notify('We couldn’t load your account yet. Check your connection.');
      navigateTo('dashboard');
      return;
    }
    if (verifyMode === 'signup') justSignedUp.current = true;
    setUserProfile(prev => ({ ...prev, tier: 'free' }));
    // Sign-up and sign-in both land on Home; Home's day-0 welcome greets new creators
    navigateTo('dashboard');
  };

  const handleLogout = () => {
    // The session-lost listener below clears the account's data from memory
    if (BACKEND.enabled) void signOut();
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
    // Connected: what Jarvis knows is the creator's real connected accounts (their sign-up picks until then)
    const jarvisPlatforms = BACKEND.enabled && userProfile?.connectedPlatforms?.length ? userProfile.connectedPlatforms : connectedPlatforms;
    setJarvisContext({ persona: desktopPersona, niches: selectedNiches.length ? selectedNiches : userProfile?.niches ?? [], platforms: jarvisPlatforms });
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
    if (currentScreen === 'dashboard' && justSignedUp.current) {
      justSignedUp.current = false;
      if (desktopPersona === 'new' && desktopTier === 'free') {
        // Ghost says hello through the tour instead
        greeted.current = true;
        closeJarvis();
        setTimeout(startTour, 1100);
      }
    }
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

  // Connected to the backend: a holding page while the saved sign-in is restored, and
  // the page that hands a phone creator back to the app after TikTok's "allow".
  if (BACKEND.enabled && (booting || phoneHandoff)) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <View style={styles.container}>
          <StatusBar style="dark" />
          {phoneHandoff ? (
            <BackendBootScreen
              message="Taking you back to PostStreak…"
              busy={false}
              action={{ label: 'Open the PostStreak app', href: appReturnLink(phoneHandoff) }}
            />
          ) : (
            <BackendBootScreen message={bootMessage} />
          )}
          {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
        </View>
      </SafeAreaProvider>
    );
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
            busy={authBusy}
            error={authError}
            providers={BACKEND.enabled ? [...BACKEND.socialProviders] : undefined}
          />
        )}

        {currentScreen === 'signin' && (
          <SignInScreen
            onBack={Platform.OS === 'web' ? undefined : handleBackFromSignIn}
            onCreateAccount={handleCreateAccountFromSignIn}
            onSubmit={handleSignInSubmit}
            onSocialSignIn={handleSocialSignIn}
            busy={authBusy}
            error={authError}
            providers={BACKEND.enabled ? [...BACKEND.socialProviders] : undefined}
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
            onVerify={BACKEND.enabled ? verifyCode : undefined}
            onResend={BACKEND.enabled ? resendCode : undefined}
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
        {/* Ghost's welcome tour for brand-new creators */}
        {inApp && <GhostTour />}

        {/* Messages from the backend connection ("Couldn't save that…", "TikTok connected") */}
        {BACKEND.enabled && <BrandToast message={notice} />}

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
