// supabase-js builds URLs with the standard URL class, which React Native only
// partly provides. The browser has the real thing, so this file is native-only
// (the web build uses polyfills.ts, which is empty).
import 'react-native-url-polyfill/auto';
