import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Real camera + camera-roll access for the composer (works in Expo Go).
// Returns null when the creator cancels or declines permission.

export type PickedMedia = {
  uri: string;
  kind: 'video' | 'image';
  /** Seconds, for videos when the picker reports it. */
  duration?: number;
  /** What the picker reported, kept so the file can be uploaded (src/api/posts.ts) */
  mimeType?: string;
  sizeBytes?: number;
  fileName?: string;
};

type Want = 'video' | 'image' | 'any';

const typesFor = (want: Want): ImagePicker.MediaType[] =>
  want === 'video' ? ['videos'] : want === 'image' ? ['images'] : ['images', 'videos'];

const toPicked = (res: ImagePicker.ImagePickerResult): PickedMedia | null => {
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    kind: a.type === 'video' ? 'video' : 'image',
    duration: a.duration ? Math.round(a.duration / 1000) : undefined,
    mimeType: a.mimeType ?? undefined,
    sizeBytes: a.fileSize ?? undefined,
    fileName: a.fileName ?? undefined,
  };
};

export async function captureWithCamera(want: Want): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: typesFor(want),
    videoMaxDuration: 180,
    quality: 1,
  });
  return toPicked(res);
}

export async function pickFromLibrary(want: Want): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: typesFor(want),
    quality: 1,
  });
  return toPicked(res);
}

/** Several photos at once (for a carousel). Returns their URIs, or [] if cancelled. */
export async function pickPhotos(limit = 10): Promise<string[]> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 1,
  });
  if (res.canceled || !res.assets?.length) return [];
  return res.assets.map((a) => a.uri);
}

/** Web only: a video's length in whole seconds, read from its metadata (undefined if the browser can't tell) */
export function readWebVideoDuration(url: string): Promise<number | undefined> {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => resolve(Number.isFinite(v.duration) ? Math.round(v.duration) : undefined);
    v.onerror = () => resolve(undefined);
    v.src = url;
  });
}
