'use client';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotificationsPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                 <section className="bg-muted/30">
                    <div className="container text-center py-20">
                        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                            Notifications
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Stay up-to-date with your job applications, messages, and profile views.
                        </p>
                    </div>
                </section>
                <section className="py-12">
                    <div className="container">
                        <Card className="text-center">
                            <CardHeader>
                                <CardTitle>Get Real-Time Notifications</CardTitle>
                                <CardDescription>This feature is available to registered users.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground mb-6">Sign up or log in to receive updates on your applications and messages.</p>
                                <div className="flex justify-center gap-4">
                                    <Button asChild size="lg">
                                        <Link href="/signup">Sign Up</Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg">
                                        <Link href="/login">Login</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
