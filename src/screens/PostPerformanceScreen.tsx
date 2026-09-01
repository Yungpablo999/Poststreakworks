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
  StatusBar,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';
import { BrandToast } from '../components/BrandToast';
import { UserProfileModal, UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { FreeAppHeader } from '../components/FreeAppHeader';
import { sFont, sPadding, moderateScale, isNarrowScreen } from '../utils/responsive';

interface PostPerformanceScreenProps {
  onBack: () => void;
  onNavigateTab?: (tab: TabType) => void;
  onOpenJarvisPro?: () => void;
  onOpenMessages?: () => void;
  onOpenSchedule?: () => void;
  onOpenAudienceBreakdown?: () => void;
  onOpenEarnings?: () => void;
  onOpenComposer?: (ideaTitle?: string) => void;
  onOpenScript?: (ideaTitle?: string) => void;
  onOpenContentAngle?: () => void;
  userProfile?: UserProfileData;
  onSaveProfile?: (updated: UserProfileData) => void;
  onLogout?: () => void;
}

const BookmarkSvg = ({ size = 18, color = '#171420' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v17l-7-4-7 4V4z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const SpeechBubbleSvg = ({ size = 18, color = '#171420' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ShareArrowSvg = ({ size = 18, color = '#171420' }: { size?: number; color?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 17L17 7M17 7H8M17 7V16"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PostPerformanceScreen: React.FC<PostPerformanceScreenProps> = ({
  onBack,
  onNavigateTab,
  onOpenJarvisPro,
  onOpenMessages,
  onOpenSchedule,
  onOpenAudienceBreakdown,
  onOpenEarnings,
  onOpenComposer,
  onOpenScript,
  onOpenContentAngle,
  userProfile,
  onSaveProfile,
  onLogout,
}) => {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('growth');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJarvisExplanationModal, setShowJarvisExplanationModal] = useState(false);
  const [isHowItWorksExpanded, setIsHowItWorksExpanded] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Animations
  const modalPopScale = useRef(new Animated.Value(0.88)).current;
  const flameFloatY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFloatY, {
          toValue: -3,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(flameFloatY, {
          toValue: 3,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );
    flameLoop.start();
    return () => flameLoop.stop();
  }, [flameFloatY]);

  const showToast = (msg: string) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2400);
  };

  const triggerModalPop = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    modalPopScale.setValue(0.88);
    Animated.spring(modalPopScale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 26,
      bounciness: 12,
    }).start();
  };

  const handleTabPress = (tab: TabType) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveTab(tab);
    if (onNavigateTab) {
      onNavigateTab(tab);
    }
  };

  const handleCreateSimilarPost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenComposer) {
      onOpenComposer('3 creator mistakes that are killing your growth (Part 2)');
    } else if (onOpenScript) {
      onOpenScript('3 creator mistakes that are killing your growth (Part 2)');
    } else {
      showToast('Opening Creator Studio...');
    }
  };

  const handleRepurposePost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (onOpenContentAngle) {
      onOpenContentAngle();
    } else if (onOpenScript) {
      onOpenScript('Repurposing: 3 creator mistakes into Instagram & Shorts format');
    } else {
      showToast('Repurposing post into 4 multi-channel formats...');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAF8F5" />
      <View style={styles.container}>
        {/* TOAST BANNER */}
        <BrandToast message={toastMessage} />

        {/* 1. TOP HEADER BAR */}
        <FreeAppHeader
          onBack={onBack}
          onOpenJarvisPro={onOpenJarvisPro}
          onOpenMessages={() => {
            if (onOpenMessages) {
              onOpenMessages();
            } else if (onNavigateTab) {
              onNavigateTab('match');
            }
          }}
          onOpenNotifications={() => {
            triggerModalPop();
            setShowNotificationModal(true);
          }}
          onOpenProfile={() => {
            triggerModalPop();
            setShowProfileModal(true);
          }}
          userProfile={userProfile}
        />

        {/* 2. SCROLLABLE CONTENT */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HERO SECTION TITLE */}
          <View style={styles.heroTitleContainer}>
            <View style={styles.badgePillRow}>
              <View style={styles.deepDivePill}>
                <Text style={styles.deepDivePillText}>⚡ POST PERFORMANCE DEEP DIVE</Text>
              </View>
            </View>
            <Text
              style={styles.mainTitle}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.85}
            >
              See why your best post worked.
            </Text>
            <Text style={styles.mainSubtitle}>
              Understand the views, retention, hooks, and engagement signals behind your post.
            </Text>
          </View>

          {/* CARD 1: BEST POST HERO CARD */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Best Post</Text>
          </View>

          <View style={styles.bestPostCard}>
            {/* Video Thumbnail Box with Overlay */}
            <View style={styles.videoPreviewContainer}>
              <Image
                source={require('../../assets/images/amara-portrait.jpg')}
                style={styles.videoThumbnail}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Top Tag Pill */}
              <View style={styles.topPostBadge}>
                <Text style={styles.topPostBadgeText}>⚡ TOP POST • TIKTOK</Text>
              </View>

              {/* Play Button Overlay */}
              <View style={styles.playButtonCircle}>
                <Text style={styles.playIconTriangle}>▶</Text>
              </View>

              {/* Bottom Video Meta Info */}
              <View style={styles.videoMetaContainer}>
                <View style={styles.videoAuthorRow}>
                  {userProfile?.customAvatarUri ? (
                    <Image
                      source={{ uri: userProfile.customAvatarUri }}
                      style={styles.videoAuthorAvatar}
                    />
                  ) : (userProfile?.avatarSource && userProfile.avatarId && userProfile.avatarId !== 'ghost') ? (
                    <Image
                      source={userProfile.avatarSource}
                      style={styles.videoAuthorAvatar}
                    />
                  ) : (
                    <View style={[styles.videoAuthorAvatar, { backgroundColor: '#F5F3FF', justifyContent: 'center', alignItems: 'center' }]}>
                      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                        <Path
                          d="M20 21V19C20 17.9 19.5 16.9 18.7 16.2C17.9 15.5 16.9 15 15.8 15H8.2C7.1 15 6.1 15.5 5.3 16.2C4.5 16.9 4 17.9 4 19V21"
                          stroke="#582CDB"
                          strokeWidth="2.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <Circle
                          cx="12"
                          cy="7"
                          r="4"
                          stroke="#582CDB"
                          strokeWidth="2.3"
                        />
                      </Svg>
                    </View>
                  )}
                  <Text style={styles.videoAuthorName}>
                    {userProfile?.handle || '@pablo.creates'} • TikTok
                  </Text>
                </View>
                <Text style={styles.videoPostTitle} numberOfLines={2}>
                  3 creator mistakes that are killing your growth...
                </Text>
              </View>
            </View>

            {/* 3-Column Video Stats Bar */}
            <View style={styles.postStatsBar}>
              <View style={styles.postStatItem}>
                <Text style={styles.postStatLabel}>VIEWS</Text>
                <Text style={styles.postStatValue}>24.5K</Text>
              </View>
              <View style={styles.postStatDivider} />
              <View style={styles.postStatItem}>
                <Text style={styles.postStatLabel}>LIKES</Text>
                <Text style={styles.postStatValue}>1,820</Text>
              </View>
              <View style={styles.postStatDivider} />
              <View style={styles.postStatItem}>
                <Text style={styles.postStatLabel}>SAVES</Text>
                <Text style={styles.postStatValue}>3,420</Text>
              </View>
            </View>

            {/* Estimated Post Earnings Revenue Chip */}
            <Pressable
              style={({ pressed }) => [styles.postEarningsChip, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                if (onOpenEarnings) {
                  onOpenEarnings();
                } else {
                  showToast('Est. earnings: $142.50 from this top post');
                }
              }}
            >
              <View style={styles.postEarningsLeftRow}>
                <Text style={{ fontSize: 13 }}>💰</Text>
                <Text style={styles.postEarningsChipText}>
                  Est. earnings: <Text style={{ color: '#582CDB', fontWeight: '800' }}>$142.50</Text>
                </Text>
              </View>
              <Text style={styles.postEarningsChipLink}>View Earnings ➔</Text>
            </Pressable>

            {/* Action Button */}
            <Pressable
              style={({ pressed }) => [styles.createSimilarBtn, pressed && styles.btnPressed]}
              onPress={handleCreateSimilarPost}
            >
              <LinearGradient
                colors={['#582CDB', '#4318FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGradient}
              >
                <Text style={styles.createSimilarBtnText}>✨ Create Similar Post</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 2: PERFORMANCE 2x2 GRID */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Performance</Text>
          </View>

          <View style={styles.perfGrid2x2}>
            {/* 1. Total Views */}
            <Pressable
              style={({ pressed }) => [styles.perfMetricBox, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Views: 24,500 total (↑ 41.2% vs previous period)');
              }}
            >
              <Text style={styles.perfMetricLabel}>TOTAL VIEWS</Text>
              <Text style={styles.perfMetricValue}>24,500</Text>
              <View style={styles.perfSurgePillGreen}>
                <Text style={styles.perfSurgeTextGreen}>↑ 41.2% vs prev period</Text>
              </View>
            </Pressable>

            {/* 2. Completion Rate */}
            <Pressable
              style={({ pressed }) => [styles.perfMetricBox, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Completion: 71.6% retention (Top 3% on TikTok)');
              }}
            >
              <Text style={styles.perfMetricLabel}>COMPLETION RATE</Text>
              <Text style={styles.perfMetricValue}>71.6%</Text>
              <View style={styles.perfSurgePillNeutral}>
                <Text style={styles.perfSurgeTextNeutral}>⭐ Top 3% on TikTok</Text>
              </View>
            </Pressable>

            {/* 3. Followers Gained */}
            <Pressable
              style={({ pressed }) => [styles.perfMetricBox, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Conversion: +910 followers (Single post record)');
              }}
            >
              <Text style={styles.perfMetricLabel}>FOLLOWERS GAINED</Text>
              <Text style={styles.perfMetricValue}>+910</Text>
              <View style={styles.perfSurgePillPurple}>
                <Text style={styles.perfSurgeTextPurple}>🎯 Single Post Record</Text>
              </View>
            </Pressable>

            {/* 4. Shares */}
            <Pressable
              style={({ pressed }) => [styles.perfMetricBox, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Shares: 330 total (🔥 3.4× your average)');
              }}
            >
              <Text style={styles.perfMetricLabel}>SHARES</Text>
              <Text style={styles.perfMetricValue}>330</Text>
              <View style={styles.perfSurgePillGold}>
                <Text style={styles.perfSurgeTextGold}>🔥 3.4× your average</Text>
              </View>
            </Pressable>
          </View>

          {/* Highlight Callout Banner */}
          <View style={styles.perfCalloutBanner}>
            <Text style={{ fontSize: 16 }}>↗️</Text>
            <Text style={styles.perfCalloutText}>
              This post drove more than <Text style={{ fontWeight: '700', color: '#582CDB' }}>41%</Text> of your follower growth this month. Let's make more.
            </Text>
          </View>

          {/* CARD 3: WHY IT WORKED */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Why It Worked</Text>
          </View>

          <View style={styles.whyItWorkedCard}>
            {/* Factor 1: Visual Hook */}
            <Pressable
              style={({ pressed }) => [styles.whyItem, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Hook Analysis: 88% viewer hold rate in the first 2 seconds');
              }}
            >
              <View style={styles.whyCheckCircle}>
                <Text style={styles.whyCheckMark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyItemTitle}>Strong Visual Hook</Text>
                <Text style={styles.whyItemBody}>
                  First 2 seconds featured high-contrast text overlay and fast pattern interrupt.
                </Text>
              </View>
            </Pressable>

            <View style={styles.whyDivider} />

            {/* Factor 2: Low Friction Format */}
            <Pressable
              style={({ pressed }) => [styles.whyItem, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Pacing: 71.6% completion rate across all 3 tips');
              }}
            >
              <View style={styles.whyCheckCircle}>
                <Text style={styles.whyCheckMark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyItemTitle}>Low Friction Format</Text>
                <Text style={styles.whyItemBody}>
                  Bulleted advice format kept viewers watching until the final tip.
                </Text>
              </View>
            </Pressable>

            <View style={styles.whyDivider} />

            {/* Factor 3: Relatable Problem */}
            <Pressable
              style={({ pressed }) => [styles.whyItem, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Engagement: 184 comments driven by relatable creator friction');
              }}
            >
              <View style={styles.whyCheckCircle}>
                <Text style={styles.whyCheckMark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyItemTitle}>Relatable Problem</Text>
                <Text style={styles.whyItemBody}>
                  Addressed common beginner creator frustration that drives comment debates.
                </Text>
              </View>
            </Pressable>

            <View style={styles.whyDivider} />

            {/* Factor 4: High Save-to-Share Ratio */}
            <Pressable
              style={({ pressed }) => [styles.whyItem, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Save Intent: 10.4x saves-to-shares ratio (Top 2% reference metric)');
              }}
            >
              <View style={styles.whyCheckCircle}>
                <Text style={styles.whyCheckMark}>✓</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.whyItemTitle}>High Save-to-Share Ratio</Text>
                <Text style={styles.whyItemBody}>
                  3,420 saves vs. 330 shares — unusually strong save intent &amp; reference value.
                </Text>
              </View>
            </Pressable>
          </View>

          {/* CARD 4: RECOMMENDED CREATION (JARVIS TOPIC MATCH) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Recommended Creation</Text>
          </View>

          <View style={styles.recommendedCreationCard}>
            <View style={styles.recommendedHeaderRow}>
              <View style={styles.sparkleCircle}>
                <Text style={{ fontSize: 14 }}>✨</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recommendedSubtitle}>JARVIS AI AUTO-GENERATED TOPIC</Text>
                <Text style={styles.recommendedTitle}>
                  "3 tools every solo creator needs to save 10 hours a week"
                </Text>
                <Text style={styles.recommendedReasoning}>
                  Based on your strongest content pattern: creator education + actionable advice.
                </Text>
              </View>
            </View>

            <View style={styles.recommendedMetaBox}>
              <Pressable
                style={({ pressed }) => [styles.recommendedMetaItem, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  showToast('AI Reach: Grounded in your viral hold rate, 71.6% retention, & prime 6:30 PM window');
                }}
              >
                <Text style={styles.metaLabel} numberOfLines={1}>ESTIMATED REACH</Text>
                <Text style={styles.metaValue} numberOfLines={1}>18K - 32K Views</Text>
              </Pressable>
              <View style={styles.metaDivider} />
              <Pressable
                style={({ pressed }) => [styles.recommendedMetaItem, pressed && styles.btnPressed]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  showToast('Peak Window: Highest audience activity on your TikTok channel is 6:00 PM – 8:00 PM');
                }}
              >
                <Text style={styles.metaLabel} numberOfLines={1}>BEST POSTING TIME</Text>
                <Text style={styles.metaValue} numberOfLines={1}>Tomorrow, 6:30 PM</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [styles.createTopicBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenComposer) {
                  onOpenComposer('3 tools every solo creator needs to save 10 hours a week');
                } else {
                  showToast('Starting Studio Draft...');
                }
              }}
            >
              <LinearGradient
                colors={['#582CDB', '#4318FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.actionBtnGradient}
              >
                <Text style={styles.createTopicBtnText}>✨ Create This Post ➔</Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 5: ENGAGEMENT QUALITY */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Engagement Quality</Text>
          </View>

          <View style={styles.engagementQualityCard}>
            {/* Saves */}
            <Pressable
              style={({ pressed }) => [styles.engagementQualityRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Saves Quality: 3,420 bookmarks (Top 1% of all your posts)');
              }}
            >
              <View style={[styles.engagementIconBox, { backgroundColor: '#FEF3C7' }]}>
                <BookmarkSvg size={18} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.engagementNumber}>3,420 Saves</Text>
                <Text style={styles.engagementSub}>Top 1% of all your posts</Text>
              </View>
              <View style={styles.qualityPillGold}>
                <Text style={styles.qualityPillGoldText}>VERY HIGH</Text>
              </View>
            </Pressable>

            <View style={styles.engagementDivider} />

            {/* Comments */}
            <Pressable
              style={({ pressed }) => [styles.engagementQualityRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Discussion Quality: 248 high-intent comments & questions');
              }}
            >
              <View style={[styles.engagementIconBox, { backgroundColor: '#EDE9FE' }]}>
                <SpeechBubbleSvg size={18} color="#582CDB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.engagementNumber}>248 Comments</Text>
                <Text style={styles.engagementSub}>High discussion &amp; question rate</Text>
              </View>
              <View style={styles.qualityPillPurple}>
                <Text style={styles.qualityPillPurpleText}>STRONG</Text>
              </View>
            </Pressable>

            <View style={styles.engagementDivider} />

            {/* Shares */}
            <Pressable
              style={({ pressed }) => [styles.engagementQualityRow, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                showToast('Share Velocity: 330 shares (3.4× your average video)');
              }}
            >
              <View style={[styles.engagementIconBox, { backgroundColor: '#ECFDF5' }]}>
                <ShareArrowSvg size={18} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.engagementNumber}>330 Shares</Text>
                <Text style={styles.engagementSub}>3.4× your average video</Text>
              </View>
              <View style={styles.qualityPillGreen}>
                <Text style={styles.qualityPillGreenText}>HIGH</Text>
              </View>
            </Pressable>
          </View>

          {/* CARD 6: JARVIS CORE INSIGHT */}
          <View style={styles.jarvisCoreCard}>
            <View style={styles.jarvisCoreAvatarBox}>
              <Image
                source={require('../../assets/images/jarvis-core-flame.png')}
                style={styles.jarvisCoreFlameImg}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.jarvisCoreLabel}>JARVIS CORE INSIGHT</Text>
            <Text style={styles.jarvisCoreTextPrimary}>
              This post succeeded because of high retention in the first 3 seconds.
            </Text>
            <Text style={styles.jarvisCoreTextSecondary}>
              The pattern-interrupt hook appears to be a key reason viewers stopped scrolling.
            </Text>

            {isHowItWorksExpanded && (
              <View style={styles.howItWorksExpandBox}>
                <Text style={styles.howItWorksExpandTitle}>Why Jarvis thinks this:</Text>
                <Text style={styles.howItWorksExpandBody}>
                  Your first-3-second retention was significantly above your normal TikTok baseline, while posts using similar opening structures performed better than your average.
                </Text>
              </View>
            )}

            <View style={styles.jarvisActionLinksRow}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setIsHowItWorksExpanded(prev => !prev);
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.jarvisLinkBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.jarvisLinkText}>
                  💡 How it works {isHowItWorksExpanded ? '▲' : '➔'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  showToast('Remixing script in Creator Studio...');
                  if (onOpenScript) {
                    onOpenScript('Remix: 3 creator mistakes that are killing your growth');
                  }
                }}
                hitSlop={8}
                style={({ pressed }) => [styles.jarvisLinkBtn, pressed && styles.btnPressed]}
              >
                <Text style={styles.jarvisLinkText}>Remix script ➔</Text>
              </Pressable>
            </View>
          </View>

          {/* CARD 7: WINNING CONTENT PATTERN */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Winning Content Pattern</Text>
          </View>

          <View style={styles.patternGrid}>
            <View style={styles.patternBox}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>🗣️</Text>
              <Text style={styles.patternLabel}>VOICE</Text>
              <Text style={styles.patternValue}>Direct &amp; Actionable</Text>
            </View>

            <View style={styles.patternBox}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>⏱️</Text>
              <Text style={styles.patternLabel}>PACING</Text>
              <Text style={styles.patternValue}>Fast Cuts (1.8s avg)</Text>
            </View>

            <View style={styles.patternBox}>
              <Text style={{ fontSize: 20, marginBottom: 4 }}>📱</Text>
              <Text style={styles.patternLabel}>FORMAT</Text>
              <Text style={styles.patternValue}>Talking Head + Overlay</Text>
            </View>
          </View>

          {/* CARD 8: THE HOOK BREAKDOWN */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>The Hook</Text>
            <View style={styles.hookRetentionBadge}>
              <Text style={styles.hookRetentionBadgeText}>+84% RETENTION</Text>
            </View>
          </View>

          <View style={styles.hookCard}>
            <Text style={styles.hookQuoteText}>
              "3 creator mistakes that are killing your growth — stop doing #2 immediately!"
            </Text>
          </View>

          {/* CARD 9: CAPTION & HASHTAG STRATEGY */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Caption</Text>
            <View style={styles.captionOptimizedBadge}>
              <Text style={styles.captionOptimizedBadgeText}>OPTIMIZED ✓</Text>
            </View>
          </View>

          <View style={styles.captionCard}>
            <Text style={styles.captionBodyText}>
              Stop making these mistakes if you want to grow in 2026. The 2nd one is why 90% of creators stay stuck at 1K followers. Comment 'GROWTH' and I'll send you the free checklist.
            </Text>
            <Text style={styles.captionHashtags}>
              #creatoradvice #contentcreation #growontiktok #videoediting
            </Text>
          </View>

          {/* CARD 10: REPURPOSE PREVIEW (SNEAK PEEK • LOCKED TO PRO) */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle} numberOfLines={1}>Repurpose Preview</Text>
            <View style={styles.proPillBadge}>
              <Text style={styles.proPillBadgeText}>🔒 PRO PREVIEW</Text>
            </View>
          </View>

          <View style={styles.repurposeCard}>
            <View style={styles.repurposeGrid}>
              <View style={styles.repurposeGridItem}>
                <View style={styles.repurposeItemHeader}>
                  <Text style={styles.repurposeItemTitle} numberOfLines={1}>📸 Reels</Text>
                  <Text style={styles.repurposeFitBadge}>HIGH</Text>
                </View>
                <Text style={styles.repurposeSnippetText}>"Hook adapted for 9:16 reels format..."</Text>
                <Text style={styles.repurposeLockTag}>🔒 PRO PREVIEW</Text>
              </View>

              <View style={styles.repurposeGridItem}>
                <View style={styles.repurposeItemHeader}>
                  <Text style={styles.repurposeItemTitle} numberOfLines={1}>▶️ Shorts</Text>
                  <Text style={styles.repurposeFitBadge}>HIGH</Text>
                </View>
                <Text style={styles.repurposeSnippetText}>"Loop pacing &amp; retention hook tuned..."</Text>
                <Text style={styles.repurposeLockTag}>🔒 PRO PREVIEW</Text>
              </View>

              <View style={styles.repurposeGridItem}>
                <View style={styles.repurposeItemHeader}>
                  <Text style={styles.repurposeItemTitle} numberOfLines={1}>▶ YouTube Shorts</Text>
                  <Text style={styles.repurposeFitBadgeMedium}>HIGH</Text>
                </View>
                <Text style={styles.repurposeSnippetText}>"Fast-paced vertical short with on-screen text..."</Text>
                <Text style={styles.repurposeLockTag}>🔒 PRO PREVIEW</Text>
              </View>

              <View style={styles.repurposeGridItem}>
                <View style={styles.repurposeItemHeader}>
                  <Text style={styles.repurposeItemTitle} numberOfLines={1}>🧵 Threads</Text>
                  <Text style={styles.repurposeFitBadge}>HIGH</Text>
                </View>
                <Text style={styles.repurposeSnippetText}>"5-slide swipeable text hook..."</Text>
                <Text style={styles.repurposeLockTag}>🔒 PRO PREVIEW</Text>
              </View>
            </View>

            <Text style={styles.repurposeSubtext}>
              Auto-convert this TikTok script into 4 optimized multi-platform assets with 1 click.
            </Text>

            <Pressable
              style={({ pressed }) => [styles.repurposeUnlockBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  handleRepurposePost();
                }
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.repurposeUnlockGradient}
              >
                <Text style={styles.repurposeUnlockBtnText}>
                  Unlock 1-Click Repurposing (Pro) ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          {/* CARD 11: AUDIENCE DEMOGRAPHICS FOR THIS POST */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Audience for this post</Text>
          </View>

          <View style={styles.audienceForPostCard}>
            <Text style={styles.audienceForPostSub}>
              Viewers were primarily creators and aspiring influencers:
            </Text>

            <View style={styles.demographicRow}>
              <View style={styles.demographicCol}>
                <Text style={styles.demoLabel}>PRIMARY AGE</Text>
                <Text style={styles.demoValue}>18-24 (58%)</Text>
                <Text style={styles.demoSub}>25-34 (32%)</Text>
              </View>
              <View style={styles.demoDivider} />
              <View style={styles.demographicCol}>
                <Text style={styles.demoLabel}>TOP CITIES</Text>
                <Text style={styles.demoValue}>London (24%)</Text>
                <Text style={styles.demoSub}>Lagos, NYC, Toronto</Text>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.unlockFullDemoBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                if (onOpenJarvisPro) {
                  onOpenJarvisPro();
                } else {
                  showToast('Pro demographic analytics unlocked!');
                }
              }}
            >
              <LinearGradient
                colors={['#F59E0B', '#F59E0B', '#F59E0B', '#A16207']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.unlockDemoGradient}
              >
                <Text style={styles.unlockFullDemoBtnText}>
                  Unlock Full Demographic Report (Pro) ➔
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* FLOATING LIQUID GLASS TAB BAR */}
        <FloatingTabBar activeTab={activeTab} onTabPress={handleTabPress} />

        
        {/* NOTIFICATION MODAL */}
        <Modal
          visible={showNotificationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowNotificationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
              <View style={styles.modalHeaderRow}>
                <View>
                  <Text style={styles.modalTitle}>Notifications</Text>
                  <Text style={styles.modalSubtitle}>Recent updates &amp; creator milestones</Text>
                </View>
                <Pressable onPress={() => setShowNotificationModal(false)} style={styles.modalCloseCircle} hitSlop={8}>
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <View style={styles.notifCard}>
                <Text style={{ fontSize: 18 }}>🔥</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>Viral Post Milestone!</Text>
                  <Text style={styles.notifBody}>Your TikTok post crossed 24.5K views with 71.6% retention.</Text>
                </View>
              </View>

              <View style={[styles.notifCard, { marginTop: 8 }]}>
                <Text style={{ fontSize: 18 }}>📈</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.notifTitle}>+910 Followers Gained</Text>
                  <Text style={styles.notifBody}>Single-post all-time high pace recorded by Jarvis.</Text>
                </View>
              </View>

              <Pressable style={styles.modalFullBtn} onPress={() => setShowNotificationModal(false)}>
                <Text style={styles.modalFullBtnText}>Close</Text>
              </Pressable>
            </Animated.View>
          </View>
        </Modal>

        {/* PROFILE MODAL */}
        <UserProfileModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={onLogout}
          initialProfile={userProfile}
          onSaveProfile={onSaveProfile}
        />

        {/* JARVIS CALCULATION EXPLANATION MODAL */}
        <Modal
          visible={showJarvisExplanationModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowJarvisExplanationModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalHeaderLeft}>
                  <Text style={{ fontSize: 18 }}>🤖</Text>
                  <Text style={styles.modalTitle} numberOfLines={1}>Jarvis Performance Model</Text>
                </View>
                <Pressable
                  onPress={() => setShowJarvisExplanationModal(false)}
                  style={styles.modalCloseCircle}
                  hitSlop={8}
                >
                  <Text style={styles.modalCloseCross}>✕</Text>
                </Pressable>
              </View>

              <Text style={styles.modalBodyText}>
                Jarvis computed this post's score by analyzing 4 core retention metrics:
              </Text>

              <View style={{ gap: 8, marginVertical: 12 }}>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailBullet}>1.</Text>
                  <Text style={styles.modalDetailText}>
                    <Text style={{ fontWeight: '700', color: '#171420' }}>First 3-Second Hook Retention:</Text> 84.2% stay rate (top 2% benchmark).
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailBullet}>2.</Text>
                  <Text style={styles.modalDetailText}>
                    <Text style={{ fontWeight: '700', color: '#171420' }}>Save Multiplier:</Text> 3,420 saves (13.9% save rate vs 4.1% niche average).
                  </Text>
                </View>
                <View style={styles.modalDetailRow}>
                  <Text style={styles.modalDetailBullet}>3.</Text>
                  <Text style={styles.modalDetailText}>
                    <Text style={{ fontWeight: '700', color: '#171420' }}>Pacing Density:</Text> 1 cut every 1.8 seconds prevented drop-offs.
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.modalDoneBtn}
                onPress={() => setShowJarvisExplanationModal(false)}
              >
                <Text style={styles.modalDoneBtnText}>Understood ✓</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* CELEBRATION MODAL */}
        <AnimatedCompletionModal
          visible={showCelebrationModal}
          title="Post Blueprint Unlocked! 🚀"
          subtitle="You now have the exact retention and hook formula from your viral post."
          badgeText="VIRAL BLUEPRINT"
          xpEarned={100}
          streakCount={userProfile?.streakCount || 1}
          actionText="Create Next Post ➔"
          onDismiss={() => {
            setShowCelebrationModal(false);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAF8F5',
  },
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FAF8F5',
  },
  btnPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },

  // 1. TOP HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1EFEA',
    backgroundColor: '#FAF8F5',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerLogoWrapper: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGhostLogo: {
    width: 28,
    height: 28,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },
  headerSubtitleText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.6,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  headerProfileBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#582CDB',
  },
  headerProfileImg: {
    width: '100%',
    height: '100%',
  },

  // SCROLL CONTENT
  scrollContent: {
    flex: 1,
    paddingHorizontal: sPadding(20),
    paddingTop: 12,
  },

  // SECTION SWITCH CHIPS
  sectionSwitchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  sectionSwitchChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  sectionSwitchChipActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  sectionSwitchChipText: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  sectionSwitchChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // HERO TITLES
  heroTitleContainer: {
    marginBottom: 4,
    paddingRight: 8,
  },
  badgePillRow: {
    marginBottom: 6,
  },
  deepDivePill: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  deepDivePillText: {
    fontSize: sFont(10),
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: Platform.OS === 'web' ? ('clamp(17px, 4.2vw, 21px)' as any) : sFont(19.5),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.35,
    marginBottom: 4,
  },
  mainSubtitle: {
    fontSize: sFont(13),
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },

  // SECTION HEADERS
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: sFont(18),
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.3,
  },

  // CARD 1: BEST POST HERO CARD
  bestPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 12,
    marginBottom: 16,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 14,
    elevation: 3,
  },
  videoPreviewContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  topPostBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#FBBF24',
    paddingVertical: 3.5,
    paddingHorizontal: 8.5,
    borderRadius: 6,
  },
  topPostBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: 0.4,
  },
  playButtonCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  playIconTriangle: {
    fontSize: 16,
    color: '#582CDB',
    marginLeft: 3,
  },
  videoMetaContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
  },
  videoAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  videoAuthorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  videoAuthorName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowRadius: 3,
  },
  videoPostTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 17.5,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },

  // 3-Column Stats Bar
  postStatsBar: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  postStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  postStatLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  postStatValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#171420',
  },
  postStatDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },

  // Dual Action Buttons
  postActionsRow: {
    gap: 8,
  },
  postEarningsChip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FAF5FF',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 10,
  },
  postEarningsLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 6,
  },
  postEarningsChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#171420',
  },
  postEarningsChipLink: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    flexShrink: 0,
  },
  createSimilarBtn: {
    height: 44,
    borderRadius: 13,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionBtnGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createSimilarBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  repurposeBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  repurposeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },

  // CARD 2: PERFORMANCE 2x2 GRID
  perfGrid2x2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  perfMetricBox: {
    width: '48.2%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 14,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  perfMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  perfMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  perfSurgePillGreen: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  perfSurgeTextGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  perfSurgePillNeutral: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  perfSurgeTextNeutral: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  perfSurgePillPurple: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  perfSurgeTextPurple: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
  },
  perfSurgePillGold: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  perfSurgeTextGold: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },

  // Highlight Callout Banner
  perfCalloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginBottom: 18,
  },
  perfCalloutText: {
    flex: 1,
    fontSize: 12,
    color: '#3B1A82',
    lineHeight: 17,
    fontWeight: '600',
  },

  // CARD 3: WHY IT WORKED
  whyItWorkedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  whyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  whyCheckCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  whyCheckMark: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  whyItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 2,
  },
  whyItemBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  whyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  // CARD 4: RECOMMENDED CREATION
  recommendedCreationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  recommendedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  recommendedSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  recommendedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
    lineHeight: 19,
  },
  recommendedReasoning: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 3,
    fontWeight: '500',
  },
  recommendedMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EDE8E1',
  },
  recommendedMetaItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  metaLabel: {
    fontSize: sFont(8.5),
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
    textAlign: 'center',
  },
  metaValue: {
    fontSize: sFont(11.5),
    fontWeight: '800',
    color: '#171420',
    textAlign: 'center',
  },
  metaDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  createTopicBtn: {
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  createTopicBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // CARD 5: ENGAGEMENT QUALITY
  engagementQualityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
  },
  engagementQualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  engagementIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  engagementNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#171420',
  },
  engagementSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  qualityPillGold: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityPillGoldText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  qualityPillPurple: {
    backgroundColor: '#FAF5FF',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityPillPurpleText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#582CDB',
  },
  qualityPillGreen: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  qualityPillGreenText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669',
  },
  engagementDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },

  // CARD 6: JARVIS CORE INSIGHT
  jarvisCoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  jarvisCoreAvatarBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#FAF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  jarvisCoreFlameImg: {
    width: 32,
    height: 32,
  },
  jarvisCoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  jarvisCoreTextPrimary: {
    fontSize: sFont(12.5),
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 4,
    paddingHorizontal: 6,
  },
  jarvisCoreTextSecondary: {
    fontSize: sFont(12),
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  howItWorksExpandBox: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    marginBottom: 12,
  },
  howItWorksExpandTitle: {
    fontSize: sFont(11),
    fontWeight: '800',
    color: '#582CDB',
    marginBottom: 4,
  },
  howItWorksExpandBody: {
    fontSize: sFont(11.5),
    color: '#334155',
    lineHeight: 16.5,
  },
  jarvisActionLinksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  jarvisLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  jarvisLinkText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#582CDB',
  },

  // CARD 7: WINNING CONTENT PATTERN
  patternGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  patternBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 12,
    alignItems: 'center',
  },
  patternLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  patternValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#171420',
    textAlign: 'center',
  },

  // CARD 8: THE HOOK
  hookRetentionBadge: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  hookRetentionBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#B45309',
  },
  hookCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: '#582CDB',
  },
  hookQuoteText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#171420',
    lineHeight: 19,
    fontStyle: 'italic',
  },

  // CARD 9: CAPTION
  captionOptimizedBadge: {
    backgroundColor: '#DCFCE7',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  captionOptimizedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#15803D',
  },
  captionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
  },
  captionBodyText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  captionHashtags: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
    lineHeight: 16,
  },

  // CARD 10: REPURPOSE PREVIEW (LOCKED TO PRO)
  proPillBadge: {
    backgroundColor: '#FEF9C3',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  proPillBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#A16207',
    letterSpacing: 0.3,
  },
  repurposeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#FEF08A',
    padding: 16,
    marginBottom: 18,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 3,
  },
  repurposeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
    marginBottom: 12,
  },
  repurposeGridItem: {
    width: '48%',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 9,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  repurposeItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  repurposeItemTitle: {
    fontSize: sFont(10.5),
    fontWeight: '800',
    color: '#171420',
    flex: 1,
    marginRight: 4,
  },
  repurposeFitBadge: {
    fontSize: sFont(7.5),
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  repurposeFitBadgeMedium: {
    fontSize: sFont(7.5),
    fontWeight: '800',
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    paddingVertical: 1.5,
    paddingHorizontal: 4,
    borderRadius: 4,
    flexShrink: 0,
  },
  repurposeSnippetText: {
    fontSize: sFont(10),
    color: '#64748B',
    fontStyle: 'italic',
    lineHeight: 14,
    marginVertical: 4,
  },
  repurposeLockTag: {
    fontSize: sFont(9),
    fontWeight: '700',
    color: '#A16207',
    marginTop: 2,
  },
  repurposeSubtext: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
    lineHeight: 16,
  },
  repurposeUnlockBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  repurposeUnlockGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  repurposeUnlockBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // CARD 11: AUDIENCE DEMOGRAPHICS FOR THIS POST
  audienceForPostCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EDE8E1',
    padding: 16,
    marginBottom: 18,
  },
  audienceForPostSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  demographicRow: {
    flexDirection: 'row',
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  demographicCol: {
    flex: 1,
    alignItems: 'center',
  },
  demoLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  demoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#171420',
  },
  demoSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  demoDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  unlockFullDemoBtn: {
    height: 46,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  unlockDemoGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockFullDemoBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
    letterSpacing: -0.2,
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 12, 24, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#171420',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 28,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
    minWidth: 0,
    marginRight: 4,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  modalCloseCross: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '800',
  },
  modalTitle: {
    fontSize: sFont(15.5),
    fontWeight: '700',
    color: '#171420',
    flexShrink: 1,
  },
  modalBodyText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  modalDetailRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  modalDetailBullet: {
    fontSize: 12,
    fontWeight: '700',
    color: '#582CDB',
  },
  modalDetailText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  modalDoneBtn: {
    height: 44,
    borderRadius: 12,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  modalDoneBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#EFEBF8',
  },
  notifTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: 12,
    color: '#64748B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalFullBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
  },
  modalFullBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // TOAST
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 30,
    left: 20,
    right: 20,
    backgroundColor: '#171420',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
