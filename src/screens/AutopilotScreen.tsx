import React, { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { Easing, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { AppToast } from '../components/ui/AppToast';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { PurpleGoldSwitch } from '../components/PurpleGoldSwitch';
import { usePageWidth } from '../hooks/useBreakpoint';
import { ds } from '../theme/colors';
import {
  AUTOPILOT_PLATFORMS,
  MAX_TOPICS,
  MAX_TOPIC_LENGTH,
  addTopic,
  autopilotApi,
  describeAutopilotError,
  setupProblem,
  toggleItem,
  type AutopilotConfig,
  type AutopilotMode,
  type AutopilotResult,
} from '../api/autopilot';

// Autopilot setup: what to post about, where, and whether to review first.
// Saved on the backend (/api/autopilot/config); "Run now" asks Jarvis to write one post per
// platform right away (/api/autopilot/run) and shows what it wrote.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const MODES: { id: AutopilotMode; label: string; hint: string }[] = [
  { id: 'suggest', label: 'Review first', hint: 'Posts land in your queue as drafts. You approve each one.' },
  { id: 'auto', label: 'Post for me', hint: 'Posts are scheduled a few minutes after they are written.' },
];

interface AutopilotScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onSwitchToFree?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

export const AutopilotScreen: React.FC<AutopilotScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onSwitchToFree,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const pageWidth = usePageWidth();
  const [showProfile, setShowProfile] = useState(false);
  const [config, setConfig] = useState<AutopilotConfig | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [draftTopic, setDraftTopic] = useState('');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AutopilotResult | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast((t) => (t === m ? null : t)), 2600);
  }, []);

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      setConfig(await autopilotApi.getConfig());
    } catch (e) {
      setLoadFailed(true);
      showToast(describeAutopilotError(e));
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const change = (next: Partial<AutopilotConfig>) => {
    setConfig((c) => (c ? { ...c, ...next } : c));
    setDirty(true);
  };

  const submitTopic = () => {
    if (!config) return;
    const next = addTopic(config.topics, draftTopic);
    if (next === config.topics) {
      if (config.topics.length >= MAX_TOPICS) showToast(`You can add up to ${MAX_TOPICS} topics.`);
      setDraftTopic('');
      return;
    }
    tick();
    change({ topics: next });
    setDraftTopic('');
  };

  /** Saves what is on screen. Returns the saved config, or null when it could not be saved. */
  const save = async (next: AutopilotConfig): Promise<AutopilotConfig | null> => {
    setSaving(true);
    try {
      const saved = await autopilotApi.saveConfig(next);
      setConfig(saved);
      setDirty(false);
      return saved;
    } catch (e) {
      showToast(describeAutopilotError(e));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const onSave = async () => {
    if (!config) return;
    if (config.enabled) {
      const problem = setupProblem(config);
      if (problem) return showToast(problem);
    }
    if (await save(config)) showToast('Autopilot saved');
  };

  const onRun = async () => {
    if (!config || running) return;
    const problem = setupProblem(config);
    if (problem) return showToast(problem);
    setRunning(true);
    setResult(null);
    try {
      // The run reads the saved setup, so save any edits first
      if (dirty && !(await save(config))) return;
      const res = await autopilotApi.run();
      setResult(res);
      showToast(res.message);
    } catch (e) {
      showToast(describeAutopilotError(e));
    } finally {
      setRunning(false);
    }
  };

  const enter = (d: number) => FadeInUp.delay(d).duration(500).easing(Easing.out(Easing.cubic));
  const mode = MODES.find((m) => m.id === config?.mode) ?? MODES[0];

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.flex} edges={['top']}>
        <FreeAppHeader backgroundColor="transparent" onBack={onBack} onOpenJarvisPro={onOpenJarvisPro} onSwitchToFree={onSwitchToFree} onOpenProfile={() => setShowProfile(true)} userProfile={userProfile} />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={[styles.scroll, pageWidth]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Animated.View entering={enter(0)} style={styles.headline}>
              <FitLines lines={['Your', <Text key="a" style={styles.accent}>autopilot</Text>]} textStyle={styles.headlineText} maxFontSize={38} align="left" accessibilityLabel="Your autopilot" />
              <Text style={styles.sub}>Pick your topics and where to post. Jarvis writes the posts.</Text>
            </Animated.View>

            {!config && !loadFailed && (
              <View style={styles.center}>
                <ActivityIndicator color={ds.purple} />
              </View>
            )}

            {loadFailed && (
              <GlassCard strong radius={24} padding={16}>
                <Text style={styles.cardTitle}>Couldn’t load your autopilot</Text>
                <View style={{ marginTop: 12 }}>
                  <AppButton title="Try again" variant="outline" onPress={() => void load()} />
                </View>
              </GlassCard>
            )}

            {config && (
              <>
                {/* On / off */}
                <Animated.View entering={enter(60)}>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.rowBetween}>
                      <View style={styles.flex}>
                        <Text style={styles.cardTitle}>Autopilot is {config.enabled ? 'on' : 'off'}</Text>
                        <Text style={styles.hint}>{config.enabled ? 'It writes for you on its schedule.' : 'Turn it on when your setup is ready.'}</Text>
                      </View>
                      <PurpleGoldSwitch value={config.enabled} onValueChange={(v) => change({ enabled: v })} />
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Topics */}
                <Animated.View entering={enter(120)}>
                  <Text style={styles.section}>Topics</Text>
                  <GlassCard strong radius={24} padding={16}>
                    <View style={styles.addRow}>
                      <View style={styles.field}>
                        <TextInput
                          value={draftTopic}
                          onChangeText={setDraftTopic}
                          onSubmitEditing={submitTopic}
                          placeholder="e.g. lessons from building in public"
                          placeholderTextColor={ds.text3}
                          maxLength={MAX_TOPIC_LENGTH}
                          returnKeyType="done"
                          accessibilityLabel="Add a topic"
                          style={styles.input}
                        />
                      </View>
                      <Pressable onPress={submitTopic} accessibilityRole="button" accessibilityLabel="Add topic" style={({ pressed }) => [styles.addBtn, pressed && styles.pressed, pointer]}>
                        <Text style={styles.addBtnText}>Add</Text>
                      </Pressable>
                    </View>
                    <View style={styles.chips}>
                      {config.topics.length === 0 && <Text style={styles.hint}>No topics yet. Add one or two things you post about.</Text>}
                      {config.topics.map((t) => (
                        <Pressable key={t} onPress={() => { tick(); change({ topics: config.topics.filter((x) => x !== t) }); }} accessibilityRole="button" accessibilityLabel={`Remove ${t}`} style={({ pressed }) => [styles.chip, styles.chipOn, pressed && styles.pressed, pointer]}>
                          <Text style={[styles.chipText, styles.chipTextOn]}>{t}  ×</Text>
                        </Pressable>
                      ))}
                    </View>
                  </GlassCard>
                </Animated.View>

                {/* Platforms */}
                <Animated.View entering={enter(180)}>
                  <Text style={styles.section}>Post to</Text>
                  <View style={styles.chips}>
                    {AUTOPILOT_PLATFORMS.map((p) => {
                      const on = config.platforms.includes(p.id);
                      return (
                        <Pressable key={p.id} onPress={() => { tick(); change({ platforms: toggleItem(config.platforms, p.id) }); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed, pointer]}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{p.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.footnote}>Connect these accounts in Settings so posts can go out.</Text>
                </Animated.View>

                {/* Mode */}
                <Animated.View entering={enter(240)}>
                  <Text style={styles.section}>How should it post?</Text>
                  <View style={styles.chips}>
                    {MODES.map((m) => {
                      const on = m.id === config.mode;
                      return (
                        <Pressable key={m.id} onPress={() => { tick(); change({ mode: m.id }); }} accessibilityRole="radio" accessibilityState={{ checked: on }} style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed, pointer]}>
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{m.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={styles.footnote}>{mode.hint}</Text>
                </Animated.View>

                {/* Actions */}
                <Animated.View entering={enter(300)} style={styles.actions}>
                  <AppButton title={saving ? 'Saving…' : 'Save'} onPress={() => void onSave()} disabled={saving || running || !dirty} />
                  <AppButton title={running ? 'Writing…' : 'Run now'} variant="outline" onPress={() => void onRun()} disabled={saving || running} />
                </Animated.View>

                {/* Result of Run now */}
                {result && (
                  <Animated.View entering={enter(0)}>
                    <Text style={styles.section}>{result.generated.length ? `Written for “${result.topic}”` : 'Nothing was written'}</Text>
                    <View style={styles.stack}>
                      {result.generated.map((g) => (
                        <GlassCard key={g.platform} strong radius={20} padding={14}>
                          <Text style={styles.eyebrow}>
                            {(AUTOPILOT_PLATFORMS.find((p) => p.id === g.platform)?.label ?? g.platform).toUpperCase()} · {g.status === 'scheduled' ? 'SCHEDULED' : 'DRAFT'}
                          </Text>
                          <Text style={styles.postText}>{g.content}</Text>
                        </GlassCard>
                      ))}
                      {result.errors.map((er) => (
                        <GlassCard key={`e-${er.platform}`} radius={20} padding={14}>
                          <Text style={styles.eyebrow}>{(AUTOPILOT_PLATFORMS.find((p) => p.id === er.platform)?.label ?? er.platform).toUpperCase()}</Text>
                          <Text style={styles.hint}>Couldn’t write this one. Try again in a moment.</Text>
                        </GlassCard>
                      ))}
                      {result.generated.length > 0 && <Text style={styles.footnote}>{result.mode === 'auto' ? 'Scheduled posts are in your Schedule.' : 'Review your drafts in the queue.'}</Text>}
                    </View>
                  </Animated.View>
                )}
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {toast && <AppToast message={toast} />}
      <FloatingTabBar activeTab="create" onTabPress={(t) => onNavigateTab?.(t)} />
      <UserProfileModal visible={showProfile} onClose={() => setShowProfile(false)} onLogout={onLogout} initialProfile={userProfile} onSaveProfile={onSaveProfile} />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ds.bg },
  flex: { flex: 1 },
  center: { paddingVertical: 40, alignItems: 'center' },
  pressed: { transform: [{ scale: 0.96 }] },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 130, width: '100%', maxWidth: 560, alignSelf: 'center' },
  headline: { marginTop: 4, marginBottom: 16 },
  headlineText: { fontWeight: '800', letterSpacing: -0.9, color: ds.ink },
  accent: { color: ds.purple },
  sub: { fontSize: 14.5, lineHeight: 20, color: ds.text2, marginTop: 6 },
  section: { fontSize: 17, fontWeight: '800', color: ds.ink, letterSpacing: -0.2, marginTop: 22, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: ds.ink },
  hint: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: ds.text2, marginTop: 2 },
  footnote: { fontSize: 12.5, lineHeight: 18, fontWeight: '600', color: ds.text3, marginTop: 8 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: ds.purple },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { flex: 1, borderRadius: 16, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)', backgroundColor: 'rgba(255, 255, 255, 0.85)', paddingHorizontal: 12, paddingVertical: 10 },
  input: { fontSize: 15, fontWeight: '700', color: ds.ink },
  addBtn: { paddingHorizontal: 16, height: 40, borderRadius: 999, justifyContent: 'center', backgroundColor: ds.lavender },
  addBtnText: { fontSize: 13.5, fontWeight: '800', color: ds.purple },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { paddingHorizontal: 14, height: 38, borderRadius: 999, justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.85)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.95)' },
  chipOn: { backgroundColor: ds.purple, borderColor: ds.purple },
  chipText: { fontSize: 13.5, fontWeight: '800', color: ds.text2 },
  chipTextOn: { color: '#FFFFFF' },
  actions: { gap: 10, marginTop: 24 },
  stack: { gap: 10 },
  postText: { fontSize: 14.5, lineHeight: 21, fontWeight: '600', color: ds.ink, marginTop: 6 },
});
