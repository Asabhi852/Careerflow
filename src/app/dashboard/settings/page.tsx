'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth, useUser, useFirestore } from '@/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import { deleteUserAccount, canDeleteAccount } from '@/lib/account-deletion';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { setLanguage: setLangCtx } = useI18n();

  // Language state persisted in localStorage
  const [language, setLanguage] = useState<string>('en');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('app_language') : null;
    if (saved) setLanguage(saved);
  }, []);
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    if (typeof window !== 'undefined') localStorage.setItem('app_language', value);
    // update i18n context immediately
    setLangCtx(value as any);
    toast({ title: 'Language Updated', description: `App language set to ${value.toUpperCase()}.` });
  };

  const handleDeleteAccountClick = async () => {
    if (!user || !firestore) return;
    
    // Check if user can delete account and get any warnings
    const eligibility = await canDeleteAccount(firestore, user.uid);
    
    if (eligibility.reason) {
      setDeleteWarning(eligibility.reason);
    }
    
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!auth || !firestore || !user) return;
    
    setIsDeleting(true);
    
    try {
      const result = await deleteUserAccount(auth, firestore, user.uid);
      
      if (result.success) {
        toast({ 
          title: 'Account Deleted Successfully', 
          description: 'All your data has been permanently removed.' 
        });
        
        // Redirect to home page after a brief delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Delete Failed', 
          description: result.error || 'Unable to delete account.' 
        });
        setShowDeleteDialog(false);
      }
    } catch (error: any) {
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: error?.message || 'An unexpected error occurred.' 
      });
      setShowDeleteDialog(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Settings
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Customize your app experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="language">Language</Label>
            <Select value={language} onValueChange={handleLanguageChange}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">Hindi</SelectItem>
                <SelectItem value="te">Telugu</SelectItem>
                <SelectItem value="ta">Tamil</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Theme */}
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme as string} onValueChange={(v) => setTheme(v)}>
              <SelectTrigger id="theme">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete your account and all associated data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border-2 border-destructive/20 rounded-lg bg-destructive/5">
            <h4 className="font-semibold text-sm mb-2">This action will delete:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Your user profile and public profile</li>
              <li>All jobs you have posted</li>
              <li>Your job applications</li>
              <li>All messages and notifications</li>
              <li>Uploaded files (resume, profile pictures)</li>
              <li>Your authentication account</li>
            </ul>
          </div>
          
          <Button 
            variant="destructive" 
            onClick={handleDeleteAccountClick} 
            disabled={!user || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              'Delete Account Permanently'
            )}
          </Button>
          
          {!user && (
            <p className="text-sm text-muted-foreground mt-2">
              Please sign in to manage your account.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="font-semibold">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>
              
              {deleteWarning && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-md">
                  <p className="text-sm text-amber-900 dark:text-amber-200">
                    <strong>Warning:</strong> {deleteWarning}
                  </p>
                </div>
              )}
              
              <div className="space-y-2 text-sm">
                <p>The following will be permanently deleted:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>User profile and public profile</li>
                  <li>All posted jobs</li>
                  <li>Job applications</li>
                  <li>Messages and notifications</li>
                  <li>Uploaded files</li>
                  <li>Account credentials</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
