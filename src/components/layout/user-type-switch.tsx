'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Briefcase, UserSearch, ChevronDown, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function UserTypeSwitch() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentUserType, setCurrentUserType] = useState<'job_seeker' | 'recruiter'>('job_seeker');

  // Fetch current user type from profile
  useEffect(() => {
    const fetchUserType = async () => {
      if (!firestore || !user) return;
      
      try {
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setCurrentUserType(userData.userType || 'job_seeker');
        }
      } catch (error) {
        console.error('Error fetching user type:', error);
      }
    };
    
    fetchUserType();
  }, [firestore, user]);

  const switchUserType = async (newType: 'job_seeker' | 'recruiter') => {
    if (!firestore || !user || isUpdating || newType === currentUserType) return;

    setIsUpdating(true);

    try {
      const userDocRef = doc(firestore, 'users', user.uid);
      const publicProfileRef = doc(firestore, 'public_profiles', user.uid);

      // Update both user profile and public profile
      await updateDoc(userDocRef, { userType: newType });
      await updateDoc(publicProfileRef, { userType: newType });

      setCurrentUserType(newType);

      toast({
        title: 'Account Type Switched',
        description: `You are now using CareerFlow as a ${newType === 'job_seeker' ? 'Job Seeker' : 'Recruiter'}.`,
      });

      // Redirect to appropriate dashboard
      if (newType === 'recruiter') {
        router.push('/dashboard');
      } else {
        router.push('/dashboard');
      }

      // Refresh the page to update UI
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Error switching user type:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Switch',
        description: 'Could not switch account type. Please try again.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" disabled={isUpdating}>
          {currentUserType === 'job_seeker' ? (
            <>
              <UserSearch className="h-4 w-4" />
              <span className="hidden sm:inline">Job Seeker</span>
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Recruiter</span>
            </>
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Switch Account Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => switchUserType('job_seeker')}
          className="cursor-pointer"
          disabled={currentUserType === 'job_seeker'}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <UserSearch className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Job Seeker</span>
                <span className="text-xs text-muted-foreground">Find opportunities</span>
              </div>
            </div>
            {currentUserType === 'job_seeker' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchUserType('recruiter')}
          className="cursor-pointer"
          disabled={currentUserType === 'recruiter'}
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              <div className="flex flex-col">
                <span className="font-medium">Recruiter</span>
                <span className="text-xs text-muted-foreground">Hire talent</span>
              </div>
            </div>
            {currentUserType === 'recruiter' && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
