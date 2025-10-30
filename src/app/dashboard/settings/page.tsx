'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth, useUser } from '@/firebase';
import { useI18n } from '@/i18n/I18nProvider';
import { deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const auth = useAuth();
  const { user } = useUser();
  const { setLanguage: setLangCtx } = useI18n();

  // Language state persisted in localStorage
  const [language, setLanguage] = useState<string>('en');
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

  const handleDeleteAccount = async () => {
    if (!auth || !auth.currentUser) return;
    const confirmed = window.confirm('This will permanently delete your account and data. Continue?');
    if (!confirmed) return;

    try {
      await deleteUser(auth.currentUser);
      toast({ title: 'Account Deleted', description: 'Your account has been removed.' });
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        toast({
          variant: 'destructive',
          title: 'Re-authentication required',
          description: 'Please log in again and retry deleting your account.'
        });
      } else {
        toast({ variant: 'destructive', title: 'Delete Failed', description: error?.message || 'Unable to delete account.' });
      }
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
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Delete your account permanently.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={handleDeleteAccount} disabled={!user}>
            Delete Account
          </Button>
          {!user && (
            <p className="text-sm text-muted-foreground mt-2">Please sign in to manage your account.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
