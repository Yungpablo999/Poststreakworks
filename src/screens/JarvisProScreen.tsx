import React, { useEffect, useRef, useState } from 'react';
import { usePageWidth } from '../hooks/useBreakpoint';
import { View, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Path, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { Problem } from '../components/studio/StudioBits';
import { useCapabilities, usePlan } from '../backend/account';
import { canBuyHere, cancelRenewal, formatPrice, loadOffer, resumeRenewal, startCheckout, useOffer } from '../backend/billing';
import { studioProblem } from '../backend/studio';
import type { BillingOffer, Capabilities } from '../../frontend/shared/types/phase1';
import { ds, goldTokens } from '../theme/colors';

// Jarvis Pro. For free creators: what Pro adds and the way to buy it; for Pro members: their plan, and
// stopping or resuming its renewal. Everything here is the server's: the price and the limits come from
// /billing/offer (the numbers the server enforces), and a row appears only for something the server can
// really do (its capabilities). Light glass like the rest of the app; gold only marks Pro.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const smooth = { duration: 260, easing: Easing.out(Easing.cubic) };
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

// An example of the daily brief Pro creators get on Home (built from their own ideas and plans)
const BRIEF = [
  { id: 'hook', title: 'Write the hook', detail: 'Jarvis drafts the opening line for today’s idea, in your words.' },
  { id: 'film', title: 'Film it', detail: 'A short plan for the video: what to show first, and what to end on.' },
  { id: 'post', title: 'Post it', detail: 'Plan it for a time that suits you. We remind you, and you tap “I posted it” once it’s up.' },
];

type Row = { feature: string; free: string; pro: string };

const per = (n: number | null, unit: string) => (n === null ? 'Unlimited' : `${n} ${unit}`);

/** Free and Pro, side by side: only what this server really does, with the numbers it enforces. */
function compareRows(offer: BillingOffer, caps: Capabilities): Row[] {
  const { free, pro } = offer.limits;
  const rows: Row[] = [];
  if (caps.ai) {
    rows.push({ feature: 'Scripts, captions and Repurpose', free: per(free.aiWritesPerDay, 'new pieces a day'), pro: per(pro.aiWritesPerDay, 'new pieces a day') });
    rows.push({ feature: 'Quick edits (rewrite, shorten…)', free: per(free.aiEditsPerDay, 'a day'), pro: per(pro.aiEditsPerDay, 'a day') });
    rows.push({ feature: 'Repurpose', free: per(free.repurposesPerWeek, 'a week'), pro: per(pro.repurposesPerWeek, 'a week') });
    rows.push({ feature: 'Hook Studio', free: 'Not included', pro: 'Three strong openings for any idea' });
  }
  rows.push({ feature: 'Ideas about your own topic', free: 'Not included', pro: 'Type a topic, get ideas for it' });
  rows.push({ feature: 'Daily brief', free: 'Not included', pro: 'What to make today, on your Home' });
  rows.push({ feature: 'Connected accounts', free: per(free.connectedPlatforms, 'accounts'), pro: pro.connectedPlatforms === null ? 'All of them' : `${pro.connectedPlatforms} accounts` });
  if (caps.ai) rows.push({ feature: 'Chats with Jarvis', free: per(free.jarvisChatsPerDay, 'a day'), pro: per(pro.jarvisChatsPerDay, 'a day') });
  // Only when this server can really do them
  if (caps.voice) rows.push({ feature: 'Voice Studio', free: 'Not included', pro: 'Voiceovers in your own voice' });
  if (caps.audienceDemographics) rows.push({ feature: 'Audience details', free: 'Totals and platforms', pro: 'Ages, places and online times' });
  if (caps.autoPost) rows.push({ feature: 'Posting', free: 'We remind you', pro: 'Posted for you at your time' });
  return rows;
}

const FAQ = [
  {
    q: 'What is Jarvis Pro?',
    a: 'Jarvis helps you decide what to post and writes the first draft with you. Pro takes the daily limits off, adds Hook Studio and ideas about your own topics, and gives you a brief on Home every day.',
  },
  { q: 'Do I lose anything on the free plan?', a: 'No. Everything you use now stays free. Pro adds more on top.' },
  { q: 'Can I cancel any time?', a: 'Yes. Cancel from this page whenever you like. You keep Pro until the end of the month you paid for, and you’re not charged again.' },
];

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });

