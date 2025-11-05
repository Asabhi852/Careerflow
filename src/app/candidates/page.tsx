'use client';

// @ts-ignore - React hooks import issue
import { useState, useMemo, useEffect } from 'react';
// @ts-ignore - Firebase Firestore import issue
import { collection, query, limit, where, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase, useUser, useDoc } from '@/firebase';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import type { UserProfile } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CandidateSearch, type SearchFilters } from '@/components/candidates/candidate-search';
import { useGeolocation } from '@/hooks/use-geolocation';
import { sortByDistance, geocodeLocation, formatDistance } from '@/lib/geolocation';
// @ts-ignore - Lucide icons import issue
import { MapPin, Navigation, Briefcase, GraduationCap, Mail, Phone, Globe, Calendar, Award, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { LocationBanner } from '@/components/location/location-banner';
import { LocationIndicator } from '@/components/location/location-indicator';

function CandidateCard({ profile }: { profile: UserProfile }) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                    <UserAvatar user={profile} size="lg" />
                    <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold truncate">
                            {profile.firstName} {profile.lastName}
                        </CardTitle>
                        {profile.jobTitle && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Briefcase className="h-3 w-3" />
                                {profile.jobTitle}
                            </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {profile.location || 'Location not specified'}
                        </p>
                        {profile.distance !== undefined && (
                            <p className="text-sm text-primary flex items-center gap-1 mt-1">
                                <Navigation className="h-3 w-3" />
                                {formatDistance(profile.distance)}
                            </p>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Bio */}
                {profile.bio && (
                    <div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                            {profile.bio}
                        </p>
                    </div>
                )}

                {/* Contact Information */}
                <div className="space-y-2">
                    {profile.email && (
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{profile.email}</span>
                        </div>
                    )}
                    {profile.phone && (
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{profile.phone}</span>
                        </div>
                    )}
                    {profile.website && (
                        <div className="flex items-center gap-2 text-sm">
                            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <a href={profile.website} target="_blank" rel="noopener noreferrer" 
                               className="text-primary hover:underline truncate">
                                {profile.website.replace(/^https?:\/\//, '')}
                            </a>
                        </div>
                    )}
                </div>

                {/* Education */}
                {profile.education && profile.education.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <GraduationCap className="h-4 w-4" />
                            Education
                        </h4>
                        <div className="space-y-1">
                            {profile.education.slice(0, 2).map((edu, index) => (
                                <div key={index} className="text-sm">
                                    {typeof edu === 'string' ? (
                                        <p className="font-medium">{edu}</p>
                                    ) : (
                                        <>
                                            <p className="font-medium">{edu.degree || edu.level}</p>
                                            <p className="text-muted-foreground text-xs">{edu.institution}</p>
                                            {(edu.endYear || edu.startYear) && (
                                                <p className="text-muted-foreground text-xs">
                                                    {edu.startYear} - {edu.endYear || 'Present'}
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            {profile.education.length > 2 && (
                                <p className="text-xs text-muted-foreground">+{profile.education.length - 2} more</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Experience */}
                {profile.experience && profile.experience.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Briefcase className="h-4 w-4" />
                            Experience
                        </h4>
                        <div className="space-y-1">
                            {profile.experience.slice(0, 2).map((exp, index) => (
                                <div key={index} className="text-sm">
                                    <p className="font-medium">{exp.position}</p>
                                    <p className="text-muted-foreground text-xs">{exp.company}</p>
                                    {exp.startDate && (
                                        <p className="text-muted-foreground text-xs">
                                            {exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                                        </p>
                                    )}
                                </div>
                            ))}
                            {profile.experience.length > 2 && (
                                <p className="text-xs text-muted-foreground">+{profile.experience.length - 2} more</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Award className="h-4 w-4" />
                            Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.skills.slice(0, 6).map((skill) => (
                                // @ts-ignore - Badge children prop
                                <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                            ))}
                            {/* @ts-ignore - Badge children prop */}
                            {profile.skills.length > 6 && (
                                <Badge variant="outline" className="text-xs">+{profile.skills.length - 6}</Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                            <Target className="h-4 w-4" />
                            Interests
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                            {profile.interests.slice(0, 4).map((interest) => (
                                // @ts-ignore - Badge children prop
                                <Badge key={interest} variant="outline" className="text-xs">{interest}</Badge>
                            ))}
                            {/* @ts-ignore - Badge children prop */}
                            {profile.interests.length > 4 && (
                                <Badge variant="outline" className="text-xs">+{profile.interests.length - 4}</Badge>
                            )}
                        </div>
                    </div>
                )}

                {/* Additional Info */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-2 border-t">
                    {profile.age && (
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {profile.age} years
                        </div>
                    )}
                    {profile.availability && (
                        <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">
                                {profile.availability === 'immediate' ? 'Available Now' : 
                                 profile.availability === 'two_weeks' ? '2 Weeks Notice' :
                                 profile.availability === 'one_month' ? '1 Month Notice' : 
                                 'Exploring'}
                            </Badge>
                        </div>
                    )}
                </div>

                {/* View Profile Button */}
                <Button asChild className="w-full mt-4">
                    <Link href={`/candidates/${profile.id}`}>View Full Profile</Link>
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
    const { user } = useUser();
    const [filters, setFilters] = useState<SearchFilters>({
        searchTerm: '',
        location: '',
        skills: [],
        interests: [],
    });
    const [sortByLocation, setSortByLocation] = useState(false);
    const [showLocationBanner, setShowLocationBanner] = useState(true);
    const { coordinates, isLoading: isLoadingLocation, requestLocation, permissionDenied, locationString } = useGeolocation(true);

    const profilesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Query all public profiles - we'll filter by userType on client side
        return query(
            collection(firestore, 'public_profiles'),
            limit(100)
        );
    }, [firestore]);

    const { data: allProfiles, isLoading } = useCollection<UserProfile>(profilesQuery);

    // Auto-enable location sorting when coordinates are available
    useEffect(() => {
        if (coordinates && !sortByLocation) {
            setSortByLocation(true);
        }
    }, [coordinates]);

    // Geocode candidate locations when they load
    useEffect(() => {
        if (!sortByLocation || !allProfiles) return;
        
        const geocodeCandidates = async () => {
            for (const profile of allProfiles) {
                if (!profile.coordinates && profile.location) {
                    const coords = await geocodeLocation(profile.location);
                    if (coords) {
                        profile.coordinates = coords;
                    }
                }
            }
        };
        
        geocodeCandidates();
    }, [allProfiles, sortByLocation]);

    // Client-side filtering and sorting
    const profiles = useMemo(() => {
        if (!allProfiles) return [];
        
        let filtered = allProfiles.filter(profile => {
            // Exclude the current user's own profile from the candidates list
            if (user && profile.id === user.uid) {
                return false;
            }
            // Only show job seekers (or profiles without userType for backward compatibility)
            if (profile.userType && profile.userType !== 'job_seeker') {
                return false;
            }
            
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

        // Apply location-based sorting if enabled
        if (sortByLocation && coordinates) {
            filtered = sortByDistance(
                filtered,
                coordinates,
                (profile) => profile.coordinates || null
            );
        }

        return filtered;
    }, [allProfiles, filters, sortByLocation, coordinates, user]);

    const handleLocationEnabled = () => {
        setShowLocationBanner(false);
        setSortByLocation(true);
    };

    const handleLocationDenied = () => {
        setShowLocationBanner(false);
        setSortByLocation(false);
    };

    const handleLocationChange = () => {
        // Location will be updated automatically by the hook
        toast({
            title: 'Location Updated',
            description: 'Candidates are being sorted by your new location.',
        });
    };

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
                            Browse job-seeker profiles, search by skill, and connect with the best candidates for your team.
                        </p>
                    </div>
                </section>
                <section className="py-12">
                    <div className="container">
                        <div className="mb-8">
                            <CandidateSearch onSearch={setFilters} />
                        </div>
                        {/* Location Indicator */}
                        {sortByLocation && coordinates && (
                            <div className="flex justify-between items-center mb-6 p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Navigation className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Showing candidates near you</p>
                                        <p className="text-xs text-muted-foreground">{locationString}</p>
                                    </div>
                                </div>
                                <LocationIndicator onLocationChange={handleLocationChange} />
                            </div>
                        )}
                        
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
                                <h3 className="text-xl font-semibold">No job-seekers found.</h3>
                                <p className="text-muted-foreground mt-2">As job-seekers sign up, their profiles will appear here.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
            <SiteFooter />
            
            {/* Location Permission Banner */}
            {showLocationBanner && !coordinates && !permissionDenied && (
                <LocationBanner
                    onLocationEnabled={handleLocationEnabled}
                    onLocationDenied={handleLocationDenied}
                />
            )}
        </div>
    );
}
