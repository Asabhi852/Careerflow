import Image from 'next/image';
import { Button } from '@/components/ui/button';
// @ts-ignore - Lucide icons import issue
import { ArrowRight } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';
import { Badge } from '../ui/badge';

export function HeroSection() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <section className="relative overflow-hidden">
      <div className="container relative pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pt-40 lg:pb-48">
        <div className="relative z-10 max-w-2xl text-center mx-auto">
          {/* @ts-ignore - Badge children prop */}
          <Badge variant="secondary" className="mb-4">
            New: AI-Powered Matching
          </Badge>
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Find Your Dream Job,
            <span className="text-primary"> Faster.</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            CareerFlow Connect uses intelligent matching to connect you with top companies and opportunities tailored to your skills and ambitions.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/jobs">
                Explore Jobs <span aria-hidden="true">→</span>
              </Link>
            </Button>
          </div>
        </div>
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            className="object-cover z-0"
            aria-hidden="true"
            priority
          />
        )}
        <div className="absolute inset-0 bg-background/70 z-0 backdrop-blur-sm"></div>
         <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-0"></div>
      </div>
    </section>
  );
}
