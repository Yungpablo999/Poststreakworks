import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import { Text, TextInput } from '../ui/AppText';
import { JarvisOrb } from '../JarvisOrb';
import { MASCOT_IMAGES } from '../mascot/LiveMascot';
import { ds } from '../../theme/colors';
import { ask, closeJarvis, ideaTasks, openJarvis, resetJarvis, runTask, useJarvisChat, type ChatMessage, type GhostTask, type TaskStatus } from '../../jarvis/chat';

// Chat with Jarvis from anywhere. Jarvis answers; when there's something to
// do (start a post, save a draft, open a page, check in) the answer has
// "Ghost, …" buttons. Tap one and Ghost flies in, works on it, and says when
// it's done. Phones: a sheet from the bottom. Wider screens: a panel docked on
// the right, so you can watch Ghost change the page behind it.

const pointer = Platform.OS === 'web' ? ({ cursor: 'pointer' } as object) : null;
const ease = Easing.out(Easing.cubic);
const PANEL_W = 400;

// ─── The button that opens the chat ─────────────────────────────────────────
export function JarvisLauncher({ bottom = 20, compact }: { bottom?: number; compact?: boolean }) {
  const { open } = useJarvisChat();
  const [hover, setHover] = useState(false);
  if (open) return null;
  return (
    <Animated.View entering={FadeInUp.duration(320).easing(ease)} style={[styles.launcherWrap, { bottom }]} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          openJarvis();
        }}
        onHoverIn={() => setHover(true)}
        onHoverOut={() => setHover(false)}
        accessibilityRole="button"
        accessibilityLabel="Ask Jarvis"
        style={({ pressed }) => [styles.launcher, compact && styles.launcherCompact, pointer, hover && styles.launcherHover, pressed && { transform: [{ scale: 0.96 }] }]}
      >
        <JarvisOrb size={compact ? 30 : 26} />
        {!compact && <Text style={styles.launcherText}>Ask Jarvis</Text>}
      </Pressable>
    </Animated.View>
  );
}

// ─── The chat ───────────────────────────────────────────────────────────────
export function JarvisChatPanel() {
  const { open } = useJarvisChat();
  const { width, height } = useWindowDimensions();
  const docked = width >= 768;
  const [mounted, setMounted] = useState(open);
  const p = useSharedValue(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      p.value = withTiming(1, { duration: 300, easing: ease });
    } else if (mounted) {
      p.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (done) => {
        if (done) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const panelW = Math.min(PANEL_W, width - 24);
  const panel = useAnimatedStyle(() =>
    docked ? { opacity: p.value, transform: [{ translateX: (1 - p.value) * (panelW + 24) }] } : { transform: [{ translateY: (1 - p.value) * height }] }
  );
  const scrim = useAnimatedStyle(() => ({ opacity: p.value }));

  if (!mounted) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {!docked && (
        <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, scrim]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeJarvis} accessibilityLabel="Close chat" />
        </Animated.View>
      )}
      <Animated.View style={[docked ? [styles.docked, { width: panelW }] : [styles.sheet, { height: height * 0.9 }], panel]} accessibilityViewIsModal={!docked}>
        <Chat docked={docked} />
      </Animated.View>
    </View>
  );
}

