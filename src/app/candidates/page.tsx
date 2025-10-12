'use client';

// @ts-ignore - React hooks import issue
import { useState, useMemo } from 'react';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import type { UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CandidateSearch, type SearchFilters } from '@/components/candidates/candidate-search';

function CandidateCard({ profile }: { profile: UserProfile }) {
    return (
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                 <Avatar className="h-16 w-16">
                    {profile.profilePictureUrl && <AvatarImage src={profile.profilePictureUrl} alt={profile.firstName} />}
                    <AvatarFallback>{profile.firstName?.charAt(0)}{profile.lastName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="font-headline text-2xl">{profile.firstName} {profile.lastName}</CardTitle>
                    <CardDescription>{profile.location}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {profile.skills && profile.skills.length > 0 && (
                     <div className="flex flex-wrap gap-2 mb-4">
                        {profile.skills.slice(0, 4).map((skill) => (
                            <Badge key={skill} variant="secondary">{skill}</Badge>
                        ))}
                        {profile.skills.length > 4 && <Badge variant="outline">+{profile.skills.length - 4}</Badge>}
                    </div>
                )}
                 <Button asChild className="w-full">
                    <Link href={`/candidates/${profile.id}`}>View Profile</Link>
                </Button>
            </CardContent>
        </Card>
    )
}

function CandidateCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex-row items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-wrap gap-2 mb-4">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
}


export default function CandidatesPage() {
    const firestore = useFirestore();
    const [filters, setFilters] = useState<SearchFilters>({
        searchTerm: '',
        location: '',
        skills: [],
        interests: [],
    });

    const profilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'public_profiles'), limit(100));
    }, [firestore]);

    const { data: allProfiles, isLoading } = useCollection<UserProfile>(profilesQuery);

    // Client-side filtering
    const profiles = useMemo(() => {
        if (!allProfiles) return [];
        
        return allProfiles.filter(profile => {
            // Search term filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const matchesName = `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(searchLower);
                const matchesSkills = profile.skills?.some(skill => skill.toLowerCase().includes(searchLower));
                const matchesBio = profile.bio?.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesSkills && !matchesBio) return false;
            }

            // Location filter
            if (filters.location && !profile.location?.toLowerCase().includes(filters.location.toLowerCase())) {
                return false;
            }

            // Skills filter
            if (filters.skills.length > 0) {
                const hasSkill = filters.skills.some(filterSkill => 
                    profile.skills?.some(profileSkill => 
                        profileSkill.toLowerCase().includes(filterSkill.toLowerCase())
                    )
                );
                if (!hasSkill) return false;
            }

            // Age filter
            if (filters.minAge && (!profile.age || profile.age < filters.minAge)) return false;
            if (filters.maxAge && (!profile.age || profile.age > filters.maxAge)) return false;

            // Availability filter
            if (filters.availability && filters.availability !== 'all' && profile.availability !== filters.availability) {
                return false;
            }

            // Interests filter
            if (filters.interests.length > 0) {
                const hasInterest = filters.interests.some(filterInterest => 
                    profile.interests?.some(profileInterest => 
                        profileInterest.toLowerCase().includes(filterInterest.toLowerCase())
                    )
                );
                if (!hasInterest) return false;
            }

            return true;
        });
    }, [allProfiles, filters]);

    return (
        <div className="flex flex-col min-h-screen">
            <SiteHeader />
            <main className="flex-1">
                <section className="bg-muted/30">
                    <div className="container text-center py-20">
                        <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl">
                            Find Top Talent
                        </h1>
                        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                            Browse profiles, search by skill, and connect with the best candidates for your team.
                        </p>
                    </div>
                </section>
                <section className="py-12">
                    <div className="container">
                        <div className="mb-8">
                            <CandidateSearch onSearch={setFilters} />
                        </div>
                        <div className="mb-4">
                            <p className="text-muted-foreground">
                                {isLoading ? 'Loading...' : `Found ${profiles?.length || 0} candidates`}
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {isLoading && Array.from({ length: 8 }).map((_, i) => <CandidateCardSkeleton key={i} />)}
                            {profiles?.map((profile) => (
                                <CandidateCard key={profile.id} profile={profile} />
                            ))}
                        </div>
                        {profiles && profiles.length === 0 && !isLoading && (
                            <div className="text-center py-20 border-2 border-dashed rounded-lg">
                                <h3 className="text-xl font-semibold">No candidates found.</h3>
                                <p className="text-muted-foreground mt-2">As users sign up, their profiles will appear here.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <SiteFooter />
        </div>
    );
}
