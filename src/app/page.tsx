'use client';

import { SiteHeader } from '@/components/layout/site-header';
import { HeroSection } from '@/components/landing/hero-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { SiteFooter } from '@/components/layout/site-footer';
import { StatsSection } from '@/components/landing/stats-section';
import { CTASection } from '@/components/landing/cta-section';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <TestimonialsSection />
        <StatsSection />
        <CTASection />
      </main>
      <SiteFooter />
    </div>
  );
}
