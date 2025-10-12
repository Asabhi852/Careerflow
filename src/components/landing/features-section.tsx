import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Lucide icons import issue
import { BrainCircuit, MessageSquare, UserSearch, Upload, Briefcase, Search, FileText, Mic } from 'lucide-react';

const features = [
  {
    icon: <BrainCircuit className="h-8 w-8 text-primary" />,
    title: 'AI-Powered Matching',
    description: 'Our advanced AI analyzes your profile to suggest jobs that truly fit your skills and career goals.',
  },
  {
    icon: <UserSearch className="h-8 w-8 text-primary" />,
    title: 'Standout Profiles',
    description: 'Create a rich, detailed profile that showcases your experience, projects, and personality to recruiters.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Direct Messaging',
    description: 'Connect directly with recruiters and hiring managers through our seamless, integrated chat platform.',
  },
  {
    icon: <Search className="h-8 w-8 text-primary" />,
    title: 'Smart Job Search',
    description: 'Find opportunities that match your skills, location, and preferences with powerful search filters.',
  },
  {
    icon: <Briefcase className="h-8 w-8 text-primary" />,
    title: 'Top Companies',
    description: 'Access job postings from leading companies across various industries and career levels.',
  },
  {
    icon: <Mic className="h-8 w-8 text-primary" />,
    title: '24/7 AI Career Assistant',
    description: 'Get instant career advice with our multilingual voice-enabled chatbot, available anytime you need help.',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-20 sm:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to land your next role.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From smart job discovery to direct communication, we've built the tools for your success.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <CardTitle className="font-headline">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