function Chat({ docked }: { docked: boolean }) {
  const { messages, thinking } = useJarvisChat();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const scroll = useRef<ScrollView>(null);

  useEffect(() => {
    const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 60);
    return () => clearTimeout(id);
  }, [messages.length, thinking]);

  const send = (q = text) => {
    if (!q.trim()) return;
    ask(q);
    setText('');
  };

  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {!docked && <View style={styles.grabber} />}
      <View style={styles.head}>
        <JarvisOrb size={34} />
        <View style={styles.fill}>
          <Text style={styles.headTitle}>Jarvis</Text>
          <Text style={styles.headSub}>Ask anything. Ghost does the jobs.</Text>
        </View>
        {messages.length > 1 && (
          <Pressable onPress={resetJarvis} accessibilityRole="button" accessibilityLabel="Start a new chat" hitSlop={6} style={({ pressed }) => [styles.headBtn, pointer, pressed && { opacity: 0.7 }]}>
            <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
              <Path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4" stroke={ds.text2} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}
        <Pressable onPress={closeJarvis} accessibilityRole="button" accessibilityLabel="Close chat" hitSlop={6} style={({ pressed }) => [styles.headBtn, pointer, pressed && { opacity: 0.7 }]}>
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M6 6l12 12M18 6L6 18" stroke={ds.text2} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView ref={scroll} style={styles.fill} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {messages.map((m, i) => (
          <Message key={m.id} m={m} last={i === messages.length - 1} onAsk={send} closeAfter={!docked} />
        ))}
        {thinking && <Typing />}
      </ScrollView>

      <View style={[styles.inputRow, { paddingBottom: 12 + (docked ? 0 : insets.bottom) }]}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Ask Jarvis anything"
          placeholderTextColor={ds.text3}
          style={styles.input}
          onSubmitEditing={() => send()}
          returnKeyType="send"
          accessibilityLabel="Message to Jarvis"
          autoFocus={docked && Platform.OS === 'web'}
        />
        <Pressable
          onPress={() => send()}
          disabled={!text.trim() || thinking}
          accessibilityRole="button"
          accessibilityLabel="Send"
          style={({ pressed }) => [styles.send, pointer, (!text.trim() || thinking) && { opacity: 0.45 }, pressed && { transform: [{ scale: 0.94 }] }]}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function Message({ m, last, onAsk, closeAfter }: { m: ChatMessage; last: boolean; onAsk: (q: string) => void; closeAfter: boolean }) {
  if (m.from === 'me') {
    return (
      <Animated.View entering={FadeInDown.duration(220).easing(ease)} style={styles.meRow}>
        <View style={styles.meBubble}>
          <Text style={styles.meText}>{m.text}</Text>
        </View>
      </Animated.View>
    );
  }
  return (
    <Animated.View entering={FadeInDown.duration(260).easing(ease)} style={styles.jRow}>
      <View style={styles.jAvatar}>
        <JarvisOrb size={22} />
      </View>
      <View style={styles.jBody}>
        <View style={styles.jBubble}>
          <Text style={styles.jText}>{m.text}</Text>
          {m.list && (
            <View style={styles.listBox}>
              {m.list.map((line) => (
                <View key={line} style={styles.listRow}>
                  <View style={styles.dot} />
                  <Text style={styles.listText}>{line}</Text>
                </View>
              ))}
            </View>
          )}
          {m.caption && (
            <View style={styles.captionBox}>
              <Text style={styles.captionText}>{m.caption}</Text>
            </View>
          )}
        </View>

        {m.ideas?.map((idea, i) => (
          <Animated.View key={idea.id} entering={FadeInDown.delay(80 + i * 70).duration(260).easing(ease)} style={styles.ideaCard}>
            <Text style={styles.ideaFormat}>{idea.format}</Text>
            <Text style={styles.ideaTitle}>{idea.title}</Text>
            <Text style={styles.ideaHook}>“{idea.hook}”</Text>
            <View style={styles.tasks}>
              {ideaTasks(idea).map((t) => (
                <TaskButton key={t.id} task={t} closeAfter={closeAfter} />
              ))}
            </View>
          </Animated.View>
        ))}

        {m.tasks && m.tasks.length > 0 && (
          <View style={styles.tasks}>
            {m.tasks.map((t) => (
              <TaskButton key={t.id} task={t} closeAfter={closeAfter} />
            ))}
          </View>
        )}

        {last && m.chips && (
          <View style={styles.chips}>
            {m.chips.map((c) => (
              <Pressable key={c} onPress={() => onAsk(c)} accessibilityRole="button" style={({ pressed }) => [styles.chip, pointer, pressed && { opacity: 0.7 }]}>
                <Text style={styles.chipText}>{c}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// A job for Ghost: tap it and Ghost glides in, works, then shows it's done
function TaskButton({ task, closeAfter }: { task: GhostTask; closeAfter: boolean }) {
  const { tasks } = useJarvisChat();
  const status: TaskStatus = tasks[task.id] ?? 'idle';
  const reduce = useReducedMotion();
  const fly = useSharedValue(0);
  const bob = useSharedValue(0);

  useEffect(() => {
    if (status !== 'working' || reduce) return;
    fly.value = 0;
    fly.value = withTiming(1, { duration: 420, easing: ease });
    bob.value = withRepeat(withSequence(withTiming(1, { duration: 200 }), withTiming(0, { duration: 200 })), -1, true);
  }, [status, reduce, fly, bob]);
  useEffect(() => {
    if (status === 'done') bob.value = withDelay(0, withTiming(0, { duration: 150 }));
  }, [status, bob]);

  const ghost = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - fly.value) * -28 }, { translateY: -3 * bob.value }, { rotate: `${(1 - fly.value) * -14 + bob.value * 6 - 3}deg` }],
    opacity: 0.4 + fly.value * 0.6,
  }));

  const face = status === 'done' ? MASCOT_IMAGES.happy : status === 'working' ? MASCOT_IMAGES.working : MASCOT_IMAGES.wave;
  const label = status === 'done' ? task.done : status === 'working' ? 'Ghost is on it…' : task.label;

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        runTask(task, { closeAfter });
      }}
      disabled={status !== 'idle'}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: status !== 'idle', busy: status === 'working' }}
      style={({ pressed }) => [styles.task, status === 'done' && styles.taskDone, status === 'idle' && pointer, pressed && { transform: [{ scale: 0.98 }] }]}
    >
      <Animated.View style={[styles.taskGhost, status === 'working' && ghost]}>
        <Image source={face} style={styles.taskGhostImg} resizeMode="contain" />
      </Animated.View>
      <Animated.View key={status} entering={FadeIn.duration(200)} style={styles.fill}>
        <Text style={[styles.taskText, status === 'done' && { color: ds.green }]} numberOfLines={2}>
          {label}
        </Text>
      </Animated.View>
      {status === 'done' && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M20 6L9 17l-5-5" stroke={ds.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      )}
    </Pressable>
  );
}

