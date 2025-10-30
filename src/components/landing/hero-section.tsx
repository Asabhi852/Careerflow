'use client';

// @ts-ignore - React hooks import issue
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
// @ts-ignore - Lucide icons import issue
import { ArrowRight, Sparkles, Briefcase, TrendingUp, Zap, Users, CheckCircle, Star } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '../ui/badge';
import { Card } from '../ui/card';

const jobTitles = [
  'Software Engineer',
  'Product Manager',
  'Data Scientist',
  'UX Designer',
  'Marketing Manager',
  'DevOps Engineer',
  'Full Stack Developer',
  'Business Analyst'
];

const stats = [
  { value: '10K+', label: 'Active Jobs', icon: Briefcase },
  { value: '5K+', label: 'Companies', icon: Users },
  { value: '95%', label: 'Success Rate', icon: TrendingUp },
  { value: '4.9/5', label: 'User Rating', icon: Star },
];

const floatingElements = [
  { icon: Briefcase, delay: 0, duration: 3 },
  { icon: TrendingUp, delay: 0.5, duration: 4 },
  { icon: Zap, delay: 1, duration: 3.5 },
  { icon: Users, delay: 1.5, duration: 4.5 },
  { icon: CheckCircle, delay: 2, duration: 3 },
  { icon: Star, delay: 2.5, duration: 4 },
];

export function HeroSection() {
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Mouse tracking for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Typing animation effect
  useEffect(() => {
    const currentTitle = jobTitles[currentTitleIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayedText.length < currentTitle.length) {
          setDisplayedText(currentTitle.slice(0, displayedText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2000);
        }
      } else {
        if (displayedText.length > 0) {
          setDisplayedText(displayedText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentTitleIndex((prev) => (prev + 1) % jobTitles.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting, currentTitleIndex]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingElements.map((element, index) => {
          const Icon = element.icon;
          return (
            <div
              key={index}
              className="absolute opacity-10"
              style={{
                left: `${(index * 17) % 100}%`,
                top: `${(index * 23) % 100}%`,
                animation: `float ${element.duration}s ease-in-out infinite`,
                animationDelay: `${element.delay}s`,
              }}
            >
              <Icon className="h-12 w-12 text-primary" />
            </div>
          );
        })}
      </div>

      <div className="container relative pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-40">
        {/* Main content */}
        <div 
          className="relative z-10 max-w-4xl mx-auto text-center"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          {/* Badge */}
          {/* @ts-ignore - Badge children prop */}
          <Badge variant="secondary" className="mb-6 animate-bounce">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Job Matching • LinkedIn • Naukri
          </Badge>
          
          {/* Main heading with typing effect */}
          <h1 className="font-headline text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl mb-6">
            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Land Your Dream Role as a
            </span>
            <br />
            <span className="relative inline-block mt-2">
              <span className="text-primary bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {displayedText}
                <span className="animate-pulse">|</span>
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"></span>
            </span>
          </h1>
          
          {/* Description */}
          <p className="mt-8 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
            Discover opportunities from <span className="font-semibold text-primary">LinkedIn</span>, 
            <span className="font-semibold text-primary"> Naukri.com</span>, and top companies. 
            Our AI matches you with roles that fit your skills, experience, and career goals.
          </p>
          
          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="w-full sm:w-auto group shadow-lg hover:shadow-xl transition-all">
              <Link href="/signup">
                <Zap className="mr-2 h-5 w-5" />
                Get Started Free 
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full sm:w-auto border-2">
              <Link href="/login">
                <Briefcase className="mr-2 h-5 w-5" />
                Sign In
              </Link>
            </Button>
          </div>

          {/* Stats cards - Display only */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card 
                  key={index} 
                  className="p-4 border-2"
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon className="h-6 w-6 text-primary" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium">Live Job Updates</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="font-medium">AI-Powered Matching</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 bg-purple-500 rounded-full animate-pulse"></div>
              <span className="font-medium">100% Free</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-medium">Verified Companies</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS for floating animation */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(5deg);
            }
          }
        `
      }} />
    </section>
  );
}
