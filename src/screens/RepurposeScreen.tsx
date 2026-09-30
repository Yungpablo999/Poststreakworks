import React, { useState, useSyncExternalStore } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Text } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AutoGrowInput } from '../components/ui/AutoGrowInput';
import { FitLines } from '../components/ui/FitLines';
import { AppToast } from '../components/ui/AppToast';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { JarvisOrb } from '../components/JarvisOrb';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { PlatformChip } from '../components/composer/ComposerBlocks';
import { AllowanceMeter } from '../components/create/CreateBlocks';
import { PlatformLogo, type PlatformLogoType } from '../components/onboarding/PlatformLogo';
import type { UserProfileData } from '../components/UserProfileModal';
import type { UserPersona } from '../components/HeaderDualModePills';
import {
  getRepurposeAllowance,
  getRepurposeVersions,
  spendRepurpose,
  subscribeToRepurposes,
  type RepurposeVersion,
} from '../data';
import { STAGE_1_PLATFORMS } from '../config/features';
import { ds } from '../theme/colors';

// Free Repurpose: one idea, written the way each platform works.
// Uses one of the free monthly repurposes per batch; gold only appears for
// the Pro upgrade once they're used up. No scores or streak numbers.

const NAMES: Record<string, string> = {
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  threads: 'Threads',
  facebook: 'Facebook',
};

interface RepurposeScreenProps {
  ideaTitle?: string;
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onUseVersion?: (caption: string, platform: string, idea: string) => void;
  userProfile?: UserProfileData;
  userPersona?: UserPersona;
  onTogglePersona?: () => void;
  onSwitchToPro?: () => void;
}

