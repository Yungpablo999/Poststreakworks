import React from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Switch, View } from 'react-native';
import { Text } from '../ui/AppText';
import { GlassCard } from '../glass/GlassCard';
import { ds } from '../../theme/colors';
import { SelectField } from './SelectField';
import {
  TIKTOK_PRIVACY_LABELS,
  TIKTOK_PROCESSING_NOTE,
  nicknameInitials,
  privacyLevelDisabledReason,
  tiktokConsent,
  tiktokDisclosureNote,
  type TikTokForm,
} from '../../api/tiktok';
import type { TikTokSettings } from '../../hooks/useTikTokSettings';

// The TikTok post settings card (TikTok Direct Post requirements): shown in the composer
// after the platform step, only when TikTok is selected and a video is attached.
// Pass the object from useTikTokSettings().

function SwitchRow({
  label,
  note,
  value,
  disabled,
  onChange,
  bold,
}: {
  label: string;
  note?: string;
  value: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, disabled && styles.dim]}>{label}</Text>
        {note ? <Text style={styles.help}>{note}</Text> : null}
      </View>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        accessibilityLabel={label}
        trackColor={{ false: '#D9D3C7', true: ds.purple }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#D9D3C7"
        style={disabled ? styles.switchDisabled : undefined}
      />
    </View>
  );
}

export function TikTokSettingsCard({ settings, disabled }: { settings: TikTokSettings; disabled?: boolean }) {
  const { creatorInfo, form, change, retry, problem } = settings;

  if (creatorInfo.status === 'idle' || creatorInfo.status === 'loading') {
    return (
      <GlassCard strong radius={24} padding={18}>
        <View style={styles.loadingRow} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={ds.purple} />
          <Text style={styles.help}>Loading your TikTok account...</Text>
        </View>
      </GlassCard>
    );
  }

  if (creatorInfo.status === 'error') {
    return (
      <GlassCard strong radius={24} padding={18}>
        <Text style={styles.reason} accessibilityRole="alert">{creatorInfo.message}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </GlassCard>
    );
  }

  const { creator } = creatorInfo;
  const consent = tiktokConsent(form);
  const note = tiktokDisclosureNote(form);
  const turnedOff = 'Turned off in your TikTok settings';
  const set = (c: Partial<TikTokForm>) => change(c);

  const privacyOptions = creator.privacyLevelOptions.map((level) => ({
    value: level,
    label: TIKTOK_PRIVACY_LABELS[level],
    disabledReason: privacyLevelDisabledReason(level, form) ? 'not available for branded content' : null,
  }));

  return (
    <GlassCard strong radius={24} padding={18}>
      <View style={styles.head}>
        {creator.avatarUrl ? (
          <Image source={{ uri: creator.avatarUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{nicknameInitials(creator.nickname)}</Text>
          </View>
        )}
        <Text style={styles.headText}>
          Posting to TikTok as <Text style={styles.strong}>{creator.nickname}</Text>
        </Text>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Who can view this video</Text>
        <SelectField
          label="Who can view this video"
          placeholder="Select who can view this video"
          value={form.privacyLevel}
          options={privacyOptions}
          onChange={(v) => set({ privacyLevel: v as TikTokForm['privacyLevel'] })}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Allow people to</Text>
        <SwitchRow label="Comment" value={form.allowComment} disabled={disabled || creator.commentDisabled} note={creator.commentDisabled ? turnedOff : undefined} onChange={(allowComment) => set({ allowComment })} />
        <SwitchRow label="Duet" value={form.allowDuet} disabled={disabled || creator.duetDisabled} note={creator.duetDisabled ? turnedOff : undefined} onChange={(allowDuet) => set({ allowDuet })} />
        <SwitchRow label="Stitch" value={form.allowStitch} disabled={disabled || creator.stitchDisabled} note={creator.stitchDisabled ? turnedOff : undefined} onChange={(allowStitch) => set({ allowStitch })} />
      </View>

      <View style={styles.field}>
        <SwitchRow
          label="Disclose video content"
          note="Turn on if this video promotes goods or services in exchange for something of value."
          value={form.commercial}
          disabled={disabled}
          onChange={(commercial) => set({ commercial })}
        />
        {form.commercial ? (
          <View style={styles.nest}>
            <SwitchRow
              label="Your brand"
              note={'You are promoting yourself or your own business. Labeled "Promotional content".'}
              value={form.yourBrand}
              disabled={disabled}
              onChange={(yourBrand) => set({ yourBrand })}
            />
            <SwitchRow
              label="Branded content"
              note={'You are promoting another brand or a third party. Labeled "Paid partnership".'}
              value={form.brandedContent}
              disabled={disabled}
              onChange={(brandedContent) => set({ brandedContent })}
            />
            {note ? <View style={styles.notice}><Text style={styles.noticeText}>{note}</Text></View> : null}
          </View>
        ) : null}
      </View>

      <Text style={styles.fine}>
        By posting, you agree to TikTok's{' '}
        {consent.links.map((link, i) => (
          <Text key={link.href}>
            {i > 0 ? (i === consent.links.length - 1 ? ' and ' : ', ') : ''}
            <Text accessibilityRole="link" style={styles.link} onPress={() => void Linking.openURL(link.href)}>
              {link.label}
            </Text>
          </Text>
        ))}
        .
      </Text>
      <Text style={[styles.fine, styles.muted]}>{TIKTOK_PROCESSING_NOTE}</Text>
      {problem ? <Text style={styles.reason} accessibilityRole="alert">{problem}</Text> : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: ds.lavender, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarText: { fontSize: 14, fontWeight: '800', color: ds.purple },
  headText: { flex: 1, fontSize: 13, color: ds.text2 },
  strong: { fontWeight: '700', color: ds.ink },
  field: { marginBottom: 18 },
  label: { fontSize: 13, fontWeight: '700', color: ds.ink, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 14, fontWeight: '600', color: ds.ink },
  dim: { color: ds.text3 },
  switchDisabled: { opacity: 0.45 },
  help: { fontSize: 12, color: ds.text2, marginTop: 2 },
  nest: { marginLeft: 14, paddingLeft: 14, borderLeftWidth: 2, borderLeftColor: ds.lavender },
  notice: { backgroundColor: ds.lavenderSoft, borderWidth: 1, borderColor: ds.lavender, borderRadius: 16, padding: 12, marginTop: 6 },
  noticeText: { fontSize: 12, color: ds.text2 },
  fine: { fontSize: 12, color: ds.text2, marginBottom: 6 },
  muted: { color: ds.text3 },
  link: { color: ds.purple, fontWeight: '600', textDecorationLine: 'underline' },
  reason: { fontSize: 12, fontWeight: '600', color: ds.goldLedge, marginTop: 6 },
  retry: { alignSelf: 'flex-start', marginTop: 10, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: ds.line },
  retryText: { fontSize: 13, fontWeight: '700', color: ds.purple },
});
