import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Text, TextInput } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { GlassSheet } from '../glass/GlassSheet';
import { AppToast } from '../ui/AppToast';
import { PlatformLogo } from '../onboarding/PlatformLogo';
import { ScheduleSheet } from '../composer/ScheduleSheet';
import { PlatformChip } from '../composer/ComposerBlocks';
import { ds } from '../../theme/colors';
import { whenLabel } from '../../data';
import { editPost, loadPost, markPosted, removePost } from '../../backend/posts';
import { growthStore, loadGrowth, useGrowth } from '../../backend/growth';
import { notify } from '../../backend/notice';
import { HANDOFF_NAMES, HANDOFF_PLATFORMS, handOffToPlatform, isHandoffPlatform, postText } from '../../utils/handoff';
import type { Post, PostStep } from '../../../frontend/shared/types/phase1';

/** How long a sheet takes to slide away (GlassSheet closes in 220 ms). */
const SWAP_MS = 260;

// One post of the creator's: its caption, its time, and where it stands on each platform. From here a
// creator opens the platform's app with the caption copied, says they posted it (one platform at a
// time), moves it to another time, edits it or removes it. Everything it shows and does goes through the
// server: this sheet holds no copy of its own that could disagree.

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

const nameOf = (platform: string) => (isHandoffPlatform(platform) ? HANDOFF_NAMES[platform] : platform);

interface PostSheetProps {
  /** The post to show. null = closed. */
  postId: string | null;
  onClose: () => void;
}

