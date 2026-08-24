import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  Pressable,
  Platform,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TinyGoldCheck = ({ size = 13 }: { size?: number }) => (
  <View
    style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#F59E0B',
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#F59E0B',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
      elevation: 2,
    }}
  >
    <Svg width={size * 0.65} height={size * 0.65} viewBox="0 0 12 12" fill="none">
      <Path
        d="M2.5 6.2L4.8 8.5L9.5 3.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

export interface StorySlide {
  id: string;
  type?: 'daily_story' | 'highlights' | 'milestone';
  title: string;
  subtitle: string;
  timeAgo: string;
  quote?: string;
  badge?: string;
  soundName?: string;
  highlights?: {
    title: string;
    platform: string;
    views: string;
    saves: string;
  }[];
  milestoneTitle?: string;
  milestoneXp?: string;
}

export interface CreatorStoryData {
  id: string;
  name: string;
  handle: string;
  niche: string;
  avatar: any;
  streak: number;
  isOnline: boolean;
  isPro: boolean;
  statusText?: string;
  slides: StorySlide[];
}

interface CreatorStoryModalProps {
  visible: boolean;
  onClose: () => void;
  storyData: CreatorStoryData | null;
  onReply?: (creator: CreatorStoryData, text: string) => void;
  onSendCollabPitch?: (creator: CreatorStoryData) => void;
}

