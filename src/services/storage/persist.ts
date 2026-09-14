import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/** AsyncStorage-backed storage for zustand `persist` — keeps the app fully usable offline. */
export const asyncStorage = createJSONStorage(() => AsyncStorage);
