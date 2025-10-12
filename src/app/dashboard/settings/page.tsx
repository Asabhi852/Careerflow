'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <div className="grid gap-6">
      <h1 className="font-headline text-3xl font-bold tracking-tight">
        Settings
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>
            Manage your account and notification preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-xl font-semibold">Coming Soon!</h3>
                <p className="text-muted-foreground mt-2">
                    We're working on the account settings page.
                </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
