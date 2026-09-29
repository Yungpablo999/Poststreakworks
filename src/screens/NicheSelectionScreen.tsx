import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, ScrollView, Pressable, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text, TextInput } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { FitLines } from '../components/ui/FitLines';
import { GlassBackdrop } from '../components/glass/GlassBackdrop';
import { GlassCard } from '../components/glass/GlassCard';
import { BlurView } from 'expo-blur';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { NicheTile } from '../components/onboarding/NicheTile';
import { JarvisOrb } from '../components/JarvisOrb';
import type { NicheIconType } from '../components/onboarding/NicheIcon';
import { ds } from '../theme/colors';

interface NicheItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: NicheIconType;
}

const DEFAULT_NICHES: NicheItem[] = [
  { id: 'lifestyle', title: 'Lifestyle', subtitle: 'Routines, self-care, everyday life', iconType: 'lifestyle' },
  { id: 'comedy', title: 'Comedy', subtitle: 'Skits, humour and reactions', iconType: 'comedy' },
  { id: 'education', title: 'Education', subtitle: 'Tutorials and explainers', iconType: 'education' },
  { id: 'beauty', title: 'Beauty & Fashion', subtitle: 'Makeup, style and grooming', iconType: 'beauty' },
  { id: 'food', title: 'Food', subtitle: 'Recipes, reviews and cooking', iconType: 'food' },
  { id: 'fitness', title: 'Fitness', subtitle: 'Workouts and healthy living', iconType: 'fitness' },
  { id: 'tech', title: 'Tech & Business', subtitle: 'Productivity and money', iconType: 'tech' },
  { id: 'music', title: 'Music & Dance', subtitle: 'Performance and rhythm', iconType: 'music' },
];

const MAX_NICHES = 3;

interface NicheSelectionScreenProps {
  onBack: () => void;
  onContinue: (selectedNiches: string[]) => void;
}

