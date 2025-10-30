// @ts-nocheck
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, memoryLocalCache, persistentSingleTabManager, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      // Server-side: return a mock object that won't crash
      console.warn('Firebase initialization attempted on server side');
      return null as any;
    }

    if (!getApps().length) {
      // Use the config directly - firebaseConfig has fallback values
      const firebaseApp = initializeApp(firebaseConfig);
      return getSdks(firebaseApp);
    }

    // If already initialized, return the SDKs with the already initialized App
    return getSdks(getApp());
  } catch (error) {
    console.error('Firebase initialization error:', error);
    // Return null to allow the app to handle it gracefully
    throw error;
  }
}

// Cache Firestore instance to avoid re-initializing with different options
let cachedFirestore: Firestore | null = null;

export function getSdks(firebaseApp: FirebaseApp) {
  // If we've already created Firestore with options, reuse it
  if (cachedFirestore) {
    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore: cachedFirestore,
      storage: getStorage(firebaseApp),
    };
  }

  // If an app already exists and Firestore was created elsewhere, get it
  try {
    const existing = getFirestore(firebaseApp);
    if (existing) {
      cachedFirestore = existing;
      return {
        firebaseApp,
        auth: getAuth(firebaseApp),
        firestore: cachedFirestore,
        storage: getStorage(firebaseApp),
      };
    }
  } catch (_) {
    // proceed to initialize below
  }

  // Configure Firestore once with best-available cache; cache the instance
  try {
    cachedFirestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() }),
      experimentalAutoDetectLongPolling: true,
    } as any);
  } catch (e) {
    // Fallback to memory cache if IndexedDB is unavailable
    cachedFirestore = initializeFirestore(firebaseApp, {
      localCache: memoryLocalCache(),
      experimentalAutoDetectLongPolling: true,
    } as any);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: cachedFirestore!,
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './errors';
export * from './error-emitter';
