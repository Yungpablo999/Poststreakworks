import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  ScrollView,
  Platform,
  Image,
  SafeAreaView,
  Modal,
  Animated,
} from 'react-native';
import Svg, { Path, Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

export interface CreatorProfileData {
  id: string;
  name: string;
  role: string;
  followers: string;
  audienceCount: string;
  location: string;
  coverImage: any;
  bio: string;
  tags: string[];
  categoryTags: string[];
  streak: number;
  availability: string;
  consistencyRating: string;
  whyFitsDescription: string;
  whyFitsPills: string[];
  collabIdea: {
    title: string;
    hook: string;
    bts: string;
    lesson: string;
    chips: string[];
  };
  correlationPercent: number;
  primaryNiche: { name: string; level: string; percent: string; color: string };
  secondaryNiche: { name: string; level: string; percent: string; color: string };
  jarvisDeepInsight: string;
  readinessChecks: string[];
}

export const DEFAULT_AMARA_PROFILE: CreatorProfileData = {
  id: 'creator_1',
  name: 'Amara Okafor',
  role: 'Travel & Lifestyle Vlogger',
  followers: '85K',
  audienceCount: '85,000+',
  location: 'Lagos, NG',
  coverImage: require('../../assets/images/amara-creator-cover.jpg'),
  bio: 'Filming authentic travel routines & luxury getaways across West Africa. Looking for lifestyle co-creators for dynamic split-screen Reels! 🌴',
  tags: ['🌿 Travel', '✨ Lifestyle', '🎥 4K Vlogs'],
  categoryTags: ['Lifestyle', 'Travel', 'Storytelling', 'Short-form Video'],
  streak: 44,
  availability: 'Available This Week',
  consistencyRating: 'High',
  whyFitsDescription:
    'Amara’s audience overlaps with your lifestyle and creator journey content. This match could support a strong short-form collaboration.',
  whyFitsPills: ['Audience Overlap', 'Similar Content Style', 'Strong Posting Rhythm'],
  collabIdea: {
    title: '“24 Hours Creating in Lagos”',
    hook: 'Two creators, one city, zero sleep.',
    bts: 'iPhone and natural lighting.',
    lesson: 'How we both built our streaks today.',
    chips: ['🎥 Reel', '⏱ 30-45 Sec', '📅 Sat 2 PM'],
  },
  correlationPercent: 76,
  primaryNiche: { name: 'LIFESTYLE', level: 'High', percent: '94%', color: '#10B981' },
  secondaryNiche: { name: 'TRAVEL', level: 'Medium', percent: '68%', color: '#6366F1' },
  jarvisDeepInsight:
    'Amara’s content style matches your creator journey niche. A simple day-in-the-life collab could work well for both audiences.',
  readinessChecks: [
    'Profile verified & complete',
    'Active high-performance streak',
    'High response likelihood',
  ],
};

export const DEFAULT_ELENA_PROFILE: CreatorProfileData = {
  id: 'creator_5',
  name: 'Elena Rostova',
  role: 'Visual Storyteller',
  followers: '42.8K',
  audienceCount: '42,800+',
  location: 'Berlin, DE',
  coverImage: require('../../assets/images/elena-avatar.jpg'),
  bio: 'Cinematographer & visual director crafting short films. Let’s co-direct high-production Reels that blow minds! 🎬',
  tags: ['🎥 Filmmaking', '🎬 Editing', '✨ Viral Hooks'],
  categoryTags: ['Tech & Design', 'Cinematography', 'Editing', 'Visual Pacing'],
  streak: 47,
  availability: 'Available This Week',
  consistencyRating: 'High',
  whyFitsDescription:
    'Strong niche overlap, similar posting pace, and open to creator squads. Elena’s visual pacing elevates short-form videos into high-retention stories.',
  whyFitsPills: ['Audience Overlap', 'Similar Content Style', 'Strong Posting Rhythm'],
  collabIdea: {
    title: '“Sound Secrets of 10M Reels”',
    hook: 'The 3 hidden audio layers that keep viewers hooked till the end.',
    bts: 'Timeline zoom-ins & foley sound breakdown.',
    lesson: 'Auditory psychology for retention.',
    chips: ['🎥 Reel', '⏱ 40 Sec', '📅 Tue 8 PM'],
  },
  correlationPercent: 94,
  primaryNiche: { name: 'TECH & DESIGN', level: 'High', percent: '96%', color: '#10B981' },
  secondaryNiche: { name: 'CINEMA', level: 'High', percent: '89%', color: '#6366F1' },
  jarvisDeepInsight:
    'Her pacing and visual sound design can amplify your video watch-through rates significantly.',
  readinessChecks: [
    'Profile verified & complete',
    'Active high-performance streak',
    'High response likelihood',
  ],
};

interface CreatorProfileModalProps {
  visible: boolean;
  onClose: () => void;
  creator?: CreatorProfileData;
  onConnect?: (creator: CreatorProfileData) => void;
  onBuildCollabPlan?: (creator: CreatorProfileData) => void;
}

export const CreatorProfileModal: React.FC<CreatorProfileModalProps> = ({
  visible,
  onClose,
  creator = DEFAULT_AMARA_PROFILE,
  onConnect,
  onBuildCollabPlan,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    if (visible) {
      pulseLoop.start();
    }
    return () => pulseLoop.stop();
  }, [visible, pulseAnim]);

  const handleToggleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsSaved(!isSaved);
  };

  const handleConnect = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onConnect) {
      onConnect(creator);
    } else {
      onClose();
    }
  };

  const handleCollabPlan = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onBuildCollabPlan) {
      onBuildCollabPlan(creator);
    } else if (onConnect) {
      onConnect(creator);
    } else {
      onClose();
    }
  };

  const creatorNameFirst = creator.name.split(' ')[0].toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalSafeArea}>
        {/* TOP HEADER BAR */}
        <View style={styles.detailHeaderBar}>
          <Pressable
            style={({ pressed }) => [styles.detailCloseBtn, pressed && styles.btnPressed]}
            onPress={onClose}
            hitSlop={8}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M18 6L6 18M6 6l12 12" stroke="#582CDB" strokeWidth="2.6" strokeLinecap="round" />
            </Svg>
          </Pressable>

          <View style={styles.detailHeaderTitleBox}>
            <Text style={styles.detailHeaderTitle}>Creator Profile</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.detailSaveTopBtn, pressed && styles.btnPressed]}
            onPress={handleToggleSave}
            hitSlop={8}
          >
            <Text style={{ fontSize: 18 }}>{isSaved ? '⭐' : '☆'}</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.detailScrollView}
          contentContainerStyle={styles.detailScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP PHOTO & STATS HERO CARD */}
          <View style={styles.detailHeroCard}>
            <Image
              source={creator.coverImage}
              style={styles.detailCoverImage}
              resizeMode="cover"
            />

            <View style={styles.detailHeroBody}>
              <View style={styles.detailAvailabilityRow}>
                <Animated.View
                  style={[
                    styles.greenStatusDot,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                />
                <Text style={styles.detailAvailabilityText}>{creator.availability}</Text>
              </View>

              <View style={styles.detailTwoStatRow}>
                <View style={styles.detailTwoStatItem}>
                  <Text style={styles.detailStatValGold}>{creator.followers}</Text>
                  <Text style={styles.detailStatLbl}>Followers</Text>
                </View>
                <View style={styles.detailTwoStatDivider} />
                <View style={styles.detailTwoStatItem}>
                  <Text style={styles.detailStatValPurple}>{creator.consistencyRating}</Text>
                  <Text style={styles.detailStatLbl}>Consistency</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CATEGORY TAG PILLS UNDER PHOTO */}
          <View style={styles.detailCategoryPillsRow}>
            {creator.categoryTags.map((tag, idx) => (
              <View key={idx} style={styles.detailCategoryPill}>
                <Text style={styles.detailCategoryPillText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* CARD 1: WHY THIS MATCH FITS */}
          <View style={styles.detailWhyFitsCard}>
            <View style={styles.detailCardTitleRow}>
              <Text style={styles.sparkleIcon}>✨</Text>
              <Text style={styles.detailCardTitleText}>Why This Match Fits</Text>
            </View>
            <Text style={styles.detailWhyFitsBody}>
              {creator.whyFitsDescription}
            </Text>
            <View style={styles.detailWhyFitsPillsRow}>
              {creator.whyFitsPills.map((pill, idx) => (
                <View key={idx} style={styles.whyFitsPill}>
                  <Text style={styles.whyFitsPillText}>{pill}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* CARD 2: COLLAB IDEA (EXACT MATCH WITH BUILD COLLAB PLAN BUTTON) */}
          <View style={styles.detailCollabIdeaCard}>
            <View style={styles.collabIdeaTitleRow}>
              <Text style={styles.purplePinIcon}>📍</Text>
              <Text style={styles.detailCollabIdeaTitle}>Collab Idea</Text>
            </View>
            <Text
              style={styles.collabIdeaName}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {creator.collabIdea.title}
            </Text>

            {/* Structured Script Steps */}
            <View style={styles.collabScriptStepsCol}>
              <View style={styles.scriptStepItem}>
                <Text style={styles.scriptStepKey}>Hook</Text>
                <Text style={styles.scriptStepVal}>{creator.collabIdea.hook}</Text>
              </View>
              <View style={styles.scriptStepItem}>
                <Text style={styles.scriptStepKey}>BTS</Text>
                <Text style={styles.scriptStepVal}>{creator.collabIdea.bts}</Text>
              </View>
              <View style={styles.scriptStepItem}>
                <Text style={styles.scriptStepKey}>Lesson</Text>
                <Text style={styles.scriptStepVal}>{creator.collabIdea.lesson}</Text>
              </View>
            </View>

            {/* Chips */}
            <View style={styles.collabIdeaChipsRow}>
              {creator.collabIdea.chips.map((chip, idx) => (
                <View key={idx} style={styles.collabIdeaChip}>
                  <Text style={styles.collabIdeaChipText}>{chip}</Text>
                </View>
              ))}
            </View>

            <Pressable
              style={({ pressed }) => [styles.buildCollabPlanBtn, pressed && styles.btnPressed]}
              onPress={handleCollabPlan}
            >
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buildCollabPlanGradient}
              >
                <Text style={styles.buildCollabPlanBtnText}>Build Collab Plan</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* ROW OF 2 METRIC CARDS: AUDIENCE & STREAK */}
          <View style={styles.detailTwoCardsRow}>
            <View style={styles.detailMetricCardHalf}>
              <View style={styles.metricCardIconRow}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Circle cx="9" cy="7" r="4" stroke="#582CDB" strokeWidth="2" />
                  <Path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="#582CDB" strokeWidth="2" />
                  <Circle cx="17" cy="11" r="3" stroke="#784DF0" strokeWidth="2" />
                  <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#784DF0" strokeWidth="2" />
                </Svg>
              </View>
              <Text style={styles.metricCardLabel}>AUDIENCE</Text>
              <Text style={styles.metricCardBigValue}>{creator.audienceCount}</Text>
            </View>

            <View style={styles.detailMetricCardHalf}>
              <View style={styles.metricCardIconRow}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"
                    fill="#F59E0B"
                  />
                </Svg>
              </View>
              <Text style={styles.metricCardLabel}>STREAK</Text>
              <Text style={styles.metricCardGoldValue}>{creator.streak} Days</Text>
            </View>
          </View>

          {/* CARD 3: AUDIENCE CORRELATION VENN DIAGRAM */}
          <View style={styles.audienceCorrelationCard}>
            <Text style={styles.correlationHeading}>AUDIENCE CORRELATION</Text>

            {/* VENN DIAGRAM GRAPHIC */}
            <View style={styles.vennContainer}>
              <Svg width={240} height={130} viewBox="0 0 240 130">
                <Defs>
                  <RadialGradient id="purpleGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#7C3AED" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#582CDB" stopOpacity="0.12" />
                  </RadialGradient>
                  <RadialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#F59E0B" stopOpacity="0.35" />
                    <Stop offset="100%" stopColor="#D97706" stopOpacity="0.1" />
                  </RadialGradient>
                </Defs>

                {/* Left Circle: YOU */}
                <Circle
                  cx="90"
                  cy="65"
                  r="52"
                  fill="url(#purpleGlow)"
                  stroke="#7C3AED"
                  strokeWidth="2.2"
                />
                {/* Right Circle: CREATOR */}
                <Circle
                  cx="150"
                  cy="65"
                  r="52"
                  fill="url(#goldGlow)"
                  stroke="#D97706"
                  strokeWidth="2.2"
                />
              </Svg>

              {/* Overlay Labels */}
              <View style={styles.vennLabelLeft}>
                <Text style={styles.vennLabelTextPurple}>YOU</Text>
              </View>
              <View style={styles.vennCenterBadge}>
                <Text style={styles.vennCenterPercent}>{creator.correlationPercent}%</Text>
              </View>
              <View style={styles.vennLabelRight}>
                <Text style={styles.vennLabelTextGold}>{creatorNameFirst}</Text>
              </View>
            </View>

            {/* Bottom 2 Pill Indicators */}
            <View style={styles.correlationIndicatorsRow}>
              <View style={styles.correlationIndicatorPill}>
                <Text style={styles.indicatorName}>{creator.primaryNiche.name}</Text>
                <Text style={[styles.indicatorLevel, { color: creator.primaryNiche.color }]}>
                  {creator.primaryNiche.level}
                </Text>
              </View>
              <View style={styles.correlationIndicatorPill}>
                <Text style={styles.indicatorName}>{creator.secondaryNiche.name}</Text>
                <Text style={[styles.indicatorLevel, { color: creator.secondaryNiche.color }]}>
                  {creator.secondaryNiche.level}
                </Text>
              </View>
            </View>
          </View>

          {/* CARD 4: JARVIS DEEP INSIGHT FROSTED BOX */}
          <View style={styles.detailJarvisInsightCard}>
            <Image
              source={require('../../assets/images/jarvis-core-flame.png')}
              style={styles.detailJarvisGhost}
              resizeMode="contain"
            />
            <Text style={styles.detailJarvisInsightLabel}>JARVIS INSIGHT</Text>
            <Text style={styles.detailJarvisInsightText}>
              {creator.jarvisDeepInsight}
            </Text>
          </View>

          {/* CARD 5: READINESS CHECKLIST */}
          <View style={styles.detailReadinessCard}>
            <View style={styles.readinessHeaderRow}>
              <Text style={styles.readinessTitle}>Readiness</Text>
              <View style={styles.readinessReadyBadge}>
                <Text style={styles.readinessReadyText}>🟢 Ready</Text>
              </View>
            </View>

            <View style={styles.readinessChecklistCol}>
              {creator.readinessChecks.map((check, idx) => (
                <View key={idx} style={styles.readinessItemRow}>
                  <View style={styles.readinessCheckCircle}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                      <Path d="M20 6L9 17l-5-5" stroke="#582CDB" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </View>
                  <Text style={styles.readinessItemText}>{check}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* FLOATING BOTTOM ACTION BAR IN MODAL */}
        <View style={styles.detailBottomActionBar}>
          <Pressable
            style={({ pressed }) => [styles.detailConnectBtn, pressed && styles.btnPressed]}
            onPress={handleConnect}
          >
            <LinearGradient
              colors={['#784DF0', '#582CDB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.detailConnectGradient}
            >
              <Text style={styles.detailConnectBtnText}>Connect</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.detailBookmarkBtn,
              isSaved && styles.detailBookmarkBtnActive,
              pressed && styles.btnPressed,
            ]}
            onPress={handleToggleSave}
            hitSlop={8}
          >
            <Svg width={20} height={20} viewBox="0 0 24 24" fill={isSaved ? '#582CDB' : 'none'}>
              <Path
                d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"
                stroke="#582CDB"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalSafeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  detailHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(235, 230, 248, 0.7)',
    backgroundColor: '#FFFFFF',
  },
  detailCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailHeaderTitleBox: {
    flex: 1,
    alignItems: 'center',
  },
  detailHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.2,
  },
  detailSaveTopBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailScrollView: {
    flex: 1,
  },
  detailScrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 110,
  },

  // Top Photo & Two-Stat Hero Card
  detailHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 12,
  },
  detailCoverImage: {
    width: '100%',
    height: 360,
  },
  detailHeroBody: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  detailAvailabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  greenStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  detailAvailabilityText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  detailTwoStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailTwoStatItem: {
    flex: 1,
  },
  detailStatValGold: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: -0.3,
  },
  detailStatValPurple: {
    fontSize: 20,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: -0.3,
  },
  detailStatLbl: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 2,
  },
  detailTwoStatDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E8E3FA',
    marginHorizontal: 16,
  },

  // Category Pills Row
  detailCategoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  detailCategoryPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  detailCategoryPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Card 1: Why This Match Fits
  detailWhyFitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  detailCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sparkleIcon: {
    fontSize: 14,
    color: '#582CDB',
  },
  detailCardTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  detailWhyFitsBody: {
    fontSize: 12.5,
    color: '#4B4360',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 12,
  },
  detailWhyFitsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  whyFitsPill: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  whyFitsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },

  // Card 2: Collab Idea Blueprint
  detailCollabIdeaCard: {
    backgroundColor: '#FAF8FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#EDE8FC',
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  collabIdeaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  purplePinIcon: {
    fontSize: 13,
  },
  detailCollabIdeaTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#582CDB',
  },
  collabIdeaName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  collabScriptStepsCol: {
    gap: 8,
    marginBottom: 14,
  },
  scriptStepItem: {
    flexDirection: 'row',
    gap: 8,
  },
  scriptStepKey: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    width: 52,
  },
  scriptStepVal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#171420',
    flex: 1,
    lineHeight: 16,
  },
  collabIdeaChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  collabIdeaChip: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  collabIdeaChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7F7894',
  },
  buildCollabPlanBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
  },
  buildCollabPlanGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buildCollabPlanBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: -0.2,
  },

  // Row of 2 Metric Cards: Audience & Streak
  detailTwoCardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  detailMetricCardHalf: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  metricCardIconRow: {
    marginBottom: 8,
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metricCardBigValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.4,
  },
  metricCardGoldValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: -0.4,
  },

  // Card 3: Audience Correlation Venn Diagram
  audienceCorrelationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  correlationHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.6,
    marginBottom: 6,
    alignSelf: 'flex-start',
  },
  vennContainer: {
    width: 240,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  vennLabelLeft: {
    position: 'absolute',
    left: 45,
    top: 54,
  },
  vennLabelTextPurple: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  vennCenterBadge: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingVertical: 3,
    paddingHorizontal: 9,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  vennCenterPercent: {
    fontSize: 13,
    fontWeight: '900',
    color: '#582CDB',
  },
  vennLabelRight: {
    position: 'absolute',
    right: 32,
    top: 54,
  },
  vennLabelTextGold: {
    fontSize: 12,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  correlationIndicatorsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    width: '100%',
  },
  correlationIndicatorPill: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E3FA',
  },
  indicatorName: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#7F7894',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  indicatorLevel: {
    fontSize: 12,
    fontWeight: '800',
  },

  // Card 4: Jarvis Deep Insight Frosted Box
  detailJarvisInsightCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    marginBottom: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  detailJarvisGhost: {
    position: 'absolute',
    right: 12,
    top: 12,
    width: 28,
    height: 28,
    opacity: 0.9,
  },
  detailJarvisInsightLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  detailJarvisInsightText: {
    fontSize: 12.5,
    color: '#3730A3',
    lineHeight: 18,
    fontStyle: 'italic',
    fontWeight: '500',
  },

  // Card 5: Readiness Checklist
  detailReadinessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  readinessHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  readinessTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#171420',
  },
  readinessReadyBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  readinessReadyText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  readinessChecklistCol: {
    gap: 10,
  },
  readinessItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  readinessCheckCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EDE8FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  readinessItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#171420',
  },

  // Floating Bottom Action Bar
  detailBottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(235, 230, 248, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailConnectBtn: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  detailConnectGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  detailBookmarkBtn: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#582CDB',
    backgroundColor: '#FAF8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailBookmarkBtnActive: {
    backgroundColor: '#EDE8FC',
  },
});
