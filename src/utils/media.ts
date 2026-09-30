import * as ImagePicker from 'expo-image-picker';

// Real camera + camera-roll access for the composer (works in Expo Go).
// Returns null when the creator cancels or declines permission.

export type PickedMedia = {
  uri: string;
  kind: 'video' | 'image';
  /** Seconds, for videos when the picker reports it. */
  duration?: number;
};

type Want = 'video' | 'image';

const toPicked = (res: ImagePicker.ImagePickerResult): PickedMedia | null => {
  if (res.canceled || !res.assets?.length) return null;
  const a = res.assets[0];
  return {
    uri: a.uri,
    kind: a.type === 'video' ? 'video' : 'image',
    duration: a.duration ? Math.round(a.duration / 1000) : undefined,
  };
};

export async function captureWithCamera(want: Want): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: want === 'video' ? ['videos'] : ['images'],
    videoMaxDuration: 180,
    quality: 1,
  });
  return toPicked(res);
}

export async function pickFromLibrary(want: Want): Promise<PickedMedia | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: want === 'video' ? ['videos'] : ['images'],
    quality: 1,
  });
  return toPicked(res);
}
