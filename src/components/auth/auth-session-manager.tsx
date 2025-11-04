'use client';

import { useEffect, useRef } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

interface AuthSessionManagerProps {
  children: React.ReactNode;
}

/**
 * AuthSessionManager component that handles authentication session management.
 *
 * This component implements a security feature where users are automatically
 * signed out when they close the browser tab. This ensures that:
 * 1. Users must re-authenticate (login/signup) when they return to the app
 * 2. Prevents unauthorized access if someone else opens the browser
 * 3. Maintains session security across tab closures
 *
 * Implementation uses:
 * - beforeunload event: Triggers when tab is being closed/refreshed
 * - visibilitychange event: Handles tab switching and minimization scenarios
 * - Automatic sign-out to force re-authentication on next visit
 */
export function AuthSessionManager({ children }: AuthSessionManagerProps) {
  const auth = useAuth();
  const { user } = useUser();
  const signOutTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!auth || !user) return;

    // Function to handle tab/window closure
    const handleBeforeUnload = () => {
      // Sign out the user when the tab is being closed
      // This happens synchronously before the page unloads
      try {
        signOut(auth);
      } catch (error) {
        // Silently handle any errors during sign out
        console.warn('Error during automatic sign out on tab closure:', error);
      }
    };

    // Function to handle visibility change (tab switching, minimizing, etc.)
    const handleVisibilityChange = () => {
      // Clear any existing timeout
      if (signOutTimeoutRef.current) {
        clearTimeout(signOutTimeoutRef.current);
      }

      // Only sign out if the document is hidden (tab is not visible)
      if (document.hidden && document.visibilityState === 'hidden') {
        // Add a delay to distinguish between tab switching and actual closure
        // If the tab remains hidden for more than 5 seconds, assume it's closed/minimized
        signOutTimeoutRef.current = setTimeout(() => {
          if (document.hidden) {
            try {
              signOut(auth);
            } catch (error) {
              console.warn('Error during visibility-based sign out:', error);
            }
          }
        }, 5000); // 5 second delay
      } else {
        // Tab became visible again, cancel the sign out
        if (signOutTimeoutRef.current) {
          clearTimeout(signOutTimeoutRef.current);
          signOutTimeoutRef.current = undefined;
        }
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      // Clear any pending timeout
      if (signOutTimeoutRef.current) {
        clearTimeout(signOutTimeoutRef.current);
      }
    };
  }, [auth, user]);

  return <>{children}</>;
}
