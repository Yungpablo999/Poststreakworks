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
import Svg, { Path } from 'react-native-svg';
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
    summary?: string;
    hook: string;
    bts: string;
    lesson: string;
    chips: string[];
  };
  correlationPercent: number;
  primaryNiche: { name: string; level: string; percent: string; color: string };
  secondaryNiche: { name: string; level: string; percent: string; color: string };
  jarvisDeepInsight: string;
  jarvisShortInsight?: string;
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
    'Strong niche overlap · Similar posting rhythm',
  whyFitsPills: ['Audience Overlap', 'Content Style', 'Posting Rhythm'],
  collabIdea: {
    title: '“24 Hours Creating in Lagos”',
    summary: 'Co-produce an authentic day-in-the-life Reel highlighting high-energy creator routines in Lagos.',
    hook: 'Two creators, one city, zero sleep.',
    bts: 'iPhone and natural lighting.',
    lesson: 'How we both built our streaks today.',
    chips: ['🎥 Reel', '30-45 sec', 'Sat 2 PM'],
  },
  correlationPercent: 76,
  primaryNiche: { name: 'LIFESTYLE', level: 'High', percent: '94%', color: '#10B981' },
  secondaryNiche: { name: 'TRAVEL', level: 'Medium', percent: '68%', color: '#6366F1' },
  jarvisDeepInsight:
    'Amara’s content style matches your creator journey niche. A simple day-in-the-life collab could work well for both audiences.',
  jarvisShortInsight:
    'Her lifestyle content style matches your creator journey niche for natural cross-audience engagement.',
  readinessChecks: [
    'Profile verified & complete',
    'Active high-performance streak',
    'High response likelihood',
  ],
};