function VersionCard({
  v,
  index,
  onChange,
  onCopy,
  onUse,
}: {
  v: RepurposeVersion;
  index: number;
  onChange: (body: string) => void;
  onCopy: () => void;
  onUse: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Animated.View entering={FadeInUp.delay(140 * index).duration(360)}>
      <GlassCard strong radius={24} padding={16}>
        <View style={styles.vHead}>
          <PlatformLogo type={v.platform as PlatformLogoType} size={34} />
          <View style={styles.flex}>
            <Text style={styles.vName}>{NAMES[v.platform]}</Text>
            <Text style={styles.vFormat}>{v.format}</Text>
          </View>
          <View style={styles.ready}>
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6L9 17l-5-5" stroke={ds.greenFill} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.readyText}>Ready</Text>
          </View>
        </View>
        <Text style={styles.vTitle}>{v.title}</Text>
        <View style={[styles.field, focused && styles.fieldOn]}>
          <AutoGrowInput
            value={v.body}
            onChangeText={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            minHeight={60}
            style={styles.vBody}
            accessibilityLabel={`${NAMES[v.platform]} version`}
          />
        </View>
        <View style={styles.vActions}>
          <Pressable
            onPress={onCopy}
            accessibilityRole="button"
            accessibilityLabel={`Copy the ${NAMES[v.platform]} version`}
            style={({ pressed }) => [styles.copy, pressed && { transform: [{ scale: 0.96 }] }]}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Rect x="8" y="8" width="12" height="12" rx="2.5" stroke={ds.purple} strokeWidth={2.2} />
              <Path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" stroke={ds.purple} strokeWidth={2.2} />
            </Svg>
            <Text style={styles.copyText}>Copy</Text>
          </Pressable>
          <View style={styles.flex}>
            <AppButton title="Use this" onPress={onUse} />
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  );
}

export const RepurposeScreen: React.FC<RepurposeScreenProps> = ({
  ideaTitle = '3 mistakes new creators make',
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onUseVersion,
  userProfile,
  userPersona,
  onTogglePersona,
  onSwitchToPro,
}) => {
  const persona = (userPersona || userProfile?.userPersona) === 'returning' ? 'returning' : 'new';
  useSyncExternalStore(subscribeToRepurposes, () => getRepurposeAllowance(persona, 'free').usedThisMonth);
  const allowance = getRepurposeAllowance(persona, 'free');
  const limit = allowance.monthlyLimit ?? 0;
  const left = Math.max(0, limit - allowance.usedThisMonth);

  const [idea, setIdea] = useState(ideaTitle);
  const [ideaFocused, setIdeaFocused] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(['tiktok', 'instagram', 'youtube', 'threads']);
  const [versions, setVersions] = useState<RepurposeVersion[]>([]);
  const [working, setWorking] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2400);
  };
  const toggle = (id: string) =>
    setPlatforms((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  const make = () => {
    if (!platforms.length) {
      showToast('Pick at least one platform');
      return;
    }
    if (!spendRepurpose(persona, 'free')) {
      onOpenJarvisPro?.();
      return;
    }
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const next = getRepurposeVersions(idea, platforms);
    setVersions([]);
    // Jarvis "writes" each platform in turn
    setWorking(next.map((v) => v.platform));
    next.forEach((v, i) => {
      setTimeout(() => {
        setVersions((prev) => [...prev, v]);
        setWorking((w) => w.filter((p) => p !== v.platform));
        if (i === next.length - 1 && Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 450 + i * 380);
    });
  };

  const copy = async (v: RepurposeVersion) => {
    try {
      await Clipboard.setStringAsync(v.body);
      showToast(`${NAMES[v.platform]} version copied`);
    } catch {
      showToast('Couldn’t copy. Try again.');
    }
  };

  const order = versions.map((v) => NAMES[v.platform]);
  // Most-used first
  const stage1 = ['tiktok', 'instagram', 'youtube', 'threads', 'facebook'].filter((p) => (STAGE_1_PLATFORMS as readonly string[]).includes(p));

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader
          backgroundColor="transparent"
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onSwitchToPro={onSwitchToPro}
          onTogglePersona={onTogglePersona}
          userPersona={userPersona}
          userProfile={userProfile}
        />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={FadeInUp.duration(500)} style={styles.headline}>
              <FitLines
                lines={['One idea,', <Text key="e" style={styles.accent}>every platform</Text>]}
                textStyle={styles.headlineText}
                maxFontSize={34}
                align="left"
                accessibilityLabel="One idea, every platform"
              />
              <View style={styles.meter}>
                <AllowanceMeter left={left} limit={limit} />
              </View>
            </Animated.View>

            {/* Idea */}
            <Animated.View entering={FadeInUp.delay(80).duration(500)}>
              <GlassCard strong radius={24} padding={16}>
                <View style={styles.ideaHead}>
                  <JarvisOrb size={24} />
                  <Text style={styles.eyebrow}>YOUR IDEA</Text>
                </View>
                <View style={[styles.field, ideaFocused && styles.fieldOn]}>
                  <AutoGrowInput
                    value={idea}
                    onChangeText={setIdea}
                    onFocus={() => setIdeaFocused(true)}
                    onBlur={() => setIdeaFocused(false)}
                    minHeight={26}
                    style={styles.ideaInput}
                    accessibilityLabel="Your idea"
                  />
                </View>
              </GlassCard>
            </Animated.View>

            {/* Platforms */}
            <Text style={styles.section}>Where should it go?</Text>
            <View style={styles.chips}>
              {stage1.map((id) => (
                <PlatformChip key={id} id={id} name={NAMES[id]} selected={platforms.includes(id)} onPress={() => toggle(id)} />
              ))}
            </View>

            <View style={styles.cta}>
              {left > 0 ? (
                <AppButton
                  title={
                    working.length
                      ? 'Jarvis is writing…'
                      : `Make ${platforms.length} version${platforms.length === 1 ? '' : 's'}`
                  }
                  size="lg"
                  disabled={!!working.length}
                  onPress={make}
                  iconRight={
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                      <Path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2z" fill="#FFFFFF" />
                    </Svg>
                  }
                />
              ) : (
                <>
                  <Text style={styles.outText}>You've used this month's free repurposes. They reset next month.</Text>
                  <AppButton title="Get unlimited with Pro" variant="gold" size="lg" onPress={() => onOpenJarvisPro?.()} />
                </>
              )}
              {left > 0 && <Text style={styles.useNote}>Uses 1 of {left} free {left === 1 ? 'repurpose' : 'repurposes'} left this month</Text>}
            </View>

            {/* Versions */}
            {(versions.length > 0 || working.length > 0) && (
              <>
                <Text style={styles.section}>Your versions</Text>
                <View style={styles.stack}>
                  {versions.map((v, i) => (
                    <VersionCard
                      key={v.platform}
                      v={v}
                      index={0}
                      onChange={(body) => setVersions((prev) => prev.map((x, j) => (j === i ? { ...x, body } : x)))}
                      onCopy={() => copy(v)}
                      onUse={() => onUseVersion?.(v.body, v.platform, idea)}
                    />
                  ))}
                  {working.map((p) => (
                    <Animated.View key={`w-${p}`} entering={FadeIn.duration(200)}>
                      <GlassCard radius={20} padding={14}>
                        <View style={styles.writing}>
                          <PlatformLogo type={p as PlatformLogoType} size={26} />
                          <JarvisOrb size={20} />
                          <Text style={styles.writingText}>Writing the {NAMES[p]} version…</Text>
                        </View>
                      </GlassCard>
                    </Animated.View>
                  ))}
                </View>

                {!working.length && order.length > 1 && (
                  <Animated.View entering={FadeInUp.duration(350)} style={styles.tip}>
                    <JarvisOrb size={24} />
                    <Text style={styles.tipText}>
                      Jarvis suggests: post on <Text style={styles.tipBold}>{order[0]}</Text> first, then{' '}
                      <Text style={styles.tipBold}>{order[1]}</Text> about 30 minutes later.
                    </Text>
                  </Animated.View>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.8, color: ds.ink },
  accent: { color: ds.purple },
  meter: { marginTop: 4 },
  ideaHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  field: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    padding: 12,
  },
  fieldOn: { borderColor: ds.purple, backgroundColor: '#FFFFFF' },
  ideaInput: { fontSize: 18, lineHeight: 24, fontWeight: '800' },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 24, marginBottom: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  cta: { marginTop: 18, gap: 8 },
  useNote: { fontSize: 12.5, color: ds.text3, textAlign: 'center' },
  outText: { fontSize: 13.5, lineHeight: 19, color: ds.text2, textAlign: 'center', marginBottom: 4 },
  stack: { gap: 12 },
  vHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vName: { fontSize: 16, fontWeight: '800', color: ds.ink },
  vFormat: { fontSize: 12, fontWeight: '700', color: ds.text3, marginTop: 1 },
  ready: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, height: 22, borderRadius: 999, backgroundColor: ds.greenBg },
  readyText: { fontSize: 11, fontWeight: '800', color: ds.greenFill },
  vTitle: { fontSize: 13.5, fontWeight: '800', color: ds.text2, marginTop: 12, marginBottom: 8 },
  vBody: { fontSize: 14.5, lineHeight: 21 },
  vActions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 46, paddingHorizontal: 14, borderRadius: 14, backgroundColor: ds.lavender },
  copyText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  writing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  writingText: { fontSize: 13.5, fontWeight: '700', color: ds.purple },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    padding: 14,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.95)',
  },
  tipText: { flex: 1, fontSize: 13.5, lineHeight: 19, color: ds.text2 },
  tipBold: { fontWeight: '800', color: ds.ink },
});
