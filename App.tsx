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
import type { FilmStyle, IdeaGoal, SavedDraft } from './src/data';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { RepurposeScreen } from './src/screens/RepurposeScreen';
import { MissionDetailScreen } from './src/screens/MissionDetailScreen';
import { QuestsScreen } from './src/screens/QuestsScreen';
import { ChallengeDetailScreen } from './src/screens/ChallengeDetailScreen';
import { CreateScreen } from './src/screens/CreateScreen';
import { ScheduleScreen } from './src/screens/ScheduleScreen';
import { JarvisProScreen } from './src/screens/JarvisProScreen';
import { GrowthScreen } from './src/screens/GrowthScreen';
import { PostComposerScreen } from './src/screens/PostComposerScreen';
import { ContentAngleScreen } from './src/screens/ContentAngleScreen';
import { ScriptScreen } from './src/screens/ScriptScreen';
import { CaptionScreen } from './src/screens/CaptionScreen';
import { AudienceBreakdownScreen } from './src/screens/AudienceBreakdownScreen';
import { PostPerformanceScreen } from './src/screens/PostPerformanceScreen';
import { PlatformGrowthScreen } from './src/screens/PlatformGrowthScreen';
import { HookStudioScreen } from './src/screens/HookStudioScreen';
import { ScreenTransitionContainer, ScreenTransitionType } from './src/components/ScreenTransitionContainer';
import { EdgeSwipeBackWrapper } from './src/components/EdgeSwipeBackWrapper';
import { TabType } from './src/components/FloatingTabBar';
import { UserProfileData, UserProfileModal } from './src/components/UserProfileModal';
import { setNotificationHandler, type NoteTarget } from './src/components/notifications/NotificationsSheet';
import { PostSheet } from './src/components/schedule/PostSheet';
import { setPostOpener } from './src/components/schedule/postSheetBus';
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
import type { UserPersona } from './src/types/account';
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
  onAccountRefreshed,
  profileFromBootstrap,
  rememberOnboarding,
  saveOnboarding,
  saveProfile,
  syncTimezone,
  takeOnboarding,
} from './src/backend/sync';
import {
  appReturnLink,
  clearConnectReturn,
  completeConnect,
  getAccounts,
  parseConnectLink,
  platformName,
  readConnectReturn,
  startedInPhoneApp,
  subscribeToAccounts,
  type ConnectReturn,
} from './src/backend/accounts';
import { notify, useNotice } from './src/backend/notice';
import { listTestAccounts, signInAsTestAccount } from './src/backend/testAccounts';
import type { ConnectablePlatform, GrowthPost, QuestPlace, TestAccount } from './frontend/shared/types/phase1';
import { planStore, useCapabilities } from './src/backend/account';
import { waitForPro } from './src/backend/billing';
import { clearLanding, readLanding } from './src/utils/landing';

type Screen =
  | 'welcome'
  | 'signup'
  | 'signin'
  | 'verify-code'
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
  | 'composer'
  | 'content-angle'
  | 'script'
  | 'caption'
  | 'repurpose'
  | 'jarvis-pro'
  | 'audience-breakdown'
  | 'post-performance'
  | 'platform-growth'
  | 'hook-studio';

