import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Platform,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  Animated,
  Modal,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface NicheItem {
  id: string;
  title: string;
  subtitle: string;
  iconType: 'lifestyle' | 'comedy' | 'education' | 'beauty' | 'food' | 'fitness' | 'tech' | 'music' | 'custom';
}

const DEFAULT_NICHES: NicheItem[] = [
  {
    id: 'lifestyle',
    title: 'Lifestyle',
    subtitle: 'Daily life, routines, self-care and personal content',
    iconType: 'lifestyle',
  },
  {
    id: 'comedy',
    title: 'Comedy',
    subtitle: 'Skits, humour, reactions and entertaining content',
    iconType: 'comedy',
  },
  {
    id: 'education',
    title: 'Education',
    subtitle: 'Tutorials, explainers, teaching and informative content',
    iconType: 'education',
  },
  {
    id: 'beauty',
    title: 'Beauty & Fashion',
    subtitle: 'Makeup, style, grooming and fashion-led content',
    iconType: 'beauty',
  },
  {
    id: 'food',
    title: 'Food',
    subtitle: 'Recipes, food reviews, dining and cooking content',
    iconType: 'food',
  },
  {
    id: 'fitness',
    title: 'Fitness',
    subtitle: 'Workouts, wellness, motivation and healthy living',
    iconType: 'fitness',
  },
  {
    id: 'tech',
    title: 'Tech & Business',
    subtitle: 'Tech, productivity, entrepreneurship and money content',
    iconType: 'tech',
  },
  {
    id: 'music',
    title: 'Music & Dance',
    subtitle: 'Dance, music, performance and rhythm-led content',
    iconType: 'music',
  },
];

interface NicheSelectionScreenProps {
  onBack: () => void;
  onContinue: (selectedNiches: string[]) => void;
}

