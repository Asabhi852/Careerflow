// @ts-nocheck
'use client';

import React, { useMemo, useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [initError, setInitError] = useState<Error | null>(null);
  
  const firebaseServices = useMemo(() => {
    try {
      // Initialize Firebase on the client side, once per component mount.
      return initializeFirebase();
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setInitError(error as Error);
      // Return a minimal fallback to prevent the app from crashing
      return null;
    }
  }, []); // Empty dependency array ensures this runs only once on mount

  if (initError) {
    console.error('Firebase failed to initialize:', initError);
  }

  if (!firebaseServices) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Firebase Initialization Error</h2>
          <p className="text-muted-foreground mb-4">
            Unable to connect to Firebase. Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