function Typing() {
  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.jRow} accessibilityLabel="Jarvis is typing">
      <View style={styles.jAvatar}>
        <JarvisOrb size={22} />
      </View>
      <View style={[styles.jBubble, styles.typing]}>
        {[0, 1, 2].map((i) => (
          <Dot key={i} i={i} />
        ))}
      </View>
    </Animated.View>
  );
}
function Dot({ i }: { i: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(i * 140, withRepeat(withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }), -1, true));
  }, [i, t]);
  const s = useAnimatedStyle(() => ({ opacity: 0.35 + t.value * 0.65, transform: [{ translateY: -3 * t.value }] }));
  return <Animated.View style={[styles.typingDot, s]} />;
}

const styles = StyleSheet.create({
  fill: { flex: 1, minWidth: 0 },
  launcherWrap: { position: 'absolute', right: 16, zIndex: 60 },
  launcher: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 52,
    paddingLeft: 12,
    paddingRight: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1.5,
    borderColor: 'rgba(91, 62, 232, 0.22)',
    shadowColor: '#3F25BF',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  launcherCompact: { width: 56, height: 56, paddingLeft: 0, paddingRight: 0, justifyContent: 'center', borderRadius: 28 },
  launcherHover: { borderColor: 'rgba(91, 62, 232, 0.45)', transform: [{ translateY: -2 }] },
  launcherText: { fontSize: 15, fontWeight: '800', color: ds.purple },

  scrim: { backgroundColor: 'rgba(23, 20, 32, 0.32)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F7F5F0',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    zIndex: 70,
  },
  docked: {
    position: 'absolute',
    right: 12,
    top: 12,
    bottom: 12,
    backgroundColor: '#F7F5F0',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(91, 62, 232, 0.14)',
    overflow: 'hidden',
    shadowColor: '#3F25BF',
    shadowOpacity: 0.2,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    zIndex: 70,
  },
  grabber: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: 'rgba(23, 20, 32, 0.15)', marginTop: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: ds.line },
  headTitle: { fontSize: 18, fontWeight: '800', color: ds.ink, letterSpacing: -0.3 },
  headSub: { fontSize: 13, color: ds.text2, fontWeight: '600' },
  headBtn: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.9)', borderWidth: 1, borderColor: ds.line },

  list: { padding: 14, gap: 14 },
  meRow: { alignItems: 'flex-end' },
  meBubble: { maxWidth: '85%', backgroundColor: ds.purple, borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10 },
  meText: { color: '#FFFFFF', fontSize: 15, lineHeight: 21, fontWeight: '600' },

  jRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  jAvatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: ds.lavenderSoft, marginTop: 2 },
  jBody: { flex: 1, minWidth: 0, gap: 8 },
  jBubble: { backgroundColor: '#FFFFFF', borderRadius: 18, borderTopLeftRadius: 6, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: ds.line, alignSelf: 'flex-start', maxWidth: '100%' },
  jText: { color: ds.ink, fontSize: 15, lineHeight: 21, fontWeight: '500' },
  listBox: { marginTop: 8, gap: 6 },
  listRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: ds.purple, marginTop: 8 },
  listText: { flex: 1, fontSize: 14.5, lineHeight: 20, color: ds.ink, fontWeight: '600' },
  captionBox: { marginTop: 10, padding: 12, borderRadius: 14, backgroundColor: ds.lavenderSoft },
  captionText: { fontSize: 14.5, lineHeight: 20, color: ds.ink },

  ideaCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: 'rgba(91, 62, 232, 0.16)', gap: 4 },
  ideaFormat: { fontSize: 12, fontWeight: '800', color: ds.purple, textTransform: 'uppercase', letterSpacing: 0.6 },
  ideaTitle: { fontSize: 16, fontWeight: '800', color: ds.ink, letterSpacing: -0.2 },
  ideaHook: { fontSize: 14, lineHeight: 19, color: ds.text2 },

  tasks: { gap: 8, marginTop: 6 },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 6,
    paddingLeft: 6,
    paddingRight: 14,
    borderRadius: 16,
    backgroundColor: ds.lavender,
    borderWidth: 1.5,
    borderColor: 'rgba(91, 62, 232, 0.22)',
  },
  taskDone: { backgroundColor: ds.greenBg, borderColor: 'rgba(21, 128, 61, 0.25)' },
  taskGhost: { width: 36, height: 36 },
  taskGhostImg: { width: '100%', height: '100%' },
  taskText: { fontSize: 14.5, fontWeight: '800', color: ds.purple },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: 'rgba(91, 62, 232, 0.2)', minHeight: 36, justifyContent: 'center' },
  chipText: { fontSize: 13.5, fontWeight: '700', color: ds.purple },

  typing: { flexDirection: 'row', gap: 5, paddingVertical: 14 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: ds.text3 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: ds.line, backgroundColor: 'rgba(255, 255, 255, 0.7)' },
  input: { flex: 1, minWidth: 0, height: 46, borderRadius: 16, paddingHorizontal: 14, backgroundColor: '#FFFFFF', borderWidth: 1.5, borderColor: ds.line, fontSize: 15, color: ds.ink },
  send: { width: 46, height: 46, borderRadius: 16, backgroundColor: ds.purple, alignItems: 'center', justifyContent: 'center' },
});
