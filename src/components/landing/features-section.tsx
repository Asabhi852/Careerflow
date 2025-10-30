'use client';

// @ts-ignore - React hooks import issue
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// @ts-ignore - Lucide icons import issue
import { BrainCircuit, MessageSquare, UserSearch, Briefcase, Search, Mic, Globe, Zap } from 'lucide-react';

const features = [
  {
    icon: <BrainCircuit className="h-8 w-8" />,
    title: 'AI-Powered Matching',
    description: 'Our advanced AI analyzes your profile to suggest jobs that truly fit your skills and career goals.',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20'
  },
  {
    icon: <Globe className="h-8 w-8" />,
    title: 'Multi-Source Jobs',
    description: 'Access jobs from LinkedIn, Naukri.com, and top companies all in one unified platform.',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10 hover:bg-green-500/20'
  },
  {
    icon: <UserSearch className="h-8 w-8" />,
    title: 'Standout Profiles',
    description: 'Create a rich, detailed profile that showcases your experience, projects, and personality to recruiters.',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20'
  },
  {
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'Direct Messaging',
    description: 'Connect directly with recruiters and hiring managers through our seamless, integrated chat platform.',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 hover:bg-pink-500/20'
  },
  {
    icon: <Search className="h-8 w-8" />,
    title: 'Smart Job Search',
    description: 'Find opportunities that match your skills, location, and preferences with powerful search filters.',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10 hover:bg-orange-500/20'
  },
  {
    icon: <Mic className="h-8 w-8" />,
    title: '24/7 AI Career Assistant',
    description: 'Get instant career advice with our multilingual voice-enabled chatbot, available anytime you need help.',
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10 hover:bg-cyan-500/20'
  },
];

export function FeaturesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Zap className="h-4 w-4" />
            <span className="text-sm font-medium">Powerful Features</span>
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Everything you need to land your next role
          </h2>
          <p className="text-lg text-muted-foreground">
            From smart job discovery to direct communication, we've built the tools for your success
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className={`text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer border-2 ${
                hoveredIndex === index ? 'border-primary' : 'border-transparent'
              }`}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <CardHeader>
                <div className={`flex justify-center mb-4 p-4 rounded-full ${feature.bgColor} transition-all duration-300 mx-auto w-fit`}>
                  <div className={feature.color}>
                    {feature.icon}
                  </div>
                </div>
                <CardTitle className="font-headline text-xl">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

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
    </section>
  );
}
