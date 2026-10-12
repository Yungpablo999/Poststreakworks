// Phones: what supabase-js expects from a browser.
// - URL / URLSearchParams that follow the spec
// - crypto.getRandomValues and crypto.subtle.digest('SHA-256') for the PKCE sign-in
//   (without them supabase-js would fall back to the weaker "plain" challenge)
import 'react-native-url-polyfill/auto';
import * as ExpoCrypto from 'expo-crypto';

type CryptoLike = {
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
  subtle?: { digest?: (algorithm: AlgorithmIdentifier, data: BufferSource) => Promise<ArrayBuffer> };
};

const g = globalThis as unknown as { crypto?: CryptoLike };
if (!g.crypto) g.crypto = {};
const c = g.crypto;

if (typeof c.getRandomValues !== 'function') {
  c.getRandomValues = (<T extends ArrayBufferView | null>(array: T): T =>
    ExpoCrypto.getRandomValues(array as unknown as Uint8Array) as unknown as T);
}

if (!c.subtle || typeof c.subtle.digest !== 'function') {
  c.subtle = {
    ...(c.subtle ?? {}),
    digest: async (algorithm: AlgorithmIdentifier, data: BufferSource) => {
      const name = (typeof algorithm === 'string' ? algorithm : algorithm.name).toUpperCase();
      if (name !== 'SHA-256') throw new Error(`crypto.subtle.digest: ${name} is not supported here`);
      return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
    },
  };
}