export function PostSheet({ postId, onClose }: PostSheetProps) {
  // Their own best time, offered when moving the post (once their posts say what it is)
  const growth = useGrowth();
  useEffect(() => {
    if (postId && !growthStore.get()) void loadGrowth();
  }, [postId]);
  const bestTime = growth?.bestTime ?? null;
  const [post, setPost] = useState<Post | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'failed' | 'gone'>('loading');
  const [busy, setBusy] = useState(false);
  // "I posted it": which platform is asking for its (optional) link
  const [linkFor, setLinkFor] = useState<string | null>(null);
  const [link, setLink] = useState('');
  const [editing, setEditing] = useState(false);
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [platforms, setPlatforms] = useState<string[]>([]);
  // Changing the time: this sheet steps aside first, then the time picker opens (and the other way round
  // when it closes). iOS can show only one modal at a time, so the two are never stacked on any platform.
  const [moving, setMoving] = useState(false);
  const [pickingTime, setPickingTime] = useState(false);
  const swapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swap = (fn: () => void) => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
    swapTimer.current = setTimeout(fn, SWAP_MS);
  };
  useEffect(() => () => {
    if (swapTimer.current) clearTimeout(swapTimer.current);
  }, []);
  const startMove = () => {
    setMoving(true);
    swap(() => setPickingTime(true));
  };
  const endMove = () => {
    setPickingTime(false);
    swap(() => setMoving(false));
  };
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // A message for the creator, shown inside the sheet (the app's own toast sits behind it)
  const [message, setMessage] = useState<string | null>(null);
  const say = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage((cur) => (cur === text ? null : cur)), 3600);
  };

  useEffect(() => {
    if (!postId) return;
    let alive = true;
    setPost(null);
    setState('loading');
    setLinkFor(null);
    setEditing(false);
    setMoving(false);
    setPickingTime(false);
    setConfirmingDelete(false);
    setMessage(null);
    void loadPost(postId).then((res) => {
      if (!alive) return;
      if (res.ok) {
        setPost(res.data);
        setState('ready');
      } else {
        setState(res.status === 404 ? 'gone' : 'failed');
      }
    });
    return () => {
      alive = false;
    };
  }, [postId]);

  const show = (next: Post) => setPost(next);

  const open = async (step: PostStep) => {
    if (!post || !isHandoffPlatform(step.platform)) return;
    tick();
    say(`Caption copied. Paste it in ${HANDOFF_NAMES[step.platform]}.`);
    await handOffToPlatform(step.platform, postText(post.caption, post.tags));
    setLinkFor(step.platform); // coming back: ready to say it's posted
  };

  const posted = async (step: PostStep) => {
    if (!post || busy) return;
    setBusy(true);
    const res = await markPosted(post.id, step.platform, link);
    setBusy(false);
    if (!res.ok) {
      say(res.message);
      return;
    }
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLinkFor(null);
    setLink('');
    show(res.data.post);
    const s = res.data.streak;
    say(s?.qualified ? `Posted on ${nameOf(step.platform)}. That's day ${s.newStreak} of your streak.` : `Posted on ${nameOf(step.platform)}. Nice work.`);
  };

  const save = async () => {
    if (!post || busy) return;
    setBusy(true);
    const res = await editPost(post.id, {
      caption,
      tags: tags.split(/[\s,]+/).filter(Boolean),
      ...(post.platforms.some((p) => p.state === 'posted') ? {} : { platforms: platforms as never }),
    });
    setBusy(false);
    if (!res.ok) {
      say(res.message);
      return;
    }
    setEditing(false);
    show(res.data);
  };

  const moveTo = async (at: Date) => {
    if (!post) return;
    endMove();
    setBusy(true);
    const res = await editPost(post.id, { at: at.toISOString() });
    setBusy(false);
    if (!res.ok) {
      say(res.message);
      return;
    }
    show(res.data);
    say(`Moved to ${whenLabel(at.getTime())}. We'll remind you then.`);
  };

  const remove = async () => {
    if (!post || busy) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setBusy(true);
    const res = await removePost(post.id);
    setBusy(false);
    if (!res.ok) {
      say(res.message);
      return;
    }
    onClose();
    notify('Removed.'); // the sheet is closing, so the app's own message is the one to show
  };

  const startEditing = () => {
    if (!post) return;
    setCaption(post.caption);
    setTags(post.tags.join(' '));
    setPlatforms(post.platforms.map((p) => p.platform));
    setEditing(true);
  };

  const allPosted = !!post && post.platforms.every((p) => p.state === 'posted');
  const open_ = !!post && !allPosted && post.state !== 'failed' && post.state !== 'draft';
  const anyPosted = !!post && post.platforms.some((p) => p.state === 'posted');
  const ready = post?.state === 'ready';

  const status = !post
    ? ''
    : allPosted
      ? 'Posted'
      : post.state === 'ready'
        ? 'Ready to post'
        : post.state === 'failed'
          ? 'Couldn’t be posted'
          : `Planned for ${whenLabel(Date.parse(post.at))}`;
  const sub = !post
    ? ''
    : allPosted
      ? post.postedAt
        ? whenLabel(Date.parse(post.postedAt))
        : ''
      : post.state === 'ready'
        ? `It was due ${whenLabel(Date.parse(post.at))}`
        : post.state === 'scheduled'
          ? 'We’ll remind you when it’s time.'
          : (post.error ?? '');

  return (
    <>
      <GlassSheet
        visible={!!postId && !moving}
        onClose={onClose}
        title={post ? status : state === 'gone' ? 'Not found' : 'Your post'}
        subtitle={post ? sub : undefined}
        maxHeight={0.9}
        overlay={<AppToast message={message} bottom={24} />}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {state === 'loading' ? (
            <ActivityIndicator color={ds.purple} style={styles.spinner} />
          ) : state === 'failed' ? (
            <Text style={styles.muted}>Couldn’t load this post. Check your connection and open it again.</Text>
          ) : state === 'gone' || !post ? (
            <Text style={styles.muted}>This post isn’t there any more.</Text>
          ) : (
            <>
              {/* The words */}
              {editing ? (
                <View style={styles.editBox}>
                  <Text style={styles.label}>Caption</Text>
                  <TextInput style={styles.captionInput} multiline value={caption} onChangeText={setCaption} placeholder="Write your caption…" placeholderTextColor={ds.text3} maxLength={5000} />
                  <Text style={styles.label}>Tags</Text>
                  <TextInput style={styles.tagInput} value={tags} onChangeText={setTags} placeholder="#habits #morning" placeholderTextColor={ds.text3} autoCapitalize="none" />
                  {!anyPosted && (
                    <>
                      <Text style={styles.label}>Where it goes</Text>
                      <View style={styles.chips}>
                        {HANDOFF_PLATFORMS.map((p) => (
                          <PlatformChip
                            key={p}
                            id={p}
                            name={HANDOFF_NAMES[p]}
                            selected={platforms.includes(p)}
                            onPress={() => setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]))}
                          />
                        ))}
                      </View>
                    </>
                  )}
                  <View style={styles.row}>
                    <View style={styles.flex}>
                      <AppButton title="Cancel" variant="outline" onPress={() => setEditing(false)} />
                    </View>
                    <View style={styles.flex}>
                      <AppButton title={busy ? 'Saving…' : 'Save'} disabled={busy || !caption.trim() || platforms.length === 0} onPress={save} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.words}>
                  <Text style={styles.caption} selectable>
                    {post.caption}
                  </Text>
                  {post.tags.length > 0 && (
                    <Text style={styles.tags} selectable>
                      {post.tags.join(' ')}
                    </Text>
                  )}
                </View>
              )}

              {/* Each platform */}
              {!editing && (
                <View style={styles.platforms}>
                  {post.platforms.map((step) => (
                    <View key={step.platform} style={styles.platform}>
                      <View style={styles.platformTop}>
                        <PlatformLogo type={step.platform as never} size={30} />
                        <View style={styles.flex}>
                          <Text style={styles.platformName}>{nameOf(step.platform)}</Text>
                          <Text style={[styles.platformState, step.state === 'posted' && styles.platformStatePosted]}>
                            {step.state === 'posted'
                              ? `Posted${step.postedAt ? ` · ${whenLabel(Date.parse(step.postedAt))}` : ''}`
                              : step.state === 'ready'
                                ? 'Ready to post'
                                : step.state === 'failed'
                                  ? 'Couldn’t be posted'
                                  : 'Waiting for its time'}
                          </Text>
                        </View>
                        {step.state === 'posted' && step.url ? (
                          <Pressable onPress={() => void Linking.openURL(step.url!).catch(() => undefined)} hitSlop={8} accessibilityRole="link">
                            <Text style={styles.link}>View post</Text>
                          </Pressable>
                        ) : null}
                      </View>

                      {step.state !== 'posted' && step.state !== 'failed' && open_ && (
                        <>
                          {linkFor === step.platform ? (
                            <View style={styles.linkBox}>
                              <Text style={styles.label}>Paste the link to your post (optional)</Text>
                              <TextInput style={styles.tagInput} value={link} onChangeText={setLink} placeholder="https://…" placeholderTextColor={ds.text3} autoCapitalize="none" keyboardType="url" />
                              <View style={styles.row}>
                                <View style={styles.flex}>
                                  <AppButton title="Not yet" variant="outline" onPress={() => setLinkFor(null)} />
                                </View>
                                <View style={styles.flex}>
                                  <AppButton title={busy ? 'Saving…' : 'I posted it'} disabled={busy} onPress={() => void posted(step)} />
                                </View>
                              </View>
                            </View>
                          ) : (
                            <View style={styles.row}>
                              {isHandoffPlatform(step.platform) && (
                                <View style={styles.flex}>
                                  <AppButton title={`Open ${nameOf(step.platform)}`} variant="outline" onPress={() => void open(step)} />
                                </View>
                              )}
                              <View style={styles.flex}>
                                <AppButton
                                  title="I posted it"
                                  variant={ready ? 'primary' : 'quiet'}
                                  onPress={() => {
                                    tick();
                                    setLinkFor(step.platform);
                                  }}
                                />
                              </View>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                  ))}
                  {open_ && <Text style={styles.note}>Opening an app copies your caption and tags, ready to paste. We can’t post for you, so tap “I posted it” once it’s up.</Text>}
                </View>
              )}

              {/* Change it */}
              {open_ && !editing && (
                <View style={styles.row}>
                  <View style={styles.flex}>
                    <AppButton title={ready ? 'Remind me later' : 'Change time'} variant="glass" onPress={startMove} disabled={busy} />
                  </View>
                  <View style={styles.flex}>
                    <AppButton title="Edit" variant="glass" onPress={startEditing} disabled={busy} />
                  </View>
                </View>
              )}
              {!anyPosted && !editing && (
                <Pressable onPress={() => void remove()} disabled={busy} style={styles.delete} accessibilityRole="button">
                  <Text style={styles.deleteText}>{confirmingDelete ? 'Tap again to remove it' : 'Remove this post'}</Text>
                </Pressable>
              )}
            </>
          )}
        </ScrollView>
      </GlassSheet>

      <ScheduleSheet
        visible={pickingTime}
        onClose={endMove}
        onConfirm={(at) => void moveTo(at)}
        mode="remind"
        bestTime={bestTime}
        initial={post && Date.parse(post.at) > Date.now() ? new Date(post.at) : null}
        title={ready ? 'When should we remind you?' : 'Move it to…'}
        confirmLabel="Move it"
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { flexGrow: 0 },
  body: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14, gap: 14 },
  spinner: { marginVertical: 28 },
  muted: { fontSize: 14, lineHeight: 20, color: ds.text2, paddingVertical: 18, textAlign: 'center' },
  words: { padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)', gap: 10 },
  caption: { fontSize: 15.5, lineHeight: 23, color: ds.ink },
  tags: { fontSize: 14, lineHeight: 20, fontWeight: '700', color: ds.purple },
  label: { fontSize: 12.5, fontWeight: '800', color: ds.text2, marginTop: 4, marginBottom: 6 },
  editBox: { padding: 14, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.8)', gap: 4 },
  captionInput: {
    minHeight: 120,
    maxHeight: 220,
    padding: 12,
    borderRadius: 14,
    fontSize: 15,
    lineHeight: 22,
    color: ds.ink,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  tagInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    fontSize: 14,
    color: ds.ink,
    borderWidth: 1.5,
    borderColor: ds.line,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : {}),
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  platforms: { gap: 10 },
  platform: { padding: 12, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.8)', gap: 12 },
  platformTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  platformName: { fontSize: 15, fontWeight: '800', color: ds.ink },
  platformState: { fontSize: 12.5, fontWeight: '600', color: ds.text3, marginTop: 1 },
  platformStatePosted: { color: ds.greenFill, fontWeight: '800' },
  link: { fontSize: 13, fontWeight: '800', color: ds.purple },
  linkBox: { gap: 4 },
  note: { fontSize: 12.5, lineHeight: 18, color: ds.text3 },
  delete: { alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 12 },
  deleteText: { fontSize: 13, fontWeight: '700', color: ds.text3 },
});
