import * as SecureStore from 'expo-secure-store';
import { createChunkedStorage } from './chunkedStorage';

// Phones: the session lives in the Keychain / Keystore via expo-secure-store.
export const authStorage = createChunkedStorage({
  getItemAsync: (key) => SecureStore.getItemAsync(key),
  setItemAsync: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItemAsync: (key) => SecureStore.deleteItemAsync(key),
});
