'use client';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ChatbotInterface = dynamic(
    () => import('@/components/chatbot/chatbot-interface').then(mod => mod.ChatbotInterface),
    { 
        ssr: false,
        loading: () => <ChatbotSkeleton />
    }
);

function ChatbotSkeleton() {
    return (
        <div className="container max-w-3xl">
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                <div className="flex items-center gap-2 mb-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-6 w-48" />
                </div>
                <Skeleton className="h-4 w-64 mb-6" />
                <div className="h-[50vh] border rounded-lg p-4 space-y-4">
                    <div className="flex items-start gap-3">
                         <Skeleton className="w-8 h-8 rounded-full" />
                         <Skeleton className="h-10 w-48 rounded-lg" />
                    </div>
                     <div className="flex items-start gap-3 justify-end">
                         <Skeleton className="h-10 w-32 rounded-lg" />
                         <Skeleton className="w-8 h-8 rounded-full" />
                    </div>
                </div>
                <div className="mt-6 flex gap-2">
                    <Skeleton className="h-10 flex-1" />
                    <Skeleton className="h-10 w-10" />
                </div>
            </div>
        </div>
    )
}

export default function ChatbotPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                 <section className="bg-muted/30">
                    <div className="container text-center py-20">
                        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                            AI Chat Assistant
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                           Get instant answers to your career questions with our multilingual AI-powered chatbot.
                        </p>
                    </div>
                </section>
                <section className="py-12">
                   <ChatbotInterface />
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