export const CreatorStoryModal: React.FC<CreatorStoryModalProps> = ({
  visible,
  onClose,
  storyData,
  onReply,
  onSendCollabPitch,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [replyText, setReplyText] = useState('');
  const progressAnim = useRef(new Animated.Value(0)).current;

  const slides = storyData?.slides || [];
  const currentSlide = slides[currentSlideIndex] || null;

  useEffect(() => {
    if (visible && storyData) {
      setCurrentSlideIndex(0);
      startSlideTimer();
    }
  }, [visible, storyData]);

  const startSlideTimer = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        handleNextSlide();
      }
    });
  };

  const handleNextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
      progressAnim.setValue(0);
      startSlideTimer();
    } else {
      onClose();
    }
  };

  const handlePrevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex((prev) => prev - 1);
      progressAnim.setValue(0);
      startSlideTimer();
    } else {
      progressAnim.setValue(0);
      startSlideTimer();
    }
  };

  const handleSendReaction = (emoji: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (storyData && onReply) {
      onReply(storyData, `Sent reaction: ${emoji}`);
    }
  };

  const handleSendTextReply = () => {
    if (!replyText.trim() || !storyData) return;
    if (onReply) {
      onReply(storyData, replyText.trim());
    }
    setReplyText('');
  };

  if (!visible || !storyData) return null;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* BACKGROUND IMAGE / GRADIENT */}
        <Image source={storyData.avatar} style={styles.backgroundImage} resizeMode="cover" blurRadius={Platform.OS === 'ios' ? 18 : 8} />
        <LinearGradient
          colors={['rgba(15, 10, 30, 0.65)', 'rgba(15, 10, 30, 0.92)', '#0F0A1E']}
          style={styles.gradientOverlay}
        />

        {/* TAP NAVIGATION TOUCH ZONES (LEFT & RIGHT) */}
        <View style={styles.touchZonesContainer}>
          <Pressable style={styles.touchZoneLeft} onPress={handlePrevSlide} />
          <Pressable style={styles.touchZoneRight} onPress={handleNextSlide} />
        </View>

        {/* ============================================================ */}
        {/* TOP SEGMENTED PROGRESS BARS                                  */}
        {/* ============================================================ */}
        <View style={styles.progressBarContainer}>
          {slides.map((_, index) => {
            const isPast = index < currentSlideIndex;
            const isCurrent = index === currentSlideIndex;
            return (
              <View key={index} style={styles.progressBarTrack}>
                {isPast && <View style={[styles.progressBarFill, { width: '100%' }]} />}
                {isCurrent && (
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>

        {/* ============================================================ */}
        {/* TOP HEADER: CREATOR INFO & CLOSE                             */}
        {/* ============================================================ */}
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* Avatar with Tiny Gold Check Badge */}
            <View style={styles.avatarWrapper}>
              <Image source={storyData.avatar} style={styles.headerAvatar} />
              {storyData.isPro && (
                <View style={styles.goldCheckPosition}>
                  <TinyGoldCheck size={14} />
                </View>
              )}
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.creatorNameText}>{storyData.name}</Text>
                <View style={styles.streakBadgePill}>
                  <Text style={styles.streakBadgeText}>🔥 {storyData.streak}d</Text>
                </View>
              </View>
              <Text style={styles.storyTimeText}>
                {currentSlide?.timeAgo || 'Just now'} • {storyData.niche}
              </Text>
            </View>
          </View>

          <Pressable onPress={onClose} style={styles.closeBtnCircle} hitSlop={12}>
            <Text style={styles.closeCrossText}>✕</Text>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* STORY CONTENT BODY ACCORDING TO SLIDE TYPE                   */}
        {/* ============================================================ */}
        <View style={styles.contentBody}>
          {currentSlide?.type === 'highlights' ? (
            /* SLIDE TYPE: VIRAL HIGHLIGHTS */
            <View style={styles.slideCardWhite}>
              <View style={styles.slideTagBox}>
                <Text style={styles.slideTagText}>🌟 TOP VIRAL HIGHLIGHTS</Text>
              </View>
              <Text style={styles.slideTitleText}>{currentSlide.title}</Text>
              <Text style={styles.slideSubtitleText}>{currentSlide.subtitle}</Text>

              <View style={{ gap: 8, marginVertical: 12 }}>
                {(currentSlide.highlights || [
                  { title: '3 creator mistakes I stopped making', platform: 'TikTok', views: '84.2K', saves: '9.3K' },
                  { title: 'How I script 30-sec videos in 5 mins', platform: 'Reels', views: '61.5K', saves: '7.1K' },
                  { title: 'My daily 7:30 PM posting routine', platform: 'Shorts', views: '39.0K', saves: '4.5K' },
                ]).map((hl, idx) => (
                  <View key={idx} style={styles.highlightItemBox}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.highlightItemTitle}>&ldquo;{hl.title}&rdquo;</Text>
                      <Text style={styles.highlightPlatformText}>{hl.platform}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.highlightViewsVal}>{hl.views} views</Text>
                      <Text style={styles.highlightSavesVal}>{hl.saves} saves</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : currentSlide?.type === 'milestone' ? (
            /* SLIDE TYPE: STREAK MILESTONE */
            <View style={styles.slideCardWhite}>
              <Text style={{ fontSize: 44, textAlign: 'center', marginBottom: 4 }}>🏆👑</Text>
              <Text style={[styles.slideTitleText, { textAlign: 'center' }]}>
                {currentSlide.milestoneTitle || '50-Day Consistency Club'}
              </Text>
              <Text style={[styles.slideSubtitleText, { textAlign: 'center', marginVertical: 6 }]}>
                {currentSlide.milestoneXp || '+250 XP Earned with Accountability Squad'}
              </Text>
              <View style={styles.milestoneBadgePill}>
                <Text style={styles.milestoneBadgePillText}>TOP 1% CREATOR CONSISTENCY</Text>
              </View>
            </View>
          ) : (
            /* SLIDE TYPE: DAILY STORY / BTS */
            <View style={styles.slideCardWhite}>
              <View style={styles.slideTagBox}>
                <Text style={styles.slideTagText}>{currentSlide?.badge || '⚡ DAILY CREATOR STORY'}</Text>
              </View>

              <Text style={styles.slideTitleText}>{currentSlide?.title || 'Today’s Studio Session'}</Text>
              <Text style={styles.slideSubtitleText}>{currentSlide?.subtitle || 'Behind the scenes reel shoot'}</Text>

              <View style={styles.quoteBox}>
                <Text style={styles.quoteText}>
                  &ldquo;{currentSlide?.quote || 'Consistency feels 10x easier when you have an accountability partner. Finished today’s script in 8 mins!'}&rdquo;
                </Text>
              </View>

              <View style={styles.soundTrackBox}>
                <Text style={{ fontSize: 13 }}>🎵</Text>
                <Text style={styles.soundTrackText}>Trending Sound: Aesthetic Lo-Fi Beat (82k Reels)</Text>
              </View>
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* BOTTOM INTERACTION BAR: QUICK REACTIONS & COLLAB PITCH       */}
        {/* ============================================================ */}
        <View style={styles.bottomBar}>
          {/* Quick Reaction Emojis */}
          <View style={styles.reactionsRow}>
            {['🔥', '🤝', '👏', '🚀', '👑'].map((emoji) => (
              <Pressable
                key={emoji}
                style={styles.reactionEmojiBtn}
                onPress={() => handleSendReaction(emoji)}
              >
                <Text style={{ fontSize: 20 }}>{emoji}</Text>
              </Pressable>
            ))}
          </View>

          {/* Quick Reply & Collab Pitch */}
          <View style={styles.replyInputsRow}>
            <TextInput
              style={styles.replyInput}
              placeholder={`Reply to ${storyData.name.split(' ')[0]}...`}
              placeholderTextColor="#94A3B8"
              value={replyText}
              onChangeText={setReplyText}
              onSubmitEditing={handleSendTextReply}
            />

            <Pressable
              style={styles.collabPitchBtn}
              onPress={() => {
                if (onSendCollabPitch) {
                  onSendCollabPitch(storyData);
                }
              }}
            >
              <Text style={styles.collabPitchBtnText}>⚡ Propose Collab</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0A1E',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.35,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  touchZonesContainer: {
    position: 'absolute',
    top: 100,
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    zIndex: 1,
  },
  touchZoneLeft: {
    width: '40%',
    height: '100%',
  },
  touchZoneRight: {
    width: '60%',
    height: '100%',
  },

  // PROGRESS BARS
  progressBarContainer: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 16,
    marginBottom: 12,
    zIndex: 2,
  },
  progressBarTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1.5,
  },

  // HEADER
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  avatarWrapper: {
    position: 'relative',
  },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  goldCheckPosition: {
    position: 'absolute',
    bottom: -1,
    right: -1,
  },
  creatorNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  streakBadgePill: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  streakBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  storyTimeText: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 1,
  },
  closeBtnCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeCrossText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // CONTENT
  contentBody: {
    paddingHorizontal: 20,
    zIndex: 2,
  },
  slideCardWhite: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
  },
  slideTagBox: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  slideTagText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#582CDB',
    letterSpacing: 0.5,
  },
  slideTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171420',
    marginBottom: 4,
  },
  slideSubtitleText: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 12,
  },
  quoteBox: {
    backgroundColor: '#FAF8F5',
    borderLeftWidth: 3,
    borderLeftColor: '#582CDB',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  quoteText: {
    fontSize: 13.5,
    color: '#171420',
    lineHeight: 20,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  soundTrackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 10,
  },
  soundTrackText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700',
  },
  highlightItemBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    padding: 12,
    borderRadius: 12,
  },
  highlightItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#171420',
  },
  highlightPlatformText: {
    fontSize: 10.5,
    color: '#582CDB',
    fontWeight: '700',
    marginTop: 2,
  },
  highlightViewsVal: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  highlightSavesVal: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  milestoneBadgePill: {
    alignSelf: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 10,
  },
  milestoneBadgePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },

  // BOTTOM BAR
  bottomBar: {
    paddingHorizontal: 16,
    zIndex: 2,
    gap: 12,
  },
  reactionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    borderRadius: 16,
  },
  reactionEmojiBtn: {
    padding: 4,
  },
  replyInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  collabPitchBtn: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collabPitchBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