export const DEFAULT_ELENA_PROFILE: CreatorProfileData = {
  id: 'creator_5',
  name: 'Elena Rostova',
  role: 'Tech & Visual Design',
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
    'Strong niche overlap · Similar posting rhythm',
  whyFitsPills: ['Audience Overlap', 'Content Style', 'Posting Rhythm'],
  collabIdea: {
    title: '“Sound Secrets of 10M Reels”',
    summary: 'Explore the audio techniques behind high-retention Reels, from hooks to foley.',
    hook: 'The 3 hidden audio layers that keep viewers hooked till the end.',
    bts: 'Timeline zoom-ins & foley sound breakdown.',
    lesson: 'Auditory psychology for retention.',
    chips: ['🎥 Reel', '40 sec', 'Tue 8 PM'],
  },
  correlationPercent: 94,
  primaryNiche: { name: 'TECH & DESIGN', level: 'High', percent: '96%', color: '#10B981' },
  secondaryNiche: { name: 'CINEMA', level: 'High', percent: '89%', color: '#6366F1' },
  jarvisDeepInsight:
    'Her visual pacing could improve your retention-focused content.',
  jarvisShortInsight:
    'Her visual pacing could improve your retention-focused content.',
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
  creator = DEFAULT_ELENA_PROFILE,
  onConnect,
  onBuildCollabPlan,
}) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showCorrelationDetails, setShowCorrelationDetails] = useState(false);
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

  const collabChipsFormatted = creator.collabIdea.chips.join(' · ');

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
          {/* 1. CREATOR IDENTITY HERO CARD */}
          <View style={styles.detailHeroCard}>
            <Image
              source={creator.coverImage}
              style={styles.detailCoverImage}
              resizeMode="cover"
            />

            <View style={styles.detailHeroBody}>
              <View style={styles.creatorIdentityHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={styles.creatorNameRow}>
                    <Text style={styles.creatorNameText} numberOfLines={1}>
                      {creator.name}
                    </Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedBadgeText}>✓</Text>
                    </View>
                  </View>
                  <Text style={styles.creatorRoleText}>
                    {creator.role} · {creator.location}
                  </Text>
                </View>

                <View style={styles.detailAvailabilityRow}>
                  <Animated.View
                    style={[
                      styles.greenStatusDot,
                      { transform: [{ scale: pulseAnim }] },
                    ]}
                  />
                  <Text style={styles.detailAvailabilityText}>{creator.availability}</Text>
                </View>
              </View>

              {/* 3-Col Stats Row */}
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
                <View style={styles.detailTwoStatDivider} />
                <View style={styles.detailTwoStatItem}>
                  <Text style={[styles.detailStatValGold, { color: '#EA580C' }]}>🔥 {creator.streak}d</Text>
                  <Text style={styles.detailStatLbl}>Streak</Text>
                </View>
              </View>
            </View>
          </View>

          {/* CATEGORY TAG PILLS */}
          <View style={styles.detailCategoryPillsRow}>
            {creator.categoryTags.map((tag, idx) => (
              <View key={idx} style={styles.detailCategoryPill}>
                <Text style={styles.detailCategoryPillText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* 2. MATCH SCORE — HERO CARD */}
          <LinearGradient
            colors={['#582CDB', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroMatchScoreCard}
          >
            <View style={styles.matchScoreTopRow}>
              <View style={styles.matchScoreTextCol}>
                <Text style={styles.matchScoreValue}>{creator.correlationPercent}% Match</Text>
                <Text style={styles.matchScoreSubtitle}>
                  Strong niche overlap · Similar posting rhythm
                </Text>
              </View>
              <View style={styles.matchScoreBadgeIcon}>
                <Text style={{ fontSize: 22 }}>⚡</Text>
              </View>
            </View>

            {/* 3 Small Tags */}
            <View style={styles.matchScorePillsRow}>
              {creator.whyFitsPills.map((pill, idx) => (
                <View key={idx} style={styles.matchScorePill}>
                  <Text style={styles.matchScorePillText}>{pill}</Text>
                </View>
              ))}
            </View>

            {/* Tiny Expandable Detail Toggle: Why 94%? › */}
            <Pressable
              style={styles.whyScoreToggleBtn}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowCorrelationDetails(!showCorrelationDetails);
              }}
            >
              <Text style={styles.whyScoreToggleText}>
                {showCorrelationDetails ? `Hide details ▴` : `Why ${creator.correlationPercent}%? ›`}
              </Text>
            </Pressable>

            {showCorrelationDetails && (
              <View style={styles.correlationExpandedBox}>
                <View style={styles.correlationIndicatorPill}>
                  <Text style={styles.indicatorName}>{creator.primaryNiche.name}</Text>
                  <Text style={[styles.indicatorLevel, { color: '#6EE7B7' }]}>
                    {creator.primaryNiche.level} ({creator.primaryNiche.percent})
                  </Text>
                </View>
                <View style={styles.correlationIndicatorPill}>
                  <Text style={styles.indicatorName}>{creator.secondaryNiche.name}</Text>
                  <Text style={[styles.indicatorLevel, { color: '#C4B5FD' }]}>
                    {creator.secondaryNiche.level} ({creator.secondaryNiche.percent})
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>

          {/* 3. COLLAB IDEA — MAIN SECONDARY SECTION */}
          <View style={styles.collabIdeaCard}>
            <View style={styles.collabIdeaHeaderRow}>
              <Text style={styles.purplePinIcon}>📍</Text>
              <Text style={styles.collabIdeaTag}>Collab Idea</Text>
            </View>

            <Text
              style={styles.collabIdeaTitleText}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {creator.collabIdea.title}
            </Text>

            <Text style={styles.collabIdeaSummaryText}>
              {creator.collabIdea.summary || `${creator.collabIdea.hook} ${creator.collabIdea.lesson}`}
            </Text>

            <View style={styles.collabFormatRow}>
              <Text style={styles.collabFormatText}>{collabChipsFormatted}</Text>
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
                <Text style={styles.buildCollabPlanBtnText}>Build Collab Plan →</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* 4. COMPACT JARVIS INSIGHT */}
          <View style={styles.jarvisCompactCard}>
            <View style={styles.jarvisCompactHeader}>
              <Text style={{ fontSize: 14 }}>✨</Text>
              <Text style={styles.jarvisCompactLabel}>Jarvis says:</Text>
            </View>
            <Text style={styles.jarvisCompactText}>
              {creator.jarvisShortInsight || creator.jarvisDeepInsight}
            </Text>
          </View>

          {/* 5. COMPACT READINESS STATUS ROW */}
          <View style={styles.readinessCompactCard}>
            <View style={styles.readinessCompactHeader}>
              <View style={styles.readinessGreenDot} />
              <Text style={styles.readinessCompactTitle}>Ready to collaborate</Text>
            </View>
            <Text style={styles.readinessCompactSub}>
              Verified · Active streak · High response likelihood
            </Text>
          </View>
        </ScrollView>

        {/* 6. STICKY BOTTOM ACTION BAR */}
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

  // 1. Creator Identity Hero Card
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
    height: 320,
  },
  detailHeroBody: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  creatorIdentityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  creatorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creatorNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    backgroundColor: '#582CDB',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  creatorRoleText: {
    fontSize: 12.5,
    color: '#7F7894',
    marginTop: 2,
    fontWeight: '500',
  },
  detailAvailabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  greenStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  detailAvailabilityText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  detailTwoStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8FC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  detailTwoStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatValGold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: -0.3,
  },
  detailStatValPurple: {
    fontSize: 16,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: -0.3,
  },
  detailStatLbl: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#7F7894',
    marginTop: 1,
  },
  detailTwoStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E8E3FA',
  },

  // Category Pills
  detailCategoryPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
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
    fontSize: 11.5,
    fontWeight: '700',
    color: '#582CDB',
  },

  // 2. Hero Match Score Card
  heroMatchScoreCard: {
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  matchScoreTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchScoreTextCol: {
    flex: 1,
  },
  matchScoreValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  matchScoreSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    marginTop: 2,
  },
  matchScoreBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScorePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  matchScorePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  matchScorePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  whyScoreToggleBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  whyScoreToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FDE68A',
    letterSpacing: 0.2,
  },
  correlationExpandedBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  correlationIndicatorPill: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  indicatorName: {
    fontSize: 9.5,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  indicatorLevel: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  // 3. Collab Idea Card
  collabIdeaCard: {
    backgroundColor: '#FFFFFF',
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
  collabIdeaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  purplePinIcon: {
    fontSize: 13,
  },
  collabIdeaTag: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collabIdeaTitleText: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  collabIdeaSummaryText: {
    fontSize: 12.5,
    color: '#4B4360',
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 10,
  },
  collabFormatRow: {
    backgroundColor: '#FAF8FF',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E8E3FA',
    alignSelf: 'flex-start',
    marginBottom: 14,
  },
  collabFormatText: {
    fontSize: 11.5,
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
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // 4. Compact Jarvis Insight Card
  jarvisCompactCard: {
    backgroundColor: '#F5F3FF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: '#DDD6FE',
    marginBottom: 12,
  },
  jarvisCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  jarvisCompactLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.4,
  },
  jarvisCompactText: {
    fontSize: 12,
    color: '#3730A3',
    lineHeight: 17,
    fontWeight: '500',
    fontStyle: 'italic',
  },

  // 5. Compact Readiness Status Row
  readinessCompactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1.2,
    borderColor: '#E8E3FA',
    marginBottom: 20,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  readinessCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  readinessGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  readinessCompactTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  readinessCompactSub: {
    fontSize: 11,
    color: '#7F7894',
    fontWeight: '500',
    marginTop: 2,
  },

  // 6. Sticky Bottom Action Bar
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
