'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
// @ts-ignore - Lucide icons import issue
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

const benefits = [
  'Access to 1000+ jobs from LinkedIn & Naukri',
  'AI-powered job matching',
  'Direct messaging with recruiters',
  'Profile optimization tools',
  '24/7 AI career assistant',
  'No credit card required'
];

export function CTASection() {
  return (
    <section className="py-20 sm:py-32 bg-gradient-to-br from-primary/10 via-background to-primary/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">Start Your Career Journey Today</span>
            </div>
            
            <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-5xl mb-6">
              Ready to Find Your Dream Job?
            </h2>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Join thousands of job seekers who have found their perfect role through CareerFlow. 
              Get started in less than 2 minutes.
            </p>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10 text-left">
              {benefits.map((benefit, index) => (
                <div 
                  key={benefit}
                  className="flex items-start gap-3 p-4 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300"
                  style={{
                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                  }}
                >
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons - Only functional buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" asChild className="w-full sm:w-auto group text-lg px-8">
                <Link href="/signup">
                  Create Free Account
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="w-full sm:w-auto text-lg px-8">
                <Link href="/login">
                  Sign In
                </Link>
              </Button>
            </div>

            {/* Trust badge */}
            <p className="mt-8 text-sm text-muted-foreground">
              🔒 Your data is secure. We never share your information.
            </p>
          </div>
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
