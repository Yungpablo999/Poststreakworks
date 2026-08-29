import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export interface DateTimePickerValue {
  dateLabel: string; // e.g. "Today · Aug 29" or "Mon · Sep 1"
  timeLabel: string; // e.g. "7:30 PM"
  fullLabel: string; // e.g. "Today · 7:30 PM"
}

interface DateTimePickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (val: DateTimePickerValue) => void;
  initialDate?: string;
  initialTime?: string;
}

const HOURS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const PERIODS = ['AM', 'PM'] as const;

export const DateTimePickerSheet: React.FC<DateTimePickerSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  initialDate = 'Today · Aug 29',
  initialTime = '7:30 PM',
}) => {
  // Generate 60 upcoming days
  const dateOptions = React.useMemo(() => {
    const arr = [];
    const today = new Date();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 0; i < 60; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const dayName = dayNames[d.getDay()];
      const month = monthNames[d.getMonth()];
      const dayNum = d.getDate();

      let displayLabel = `${dayName}, ${month} ${dayNum}`;
      let shortLabel = `${dayName} · ${month} ${dayNum}`;
      if (i === 0) {
        displayLabel = `Today · ${month} ${dayNum}`;
        shortLabel = `Today · ${month} ${dayNum}`;
      } else if (i === 1) {
        displayLabel = `Tomorrow · ${month} ${dayNum}`;
        shortLabel = `Tomorrow · ${month} ${dayNum}`;
      }

      arr.push({
        id: `date_${i}`,
        dayName,
        month,
        dayNum,
        displayLabel,
        shortLabel,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return arr;
  }, []);

  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState('7');
  const [selectedMinute, setSelectedMinute] = useState('30');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('PM');

  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      if (initialTime.includes(':')) {
        const parts = initialTime.replace(/[^0-9:APMapm ]/g, '').trim().split(/[: ]+/);
        if (parts.length >= 2) {
          setSelectedHour(parts[0] || '7');
          setSelectedMinute(parts[1] || '30');
        }
        if (initialTime.toUpperCase().includes('AM')) setSelectedPeriod('AM');
        if (initialTime.toUpperCase().includes('PM')) setSelectedPeriod('PM');
      }

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          speed: 20,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    const selDate = dateOptions[selectedDateIndex] || dateOptions[0];
    const timeStr = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    const fullStr = `${selDate.shortLabel} · ${timeStr}`;

    onConfirm({
      dateLabel: selDate.shortLabel,
      timeLabel: timeStr,
      fullLabel: fullStr,
    });
    onClose();
  };

  const handleApplyPreset = (hour: string, min: string, period: 'AM' | 'PM') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedHour(hour);
    setSelectedMinute(min);
    setSelectedPeriod(period);
  };

  if (!visible) return null;

  const currentSelectedDate = dateOptions[selectedDateIndex] || dateOptions[0];
  const currentTimeString = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheetContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>Select Date & Time</Text>
              <Text style={styles.sheetSubtitle}>Scroll or tap to choose any date & time</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Current Selection Banner */}
          <View style={styles.selectionBanner}>
            <View style={styles.selectionBannerPill}>
              <Text style={styles.selectionBannerIcon}>🗓️</Text>
              <Text style={styles.selectionBannerText} numberOfLines={1}>
                {currentSelectedDate.displayLabel}
              </Text>
            </View>
            <Text style={styles.selectionBannerAt}>at</Text>
            <View style={styles.selectionBannerPill}>
              <Text style={styles.selectionBannerIcon}>⏰</Text>
              <Text style={styles.selectionBannerText}>{currentTimeString}</Text>
            </View>
          </View>

          <ScrollView style={styles.sheetScroll} showsVerticalScrollIndicator={false}>
            {/* Quick Peak Presets */}
            <Text style={styles.sectionLabel}>SMART PEAK PRESETS</Text>
            <View style={styles.presetsRow}>
              {[
                { label: '🔥 7:30 PM Peak', h: '7', m: '30', p: 'PM' as const },
                { label: '🥪 11:30 AM Lunch', h: '11', m: '30', p: 'AM' as const },
                { label: '✨ 8:00 PM Prime', h: '8', m: '00', p: 'PM' as const },
                { label: '🌙 9:30 PM Late', h: '9', m: '30', p: 'PM' as const },
              ].map((preset) => {
                const isActive =
                  selectedHour === preset.h &&
                  selectedMinute === preset.m &&
                  selectedPeriod === preset.p;
                return (
                  <Pressable
                    key={preset.label}
                    onPress={() => handleApplyPreset(preset.h, preset.m, preset.p)}
                    style={[styles.presetChip, isActive && styles.presetChipActive]}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        isActive && styles.presetChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* 1. SCROLLABLE DATE SELECTOR */}
            <Text style={styles.sectionLabel}>SCROLL TO SELECT DATE</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.datesScrollContent}
              style={styles.datesScrollView}
            >
              {dateOptions.map((item, idx) => {
                const isSelected = selectedDateIndex === idx;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      if (Platform.OS !== 'web') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                      setSelectedDateIndex(idx);
                    }}
                    style={[styles.dateCard, isSelected && styles.dateCardActive]}
                  >
                    <Text
                      style={[
                        styles.dateCardDay,
                        isSelected && styles.dateCardDayActive,
                        item.isToday && !isSelected && { color: '#6366F1' },
                      ]}
                    >
                      {item.isToday ? 'TODAY' : item.isTomorrow ? 'TMRW' : item.dayName.toUpperCase()}
                    </Text>
                    <Text style={[styles.dateCardNum, isSelected && styles.dateCardNumActive]}>
                      {item.dayNum}
                    </Text>
                    <Text style={[styles.dateCardMonth, isSelected && styles.dateCardMonthActive]}>
                      {item.month}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* 2. SCROLLABLE TIME WHEEL / SELECTOR */}
            <Text style={styles.sectionLabel}>SCROLL TO SELECT TIME</Text>
            <View style={styles.timeWheelRow}>
              {/* Hour Column */}
              <View style={styles.wheelColumnBox}>
                <Text style={styles.wheelColumnHeader}>HOUR</Text>
                <ScrollView
                  style={styles.wheelScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {HOURS.map((h) => {
                    const isSelected = selectedHour === h;
                    return (
                      <Pressable
                        key={h}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedHour(h);
                        }}
                        style={[styles.wheelItem, isSelected && styles.wheelItemActive]}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            isSelected && styles.wheelItemTextActive,
                          ]}
                        >
                          {h}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <Text style={styles.timeColon}>:</Text>

              {/* Minute Column */}
              <View style={styles.wheelColumnBox}>
                <Text style={styles.wheelColumnHeader}>MINUTE</Text>
                <ScrollView
                  style={styles.wheelScrollView}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  {MINUTES.map((m) => {
                    const isSelected = selectedMinute === m;
                    return (
                      <Pressable
                        key={m}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedMinute(m);
                        }}
                        style={[styles.wheelItem, isSelected && styles.wheelItemActive]}
                      >
                        <Text
                          style={[
                            styles.wheelItemText,
                            isSelected && styles.wheelItemTextActive,
                          ]}
                        >
                          {m}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* AM/PM Toggle */}
              <View style={styles.periodColumnBox}>
                <Text style={styles.wheelColumnHeader}>PERIOD</Text>
                <View style={styles.periodBtnGroup}>
                  {PERIODS.map((p) => {
                    const isSelected = selectedPeriod === p;
                    return (
                      <Pressable
                        key={p}
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                          setSelectedPeriod(p);
                        }}
                        style={[styles.periodBtn, isSelected && styles.periodBtnActive]}
                      >
                        <Text
                          style={[
                            styles.periodBtnText,
                            isSelected && styles.periodBtnTextActive,
                          ]}
                        >
                          {p}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.footerBtnRow}>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <LinearGradient
                colors={['#6366F1', '#582CDB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.confirmGradient}
              >
                <Text style={styles.confirmBtnText}>Set Schedule Time ✓</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 18,
    maxHeight: '85%',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#171420',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF5FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 14,
    gap: 8,
  },
  selectionBannerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  selectionBannerIcon: {
    fontSize: 13,
  },
  selectionBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#582CDB',
  },
  selectionBannerAt: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  sheetScroll: {
    maxHeight: 380,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#582CDB',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  presetChipActive: {
    backgroundColor: '#EDE9FE',
    borderColor: '#A78BFA',
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  presetChipTextActive: {
    color: '#6D28D9',
  },
  datesScrollView: {
    marginBottom: 14,
  },
  datesScrollContent: {
    gap: 8,
    paddingVertical: 2,
  },
  dateCard: {
    width: 58,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#FAF8F5',
    borderWidth: 1,
    borderColor: '#EFEBF8',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  dateCardActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
    shadowColor: '#582CDB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  dateCardDay: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  dateCardDayActive: {
    color: '#E0E7FF',
  },
  dateCardNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#171420',
  },
  dateCardNumActive: {
    color: '#FFFFFF',
  },
  dateCardMonth: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  dateCardMonthActive: {
    color: '#DDD6FE',
  },
  timeWheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    backgroundColor: '#FAF8F5',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFEBF8',
    padding: 10,
  },
  wheelColumnBox: {
    flex: 1,
    alignItems: 'center',
  },
  wheelColumnHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 6,
  },
  wheelScrollView: {
    height: 120,
    width: '100%',
  },
  wheelItem: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: 'transparent',
  },
  wheelItemActive: {
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#C4B5FD',
  },
  wheelItemText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#64748B',
  },
  wheelItemTextActive: {
    fontSize: 16,
    fontWeight: '900',
    color: '#582CDB',
  },
  timeColon: {
    fontSize: 22,
    fontWeight: '900',
    color: '#582CDB',
    marginTop: 14,
  },
  periodColumnBox: {
    width: 68,
    alignItems: 'center',
  },
  periodBtnGroup: {
    height: 120,
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  periodBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  periodBtnActive: {
    backgroundColor: '#582CDB',
    borderColor: '#582CDB',
  },
  periodBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
  periodBtnTextActive: {
    color: '#FFFFFF',
  },
  footerBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  confirmBtn: {
    flex: 1.8,
    height: 46,
    borderRadius: 12,
    overflow: 'hidden',
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