// ─── Pieces ─────────────────────────────────────────────────────────────────
function GoldGlow({ size = 240, style }: { size?: number; style?: object }) {
  const reduce = useReducedMotion();
  const t = useSharedValue(0);
  useEffect(() => {
    if (!reduce) t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduce, t]);
  const anim = useAnimatedStyle(() => ({ opacity: 0.6 + 0.4 * t.value, transform: [{ scale: 0.94 + 0.08 * t.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[{ position: 'absolute' }, style, anim]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="jpGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={ds.gold} stopOpacity={0.28} />
            <Stop offset="100%" stopColor={ds.gold} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#jpGlow)" />
      </Svg>
    </Animated.View>
  );
}

function Chevron({ open }: { open: boolean }) {
  const r = useSharedValue(open ? 1 : 0);
  useEffect(() => {
    r.value = withTiming(open ? 1 : 0, smooth);
  }, [open, r]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value * 180}deg` }] }));
  return (
    <Animated.View style={style}>
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Path d="M6 9l6 6 6-6" stroke={ds.purple} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function PlanSwitch({ value, onChange }: { value: 'free' | 'pro'; onChange: (v: 'free' | 'pro') => void }) {
  const [w, setW] = useState(0);
  const cell = w / 2;
  const x = useSharedValue(0);
  useEffect(() => {
    if (cell > 0) x.value = withTiming(value === 'pro' ? cell : 0, smooth);
  }, [value, cell, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  return (
    <View
      style={styles.switchTrack}
      accessibilityRole="tablist"
      onLayout={(e) => {
        const nw = e.nativeEvent.layout.width - 8;
        if (Math.abs(nw - w) > 1) {
          setW(nw);
          x.value = value === 'pro' ? nw / 2 : 0;
        }
      }}
    >
      {cell > 0 && <Animated.View pointerEvents="none" style={[styles.switchPill, value === 'pro' && styles.switchPillPro, { width: cell }, pill]} />}
      {(['free', 'pro'] as const).map((id) => {
        const on = id === value;
        return (
          <Pressable
            key={id}
            onPress={() => {
              tick();
              onChange(id);
            }}
            style={[styles.switchCell, pointer]}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.switchText, on && (id === 'pro' ? styles.switchTextPro : styles.switchTextOn)]}>
              {id === 'free' ? 'Free' : 'Pro'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

interface JarvisProScreenProps {
  onLogout?: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onBack?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
}

export const JarvisProScreen: React.FC<JarvisProScreenProps> = ({ onLogout, onNavigateTab, onBack, userProfile, onSaveProfile }) => {
  const pageWidth = usePageWidth();
  const scrollRef = useRef<ScrollView>(null);
  const planY = useRef(0);
  const [showProfile, setShowProfile] = useState(false);
  const [openStep, setOpenStep] = useState<string | null>('hook');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [view, setView] = useState<'free' | 'pro'>('pro');
  const caps = useCapabilities();
  const plan = usePlan(); // the creator's paid plan, or null
  const offer = useOffer();
  const isPro = !!plan || userProfile?.tier === 'pro' || userProfile?.tier === 'founding';
  const [offerFailed, setOfferFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [problem, setProblem] = useState<{ message: string; upgrade: boolean } | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    void loadOffer().then((o) => mounted.current && setOfferFailed(!o));
    return () => {
      mounted.current = false;
    };
  }, []);

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));
  const price = offer?.plan?.priceUsdCents ? formatPrice(offer.plan.priceUsdCents, 'USD') : null;
  const rows = offer ? compareRows(offer, caps) : [];
  const canPay = !!offer && offer.processors.includes('stripe');

  const buy = async () => {
    if (busy) return;
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProblem(null);
    setBusy(true);
    const res = await startCheckout();
    // On success this page is being replaced by the payment page; stay busy until it is
    if (!res.ok && mounted.current) {
      setBusy(false);
      setProblem(studioProblem(res));
    }
  };

  const changeRenewal = async (renew: boolean) => {
    if (busy) return;
    if (!renew && !confirmCancel) {
      tick();
      setConfirmCancel(true);
      return;
    }
    setProblem(null);
    setBusy(true);
    const res = renew ? await resumeRenewal() : await cancelRenewal();
    if (!mounted.current) return;
    setBusy(false);
    setConfirmCancel(false);
    if (!res.ok) setProblem(studioProblem(res));
    else if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <ScrollView ref={scrollRef} contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <Animated.View entering={enter(0)}>
            <GlassCard strong radius={28} padding={22}>
              <GoldGlow style={{ top: -110, right: -90 }} />
              <View style={styles.heroTop}>
                <JarvisOrb size={56} />
                <View style={styles.proChip}>
                  <Text style={styles.proChipText}>PRO</Text>
                </View>
              </View>
              <FitLines
                lines={['Meet', <Text key="p" style={styles.accent}>Jarvis Pro</Text>]}
                textStyle={styles.heroTitle}
                maxFontSize={38}
                align="left"
                accessibilityLabel="Meet Jarvis Pro"
              />
              <Text style={styles.heroBody}>
                {isPro ? 'You’re on Pro. Here’s your plan, and everything it includes.' : 'Your partner for what to post, and the first draft of it.'}
              </Text>
              {price && !isPro && (
                <View style={styles.heroPrice}>
                  <Text style={styles.heroPriceNum}>{price}</Text>
                  <Text style={styles.heroPriceSub}>a month · cancel any time</Text>
                </View>
              )}
              <View style={styles.heroCta}>
                <AppButton
                  title={isPro ? 'Your plan' : 'See what’s included'}
                  variant="glass"
                  onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, planY.current - 12), animated: true })}
                />
              </View>
            </GlassCard>
          </Animated.View>

          {/* Example brief */}
          <Animated.View entering={enter(100)}>
            <View style={styles.sectionRow}>
              <Text style={styles.section}>A day with Pro</Text>
              <View style={styles.exampleChip}>
                <Text style={styles.exampleText}>Example</Text>
              </View>
            </View>
            <GlassCard strong radius={24} padding={16}>
              <View style={styles.briefHead}>
                <JarvisOrb size={30} />
                <Text style={styles.briefLead}>Each morning: one thing worth making today, in three small steps.</Text>
              </View>
              <View style={styles.briefList}>
                {BRIEF.map((b, i) => {
                  const open = openStep === b.id;
                  return (
                    <Animated.View key={b.id} style={[styles.briefItem, open && styles.briefItemOpen]}>
                      <Pressable
                        onPress={() => {
                          tick();
                          setOpenStep(open ? null : b.id);
                        }}
                        accessibilityRole="button"
                        accessibilityState={{ expanded: open }}
                        style={[styles.briefRow, pointer]}
                      >
                        <View style={[styles.briefNum, open && styles.briefNumOn]}>
                          <Text style={[styles.briefNumText, open && { color: '#FFFFFF' }]}>{i + 1}</Text>
                        </View>
                        <Text style={styles.briefTitle}>{b.title}</Text>
                        <Chevron open={open} />
                      </Pressable>
                      {open && (
                        <Animated.View entering={FadeIn.duration(220)}>
                          <Text style={styles.briefDetail}>{b.detail}</Text>
                        </Animated.View>
                      )}
                    </Animated.View>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* Free vs Pro */}
          {rows.length > 0 && (
          <Animated.View entering={enter(200)}>
            <Text style={styles.section}>Free and Pro, side by side</Text>
            <GlassCard strong radius={24} padding={16}>
              <PlanSwitch value={view} onChange={setView} />
              <View style={styles.compare}>
                {rows.map((c) => (
                  <View key={c.feature} style={styles.compareRow}>
                    <Text style={styles.compareFeature}>{c.feature}</Text>
                    <Animated.View key={`${c.feature}-${view}`} entering={FadeIn.duration(220)} style={styles.compareValueWrap}>
                      {view === 'pro' && (
                        <View style={styles.goldTick}>
                          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                            <Path d="M20 6L9 17l-5-5" stroke={goldTokens.dark} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        </View>
                      )}
                      <Text style={[styles.compareValue, view === 'pro' && styles.compareValuePro, c.free === 'Not included' && view === 'free' && styles.compareValueOff]}>
                        {view === 'free' ? c.free : c.pro}
                      </Text>
                    </Animated.View>
                  </View>
                ))}
              </View>
            </GlassCard>
          </Animated.View>
          )}

          {/* Plan (the one upgrade button, or the member's own plan) */}
          <Animated.View
            entering={enter(300)}
            onLayout={(e) => {
              planY.current = e.nativeEvent.layout.y;
            }}
          >
            <Text style={styles.section}>{isPro ? 'Your plan' : 'Jarvis Pro'}</Text>
            <GlassCard strong radius={26} padding={20}>
              <GoldGlow size={200} style={{ bottom: -90, left: -70 }} />
              <View style={styles.planHead}>
                <Text style={styles.planName}>{offer?.plan?.name ?? 'Jarvis Pro'}</Text>
                <View style={styles.proChip}>
                  <Text style={styles.proChipText}>{isPro ? 'YOURS' : 'PRO'}</Text>
                </View>
              </View>

              {isPro ? (
                <>
                  {plan ? (
                    <Text style={styles.planStatus}>
                      {plan.cancelAtPeriodEnd ? `Pro ends on ${dateLabel(plan.renewsAt)}. You won’t be charged again.` : `Renews on ${dateLabel(plan.renewsAt)}.`}
                    </Text>
                  ) : (
                    <Text style={styles.planStatus}>Pro is switched on for your account.</Text>
                  )}
                  {plan && plan.processor === 'stripe' && (
                    <View style={styles.planActions}>
                      {plan.cancelAtPeriodEnd ? (
                        <AppButton title={busy ? 'One moment…' : 'Keep Pro'} variant="gold" size="lg" disabled={busy} onPress={() => void changeRenewal(true)} />
                      ) : (
                        <AppButton
                          title={busy ? 'One moment…' : confirmCancel ? 'Tap again to cancel the renewal' : 'Cancel the renewal'}
                          variant="outline"
                          disabled={busy}
                          onPress={() => void changeRenewal(false)}
                        />
                      )}
                      {confirmCancel && !busy && (
                        <Pressable onPress={() => setConfirmCancel(false)} hitSlop={8} accessibilityRole="button" style={pointer}>
                          <Text style={styles.planNote}>Never mind</Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </>
              ) : (
                <>
                  {price && (
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>{price}</Text>
                      <Text style={styles.planPer}>/ month</Text>
                    </View>
                  )}
                  <View style={styles.planList}>
                    {rows.map((r) => (
                      <View key={r.feature} style={styles.planItem}>
                        <View style={styles.goldTick}>
                          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                            <Path d="M20 6L9 17l-5-5" stroke={goldTokens.dark} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
                          </Svg>
                        </View>
                        <Text style={styles.planItemText}>
                          <Text style={styles.planItemBold}>{r.feature}: </Text>
                          {r.pro}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {!offer && !offerFailed ? (
                    <Text style={styles.planNote}>One moment…</Text>
                  ) : offerFailed ? (
                    <Text style={styles.planNote}>Couldn’t load Pro’s details just now. Check your connection.</Text>
                  ) : !offer?.plan ? (
                    <Text style={styles.planNote}>Pro isn’t on sale right now.</Text>
                  ) : !canBuyHere ? (
                    <Text style={styles.planNote}>Pro can be bought on the web, at app.poststreak.app. Sign in there with this account and it switches on here too.</Text>
                  ) : !canPay ? (
                    <>
                      <AppButton title="Start Jarvis Pro" variant="gold" size="lg" disabled />
                      <Text style={styles.planNote}>Payments aren’t switched on yet. Please check back soon.</Text>
                    </>
                  ) : (
                    <>
                      {caps.paymentsStandIn && (
                        <Text style={styles.standIn}>
                          <Text style={styles.standInBold}>Test mode.</Text> A stand-in on this computer takes the payment. No card is charged.
                        </Text>
                      )}
                      <AppButton title={busy ? 'Opening the payment page…' : 'Start Jarvis Pro'} variant="gold" size="lg" disabled={busy} onPress={() => void buy()} />
                      <Text style={styles.planNote}>Paid securely through Stripe. Cancel any time from this page.</Text>
                    </>
                  )}
                </>
              )}
              {problem && (
                <View style={styles.problem}>
                  <Problem message={problem.message} />
                </View>
              )}
            </GlassCard>
          </Animated.View>

          {/* FAQ */}
          <Animated.View entering={enter(400)}>
            <Text style={styles.section}>Questions</Text>
            <GlassCard radius={24} padding={6}>
              {FAQ.map((f, i) => {
                const open = openFaq === i;
                return (
                  <Animated.View key={f.q} style={[styles.faq, i < FAQ.length - 1 && styles.faqLine]}>
                    <Pressable
                      onPress={() => {
                        tick();
                        setOpenFaq(open ? null : i);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ expanded: open }}
                      style={[styles.faqRow, pointer]}
                    >
                      <Text style={styles.faqQ}>{f.q}</Text>
                      <Chevron open={open} />
                    </Pressable>
                    {open && (
                      <Animated.View entering={FadeIn.duration(220)}>
                        <Text style={styles.faqA}>{f.a}</Text>
                      </Animated.View>
                    )}
                  </Animated.View>
                );
              })}
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>

      <FloatingTabBar activeTab="growth" onTabPress={(t) => onNavigateTab?.(t)} />

      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  accent: { color: ds.purple },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  proChip: {
    paddingHorizontal: 9,
    height: 24,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: goldTokens.light,
    borderWidth: 1,
    borderColor: goldTokens.border,
  },
  proChipText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, color: goldTokens.dark },
  goldTick: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: goldTokens.light },

  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  heroTitle: { fontWeight: '800', letterSpacing: -1, color: ds.ink },
  heroBody: { fontSize: 15, lineHeight: 22, color: ds.text2, marginTop: 8 },
  heroPrice: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 16, flexWrap: 'wrap' },
  heroPriceNum: { fontSize: 22, fontWeight: '800', color: ds.ink, letterSpacing: -0.5 },
  heroPriceSub: { fontSize: 13, fontWeight: '600', color: ds.text3 },
  heroCta: { marginTop: 16 },

  exampleChip: { paddingHorizontal: 8, height: 22, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(23, 20, 32, 0.06)', marginTop: 12 },
  exampleText: { fontSize: 11, fontWeight: '800', color: ds.text3 },
  briefHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  briefLead: { flex: 1, fontSize: 14.5, lineHeight: 20, fontWeight: '700', color: ds.ink },
  briefList: { gap: 8, marginTop: 14 },
  briefItem: { borderRadius: 16, padding: 12, backgroundColor: 'rgba(255, 255, 255, 0.7)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.95)' },
  briefItemOpen: { backgroundColor: ds.lavenderSoft, borderColor: ds.lavender },
  briefRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  briefNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center' },
  briefNumOn: { backgroundColor: ds.purple },
  briefNumText: { fontSize: 12.5, fontWeight: '800', color: ds.purple },
  briefTitle: { flex: 1, fontSize: 15, fontWeight: '800', color: ds.ink },
  briefDetail: { fontSize: 13.5, lineHeight: 19, color: ds.text2, marginTop: 8, marginLeft: 36 },

  switchTrack: { flexDirection: 'row', padding: 4, height: 46, borderRadius: 999, backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender },
  switchPill: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 999, backgroundColor: ds.purple },
  switchPillPro: { backgroundColor: goldTokens.light, borderWidth: 1, borderColor: goldTokens.border },
  switchCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  switchText: { fontSize: 14, fontWeight: '800', color: ds.text2 },
  switchTextOn: { color: '#FFFFFF' },
  switchTextPro: { color: goldTokens.dark },
  compare: { marginTop: 8 },
  compareRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  compareFeature: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3, color: ds.text3 },
  compareValueWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  compareValue: { flex: 1, fontSize: 14.5, lineHeight: 20, fontWeight: '700', color: ds.ink },
  compareValuePro: { fontWeight: '800' },
  compareValueOff: { color: ds.text3 },

  planHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName: { fontSize: 18, fontWeight: '800', color: ds.ink },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 6 },
  planPrice: { fontSize: 40, lineHeight: 46, fontWeight: '800', color: ds.ink, letterSpacing: -1.4 },
  planPer: { fontSize: 14, fontWeight: '700', color: ds.text3 },
  planList: { gap: 10, marginTop: 14, marginBottom: 18 },
  planItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planItemText: { flex: 1, fontSize: 14.5, lineHeight: 20, fontWeight: '600', color: ds.text2 },
  planNote: { fontSize: 12.5, lineHeight: 18, color: ds.text3, textAlign: 'center', marginTop: 10 },
  planStatus: { fontSize: 15, lineHeight: 22, fontWeight: '700', color: ds.ink, marginTop: 10 },
  planActions: { marginTop: 16, gap: 4 },
  planItemBold: { fontWeight: '800', color: ds.ink },
  problem: { marginTop: 14 },
  standIn: { fontSize: 12.5, lineHeight: 18, color: goldTokens.dark, backgroundColor: goldTokens.light, borderColor: goldTokens.border, borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 12 },
  standInBold: { fontWeight: '800' },

  faq: { paddingHorizontal: 12 },
  faqLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(23, 20, 32, 0.08)' },
  faqRow: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 },
  faqQ: { flex: 1, fontSize: 15, fontWeight: '800', color: ds.ink },
  faqA: { fontSize: 14, lineHeight: 20, color: ds.text2, paddingBottom: 14 },
});
