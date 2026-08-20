import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
  Animated,
  TextInput,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { UserProfileData } from '../components/UserProfileModal';
import { AnimatedCompletionModal } from '../components/AnimatedCompletionModal';
import { BrandToast } from '../components/BrandToast';
import { FloatingTabBar, TabType } from '../components/FloatingTabBar';

interface ProRepurposeScreenProps {
  userProfile?: UserProfileData;
  onNavigate?: (screen: string) => void;
  onBack?: () => void;
  initialIdeaTitle?: string;
}

const { width } = Dimensions.get('window');

export const ProRepurposeScreen: React.FC<ProRepurposeScreenProps> = ({
  userProfile,
  onNavigate,
  onBack,
  initialIdeaTitle = '3 mistakes that slow down new creators',
}) => {
  // Core State
  const [originalIdea, setOriginalIdea] = useState(initialIdeaTitle);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([
    'tiktok',
    'ig_reel',
    'linkedin',
    'x_post',
    'shorts',
  ]);
  const [selectedCaptionVariation, setSelectedCaptionVariation] = useState('direct');
  const [isGenerating, setIsGenerating] = useState(false);

  // Toast & Modals
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKey, setToastKey] = useState(0);

  // Edit Modals
  const [showEditIdeaModal, setShowEditIdeaModal] = useState(false);
  const [editIdeaText, setEditIdeaText] = useState(originalIdea);
  const [editingVersion, setEditingVersion] = useState<{ id: string; title: string; body: string } | null>(null);

  // Generated Versions Data
  const [versions, setVersions] = useState([
    {
      id: 'tiktok',
      platform: 'TikTok Version',
      icon: '📺',
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'The Slow-Mo Creator Trap',
      body: 'Stop doing these 3 things if you want to grow past 1,000 followers...',
    },
    {
      id: 'linkedin',
      platform: 'LinkedIn Insight',
      icon: '💼',
      badge: 'OPTIMIZED',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: 'Scaling in the Creator Economy',
      body: "Reflecting on the friction points of early-stage creation. Consistency isn't just about output volume...",
    },
    {
      id: 'x_post',
      platform: 'X Thread Starter',
      icon: '💬',
      badge: 'READY',
      badgeColor: '#DCFCE7',
      badgeTextColor: '#15803D',
      title: '1/ 90% of new creators fail because of these 3 traps. Here\'s how to avoid them: [thread]',
      body: 'Breakdown of workflow systems that 10x your output without burnout.',
    },
  ]);

  // Completion / Celebration Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionData, setCompletionData] = useState({
    title: 'Content Repurposed!',
    subtitle: '1 idea converted into 5 platform-optimized posts (+150 XP)',
    badgeText: '✨ 5-PLATFORM MULTI-REPURPOSE (+150 XP)',
    xpEarned: 150,
    speechBubble: 'All 5 versions are calibrated for peak algorithmic retention, Pablo! 🔥',
  });

  const modalPopScale = useRef(new Animated.Value(0.9)).current;
  const triggerModalPop = () => {
    modalPopScale.setValue(0.9);
    Animated.spring(modalPopScale, {
      toValue: 1,
      friction: 6,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastKey((k) => k + 1);
  };

  // Format Selection Toggles
  const handleToggleFormat = (formatId: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (selectedFormats.includes(formatId)) {
      if (selectedFormats.length > 1) {
        setSelectedFormats(selectedFormats.filter((f) => f !== formatId));
        showToast(`Deselected ${formatId.toUpperCase()}`);
      } else {
        showToast('At least 1 format must remain selected');
      }
    } else {
      setSelectedFormats([...selectedFormats, formatId]);
      showToast(`✓ Added ${formatId.toUpperCase()}`);
    }
  };

  const handleToggleSelectAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const all = ['tiktok', 'ig_reel', 'linkedin', 'x_post', 'shorts'];
    if (selectedFormats.length === all.length) {
      setSelectedFormats(['tiktok']);
      showToast('Reset to TikTok format');
    } else {
      setSelectedFormats(all);
      showToast('✓ Selected all 5 formats');
    }
  };

  // Generate Action
  const handleGenerateVersions = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setIsGenerating(true);
    showToast('✨ Adapting idea for all selected platforms...');
    setTimeout(() => {
      setIsGenerating(false);
      setCompletionData({
        title: 'Platform Versions Generated!',
        subtitle: `Created tailored scripts for ${selectedFormats.length} platforms.`,
        badgeText: '✨ MULTI-PLATFORM SYNC (+50 XP)',
        xpEarned: 50,
        speechBubble: 'Hooks, tone & pacing calibrated for TikTok, Reels, LinkedIn & X, Pablo! 🚀',
      });
      setShowCompletionModal(true);
    }, 900);
  };

  // Use Version Handler
  const handleUseVersion = (version: typeof versions[0]) => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    showToast(`✓ Loaded "${version.title}" to Post Composer`);
    setTimeout(() => {
      if (onNavigate) {
        onNavigate('composer');
      }
    }, 400);
  };

  // Schedule All Handler
  const handleScheduleAll = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setCompletionData({
      title: 'Smart Multi-Post Scheduled!',
      subtitle: 'TikTok queued for 7:30 PM • Instagram Reels queued for 8:00 PM',
      badgeText: '📅 MULTI-CHANNEL QUEUED (+150 XP)',
      xpEarned: 150,
      speechBubble: 'Strategic schedule locked in at peak engagement windows! 🔥',
    });
    setShowCompletionModal(true);
  };

  // Save Edited Idea
  const handleSaveEditedIdea = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setOriginalIdea(editIdeaText);
    setShowEditIdeaModal(false);
    showToast('✓ Original Idea updated');
  };

  // Save Edited Version
  const handleSaveEditedVersion = () => {
    if (!editingVersion) return;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setVersions(
      versions.map((v) =>
        v.id === editingVersion.id
          ? { ...v, title: editingVersion.title, body: editingVersion.body }
          : v
      )
    );
    setEditingVersion(null);
    showToast('✓ Version updated');
  };

  return (
    <View style={styles.container}>
      {/* BRAND TOAST */}
      <BrandToast message={toastMessage} />

      {/* TOP APP BAR */}
      <View style={styles.topAppBar}>
        <Pressable
          style={({ pressed }) => [styles.topGhostLogoBtn, pressed && styles.btnPressed]}
          onPress={() => (onBack ? onBack() : onNavigate ? onNavigate('dashboard') : null)}
          hitSlop={8}
        >
          <Image
            source={require('../../assets/images/jarvis-ghost-clean.png')}
            style={styles.topGhostLogo}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.topRightRow}>
          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('messages')}
            hitSlop={8}
          >
            <Text style={{ fontSize: 16 }}>💬</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.topIconBtn, pressed && styles.btnPressed]}
            onPress={() => showToast('🔔 2 new platform suggestions')}
            hitSlop={8}
          >
            <Text style={{ fontSize: 16 }}>🔔</Text>
            <View style={styles.topNotifBadge} />
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.topAvatarBox, pressed && styles.btnPressed]}
            onPress={() => onNavigate && onNavigate('creator-passport')}
            hitSlop={8}
          >
            <Image
              source={userProfile?.avatarSource || require('../../assets/images/jarvis-ghost-clean.png')}
              style={styles.topAvatarImg}
              resizeMode="cover"
            />
            <View style={styles.topAvatarGoldBadge}>
              <Text style={{ fontSize: 8 }}>✓</Text>
            </View>
          </Pressable>
        </View>
      </View>

      {/* MAIN SCROLLABLE CONTENT */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO HEADER SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.repurposeStudioBadge}>
            <Text style={styles.repurposeStudioBadgeText}>REPURPOSE STUDIO</Text>
          </View>

          <Text style={styles.heroTitle}>Turn one idea into platform-ready posts.</Text>
          <Text style={styles.heroSubtitle}>
            Adapt one content idea into tailored versions for TikTok, Instagram, LinkedIn, X, and Shorts.
          </Text>
        </View>

        {/* ============================================================ */}
        {/* CARD 1: ORIGINAL IDEA                                       */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Text style={{ fontSize: 15 }}>💡</Text>
            <Text style={styles.sectionHeaderTitle}>Original Idea</Text>
          </View>

          <View style={styles.originalIdeaCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={styles.originalIdeaTitle}>&ldquo;{originalIdea}&rdquo;</Text>
              <View style={styles.shortVideoBadge}>
                <Text style={styles.shortVideoBadgeText}>SHORT VIDEO</Text>
              </View>
            </View>

            <Text style={styles.originalIdeaGoal}>🎯 Goal: Saves, comments, authority</Text>

            {/* Badges Row */}
            <View style={styles.badgesRow}>
              <View style={styles.retentionBadge}>
                <Text style={styles.retentionBadgeText}>RETENTION READY</Text>
              </View>
              <View style={styles.savePotentialBadge}>
                <Text style={styles.savePotentialBadgeText}>HIGH SAVE POTENTIAL</Text>
              </View>
            </View>

            {/* Edit Original Idea Button */}
            <Pressable
              style={({ pressed }) => [styles.editOriginalIdeaBtn, pressed && styles.btnPressed]}
              onPress={() => {
                setEditIdeaText(originalIdea);
                triggerModalPop();
                setShowEditIdeaModal(true);
              }}
            >
              <Text style={styles.editOriginalIdeaBtnText}>✏️ Edit Original Idea</Text>
            </Pressable>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 2: SELECT FORMATS                                       */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionHeaderTitle}>Select Formats</Text>
            <Pressable onPress={handleToggleSelectAll} hitSlop={8}>
              <Text style={styles.selectAllLinkText}>
                {selectedFormats.length === 5 ? 'Deselect All' : 'Select All'}
              </Text>
            </Pressable>
          </View>

          {/* Formats Grid */}
          <View style={styles.formatsGrid}>
            {[
              { id: 'tiktok', name: 'TikTok', icon: '📺' },
              { id: 'ig_reel', name: 'IG Reel', icon: '📸' },
              { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
              { id: 'x_post', name: 'X Post', icon: '𝕏' },
              { id: 'shorts', name: 'Shorts', icon: '▶️' },
              { id: 'more', name: 'More', icon: '➕', isMore: true },
            ].map((fmt) => {
              const isSelected = selectedFormats.includes(fmt.id);
              if (fmt.isMore) {
                return (
                  <Pressable
                    key={fmt.id}
                    style={({ pressed }) => [styles.formatMoreCard, pressed && styles.btnPressed]}
                    onPress={() => showToast('💡 Custom format creator unlocking soon')}
                  >
                    <Text style={{ fontSize: 15 }}>{fmt.icon}</Text>
                    <Text style={styles.formatMoreText}>{fmt.name}</Text>
                  </Pressable>
                );
              }
              return (
                <Pressable
                  key={fmt.id}
                  style={({ pressed }) => [
                    styles.formatCard,
                    isSelected && styles.formatCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => handleToggleFormat(fmt.id)}
                >
                  <Text style={{ fontSize: 16 }}>{fmt.icon}</Text>
                  <Text style={[styles.formatCardName, isSelected && styles.formatCardNameActive]}>
                    {fmt.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.formatCheckDot}>
                      <Text style={{ fontSize: 8, color: '#FFFFFF', fontWeight: '900' }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Generate Versions Action Button */}
          <Pressable
            style={({ pressed }) => [styles.generateVersionsBtn, pressed && styles.btnPressed]}
            onPress={handleGenerateVersions}
          >
            <LinearGradient
              colors={['#582CDB', '#6D28D9']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.generateVersionsGradient}
            >
              <Text style={styles.generateVersionsBtnText}>
                {isGenerating ? '⏳ Adapting Across Formats...' : '✨ Generate Versions'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 3: GENERATED VERSIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Generated Versions</Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {versions.map((ver) => (
              <View key={ver.id} style={styles.versionCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 14 }}>{ver.icon}</Text>
                    <Text style={styles.versionPlatformText}>{ver.platform}</Text>
                  </View>
                  <View style={[styles.versionBadge, { backgroundColor: ver.badgeColor }]}>
                    <Text style={[styles.versionBadgeText, { color: ver.badgeTextColor }]}>
                      {ver.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.versionTitle}>{ver.title}</Text>
                <Text style={styles.versionBodyText}>&ldquo;{ver.body}&rdquo;</Text>

                {/* Edit & Use Buttons */}
                <View style={styles.versionActionsRow}>
                  <Pressable
                    style={({ pressed }) => [styles.versionEditBtn, pressed && styles.btnPressed]}
                    onPress={() => {
                      setEditingVersion({ id: ver.id, title: ver.title, body: ver.body });
                      triggerModalPop();
                    }}
                  >
                    <Text style={styles.versionEditBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [styles.versionUseBtn, pressed && styles.btnPressed]}
                    onPress={() => handleUseVersion(ver)}
                  >
                    <Text style={styles.versionUseBtnText}>Use Version</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 4: CAPTION VARIATIONS                                   */}
        {/* ============================================================ */}
        <View style={styles.cardSectionContainer}>
          <Text style={styles.sectionHeaderTitle}>Caption Variations</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.captionVariationsScroll}
          >
            {[
              {
                id: 'direct',
                type: 'DIRECT',
                text: '3 mistakes slowing you down: 1. Lack of routine, 2. Bad lighting, 3. Long intros. Fixed.',
              },
              {
                id: 'story',
                type: 'STORY-FOCUSED',
                text: 'Save this for when you need a reminder. These 3 lessons transformed my creation journey...',
              },
              {
                id: 'question',
                type: 'CONVERSATION HOOK',
                text: 'Which of these 3 creator traps took you the longest to unlearn? Drop your number below.',
              },
            ].map((cap) => {
              const isSelected = selectedCaptionVariation === cap.id;
              return (
                <Pressable
                  key={cap.id}
                  style={({ pressed }) => [
                    styles.captionVarCard,
                    isSelected && styles.captionVarCardActive,
                    pressed && styles.btnPressed,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedCaptionVariation(cap.id);
                    showToast(`✓ Applied ${cap.type} caption angle`);
                  }}
                >
                  <View style={styles.captionVarTypeBadge}>
                    <Text style={styles.captionVarTypeBadgeText}>{cap.type}</Text>
                  </View>
                  <Text style={styles.captionVarText} numberOfLines={4}>
                    {cap.text}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* CARD 5: REPURPOSE SCORE GAUGE                                */}
        {/* ============================================================ */}
        <View style={styles.repurposeScoreCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={styles.repurposeScoreTitle}>Repurpose Score</Text>
              <Text style={styles.repurposeScoreSub}>Strategic readiness factor</Text>
            </View>

            {/* Circular Gauge 88 */}
            <View style={styles.gaugeCircle}>
              <Text style={styles.gaugeScoreVal}>88</Text>
            </View>
          </View>

          {/* Metric Progress Bars */}
          <View style={{ gap: 10, marginTop: 16 }}>
            {/* Short-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>SHORT-FORM</Text>
                <Text style={styles.metricBarVal}>92%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '92%', backgroundColor: '#582CDB' }]} />
              </View>
            </View>

            {/* Long-form */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.metricBarLabel}>LONG-FORM</Text>
                <Text style={styles.metricBarVal}>84%</Text>
              </View>
              <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: '84%', backgroundColor: '#F59E0B' }]} />
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================ */}
        {/* CARD 6: JARVIS INSIGHT HERO CARD                             */}
        {/* ============================================================ */}
        <LinearGradient
          colors={['#2A1454', '#1E0C3E', '#14072C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.jarvisHeroCard}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.jarvisIconHaloBox}>
                <Image
                  source={require('../../assets/images/jarvis-core-flame.png')}
                  style={{ width: 26, height: 26 }}
                  resizeMode="contain"
                />
              </View>
              <View>
                <Text style={styles.jarvisHeroTitle}>Jarvis Insight</Text>
                <Text style={styles.jarvisHeroSub}>PRO AI STRATEGY</Text>
              </View>
            </View>
            <View style={styles.jarvisActivePill}>
              <Text style={styles.jarvisActivePillText}>⚡ ACTIVE</Text>
            </View>
          </View>

          <View style={styles.jarvisQuoteBox}>
            <Text style={styles.jarvisQuoteText}>
              &ldquo;Your strongest repurposed version shows the best retention potential. Recommend scheduling TikTok first.&rdquo;
            </Text>
          </View>

          {/* Strategy Pills */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {['SCHEDULE TIKTOK FIRST', 'CROSS-POST REEL', 'EXTRACT THREAD'].map((pill) => (
              <Pressable
                key={pill}
                style={styles.jarvisGoldStrategyPill}
                onPress={() => showToast(`✓ Applied ${pill}`)}
              >
                <Text style={styles.jarvisGoldStrategyPillText}>{pill}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.jarvisScheduleBtn, pressed && styles.btnPressed]}
            onPress={handleScheduleAll}
          >
            <Text style={styles.jarvisScheduleBtnText}>✨ Schedule All via Jarvis</Text>
          </Pressable>
        </LinearGradient>

        {/* ============================================================ */}
        {/* CARD 7: STRATEGIC SCHEDULE                                   */}
        {/* ============================================================ */}
        <View style={styles.scheduleCard}>
          <Text style={styles.scheduleHeaderTitle}>Strategic Schedule</Text>

          <View style={{ gap: 8, marginTop: 10 }}>
            <View style={styles.scheduleSlotRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 15 }}>📺</Text>
                <Text style={styles.scheduleSlotName}>TikTok</Text>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>7:30 PM</Text>
              </View>
            </View>

            <View style={styles.scheduleSlotRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontSize: 15 }}>📸</Text>
                <Text style={styles.scheduleSlotName}>Instagram</Text>
              </View>
              <View style={styles.scheduleTimePill}>
                <Text style={styles.scheduleTimePillText}>8:00 PM</Text>
              </View>
            </View>
          </View>

          {/* Schedule All Amber Action Button */}
          <Pressable
            style={({ pressed }) => [styles.amberScheduleAllBtn, pressed && styles.btnPressed]}
            onPress={handleScheduleAll}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.amberScheduleAllGradient}
            >
              <Text style={styles.amberScheduleAllBtnText}>📅  Schedule All</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* ============================================================ */}
        {/* CARD 8: PROGRESS & SAFETY                                    */}
        {/* ============================================================ */}
        <View style={styles.progressSafetyRow}>
          <View style={styles.metricCardBox}>
            <Text style={styles.metricCardLabel}>PROGRESS</Text>
            <Text style={styles.metricCardValue}>86%</Text>
          </View>

          <View style={styles.metricCardBox}>
            <Text style={styles.metricCardLabel}>SAFETY</Text>
            <Text style={[styles.metricCardValue, { color: '#F59E0B' }]}>47D</Text>
          </View>
        </View>

        {/* ============================================================ */}
        {/* BOTTOM ACTION BUTTONS                                        */}
        {/* ============================================================ */}
        <View style={{ gap: 10, marginTop: 20 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              style={({ pressed }) => [styles.bottomScheduleBtn, pressed && styles.btnPressed]}
              onPress={handleScheduleAll}
            >
              <Text style={styles.bottomScheduleBtnText}>Schedule 📅</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.bottomRegenerateBtn, pressed && styles.btnPressed]}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                showToast('🔄 Regenerating all platform versions...');
                handleGenerateVersions();
              }}
            >
              <Text style={styles.bottomRegenerateBtnText}>Regenerate</Text>
            </Pressable>
          </View>

          {/* Redesigned Luxury Save Draft Button */}
          <Pressable
            style={({ pressed }) => [styles.saveDraftFullBtn, pressed && styles.btnPressed]}
            onPress={() => {
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              setCompletionData({
                title: 'Repurpose Draft Saved!',
                subtitle: 'All 5 tailored platform posts saved to your draft bank.',
                badgeText: '💾 DRAFT SECURED (+120 XP)',
                xpEarned: 120,
                speechBubble: 'Your multi-channel repurpose draft is safe and ready to schedule anytime! 🔥',
              });
              setShowCompletionModal(true);
            }}
          >
            <Text style={{ fontSize: 13, marginRight: 6 }}>💾</Text>
            <Text style={styles.saveDraftFullBtnText}>Save Draft</Text>
            <View style={styles.saveDraftXpPill}>
              <Text style={styles.saveDraftXpPillText}>+120 XP</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* EDIT ORIGINAL IDEA MODAL */}
      <Modal
        visible={showEditIdeaModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditIdeaModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Edit Original Idea</Text>
              <Pressable onPress={() => setShowEditIdeaModal(false)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <TextInput
              style={styles.modalTextInput}
              value={editIdeaText}
              onChangeText={setEditIdeaText}
              placeholder="Enter original idea..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setShowEditIdeaModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedIdea}
              >
                <Text style={styles.modalSaveBtnText}>Save Idea</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* EDIT VERSION MODAL */}
      <Modal
        visible={editingVersion !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingVersion(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={[styles.modalCard, { transform: [{ scale: modalPopScale }] }]}>
            <View style={styles.modalHeaderBetween}>
              <Text style={styles.modalTitle}>Edit Platform Version</Text>
              <Pressable onPress={() => setEditingVersion(null)} hitSlop={8}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>

            <Text style={styles.modalInputLabel}>TITLE / HOOK</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 50 }]}
              value={editingVersion?.title}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, title: text } : null))
              }
              placeholder="Version title..."
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.modalInputLabel, { marginTop: 10 }]}>BODY CONTENT</Text>
            <TextInput
              style={[styles.modalTextInput, { height: 90 }]}
              value={editingVersion?.body}
              onChangeText={(text) =>
                setEditingVersion((prev) => (prev ? { ...prev, body: text } : null))
              }
              placeholder="Version body content..."
              placeholderTextColor="#94A3B8"
              multiline
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                style={styles.modalCancelBtn}
                onPress={() => setEditingVersion(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={styles.modalSaveBtn}
                onPress={handleSaveEditedVersion}
              >
                <Text style={styles.modalSaveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* 3D GHOST CELEBRATION MODAL */}
      <AnimatedCompletionModal
        visible={showCompletionModal}
        onDismiss={() => setShowCompletionModal(false)}
        title={completionData.title}
        subtitle={completionData.subtitle}
        badgeText={completionData.badgeText}
        xpEarned={completionData.xpEarned}
        speechBubble={completionData.speechBubble}
      />

      {/* FLOATING TAB BAR */}
      <FloatingTabBar
        activeTab="create"
        onTabPress={(tab: TabType) => {
          if (onNavigate) {
            if (tab === 'home') onNavigate('dashboard');
            else if (tab === 'create') onNavigate('create');
            else if (tab === 'match') onNavigate('match');
            else if (tab === 'quests') onNavigate('quests');
            else if (tab === 'growth') onNavigate('growth');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5F0',
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.98 }],
  },

  // TOP APP BAR
  topAppBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : 20,
    paddingBottom: 14,
    backgroundColor: '#F7F5F0',
  },
  topGhostLogoBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  topGhostLogo: {
    width: 24,
    height: 24,
  },
  topRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFECE6',
    position: 'relative',
  },
  topNotifBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  topAvatarBox: {
    position: 'relative',
  },
  topAvatarImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#582CDB',
  },
  topAvatarGoldBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // SCROLL CONTENT
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },

  // HERO SECTION
  heroSection: {
    marginTop: 6,
    marginBottom: 16,
  },
  repurposeStudioBadge: {
    backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    marginBottom: 8,
  },
  repurposeStudioBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#171420',
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },

  // SECTION HEADERS
  cardSectionContainer: {
    marginTop: 18,
  },
  sectionHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },

  // CARD 1: ORIGINAL IDEA
  originalIdeaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  originalIdeaTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#171420',
    flex: 1,
    lineHeight: 20,
    paddingRight: 8,
  },
  shortVideoBadge: {
    backgroundColor: '#582CDB',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  shortVideoBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  originalIdeaGoal: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 12,
  },
  retentionBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  retentionBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803D',
    letterSpacing: 0.3,
  },
  savePotentialBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  savePotentialBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#D97706',
    letterSpacing: 0.3,
  },
  editOriginalIdeaBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  editOriginalIdeaBtnText: {
    color: '#582CDB',
    fontSize: 12,
    fontWeight: '900',
  },

  // CARD 2: SELECT FORMATS
  selectAllLinkText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#582CDB',
  },
  formatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatCard: {
    width: (width - 40 - 16) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EFECE6',
    position: 'relative',
    gap: 4,
  },
  formatCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  formatCardName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
  },
  formatCardNameActive: {
    fontWeight: '900',
    color: '#171420',
  },
  formatCheckDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#582CDB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formatMoreCard: {
    width: (width - 40 - 16) / 3,
    backgroundColor: '#FAF8F5',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    gap: 4,
  },
  formatMoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  generateVersionsBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  generateVersionsGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  generateVersionsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // CARD 3: GENERATED VERSIONS
  versionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  versionPlatformText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#171420',
  },
  versionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
  },
  versionBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  versionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#171420',
    marginTop: 8,
    marginBottom: 4,
  },
  versionBodyText: {
    fontSize: 11.5,
    color: '#475569',
    lineHeight: 17,
  },
  versionActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  versionEditBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionEditBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#171420',
  },
  versionUseBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  versionUseBtnText: {
    fontSize: 11.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // CARD 4: CAPTION VARIATIONS
  captionVariationsScroll: {
    gap: 10,
    marginTop: 10,
    paddingRight: 10,
  },
  captionVarCard: {
    width: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#EFECE6',
  },
  captionVarCardActive: {
    borderColor: '#582CDB',
    backgroundColor: '#F5F3FF',
  },
  captionVarTypeBadge: {
    backgroundColor: '#EDE9FE',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
    marginBottom: 8,
  },
  captionVarTypeBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: 0.3,
  },
  captionVarText: {
    fontSize: 11,
    color: '#334155',
    lineHeight: 16,
    fontWeight: '600',
  },

  // CARD 5: REPURPOSE SCORE
  repurposeScoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  repurposeScoreTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  repurposeScoreSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  gaugeCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FEFCE8',
  },
  gaugeScoreVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  metricBarLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  metricBarVal: {
    fontSize: 10,
    fontWeight: '900',
    color: '#171420',
  },
  metricBarTrack: {
    height: 6,
    backgroundColor: '#F1EFE9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // CARD 6: JARVIS HERO CARD
  jarvisHeroCard: {
    borderRadius: 22,
    padding: 18,
    marginTop: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.45)',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  jarvisIconHaloBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(88, 44, 219, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jarvisHeroTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  jarvisHeroSub: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#A78BFA',
    letterSpacing: 0.5,
    marginTop: 1,
  },
  jarvisActivePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  jarvisActivePillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#34D399',
    letterSpacing: 0.3,
  },
  jarvisQuoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  jarvisQuoteText: {
    fontSize: 12,
    color: '#F1F5F9',
    lineHeight: 18,
    fontWeight: '600',
  },
  jarvisGoldStrategyPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  jarvisGoldStrategyPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  jarvisScheduleBtn: {
    backgroundColor: '#582CDB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  jarvisScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },

  // CARD 7: STRATEGIC SCHEDULE
  scheduleCard: {
    backgroundColor: '#FAF8F5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#EFECE6',
    marginTop: 18,
  },
  scheduleHeaderTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#171420',
  },
  scheduleSlotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  scheduleSlotName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#171420',
  },
  scheduleTimePill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scheduleTimePillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#582CDB',
  },
  amberScheduleAllBtn: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
  },
  amberScheduleAllGradient: {
    paddingVertical: 13,
    alignItems: 'center',
  },
  amberScheduleAllBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  // CARD 8: PROGRESS & SAFETY
  progressSafetyRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  metricCardBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EFECE6',
  },
  metricCardLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.4,
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#582CDB',
    marginTop: 4,
  },

  // BOTTOM ACTION BUTTONS
  bottomScheduleBtn: {
    flex: 1,
    backgroundColor: '#582CDB',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  bottomScheduleBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  bottomRegenerateBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
  },
  bottomRegenerateBtnText: {
    color: '#171420',
    fontSize: 13,
    fontWeight: '900',
  },
  saveDraftFullBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F5',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  saveDraftFullBtnText: {
    color: '#171420',
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  saveDraftXpPill: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    marginLeft: 8,
  },
  saveDraftXpPillText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#582CDB',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#EFECE6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#64748B',
    padding: 4,
  },
  modalInputLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94A3B8',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  modalTextInput: {
    backgroundColor: '#FAF8F5',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 13,
    color: '#171420',
    minHeight: 60,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '900',
  },
  modalSaveBtn: {
    flex: 2,
    backgroundColor: '#582CDB',
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
