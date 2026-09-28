import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export interface WeeklyGoalData {
  personalTarget: number;
  squadTarget: number;
  focusCategory: string;
  xpBounty: number;
}

interface AdjustWeeklyGoalModalProps {
  visible: boolean;
  onClose: () => void;
  personalTarget: number;
  personalCompleted: number;
  squadTarget: number;
  squadCompleted: number;
  focusCategory?: string;
  onSave: (data: WeeklyGoalData) => void;
}

const PERSONAL_PRESETS = [
  { label: '2 / wk', count: 2 },
  { label: '3 / wk', count: 3 },
  { label: '5 / wk', count: 5 },
  { label: '7 / wk', count: 7 },
];

const SQUAD_PRESETS = [
  { label: '10 Posts', count: 10 },
  { label: '15 Posts', count: 15 },
  { label: '25 Posts', count: 25 },
  { label: '35 Posts', count: 35 },
];

const FOCUS_CATEGORIES = [
  { id: 'reels', label: '⚡ Short-form Reels & TikTok', desc: 'Prioritizes high-velocity hook testing' },
  { id: 'carousels', label: '📸 Visual Carousels & Guides', desc: 'Focuses on saveable high-retention frameworks' },
  { id: 'stories', label: '🎬 Video Stories & Deep Dives', desc: 'Focuses on high-retention audience connection' },
  { id: 'daily', label: '🔥 Daily Habit Consistency', desc: 'Sustains streak momentum across all formats' },
];

