'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
// @ts-ignore - Lucide icons import issue
import { 
  BrainCircuit, 
  MessageSquare, 
  UserSearch, 
  Briefcase, 
  Search, 
  Mic, 
  Globe, 
  MapPin,
  Navigation,
  Trash2,
  Bookmark,
  Filter,
  Upload,
  TrendingUp,
  ArrowRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

const features = [
  {
    icon: <BrainCircuit className="h-6 w-6" />,
    title: 'AI-Powered Job Matching',
    description: 'Our intelligent algorithm analyzes your profile and matches you with jobs that fit your skills, experience, and career goals.',
    link: '/ai-matches',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    highlights: ['80%+ match accuracy', 'Skills-based matching', 'Real-time suggestions']
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Multi-Source Job Aggregation',
    description: 'Access thousands of jobs from LinkedIn, Naukri.com, and internal postings all in one unified platform.',
    link: '/jobs',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    highlights: ['LinkedIn integration', 'Naukri.com jobs', 'Internal postings']
  },
  {
    icon: <Navigation className="h-6 w-6" />,
    title: 'Location-Based Recommendations',
    description: 'Find jobs and candidates near you with smart location-based sorting and distance calculations.',
    link: '/jobs',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    highlights: ['GPS-based sorting', 'Distance display', 'Nearby opportunities']
  },
  {
    icon: <UserSearch className="h-6 w-6" />,
    title: 'Rich Candidate Profiles',
    description: 'Create comprehensive profiles with work experience, certificates, portfolio, resume, and video demos.',
    link: '/dashboard',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    highlights: ['Work history', 'Certificates', 'Video demos']
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Direct Messaging',
    description: 'Connect directly with recruiters and candidates through our real-time messaging system.',
    link: '/dashboard/messages',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    highlights: ['Real-time chat', 'Message history', 'Instant notifications']
  },
  {
    icon: <Mic className="h-6 w-6" />,
    title: '24/7 AI Career Assistant',
    description: 'Get instant career advice with our multilingual voice-enabled chatbot, available anytime you need help.',
    link: '/chatbot',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    highlights: ['Voice commands', 'Multilingual', 'Career guidance']
  },
  {
    icon: <Search className="h-6 w-6" />,
    title: 'Advanced Search & Filters',
    description: 'Find the perfect candidates or jobs with powerful filters for skills, location, experience, and more.',
    link: '/candidates',
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    highlights: ['Multiple filters', 'Real-time results', 'Smart search']
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: 'Media Upload System',
    description: 'Upload profile pictures, resumes, certificates, and video demos to showcase your skills.',
    link: '/dashboard',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    highlights: ['Drag & drop', 'Multiple formats', 'Cloud storage']
  },
  {
    icon: <Briefcase className="h-6 w-6" />,
    title: 'Job Posting & Management',
    description: 'Post jobs, manage applications, and delete your postings with full control over your listings.',
    link: '/jobs',
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    highlights: ['Easy posting', 'Application tracking', 'Delete control']
  },
  {
    icon: <Bookmark className="h-6 w-6" />,
    title: 'Save & Bookmark Jobs',
    description: 'Save interesting jobs for later and access them anytime from your dashboard.',
    link: '/dashboard',
    color: 'text-teal-500',
    bgColor: 'bg-teal-500/10',
    highlights: ['Quick save', 'Organized list', 'Easy access']
  },
];

const quickActions = [
  {
    title: 'Complete Your Profile',
    description: 'Stand out to recruiters',
    icon: <UserSearch className="h-5 w-5" />,
    link: '/dashboard',
    color: 'bg-blue-500'
  },
  {
    title: 'Browse Jobs',
    description: 'Find your next opportunity',
    icon: <Briefcase className="h-5 w-5" />,
    link: '/jobs',
    color: 'bg-green-500'
  },
  {
    title: 'AI Matches',
    description: 'See personalized recommendations',
    icon: <BrainCircuit className="h-5 w-5" />,
    link: '/ai-matches',
    color: 'bg-purple-500'
  },
  {
    title: 'Talk to AI Assistant',
    description: 'Get career guidance',
    icon: <Mic className="h-5 w-5" />,
    link: '/chatbot',
    color: 'bg-orange-500'
  },
];

export default function HomePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b">
          <div className="container py-16 sm:py-20">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="mb-4" variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                Welcome to CareerFlow Connect
              </Badge>
              <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Your Career Journey Starts Here
              </h1>
              <p className="text-lg text-muted-foreground mb-8">
                Discover powerful features designed to connect you with the perfect opportunities and talent. 
                Everything you need to succeed in one platform.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/jobs">
                    <Briefcase className="mr-2 h-5 w-5" />
                    Explore Jobs
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/ai-matches">
                    <BrainCircuit className="mr-2 h-5 w-5" />
                    AI Matches
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-12 border-b">
          <div className="container">
            <h2 className="text-2xl font-bold mb-6 text-center">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.link}>
                  <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className={`${action.color} text-white p-3 rounded-lg w-fit mb-3`}>
                        {action.icon}
                      </div>
                      <h3 className="font-semibold mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-16 sm:py-20">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Powerful Features at Your Fingertips
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to find the perfect job or hire the best talent
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card 
                  key={feature.title}
                  className="hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.05}s both`
                  }}
                >
                  <CardHeader>
                    <div className={`${feature.bgColor} ${feature.color} p-3 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}>
                      {feature.icon}
                    </div>
                    <CardTitle className="font-headline text-xl mb-2">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      {feature.highlights.map((highlight) => (
                        <div key={highlight} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-muted-foreground">{highlight}</span>
                        </div>
                      ))}
                    </div>
                    <Button asChild variant="ghost" className="w-full group-hover:bg-primary/10">
                      <Link href={feature.link}>
                        Learn More
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30 border-y">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">10+</div>
                <div className="text-sm text-muted-foreground">Powerful Features</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Assistant</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">3</div>
                <div className="text-sm text-muted-foreground">Job Sources</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">Free to Use</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20">
          <div className="container">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-12 pb-12 text-center">
                <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                <h2 className="font-headline text-3xl font-bold mb-4">
                  Ready to Accelerate Your Career?
                </h2>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Start exploring opportunities, connect with the right people, and let our AI help you find the perfect match.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                  <Button asChild size="lg">
                    <Link href="/dashboard">
                      <UserSearch className="mr-2 h-5 w-5" />
                      Complete Profile
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <Link href="/candidates">
                      <Search className="mr-2 h-5 w-5" />
                      Browse Candidates
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <SiteFooter />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}} />
    </div>
  );
}
