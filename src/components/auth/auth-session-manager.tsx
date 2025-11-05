'use client';

import { useEffect } from 'react';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';

interface AuthSessionManagerProps {
  children: React.ReactNode;
}

/**
 * AuthSessionManager component that handles authentication session management.
 *
 * This component implements a security feature where users stay logged in on page refresh
 * but are automatically signed out when they close and reopen the browser tab. This ensures that:
 * 1. Page refreshes maintain the session
 * 2. Users must re-authenticate (login/signup) when reopening the tab
 * 3. Prevents unauthorized access if someone else opens the browser
 *
 * Implementation uses:
 * - sessionStorage flags to detect refresh vs tab closure
 * - beforeunload event to set flags before page unload
 * - Automatic sign-out on tab reopen to force re-authentication
 */
export function AuthSessionManager({ children }: AuthSessionManagerProps) {
  const auth = useAuth();
  const { user } = useUser();

  useEffect(() => {
    // Check if this is a refresh or a new tab open
    const refreshing = sessionStorage.getItem('refreshing') === 'true';
    if (refreshing) {
      sessionStorage.removeItem('refreshing');
    } else {
      // Tab was closed and reopened, sign out to force re-authentication
      setTimeout(() => {
        if (auth && user) {
          try {
            signOut(auth);
          } catch (error) {
            console.warn('Error during automatic sign out on tab reopen:', error);
          }
        }
      }, 100); // Small delay to allow auth state to load
    }
    sessionStorage.setItem('tabOpen', 'true');
  }, []); // Run once on mount

  useEffect(() => {
    if (!auth || !user) return;

    // Function to handle tab/window closure or refresh
    const handleBeforeUnload = () => {
      // Set flag to indicate refreshing if tab was open
      if (sessionStorage.getItem('tabOpen') === 'true') {
        sessionStorage.setItem('refreshing', 'true');
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [auth, user]);

  return <>{children}</>;
}