export const NicheSelectionScreen: React.FC<NicheSelectionScreenProps> = ({
  onBack,
  onContinue,
}) => {
  // Clean initial state (empty by default so user selects up to 3)
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [customNiches, setCustomNiches] = useState<NicheItem[]>([]);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [modalType, setModalType] = useState<'limit' | 'required'>('limit');
  const [customInput, setCustomInput] = useState('');

  // 1. Star-like Glowing & Floating Kinetic Physics on the Icon Alone (Zero Circles)
  const jarvisFloatY = useRef(new Animated.Value(0)).current;
  const jarvisStarScale = useRef(new Animated.Value(1)).current;
  const modalPopScale = useRef(new Animated.Value(0.85)).current;

  // 2. Responsive Niche Capacity Bar (0 = 0%, 1 = 33%, 2 = 66%, 3 = 100% full)
  const barWidthAnim = useRef(new Animated.Value(selectedNiches.length / 3)).current;

  useEffect(() => {
    Animated.spring(barWidthAnim, {
      toValue: Math.min(selectedNiches.length / 3, 1),
      useNativeDriver: false,
      speed: 20,
      bounciness: 6,
    }).start();
  }, [selectedNiches.length, barWidthAnim]);

  useEffect(() => {
    // Star Pulsation & Living Celestial Float Loop
    const starLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(jarvisFloatY, {
            toValue: -8,
            duration: 1100,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 1.12,
            duration: 1100,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(jarvisFloatY, {
            toValue: 5,
            duration: 1050,
            useNativeDriver: true,
          }),
          Animated.timing(jarvisStarScale, {
            toValue: 0.95,
            duration: 1050,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    starLoop.start();
    return () => starLoop.stop();
  }, [jarvisFloatY, jarvisStarScale]);

  const openJarvisModal = (type: 'limit' | 'required') => {
    setModalType(type);
    setShowLimitModal(true);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 22,
      bounciness: 10,
    }).start();
  };

  const toggleNiche = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedNiches.includes(id)) {
      setSelectedNiches(selectedNiches.filter((item) => item !== id));
    } else {
      if (selectedNiches.length >= 3) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        openJarvisModal('limit');
        return;
      }
      setSelectedNiches([...selectedNiches, id]);
    }
  };

  const handleCloseLimitModal = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setShowLimitModal(false);
    modalPopScale.setValue(0.85);
  };

  const handleAddCustomNiche = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    const newId = `custom_${Date.now()}`;
    const newItem: NicheItem = {
      id: newId,
      title: trimmed,
      subtitle: 'Custom creator content niche',
      iconType: 'custom',
    };
    setCustomNiches([...customNiches, newItem]);
    if (selectedNiches.length < 3) {
      setSelectedNiches([...selectedNiches, newId]);
    } else {
      openJarvisModal('limit');
    }
    setCustomInput('');
    setShowCustomModal(false);
  };

  const handleContinue = () => {
    if (selectedNiches.length === 0) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      openJarvisModal('required');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onContinue(selectedNiches);
  };

  // Render Category Vector Icons
  const renderNicheIcon = (type: NicheItem['iconType'], isSelected: boolean) => {
    const strokeColor = isSelected ? '#582CDB' : '#736B88';

    switch (type) {
      case 'lifestyle':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V9.5Z"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M9 21V12H15V21"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'comedy':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth="2" />
            <Path
              d="M8 14C8 14 9.5 17 12 17C14.5 17 16 14 16 14"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
            />
            <Circle cx="9" cy="9.5" r="1.25" fill={strokeColor} />
            <Circle cx="15" cy="9.5" r="1.25" fill={strokeColor} />
          </Svg>
        );
      case 'education':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M22 10L12 5L2 10L12 15L22 10Z"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M6 12V17C6 18.6569 8.68629 20 12 20C15.3137 20 18 18.6569 18 17V12"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M22 10V16" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" />
          </Svg>
        );
      case 'beauty':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="6" r="2.5" stroke={strokeColor} strokeWidth="2" />
            <Path
              d="M6 21L8 10H16L18 21H6Z"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d="M10 10V14" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          </Svg>
        );
      case 'food':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M18 4V10C18 11.1046 17.1046 12 16 12H14C12.8954 12 12 11.1046 12 10V4M15 4V20"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M6 4V20M9 4V10C9 11.1046 8.10457 12 7 12H5C3.89543 12 3 11.1046 3 10V4"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'fitness':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6.5 6.5L17.5 17.5M4 8L8 4M16 20L20 16M3 11L11 3M13 21L21 13"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'tech':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 20H21M5 16V17M10 12V17M15 8V17M20 4V17"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M4 11L9 7L14 10L20 4"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
      case 'music':
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 18V5L20 3V16M9 9L20 7"
              stroke={strokeColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Circle cx="6" cy="18" r="3" stroke={strokeColor} strokeWidth="2" />
            <Circle cx="17" cy="16" r="3" stroke={strokeColor} strokeWidth="2" />
          </Svg>
        );
      default:
        return (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 4V20M4 12H20"
              stroke={strokeColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        );
    }
  };

  const allNiches = [...DEFAULT_NICHES, ...customNiches];
  const hasSelection = selectedNiches.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* 1. TOP BAR: Back Arrow + 4-Step Progress Indicator (Step 2 Active) */}
          <View style={styles.topBar}>
            <Pressable
              onPress={onBack}
              hitSlop={14}
              style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            >
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M19 12H5M5 12L12 19M5 12L12 5"
                  stroke="#1A1626"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Pressable>

            <View style={styles.progressContainer}>
              <View style={[styles.progressSegment, styles.progressActive]} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
              <View style={styles.progressSegment} />
            </View>

            {/* Placeholder to balance left arrow */}
            <View style={styles.topBarRightPlaceholder} />
          </View>

          {/* 2. HEADINGS */}
          <View style={styles.headingSection}>
            <Text style={styles.mainHeading}>
              What kind of creator are <Text style={styles.headingPurple}>you?</Text>
            </Text>
            <Text style={styles.helperText}>Select up to 3 niches</Text>
          </View>

          {/* 3. RESPONSIVE NICHE CAPACITY BAR */}
          <View style={styles.horizontalBarContainer}>
            <Animated.View
              style={[
                styles.horizontalBarActive,
                {
                  width: barWidthAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>

          {/* 4. NICHE SELECTION CARDS */}
          <View style={styles.nicheList}>
            {allNiches.map((niche) => {
              const isSelected = selectedNiches.includes(niche.id);
              return (
                <Pressable
                  key={niche.id}
                  onPress={() => toggleNiche(niche.id)}
                  style={({ pressed }) => [
                    styles.nicheCard,
                    isSelected && styles.nicheCardSelected,
                    pressed && styles.nicheCardPressed,
                  ]}
                >
                  {/* Category Icon in Lavender Box */}
                  <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
                    {renderNicheIcon(niche.iconType, isSelected)}
                  </View>

                  {/* Title & Subtitle */}
                  <View style={styles.nicheTextContainer}>
                    <Text
                      style={[styles.nicheTitle, isSelected && styles.nicheTitleSelected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.85}
                    >
                      {niche.title}
                    </Text>
                    <Text style={styles.nicheSubtitle}>{niche.subtitle}</Text>
                  </View>

                  {/* Selected Checkmark Pill */}
                  {isSelected && (
                    <View style={styles.selectedCheckBadge}>
                      <Text style={styles.selectedCheckText}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}

            {/* + Add Custom Niche Button */}
            <Pressable
              onPress={() => setShowCustomModal(true)}
              style={({ pressed }) => [
                styles.addCustomCard,
                pressed && styles.addCustomCardPressed,
              ]}
            >
              <Text style={styles.addCustomText}>+ Add custom niche</Text>
            </Pressable>
          </View>

          {/* 5. CONTINUE BUTTON */}
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              !hasSelection && styles.continueButtonDisabled,
              pressed && hasSelection && styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </Pressable>

          {/* 6. JARVIS CORE SECTION: Pure Glowing Star-Flame (Zero Circles, Zero Frames) */}
          <View style={styles.jarvisAdviceSection}>
            <Animated.View
              style={[
                styles.pureStarWrapper,
                {
                  transform: [
                    { translateY: jarvisFloatY },
                    { scale: jarvisStarScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.pureStarImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Jarvis Core Name */}
            <Text style={styles.jarvisTitle}>Jarvis Core</Text>

            {/* Speech / Advice Bubble */}
            <View style={styles.adviceBubble}>
              <Text style={styles.adviceText}>
                &ldquo;Your niche helps PostStreak recommend the right creators, missions and Brand Quests.&rdquo;
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* 7. BOTTOM STATUS BAR (Niche Step / 25% Complete) */}
        <View style={styles.bottomStatusBar}>
          <View style={styles.statusLeftGroup}>
            <View style={styles.statusIconBadge}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 4V20M4 12H20"
                  stroke="#582CDB"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </Svg>
            </View>
            <Text style={styles.statusLabelText}>Niche Step</Text>
          </View>

          <Text style={styles.statusPercentageText}>25% Complete</Text>
        </View>
      </View>

      {/* 8. JARVIS CORE LIMIT POPUP MODAL (> 3 Niches) */}
      <Modal
        visible={showLimitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseLimitModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.limitModalCard,
              {
                transform: [{ scale: modalPopScale }],
              },
            ]}
          >
            {/* Pure Glowing Star-Flame in Pop-up (Zero Circles) */}
            <Animated.View
              style={[
                styles.modalPureStarWrapper,
                {
                  transform: [
                    { translateY: jarvisFloatY },
                    { scale: jarvisStarScale },
                  ],
                },
              ]}
            >
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.modalPureStarImage}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Jarvis Core Badge */}
            <View style={styles.jarvisCoreBadge}>
              <Text style={styles.jarvisBadgeSparkle}>🔥</Text>
              <Text style={styles.jarvisBadgeText}>JARVIS CORE</Text>
            </View>

            {/* Modal Heading */}
            <Text style={styles.limitModalTitle}>
              {modalType === 'required' ? 'Select a niche' : '3 niches max'}
            </Text>

            {/* Modal Advice Message */}
            <Text style={styles.limitModalText}>
              {modalType === 'required' ? (
                <>
                  Please choose at least <Text style={styles.limitHighlight}>1 niche</Text> so Jarvis can personalise your creator setup.
                </>
              ) : (
                <>
                  For now, focus on your <Text style={styles.limitHighlight}>3 strongest niches</Text> so Jarvis can personalise your experience.
                </>
              )}
            </Text>

            <Text style={styles.limitSubNote}>
              {modalType === 'required'
                ? 'You can choose up to 3 niches for your creator profile.'
                : 'You can add more later from your creator profile.'}
            </Text>

            {/* Got It Button */}
            <Pressable
              onPress={handleCloseLimitModal}
              style={({ pressed }) => [
                styles.gotItButton,
                pressed && styles.gotItButtonPressed,
              ]}
            >
              <Text style={styles.gotItButtonText}>Got it, Jarvis  ✓</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      {/* 9. CUSTOM NICHE INPUT MODAL */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCustomModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Custom Niche</Text>
            <Text style={styles.modalSubtitle}>
              Type your custom content category or specialisation
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 3D Animation, Crypto, Pets..."
              placeholderTextColor="#A59EBA"
              value={customInput}
              onChangeText={setCustomInput}
              autoFocus={true}
            />

            <View style={styles.modalBtnRow}>
              <Pressable
                onPress={() => setShowCustomModal(false)}
                style={styles.modalCancelBtn}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleAddCustomNiche}
                style={styles.modalAddBtn}
              >
                <Text style={styles.modalAddText}>Add Niche</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  container: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  keyboardAvoid: {
    flex: 1,
    backgroundColor: '#FAF9FD',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    height: 40,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  backButtonPressed: {
    opacity: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressSegment: {
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
  },
  progressActive: {
    width: 48,
    backgroundColor: '#582CDB',
  },
  topBarRightPlaceholder: {
    width: 36,
  },
  headingSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  mainHeading: {
    fontSize: 26,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.5,
    marginBottom: 6,
    textAlign: 'center',
  },
  headingPurple: {
    color: '#582CDB',
  },
  subHeading: {
    fontSize: 14,
    fontWeight: '400',
    color: '#5E576E',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  helperText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#582CDB',
    textAlign: 'center',
    marginTop: 4,
  },
  horizontalBarContainer: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(23, 20, 32, 0.06)',
    marginVertical: 12,
    overflow: 'hidden',
    width: '100%',
  },
  horizontalBarActive: {
    height: '100%',
    backgroundColor: '#582CDB',
    borderRadius: 2,
  },
  nicheList: {
    gap: 10,
    marginBottom: 16,
  },
  nicheListContainer: {
    gap: 10,
    marginBottom: 16,
  },
  nicheCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    padding: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  },
  nicheCardSelected: {
    borderColor: '#582CDB',
    backgroundColor: '#F8F6FF',
    borderWidth: 1.5,
    shadowColor: '#582CDB',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  nicheCardPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxSelected: {
    backgroundColor: '#ECE6FD',
  },
  nicheTextContainer: {
    flex: 1,
  },
  nicheTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 3,
  },
  nicheTitleSelected: {
    color: '#171420',
  },
  nicheSubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    color: '#5E576E',
    lineHeight: 17,
  },
  selectedCheckBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  selectedCheckText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  addCustomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
    borderStyle: 'solid',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomCardPressed: {
    backgroundColor: '#F8F6FD',
    transform: [{ scale: 0.98 }],
  },
  addCustomText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
  },
  continueButton: {
    backgroundColor: '#582CDB',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(181, 165, 232, 0.7)',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  jarvisAdviceSection: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  pureStarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  pureStarImage: {
    width: 80,
    height: 80,
  },
  jarvisTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#582CDB',
    marginBottom: 8,
  },
  adviceBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.07)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  adviceText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#5E576E',
    textAlign: 'center',
    lineHeight: 19,
  },
  bottomStatusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(23, 20, 32, 0.06)',
    backgroundColor: '#FAF9FD',
  },
  statusLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F4F0FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171420',
  },
  statusPercentageText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(23, 20, 32, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  limitModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 26,
    paddingHorizontal: 22,
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(23, 20, 32, 0.08)',
  },
  modalPureStarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  modalPureStarImage: {
    width: 88,
    height: 88,
  },
  jarvisCoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(237, 232, 252, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 100,
    marginBottom: 10,
    gap: 5,
  },
  jarvisBadgeSparkle: {
    fontSize: 13,
  },
  jarvisBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.8,
  },
  limitModalTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  limitModalText: {
    fontSize: 14,
    color: '#524C62',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  limitHighlight: {
    color: '#582CDB',
    fontWeight: '700',
  },
  limitSubNote: {
    fontSize: 12,
    color: '#7F7894',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
  gotItButton: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  gotItButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  gotItButtonText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 248, 0.95)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#7F7894',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  modalInput: {
    height: 48,
    borderWidth: 1.2,
    borderColor: 'rgba(221, 214, 254, 0.9)',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#171420',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(226, 220, 242, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F7894',
  },
  modalAddBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
