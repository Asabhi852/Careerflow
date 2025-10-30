'use client';

// @ts-ignore - React hooks import issue
import { use, useMemo, useEffect } from 'react';
import { doc } from 'firebase/firestore';
import { useFirestore, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { UserProfile } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Lucide icons import issue
import { ArrowLeft, Briefcase, MapPin, Mail, GraduationCap, Lightbulb, FileText, Video, Phone, Globe, Award, DollarSign, Calendar } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/shared/user-avatar';

export default function CandidateProfilePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const firestore = useFirestore();
  const { user } = useUser();

  const profileRef = useMemoFirebase(() => {
    if (!firestore || !resolvedParams.id) return null;
    return doc(firestore, 'public_profiles', resolvedParams.id);
  }, [firestore, resolvedParams.id]);

  const { data: profile, isLoading } = useDoc<UserProfile>(profileRef);

  // Notify profile owner when someone views their profile
  useEffect(() => {
    const notifyProfileOwner = async () => {
      if (!firestore || !user || !profile || !resolvedParams.id) return;
      
      // Don't notify if viewing own profile
      if (user.uid === resolvedParams.id) return;

      try {
        // Import notification functions dynamically
        const { notifyProfileView } = await import('@/lib/notifications');
        const { doc: docRef, getDoc } = await import('firebase/firestore');
        
        // Get viewer profile for notification
        const viewerProfileRef = docRef(firestore, 'users', user.uid);
        const viewerProfileSnap = await getDoc(viewerProfileRef);
        const viewerProfile = viewerProfileSnap.data();
        const viewerName = viewerProfile?.firstName && viewerProfile?.lastName 
          ? `${viewerProfile.firstName} ${viewerProfile.lastName}`
          : user.displayName || undefined;

        // Send notification to profile owner
        await notifyProfileView(firestore, resolvedParams.id, {
          viewerId: user.uid,
          viewerName: viewerName,
        });
      } catch (error) {
        console.error('Error sending profile view notification:', error);
        // Don't show error to user, just log it
      }
    };

    notifyProfileOwner();
  }, [firestore, user, profile, resolvedParams.id]);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <Button variant="ghost" asChild className="mb-8">
            <Link href="/candidates">
              <ArrowLeft className="mr-2" />
              Back to Candidates
            </Link>
          </Button>

          {isLoading && (
            <Card>
              <CardHeader className="items-center text-center">
                 <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2 pt-4">
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-6 w-40" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                </div>
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </CardContent>
              <CardFooter>
                 <Skeleton className="h-10 w-32" />
              </CardFooter>
            </Card>
          )}

          {profile && (
            <Card>
              <CardHeader className="items-center text-center">
                <div className="mb-4">
                  <UserAvatar user={profile} size="xl" className="ring-4 ring-primary/20" />
                </div>
                <div className="pt-4">
                    <CardTitle className="font-headline text-4xl">{profile.firstName} {profile.lastName}</CardTitle>
                    <CardDescription className="text-lg flex flex-wrap items-center justify-center gap-x-4 gap-y-2 pt-2">
                        {profile.location && <span className="flex items-center gap-2"><MapPin /> {profile.location}</span>}
                        {profile.email && <span className="flex items-center gap-2"><Mail /> {profile.email}</span>}
                    </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 mt-6">
                {profile.bio && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3">About</h3>
                        <p className="text-muted-foreground">{profile.bio}</p>
                    </div>
                )}

                {(profile.currentJobTitle || profile.currentCompany) && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Briefcase /> Current Position</h3>
                        <p className="text-lg">{profile.currentJobTitle} {profile.currentCompany && `at ${profile.currentCompany}`}</p>
                    </div>
                )}

                {/* Phone number is kept private - not displayed publicly */}

                {profile.availability && (
                    <div>
                        {/* @ts-ignore - Badge children prop */}
                        <Badge variant={profile.availability === 'available' ? 'default' : 'secondary'}>
                            {profile.availability === 'available' ? 'Available for Work' : 
                             profile.availability === 'open_to_offers' ? 'Open to Offers' : 'Not Available'}
                        </Badge>
                    </div>
                )}

                {profile.expectedSalary && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        <span className="text-lg">Expected Salary: ${profile.expectedSalary.toLocaleString()}</span>
                    </div>
                )}

                {profile.skills && profile.skills.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Lightbulb /> Skills</h3>
                        <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                            // @ts-ignore - Badge children prop
                            <Badge key={index} variant="secondary">{skill}</Badge>
                        ))}
                        </div>
                    </div>
                )}

                {profile.languages && profile.languages.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Globe /> Languages</h3>
                        <div className="flex flex-wrap gap-2">
                        {profile.languages.map((lang, index) => (
                            // @ts-ignore - Badge children prop
                            <Badge key={index} variant="outline">{lang}</Badge>
                        ))}
                        </div>
                    </div>
                )}

                {profile.workExperience && profile.workExperience.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Briefcase /> Work Experience</h3>
                        <div className="space-y-4">
                            {profile.workExperience.map((exp, index) => (
                                <Card key={index}>
                                    <CardHeader>
                                        <CardTitle className="text-lg">{exp.position}</CardTitle>
                                        <CardDescription>{exp.company}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                                            <Calendar className="h-4 w-4" />
                                            <span>{exp.startDate} - {exp.current ? 'Present' : exp.endDate || 'N/A'}</span>
                                        </div>
                                        {exp.description && <p className="text-sm">{exp.description}</p>}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {profile.educationDetails && profile.educationDetails.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><GraduationCap /> Education</h3>
                        <div className="space-y-4">
                            {profile.educationDetails.map((edu) => (
                                <Card key={edu.id} className="border-l-4 border-l-blue-500">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{edu.level}</CardTitle>
                                                <CardDescription className="text-base font-medium">{edu.institution}</CardDescription>
                                            </div>
                                            {edu.current && (
                                                <Badge variant="default">Currently Pursuing</Badge>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {(edu.level === 'SSC' || edu.level === 'PUC') && edu.board && (
                                            <p className="text-sm"><span className="font-medium">Board:</span> {edu.board}</p>
                                        )}
                                        {edu.university && (
                                            <p className="text-sm"><span className="font-medium">University:</span> {edu.university}</p>
                                        )}
                                        {edu.degree && (
                                            <p className="text-sm"><span className="font-medium">Degree:</span> {edu.degree}</p>
                                        )}
                                        <p className="text-sm"><span className="font-medium">Field of Study:</span> {edu.field}</p>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4" />
                                                <span>{edu.startYear} - {edu.current ? 'Present' : edu.endYear || 'N/A'}</span>
                                            </div>
                                            {edu.grade && (
                                                <span className="font-medium text-foreground">Grade: {edu.grade}</span>
                                            )}
                                        </div>
                                        {edu.achievements && (
                                            <div className="mt-2 pt-2 border-t">
                                                <p className="text-sm font-medium mb-1">Achievements:</p>
                                                <p className="text-sm text-muted-foreground">{edu.achievements}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Fallback to old education format if educationDetails is not available */}
                {(!profile.educationDetails || profile.educationDetails.length === 0) && profile.education && profile.education.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><GraduationCap /> Education</h3>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            {profile.education.map((edu, index) => (
                                <li key={index}>{edu}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {profile.certificates && profile.certificates.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Award /> Certificates</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {profile.certificates.map((cert) => (
                                <Card key={cert.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">{cert.name}</CardTitle>
                                        <CardDescription>{cert.issuer}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground">Issued: {cert.issueDate}</p>
                                        {cert.expiryDate && <p className="text-sm text-muted-foreground">Expires: {cert.expiryDate}</p>}
                                        {cert.credentialId && <p className="text-sm text-muted-foreground">ID: {cert.credentialId}</p>}
                                        {cert.certificateUrl && (
                                            <Button asChild variant="link" size="sm" className="px-0 mt-2">
                                                <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                                                    View Certificate
                                                </a>
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {profile.portfolioUrls && profile.portfolioUrls.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-xl mb-3 flex items-center gap-2"><Globe /> Portfolio</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.portfolioUrls.map((url, index) => (
                                <Button key={index} asChild variant="outline" size="sm">
                                    <a href={url} target="_blank" rel="noopener noreferrer">
                                        Link {index + 1}
                                    </a>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}
                
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    {profile.resumeUrl && (
                        <Button asChild variant="outline" size="lg">
                            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer">
                                <FileText className="mr-2" /> View Resume
                            </a>
                        </Button>
                    )}
                     {profile.videoDemoUrl && (
                        <Button asChild variant="outline" size="lg">
                            <a href={profile.videoDemoUrl} target="_blank" rel="noopener noreferrer">
                                <Video className="mr-2" /> Watch Video Demo
                            </a>
                        </Button>
                    )}
                    {profile.videoUrls && profile.videoUrls.length > 0 && profile.videoUrls.map((url, index) => (
                        <Button key={index} asChild variant="outline" size="lg">
                            <a href={url} target="_blank" rel="noopener noreferrer">
                                <Video className="mr-2" /> Video {index + 1}
                            </a>
                        </Button>
                    ))}
                </div>

              </CardContent>
              <CardFooter>
                <Button size="lg" asChild>
                  <Link href={`/dashboard/messages?userId=${profile.id}&name=${encodeURIComponent(profile.firstName + ' ' + profile.lastName)}`}>
                    <Mail className="mr-2" />
                    Contact {profile.firstName}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )}
           {!profile && !isLoading && (
             <div className="text-center py-20 border-2 border-dashed rounded-lg">
                <h3 className="text-2xl font-semibold">Candidate not found</h3>
                <p className="text-muted-foreground mt-2">This profile may have been removed or is not public.</p>
            </div>
           )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