export const AdjustWeeklyGoalModal: React.FC<AdjustWeeklyGoalModalProps> = ({
  visible,
  onClose,
  personalTarget: initialPersonalTarget,
  personalCompleted,
  squadTarget: initialSquadTarget,
  squadCompleted,
  focusCategory: initialFocusCategory = '⚡ Short-form Reels & TikTok',
  onSave,
}) => {
  const [personalTarget, setPersonalTarget] = useState(initialPersonalTarget);
  const [squadTarget, setSquadTarget] = useState(initialSquadTarget);
  const [focusCategory, setFocusCategory] = useState(initialFocusCategory);

  useEffect(() => {
    if (visible) {
      setPersonalTarget(initialPersonalTarget);
      setSquadTarget(initialSquadTarget);
      setFocusCategory(initialFocusCategory);
    }
  }, [visible, initialPersonalTarget, initialSquadTarget, initialFocusCategory]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleAdjustPersonal = (delta: number) => {
    const next = Math.max(1, Math.min(14, personalTarget + delta));
    setPersonalTarget(next);
    triggerHaptic();
  };

  const handleAdjustSquad = (delta: number) => {
    const next = Math.max(5, Math.min(50, squadTarget + delta));
    setSquadTarget(next);
    triggerHaptic();
  };

  // Real-time remaining posts calculation
  const personalRemaining = Math.max(0, personalTarget - personalCompleted);
  const squadRemaining = Math.max(0, squadTarget - squadCompleted);

  // Dynamic XP bounty calculation based on targets
  const calculatedXpBounty = Math.round(150 + personalTarget * 15 + squadTarget * 5);

  const handleSave = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onSave({
      personalTarget,
      squadTarget,
      focusCategory,
      xpBounty: calculatedXpBounty,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.modalTitle}>Adjust Weekly Goals</Text>
                <View style={styles.hostBadge}>
                  <Text style={styles.hostBadgeText}>HOST 👑</Text>
                </View>
              </View>
              <Text style={styles.modalSubtitle}>
                Set post targets, squad focus & XP rewards for Momentum Makers.
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* 1. PERSONAL TARGET SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>PERSONAL TARGET</Text>
                <View style={styles.progressBadgePurple}>
                  <Text style={styles.progressBadgePurpleText}>
                    {personalCompleted} / {personalTarget} posts
                  </Text>
                </View>
              </View>

              <View style={styles.stepperContainer}>
                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                  onPress={() => handleAdjustPersonal(-1)}
                  disabled={personalTarget <= 1}
                >
                  <Text style={[styles.stepperBtnText, personalTarget <= 1 && styles.btnDisabledText]}>−</Text>
                </Pressable>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValueNumber}>{personalTarget}</Text>
                  <Text style={styles.stepperValueUnit}>posts / week</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                  onPress={() => handleAdjustPersonal(1)}
                  disabled={personalTarget >= 14}
                >
                  <Text style={[styles.stepperBtnText, personalTarget >= 14 && styles.btnDisabledText]}>+</Text>
                </Pressable>
              </View>

              {/* Real-time remaining status */}
              <View style={styles.remainingPillRow}>
                <Text style={styles.remainingPillText} numberOfLines={1}>
                  {personalRemaining === 0
                    ? '🎉 Personal weekly goal completed!'
                    : `🎯 ${personalRemaining} post${personalRemaining === 1 ? '' : 's'} remaining this week`}
                </Text>
              </View>

              {/* Personal Quick Presets */}
              <View style={styles.presetsRow}>
                {PERSONAL_PRESETS.map((preset) => {
                  const isSelected = personalTarget === preset.count;
                  return (
                    <Pressable
                      key={preset.count}
                      style={[styles.presetChip, isSelected && styles.presetChipActive]}
                      onPress={() => {
                        setPersonalTarget(preset.count);
                        triggerHaptic();
                      }}
                    >
                      <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 2. SQUAD COLLECTIVE TARGET SECTION */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>SQUAD TARGET</Text>
                <View style={styles.progressBadgeGold}>
                  <Text style={styles.progressBadgeGoldText}>
                    {squadCompleted} / {squadTarget} posts
                  </Text>
                </View>
              </View>

              <View style={styles.stepperContainer}>
                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                  onPress={() => handleAdjustSquad(-1)}
                  disabled={squadTarget <= 5}
                >
                  <Text style={[styles.stepperBtnText, squadTarget <= 5 && styles.btnDisabledText]}>−</Text>
                </Pressable>

                <View style={styles.stepperValueBox}>
                  <Text style={styles.stepperValueNumberGold}>{squadTarget}</Text>
                  <Text style={styles.stepperValueUnit}>squad posts</Text>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.stepperBtn, pressed && styles.btnPressed]}
                  onPress={() => handleAdjustSquad(1)}
                  disabled={squadTarget >= 50}
                >
                  <Text style={[styles.stepperBtnText, squadTarget >= 50 && styles.btnDisabledText]}>+</Text>
                </Pressable>
              </View>

              {/* Real-time remaining status */}
              <View style={styles.remainingPillRowGold}>
                <Text style={styles.remainingPillTextGold} numberOfLines={1}>
                  {squadRemaining === 0
                    ? '🎉 Squad weekly target reached!'
                    : `🛡️ ${squadRemaining} squad post${squadRemaining === 1 ? '' : 's'} remaining`}
                </Text>
              </View>

              {/* Squad Quick Presets */}
              <View style={styles.presetsRow}>
                {SQUAD_PRESETS.map((preset) => {
                  const isSelected = squadTarget === preset.count;
                  return (
                    <Pressable
                      key={preset.count}
                      style={[styles.presetChip, isSelected && styles.presetChipActiveGold]}
                      onPress={() => {
                        setSquadTarget(preset.count);
                        triggerHaptic();
                      }}
                    >
                      <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActiveGold]}>
                        {preset.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={styles.squadAverageHint}>
                💡 Approx. {(squadTarget / 5).toFixed(1)} posts per member ({squadCompleted} already published).
              </Text>
            </View>

            {/* 3. WEEKLY SQUAD FOCUS CATEGORY */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>WEEKLY SQUAD FOCUS</Text>
              <View style={{ gap: 7, marginTop: 8 }}>
                {FOCUS_CATEGORIES.map((cat) => {
                  const isSelected = focusCategory === cat.label;
                  return (
                    <Pressable
                      key={cat.id}
                      style={[styles.categoryCard, isSelected && styles.categoryCardActive]}
                      onPress={() => {
                        setFocusCategory(cat.label);
                        triggerHaptic();
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelActive]}>
                          {cat.label}
                        </Text>
                        <Text style={styles.categoryDesc}>{cat.desc}</Text>
                      </View>
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioDot} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* 4. REWARD BOUNTY PREVIEW */}
            <LinearGradient
              colors={['#FEF3C7', '#FDE68A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bountyCard}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Text style={{ fontSize: 24 }}>🏆</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bountyTitle}>Squad Milestone Reward</Text>
                  <Text style={styles.bountySub}>
                    Unlocks +{calculatedXpBounty} XP for all 5 squad members upon reaching target.
                  </Text>
                </View>
                <View style={styles.xpPill}>
                  <Text style={styles.xpPillText}>+{calculatedXpBounty} XP</Text>
                </View>
              </View>
            </LinearGradient>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerRow}>
            <Pressable
              style={({ pressed }) => [styles.cancelBtn, pressed && styles.btnPressed]}
              onPress={onClose}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.saveBtnContainer, pressed && styles.btnPressed]}
              onPress={handleSave}
            >
              <LinearGradient
                colors={['#784DF0', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveBtnGradient}
              >
                <Text style={styles.saveBtnText}>Save Targets 🎯</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 10, 30, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 17.5,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  hostBadge: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hostBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
    lineHeight: 16,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  scrollContent: {
    paddingVertical: 12,
    gap: 16,
  },
  sectionContainer: {
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFECE6',
    borderRadius: 16,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  progressBadgePurple: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  progressBadgePurpleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#582CDB',
  },
  progressBadgeGold: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    flexShrink: 0,
  },
  progressBadgeGoldText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 8,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  stepperBtnText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#582CDB',
  },
  btnDisabledText: {
    color: '#CBD5E1',
  },
  stepperValueBox: {
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  stepperValueNumber: {
    fontSize: 30,
    fontWeight: '900',
    color: '#582CDB',
    letterSpacing: -0.5,
  },
  stepperValueNumberGold: {
    fontSize: 30,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: -0.5,
  },
  stepperValueUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: -2,
  },
  remainingPillRow: {
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  remainingPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#6B21A8',
  },
  remainingPillRowGold: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  remainingPillTextGold: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#92400E',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  presetChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#784DF0',
  },
  presetChipActiveGold: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  presetChipTextActive: {
    color: '#582CDB',
  },
  presetChipTextActiveGold: {
    color: '#B45309',
  },
  squadAverageHint: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  categoryCardActive: {
    borderColor: '#784DF0',
    backgroundColor: '#FAF5FF',
  },
  categoryLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#171420',
  },
  categoryLabelActive: {
    color: '#582CDB',
  },
  categoryDesc: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  radioCircleActive: {
    borderColor: '#582CDB',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#582CDB',
  },
  bountyCard: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bountyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#92400E',
  },
  bountySub: {
    fontSize: 10.5,
    color: '#B45309',
    marginTop: 1,
    lineHeight: 14,
  },
  xpPill: {
    backgroundColor: '#B45309',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  xpPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtnContainer: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