// What the app holds before sign-in and after sign-out, until the creator's own profile loads.
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
  // ?plan=pro (the website's "Upgrade") and ?payment=success|cancelled (back from the payment page)
  const landing = React.useRef(readLanding());
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
  // The idea the writing tools (Script, Caption, Hook Studio, Repurpose) open on. Empty: the creator types one there.
  const [selectedIdeaTitle, setSelectedIdeaTitle] = useState('');
  const [composerIdeaTitle, setComposerIdeaTitle] = useState('');
  // Goal picked on the Ideas page shapes the composer's caption
  // Also carries a ready caption + tags from the Caption writer
  // Platform to pre-select in the composer (e.g. from Repurpose)
  const [composerIdeaPlatform, setComposerIdeaPlatform] = useState<string | undefined>(undefined);
  const [composerFilmStyle, setComposerFilmStyle] = useState<FilmStyle | undefined>(undefined);
  // Growth: which post and which account the detail pages open on
  const [growthPostKey, setGrowthPostKey] = useState<string | null>(null);
  const [growthPlatform, setGrowthPlatform] = useState<ConnectablePlatform | null>(null);
  const capabilities = useCapabilities();
  const [composerIdeaGoal, setComposerIdeaGoal] = useState<{ goal?: IdeaGoal; hook?: string; caption?: string; tags?: string[] } | null>(null);
  const [composerIdeaFormat, setComposerIdeaFormat] = useState<'short_video' | 'carousel' | 'image' | 'long_video' | 'text' | undefined>(undefined);
  // The post whose sheet is open (any page can open one: Schedule, the calendar, Home…)
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  React.useEffect(() => {
    setPostOpener(setOpenPostId);
    return () => setPostOpener(null);
  }, []);
  // A saved draft the composer carries on from (set when one is opened; forgotten when the composer is left)
  const [composerDraft, setComposerDraft] = useState<SavedDraft | null>(null);
  // A saved script the Script page carries on from (forgotten when the page is left)
  const [scriptDraft, setScriptDraft] = useState<SavedDraft | null>(null);

  const handleUseIdea = (title: string, format?: string, goal?: IdeaGoal, hook?: string) => {
    setComposerIdeaGoal(goal ? { goal, hook } : null);
    setComposerIdeaPlatform(undefined); setComposerFilmStyle(undefined);
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
  const [userProfile, setUserProfileRaw] = useState<UserProfileData>(BLANK_PROFILE);
  // The plan (tier) and the New/Returning view are the server's to decide: every place that
  // edits the profile goes through this, and none of them can change those two.
  const setUserProfile: typeof setUserProfileRaw = (action) =>
    setUserProfileRaw((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return { ...next, tier: prev.tier, userPersona: prev.userPersona };
    });
  const userPersona: UserPersona = userProfile.userPersona;
  const editProfile = (updated: UserProfileData) => setUserProfile((prev) => ({ ...prev, ...updated }));

  // ─── Backend state ────────────────────────────────────────────────────────
  // Whether we're still restoring the saved sign-in at launch (a holding page shows meanwhile)
  const [booting, setBooting] = useState(BACKEND.enabled);
  const [bootMessage, setBootMessage] = useState('One moment…');
  // Sending a code / why it couldn't be sent, for the sign-up and sign-in forms
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  // Local testing: the seeded accounts offered on the sign-in screen (none anywhere else)
  const [testAccounts, setTestAccounts] = useState<TestAccount[]>([]);
  // Phone creators approve a platform (Instagram, TikTok…) in a browser; this page then hands them back to the app
  const [phoneHandoff, setPhoneHandoff] = useState<ConnectReturn | null>(null);
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

  // Where a creator lands once signed in: Pro, if the website's "Upgrade to Pro" sent them (once, and
  // only if they don't have it already); otherwise Home.
  const landingScreen = (): Screen => {
    if (landing.current.wantsPro) {
      landing.current.wantsPro = false;
      clearLanding();
      if (!planStore.get()) return 'jarvis-pro';
    }
    return 'dashboard';
  };

  // Back from the payment page: the payment provider tells the server a moment after the creator arrives,
  // so the plan is read again until it says Pro.
  const finishPaymentReturn = async () => {
    const result = landing.current.payment;
    if (!result) return;
    landing.current.payment = null;
    clearLanding();
    if (result === 'cancelled') {
      notify('Payment cancelled. Nothing was charged.');
      return;
    }
    notify('Payment received. Switching on Pro…', 6000);
    const pro = await waitForPro();
    notify(pro ? 'You’re on Jarvis Pro. Enjoy!' : 'Your payment is being confirmed. Pro switches on as soon as it is; there’s no need to pay again.', 6000);
  };

  // Smart Navigation Handler: Instant (0ms) for bottom tabs & regular screens; Smart AI loader for generation workflows
  // Every page opens straight away. (There used to be a timed "Jarvis is
  // working..." screen before Ideas, Caption, Script and Repurpose; it wasn't
  // real loading, so it only slowed things down. Pages show Jarvis thinking
  // in place when they actually generate something.)
  const navigateTo = (nextScreen: Screen) => {
    if (nextScreen !== 'composer') {
      setComposerDraft(null);
    }
    if (nextScreen !== 'script') {
      setScriptDraft(null);
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

  // ─── Backend: signing in, loading the creator's account, connecting platforms ─────
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

  // A platform has sent the creator back (web: this page load; phone: an app link): finish the connection
  const finishConnect = async (ret: ConnectReturn) => {
    const name = platformName(ret.provider);
    if (ret.error || !ret.code || !ret.state) {
      notify(`${name} wasn’t connected. You can try again any time.`);
      return;
    }
    const r = await completeConnect(ret.provider, ret.code, ret.state);
    if (r.ok) {
      notify(r.name ? `${name} connected: ${r.name}` : `${name} connected`);
      setShowAccountsFromNote(true); // shows the account that just connected
    } else {
      notify(r.message);
    }
  };

  // Launch: restore the saved sign-in and the creator's account, and finish a platform round trip if one is landing.
  // App links that arrive while this runs (a phone opened by a platform's "allowed") wait on `bootDone`.
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
      const ret = readConnectReturn();
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
        setBootMessage(ret ? `Connecting your ${platformName(ret.provider)}…` : 'Signing you in…');
        const remembered = takeOnboarding(); // set when they signed up with Google / Apple on the web
        const loaded = await enterApp({ newAccount: remembered !== null, niches: remembered?.niches });
        if (!alive) return;
        if (!loaded) notify('We couldn’t load your account. Check your connection.');
        setCurrentScreen(landingScreen());
        if (loaded) void finishPaymentReturn();
        if (ret) {
          clearConnectReturn(); // so a refresh can't replay the one-time code
          await finishConnect(ret);
        }
      } else if (ret) {
        clearConnectReturn();
        notify(`Sign in, then connect ${platformName(ret.provider)} again.`);
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

  React.useEffect(() => {
    let alive = true;
    void listTestAccounts().then((list) => alive && setTestAccounts(list));
    return () => {
      alive = false;
    };
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

  // Something the creator did (their first post, say) changed what the server says about them
  React.useEffect(() => {
    if (!BACKEND.enabled) return;
    onAccountRefreshed((b) => {
      const fresh = profileFromBootstrap(b, BLANK_PROFILE);
      setUserProfileRaw((prev) => ({ ...prev, tier: fresh.tier, userPersona: fresh.userPersona, streakCount: fresh.streakCount, level: fresh.level, xp: fresh.xp, postsCount: fresh.postsCount }));
    });
    return () => onAccountRefreshed(null);
  }, []);

  // A real connection changed (connected, disconnected, needs reconnecting): update the profile's list
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

  // Phone: links back into the app — a platform's "allowed" (poststreak://connect?…) and Google / Apple sign-in
  React.useEffect(() => {
    if (!BACKEND.enabled || Platform.OS === 'web') return;
    const handle = async (url: string | null) => {
      if (!url) return;
      await bootGate.current?.done; // the saved sign-in is back before we act on a link
      if (await handleAuthLink(url)) {
        if (getSessionState().status === 'signedIn') {
          const loaded = await enterApp({ newAccount: authRef.current.signingUp });
          if (!loaded) notify('We couldn’t load your account. Check your connection.');
          setCurrentScreen(landingScreen());
        }
        return;
      }
      const ret = parseConnectLink(url);
      if (ret) await finishConnect(ret);
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
    authRef.current = { email: _email, username: _username, niches: selectedNiches, signingUp: true };
    setAuthUsername(_username);
    setAuthEmail(_email);
    setVerifyMode('signup');
    navigateTo('verify-code');
  };

  // One-tap Apple / Google sign-up: hands off to the provider (the web page leaves and
  // comes back signed in; on a phone the session arrives through an app link).
  const handleSocialSignUp = async (_provider: 'apple' | 'google') => {
    setAuthError(null);
    authRef.current = { email: '', username: '', niches: selectedNiches, signingUp: true };
    rememberOnboarding(selectedNiches);
    const r = await signInWithProvider(_provider);
    if (!r.ok) setAuthError(r.message);
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
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    const sent = await sendCode(_email, false);
    setAuthBusy(false);
    if (!sent.ok) {
      setAuthError(sent.message);
      return;
    }
    authRef.current = { email: _email, username: '', niches: [], signingUp: false };
    setAuthEmail(_email);
    setVerifyMode('signin');
    navigateTo('verify-code');
  };

  const handleSocialSignIn = async (provider: 'apple' | 'google') => {
    setAuthError(null);
    authRef.current = { email: '', username: '', niches: [], signingUp: false };
    const r = await signInWithProvider(provider);
    if (!r.ok) setAuthError(r.message);
  };

  // Local testing: one tap signs in as a seeded account (a real session, no emailed code)
  const handleTestAccount = async (email: string) => {
    if (authBusy) return;
    setAuthBusy(true);
    setAuthError(null);
    const r = await signInAsTestAccount(email);
    if (!r.ok) {
      setAuthBusy(false);
      setAuthError(r.message);
      return;
    }
    authRef.current = { email, username: '', niches: [], signingUp: false };
    const loaded = await enterApp();
    setAuthBusy(false);
    if (!loaded) notify('We couldn’t load that account. Is the local stack running?');
    navigateTo(landingScreen());
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

  // Checks the 6-digit code with the backend. null = it was right, otherwise
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
    const loaded = (await enteringApp.current) ?? false;
    enteringApp.current = null;
    if (!loaded) notify('We couldn’t load your account yet. Check your connection.');
    // Sign-up and sign-in both land on Home (Home's day-0 welcome greets new creators), or on Pro if the
    // website's "Upgrade to Pro" brought them
    navigateTo(landingScreen());
  };

  const handleLogout = () => {
    // The session-lost listener below clears the account's data from memory
    void signOut();
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
    create: 'create', composer: 'create', 'content-angle': 'create', script: 'create', caption: 'create',
    quests: 'quests', 'challenge-detail': 'quests',
    growth: 'growth', 'audience-breakdown': 'growth', 'post-performance': 'growth', 'platform-growth': 'growth',
    schedule: 'schedule', repurpose: 'repurpose', 'hook-studio': 'hook-studio',
  };
  const SCREEN_FOR: Record<SidebarId, Screen> = {
    home: 'dashboard', create: 'create', quests: 'quests', growth: 'growth',
    schedule: 'schedule', repurpose: 'repurpose', 'hook-studio': 'hook-studio',
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
    signin: null,
  };
  const showAuthHeader = (IS_WEB_APP || breakpoint === 'desktop') && currentScreen in AUTH_STEP;
  const authStep = AUTH_STEP[currentScreen] ?? null;
  const signingUp = authStep !== null;
  const authBack = getBackScreen(currentScreen);

  // Desktop web app: a top bar on every signed-in page, and the Today panel
  // on the right of the main pages when the window is wide enough
  const { width: windowW } = useWindowDimensions();
  const MAIN_PAGES: Screen[] = ['dashboard', 'create', 'quests', 'growth', 'schedule', 'repurpose', 'hook-studio'];
  // Every signed-in page except the studios (they have their own panel) gets the Today panel
  const RAIL_PAGES: Screen[] = [
    'dashboard', 'create', 'quests', 'growth', 'schedule',
    'composer', 'content-angle', 'script', 'caption', 'mission-detail', 'challenge-detail',
    'jarvis-pro', 'audience-breakdown', 'post-performance', 'platform-growth',
  ];
  const wideEnough = windowW >= 1360;
  const showRail = showSidebar && RAIL_PAGES.includes(currentScreen) && wideEnough;
  const STUDIO_FOR: Partial<Record<Screen, StudioKind>> = { repurpose: 'repurpose', 'hook-studio': 'hook' };
  const studioRail = showSidebar && wideEnough ? STUDIO_FOR[currentScreen] : undefined;
  const PAGE_TITLE: Partial<Record<Screen, string>> = {
    composer: 'New post', 'content-angle': 'Ideas', script: 'Script', caption: 'Caption',
    'mission-detail': 'Today’s quest', 'challenge-detail': 'Weekly challenge', 'jarvis-pro': 'Jarvis Pro',
    'audience-breakdown': 'Your audience', 'post-performance': 'Post performance', 'platform-growth': 'Platform growth',
  };
  const innerBack = MAIN_PAGES.includes(currentScreen) ? null : getBackScreen(currentScreen);
  const desktopTier: 'free' | 'pro' = userProfile?.tier === 'pro' || userProfile?.tier === 'founding' ? 'pro' : 'free';
  const desktopPersona: 'new' | 'returning' = (userPersona || userProfile?.userPersona) === 'returning' ? 'returning' : 'new';
  const openBlankComposer = (title?: string) => {
    setComposerDraft(null);
    setComposerIdeaGoal(null);
    setComposerIdeaPlatform(undefined);
    setComposerFilmStyle(undefined);
    setComposerIdeaFormat(undefined);
    setComposerIdeaTitle(title ?? '');
    navigateTo('composer');
  };
  setComposerOpener(openBlankComposer);

  // A saved post draft opens in the composer the way it was left
  const openComposerDraft = (draft: SavedDraft) => {
    setComposerIdeaGoal(null);
    setComposerIdeaPlatform(undefined);
    setComposerFilmStyle(undefined);
    setComposerIdeaFormat(undefined);
    setComposerIdeaTitle('');
    setComposerDraft(draft);
    navigateTo('composer');
  };

  // The Script page, on an idea (or none: the creator types one there)
  const openScript = (title?: string) => {
    setSelectedIdeaTitle(title ?? '');
    navigateTo('script');
  };

  // Any saved draft: a script opens on Script, anything else in the composer
  const openDraft = (draft: SavedDraft) => {
    if (draft.kind === 'script') {
      setSelectedIdeaTitle(draft.title);
      setScriptDraft(draft);
      navigateTo('script');
    } else {
      openComposerDraft(draft);
    }
  };

  // "Make more like this" on a post: ideas on the same topic (only offered when the server can write ideas)
  const makeMoreLikeThis = (post: GrowthPost) => {
    setSelectedIdeaTitle(post.title);
    navigateTo('content-angle');
  };

  // Where a quest's button takes the creator
  const openQuestPlace = (place: QuestPlace) => {
    switch (place) {
      case 'create':
        return navigateTo('create');
      case 'ideas':
        return navigateTo('content-angle');
      case 'script':
        return openScript();
      case 'composer':
        return openBlankComposer();
      case 'schedule':
        return navigateTo('schedule');
      case 'growth':
        return navigateTo('growth');
      case 'repurpose':
        setSelectedIdeaTitle('');
        return navigateTo('repurpose');
      case 'hook-studio':
        return navigateTo('hook-studio');
      case 'accounts':
        return setShowAccountsFromNote(true);
      case 'challenge':
        return navigateTo('challenge-detail');
    }
  };

  // The side menu (desktop/tablet), also shown in the phone menu drawer
  const renderMenu = (close?: () => void) => (
    <AppSidebar
      fill={!!close}
      active={SIDEBAR_FOR[currentScreen] ?? null}
      profile={userProfile}
      onNavigate={(id) => { close?.(); navigateTo(SCREEN_FOR[id]); }}
      onOpenProfile={() => { close?.(); setShowProfileFromMenu(true); }}
      onOpenPro={() => { close?.(); navigateTo('jarvis-pro'); }}
    />
  );

  // The mascot's resting mood follows where you are, and it says hello when you
  // arrive (welcome back for returning creators). Never guilt, only warmth.
  const MASCOT_MOOD: Partial<Record<Screen, Emotion>> = {
    dashboard: 'calm', create: 'idea', 'content-angle': 'thinking',
    composer: 'working', script: 'working', caption: 'working',
    quests: 'determined', 'mission-detail': 'determined', 'challenge-detail': 'determined',
    growth: 'happy', 'audience-breakdown': 'happy', 'post-performance': 'love', 'platform-growth': 'happy',
    schedule: 'calm', repurpose: 'idea', 'hook-studio': 'idea', 'jarvis-pro': 'cool',
  };
  // Jarvis chat: the button shows on every signed-in page on wide screens, and
  // on the main pages on phones (inner pages have their own bottom buttons).
  // Not where the right panel already has its Ask Jarvis card (no doubles).
  // Jarvis answers on the server: no launcher when the server has no AI switched on
  const showJarvisButton = capabilities.ai && inApp && !showRail && (webSidebar || MAIN_PAGES.includes(currentScreen));
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

  // Without the backend's address there is nothing to show: say so rather than look real.
  if (!BACKEND.enabled) {
    return (
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <BackendBootScreen
            busy={false}
            message="This copy of PostStreak isn’t connected to a PostStreak server."
            detail="Set EXPO_PUBLIC_API_URL, EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY and start it again. On your own computer, npm run local does all of that."
          />
        </View>
      </SafeAreaProvider>
    );
  }

  // A holding page while the saved sign-in is restored, and
  // the page that hands a phone creator back to the app after a platform's "allow".
  if (booting || phoneHandoff) {
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
            providers={[...BACKEND.socialProviders]}
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
            providers={[...BACKEND.socialProviders]}
            testAccounts={testAccounts}
            onTestAccount={handleTestAccount}
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
            onVerify={verifyCode}
            onResend={resendCode}
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
              onOpenHookStudio={() => navigateTo('hook-studio')}
              onLogout={handleLogout}
              onStartMission={() => navigateTo('mission-detail')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenAccounts={() => setShowAccountsFromNote(true)}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'mission-detail' && (
          <MissionDetailScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'quests')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onLogout={handleLogout}
            onOpenPlace={openQuestPlace}
            onOpenScript={openScript}
            onOpenPostComposer={(title) => openBlankComposer(title)}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'create' && (
          (
            <CreateScreen
              tier={desktopTier}
              onOpenHookStudio={() => navigateTo('hook-studio')}
              onLogout={handleLogout}
              onOpenSchedule={() => navigateTo('schedule')}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenPostComposer={(title) => openBlankComposer(title)}
              onUseIdea={(idea) => handleUseIdea(idea.title, idea.format, 'followers', idea.hook)}
              onOpenIdeaAngle={() => navigateTo('content-angle')}
              onOpenScript={() => openScript()}
              onOpenCaption={() => {
                setSelectedIdeaTitle('');
                navigateTo('caption');
              }}
              onOpenRepurpose={() => {
                setSelectedIdeaTitle('');
                navigateTo('repurpose');
              }}
              onOpenDraft={openDraft}
              onNavigateTab={handleTabNavigation}
              userPersona={userPersona}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'schedule' && (
          (
            <ScheduleScreen
              tier={desktopTier}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onOpenCreateIdea={() => navigateTo('create')}
              onOpenPostComposer={(title, platform) => {
                if (title) setComposerIdeaTitle(title);
                setComposerIdeaGoal(null);
                setComposerIdeaPlatform(platform);
                setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'growth' && (
          <GrowthScreen
            tier={desktopTier}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenAudienceBreakdown={() => navigateTo('audience-breakdown')}
            onOpenPostPerformance={(key) => {
              setGrowthPostKey(key);
              navigateTo('post-performance');
            }}
            onOpenPlatformGrowth={(platform) => {
              setGrowthPlatform(platform ?? null);
              navigateTo('platform-growth');
            }}
            onNavigateTab={handleTabNavigation}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenIdeas={() => navigateTo('content-angle')}
            onOpenChallenge={() => navigateTo('challenge-detail')}
            onMakeMoreLikeThis={capabilities.ai ? makeMoreLikeThis : undefined}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'jarvis-pro' && (
          <JarvisProScreen
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onLogout={handleLogout}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'quests' && (
          <QuestsScreen
            onLogout={handleLogout}
            onOpenMissionDetail={() => navigateTo('mission-detail')}
            onOpenCommunityChallenge={() => navigateTo('challenge-detail')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPlace={openQuestPlace}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'challenge-detail' && (
          <ChallengeDetailScreen
            onBackToDashboard={() => navigateTo('quests')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onLogout={handleLogout}
            onOpenComposer={(idea) => openBlankComposer(idea)}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'composer' && (
          <PostComposerScreen
            key={composerDraft?.id ?? 'new'}
            ideaTitle={composerIdeaTitle}
            ideaGoal={composerIdeaGoal}
            initialPlatform={composerIdeaPlatform}
            initialFilmStyle={composerFilmStyle}
            initialFormat={composerIdeaFormat}
            draft={composerDraft}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenSchedule={() => navigateTo('schedule')}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'content-angle' && (
          (
            <ContentAngleScreen
              tier={desktopTier}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseIdea={handleUseIdea}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'script' && (
          (
            <ScriptScreen
              key={scriptDraft?.id ?? 'new'}
              ideaTitle={selectedIdeaTitle}
              draft={scriptDraft}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onUseAsPost={({ idea, hook, style }) => {
                setComposerDraft(null);
                setComposerIdeaTitle(idea);
                setComposerIdeaGoal(hook ? { hook } : null);
                setComposerIdeaPlatform(undefined);
                setComposerFilmStyle(style);
                setComposerIdeaFormat('short_video');
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'caption' && (
          (
            <CaptionScreen
              tier={desktopTier}
              ideaTitle={selectedIdeaTitle}
              onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
              onLogout={handleLogout}
              onOpenJarvisPro={() => navigateTo('jarvis-pro')}
              onAddToPost={(captionText, tags, topic) => {
                // The caption goes into the composer's caption box (not the idea title)
                setComposerDraft(null);
                setComposerIdeaTitle(topic);
                setComposerIdeaGoal({ caption: captionText, tags });
                setComposerIdeaPlatform(undefined);
                setComposerFilmStyle(undefined);
                navigateTo('composer');
              }}
              onNavigateTab={handleTabNavigation}
              userProfile={userProfile}
              onSaveProfile={editProfile}
            />
          )
        )}

        {currentScreen === 'repurpose' && (
          <RepurposeScreen
            ideaTitle={selectedIdeaTitle}
            userProfile={userProfile}
            onSaveProfile={editProfile}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onNavigateTab={handleTabNavigation}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onUseVersion={(caption, platform, idea) => {
              setComposerDraft(null);
              setComposerIdeaTitle(idea);
              setComposerIdeaGoal({ caption });
              setComposerIdeaPlatform(platform);
              setComposerFilmStyle(undefined);
              navigateTo('composer');
            }}
          />
        )}

        {currentScreen === 'hook-studio' && (
          <HookStudioScreen
            ideaTitle={selectedIdeaTitle}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'create')}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onUseHook={(title, hook, style) => {
              setComposerIdeaTitle(title);
              setComposerIdeaGoal({ hook });
              setComposerIdeaPlatform(undefined);
              setComposerFilmStyle(style);
              navigateTo('composer');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'platform-growth' && (
          <PlatformGrowthScreen
            platform={growthPlatform}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPostPerformance={(key) => {
              setGrowthPostKey(key);
              navigateTo('post-performance');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'post-performance' && (
          <PostPerformanceScreen
            postKey={growthPostKey}
            onBack={() => navigateTo(previousScreen ? previousScreen : 'growth')}
            onMakeMoreLikeThis={capabilities.ai ? makeMoreLikeThis : undefined}
            onPlanSimilar={(title) => openBlankComposer(title)}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}

        {currentScreen === 'audience-breakdown' && (
          <AudienceBreakdownScreen
            tier={desktopTier}
            onBack={() => navigateTo('growth')}
            onLogout={handleLogout}
            onOpenJarvisPro={() => navigateTo('jarvis-pro')}
            onOpenPlatformGrowth={(platform) => {
              setGrowthPlatform(platform ?? null);
              navigateTo('platform-growth');
            }}
            onNavigateTab={handleTabNavigation}
            userProfile={userProfile}
            onSaveProfile={editProfile}
          />
        )}
          </ScreenTransitionContainer>
        </EdgeSwipeBackWrapper>
            </View>
            {studioRail && <StudioRail kind={studioRail} />}
            {showRail && (
              <TodayRail
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
          onSaveProfile={editProfile}
        />

        <UserProfileModal
          visible={showProfileFromMenu}
          onClose={() => setShowProfileFromMenu(false)}
          onLogout={handleLogout}
          initialProfile={userProfile}
          onSaveProfile={editProfile}
        />

        {/* One of the creator's posts, opened from Schedule, the calendar, Home or the bell */}
        <PostSheet postId={openPostId} onClose={() => setOpenPostId(null)} />

        {/* Ask Jarvis from anywhere in the app; Ghost does the jobs */}
        {showJarvisButton && <JarvisLauncher compact={breakpoint === 'phone'} bottom={jarvisBottom} />}
        {inApp && <JarvisChatPanel />}
        {/* Ghost's welcome tour for brand-new creators */}
        {inApp && <GhostTour />}

        {/* Messages from the backend connection ("Couldn't save that…", "Instagram connected") */}
        <BrandToast message={notice} />

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