export const NicheSelectionScreen: React.FC<NicheSelectionScreenProps> = ({ onBack, onContinue }) => {
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNiches, setCustomNiches] = useState<NicheItem[]>([]);
  const [showCustomSheet, setShowCustomSheet] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Limit hint floats above the footer so it's visible wherever the list is scrolled
  const hintOpacity = useSharedValue(0);
  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
    transform: [{ translateY: (1 - hintOpacity.value) * 8 }],
  }));

  // Counter pill: bumps on every change, shakes when the limit is hit
  const counterScale = useSharedValue(1);
  const counterShake = useSharedValue(0);
  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }, { translateX: counterShake.value }],
  }));

  useEffect(() => () => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
  }, []);

  const bumpCounter = () => {
    counterScale.value = withSequence(withTiming(1.12, { duration: 110 }), withSpring(1, { damping: 10 }));
  };

  const signalLimit = () => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    counterShake.value = withSequence(
      withTiming(-7, { duration: 50 }),
      withTiming(7, { duration: 50 }),
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    hintOpacity.value = withTiming(1, { duration: 180 });
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => {
      hintOpacity.value = withTiming(0, { duration: 250 });
    }, 2600);
  };

  const toggleNiche = (id: string) => {
    if (selectedNiches.includes(id)) {
      setSelectedNiches(selectedNiches.filter((item) => item !== id));
      bumpCounter();
      return;
    }
    if (selectedNiches.length >= MAX_NICHES) {
      signalLimit();
      return;
    }
    setSelectedNiches([...selectedNiches, id]);
    bumpCounter();
  };

  const handleAddCustomNiche = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const newItem: NicheItem = { id: `custom_${Date.now()}`, title: trimmed, subtitle: 'Your own niche', iconType: 'custom' };
    setCustomNiches([...customNiches, newItem]);
    if (selectedNiches.length < MAX_NICHES) {
      setSelectedNiches([...selectedNiches, newItem.id]);
      bumpCounter();
    } else {
      signalLimit();
    }
    setCustomInput('');
    setShowCustomSheet(false);
  };

  const handleContinue = () => {
    if (selectedNiches.length === 0) return;
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onContinue(selectedNiches);
  };

  const allNiches = [...DEFAULT_NICHES, ...customNiches];
  // With an even number of niches the "Add your own" tile would sit alone on the last row
  const addTileAlone = allNiches.length % 2 === 0;
  const count = selectedNiches.length;

  return (
    <View style={styles.root}>
      <GlassBackdrop />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Top: back + progress */}
        <View style={styles.header}>
          <Pressable onPress={onBack} hitSlop={10} accessibilityRole="button" accessibilityLabel="Go back" style={styles.backBtn}>
            <BlurView intensity={30} tint="light" style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]} />
            {/* Wrapped so the arrow always draws above the frosted layer */}
            <View>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path d="M15 18l-6-6 6-6" stroke={ds.ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
            </View>
          </Pressable>
          <Animated.View entering={FadeInUp.duration(500)} style={styles.progressWrap}>
            <OnboardingProgress current={0} />
          </Animated.View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Title */}
          <Animated.View entering={FadeInUp.delay(120).duration(550)}>
            {/* Always two lines: "What kind of creator are" / "you?", scaled to the screen */}
            <FitLines
              lines={['What kind of creator are', <Text key="you" style={styles.titleAccent}>you?</Text>]}
              textStyle={styles.title}
              maxFontSize={40}
              accessibilityLabel="What kind of creator are you?"
            />
            <Text style={styles.subtitle}>Pick up to 3. Jarvis uses them to suggest ideas and the best times to post. You can change them later.</Text>
          </Animated.View>

          {/* Live counter */}
          <Animated.View entering={FadeIn.delay(260).duration(400)} style={styles.counterRow}>
            <Animated.View style={[styles.counterPill, count > 0 && styles.counterPillActive, counterStyle]}>
              <Text style={[styles.counterText, count > 0 && styles.counterTextActive]}>
                {count} of {MAX_NICHES} selected
              </Text>
            </Animated.View>
          </Animated.View>

          {/* Niche grid */}
          <View style={styles.grid}>
            {allNiches.map((niche, i) => (
              <Animated.View
                key={niche.id}
                entering={FadeInUp.delay(300 + i * 55).duration(500)}
                style={styles.gridItem}
              >
                <NicheTile
                  title={niche.title}
                  subtitle={niche.subtitle}
                  icon={niche.iconType}
                  selected={selectedNiches.includes(niche.id)}
                  onPress={() => toggleNiche(niche.id)}
                />
              </Animated.View>
            ))}

            {/* Add your own: full-width bar when it would sit alone on its row, half tile otherwise */}
            <Animated.View
              entering={FadeInUp.delay(300 + allNiches.length * 55).duration(500)}
              style={addTileAlone ? styles.gridItemFull : styles.gridItem}
            >
              <Pressable
                onPress={() => setShowCustomSheet(true)}
                style={({ pressed }) => [
                  styles.addTile,
                  addTileAlone && styles.addTileWide,
                  pressed && { opacity: 0.7, transform: [{ scale: 0.98 }] },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Add your own niche"
              >
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
                  <Path d="M12 5v14M5 12h14" stroke={ds.purple} strokeWidth={2.4} strokeLinecap="round" />
                </Svg>
                <Text style={styles.addTileText}>Add your own</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Jarvis note */}
          <Animated.View entering={FadeIn.delay(800).duration(500)} style={styles.jarvisNote}>
            <JarvisOrb size={30} />
            <Text style={styles.jarvisText}>
              <Text style={styles.jarvisName}>Jarvis: </Text>
              no wrong answers here. Pick what you enjoy making most.
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Limit hint, floating just above the footer */}
        <Animated.View pointerEvents="none" style={[styles.limitToast, hintStyle]} accessibilityLiveRegion="polite">
            <Text style={styles.limitToastText}>Up to 3 for now. Tap one of yours to swap it.</Text>
          </Animated.View>
        {/* Sticky glass footer with the one clear action */}
        <View style={styles.footer}>
          <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, styles.footerFill]} />
          <SafeAreaView edges={['bottom']} style={styles.footerInner}>
            <AppButton
              title={count === 0 ? 'Pick at least one niche' : 'Continue'}
              size="lg"
              disabled={count === 0}
              onPress={handleContinue}
              iconRight={
                count > 0 ? (
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                ) : undefined
              }
            />
          </SafeAreaView>
        </View>
      </SafeAreaView>

      {/* Add-your-own sheet */}
      <Modal visible={showCustomSheet} transparent animationType="fade" onRequestClose={() => setShowCustomSheet(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowCustomSheet(false)} accessibilityLabel="Close" />
          <Animated.View entering={FadeInUp.duration(300)} style={styles.sheetWrap}>
            <GlassCard strong radius={28} padding={20}>
              <Text style={styles.sheetTitle}>Add your own niche</Text>
              <Text style={styles.sheetSub}>What do you make? A word or two is perfect.</Text>
              <TextInput
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="e.g. Pets, Travel, 3D art"
                placeholderTextColor={ds.text3}
                style={styles.sheetInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddCustomNiche}
                maxLength={32}
              />
              <View style={styles.sheetActions}>
                <View style={{ flex: 1 }}>
                  <AppButton title="Cancel" variant="glass" onPress={() => setShowCustomSheet(false)} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton title="Add niche" onPress={handleAddCustomNiche} disabled={!customInput.trim()} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ds.bg,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 6,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  progressWrap: {
    width: '100%',
  },
  scroll: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 140,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  title: {
    fontWeight: '800',
    letterSpacing: -0.6,
    color: ds.ink,
  },
  titleAccent: {
    color: ds.purple,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: ds.text2,
    marginTop: 10,
    textAlign: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 14,
    minHeight: 30,
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: ds.line,
  },
  counterPillActive: {
    backgroundColor: ds.purple,
    borderColor: ds.purple,
  },
  counterText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: ds.text2,
  },
  counterTextActive: {
    color: '#FFFFFF',
  },
  limitToast: {
    position: 'absolute',
    bottom: 118,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: ds.ink,
    zIndex: 5,
  },
  limitToastText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  gridItem: {
    width: '48%',
    alignSelf: 'stretch',
  },
  addTile: {
    minHeight: 132,
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#B9ACF7',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  gridItemFull: {
    width: '100%',
  },
  addTileWide: {
    minHeight: 64,
    flexDirection: 'row',
    gap: 10,
  },
  addTileText: {
    fontSize: 14,
    fontWeight: '800',
    color: ds.purple,
  },
  jarvisNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
    paddingHorizontal: 4,
  },
  jarvisText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: ds.text2,
  },
  jarvisName: {
    fontWeight: '800',
    color: ds.purple,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.9)',
  },
  footerFill: {
    backgroundColor: 'rgba(247, 245, 240, 0.6)',
  },
  footerInner: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  sheetBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(23, 20, 32, 0.25)',
  },
  sheetWrap: {
    padding: 16,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: ds.ink,
  },
  sheetSub: {
    fontSize: 14,
    color: ds.text2,
    marginTop: 4,
  },
  sheetInput: {
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: ds.ink,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: ds.line,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
});
