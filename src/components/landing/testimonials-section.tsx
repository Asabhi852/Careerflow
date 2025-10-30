'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
// @ts-ignore - Lucide icons import issue
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    id: 'avatar1',
    name: 'Sarah Johnson',
    title: 'Senior Software Engineer',
    company: 'Tech Corp',
    quote: "CareerFlow's AI matching was spot on. It found me a role I wouldn't have discovered on my own. The entire process was seamless!",
    rating: 5,
  },
  {
    id: 'avatar2',
    name: 'Michael Chen',
    title: 'Product Manager',
    company: 'Digital Solutions',
    quote: 'The ability to directly message recruiters made all the difference. I got feedback faster and landed my dream job in weeks.',
    rating: 5,
  },
  {
    id: 'avatar3',
    name: 'Emily Rodriguez',
    title: 'UX Designer',
    company: 'Creative Studio',
    quote: 'I loved creating my profile. It felt like I could really show off my portfolio and personality, not just a list of skills.',
    rating: 5,
  },
  {
    id: 'avatar1',
    name: 'Rajesh Kumar',
    title: 'Data Scientist',
    company: 'Analytics Inc',
    quote: 'Found my dream job through LinkedIn integration. The platform made it so easy to apply and track my applications.',
    rating: 5,
  },
  {
    id: 'avatar2',
    name: 'Priya Sharma',
    title: 'Marketing Manager',
    company: 'Brand Agency',
    quote: 'The AI career assistant helped me optimize my profile. Got 3x more interview calls after the suggestions!',
    rating: 5,
  },
  {
    id: 'avatar3',
    name: 'David Lee',
    title: 'Full Stack Developer',
    company: 'Startup Hub',
    quote: 'Best job platform I\'ve used. The multi-source job aggregation saved me hours of searching across different sites.',
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-background py-20 sm:py-32 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Star className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">Success Stories</span>
          </div>
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Professionals Worldwide
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands who have found their dream jobs through CareerFlow
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => {
            const image = PlaceHolderImages.find((img) => img.id === testimonial.id);
            return (
              <Card 
                key={`${testimonial.name}-${index}`}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group"
                style={{
                  animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                }}
              >
                <div className="absolute top-4 right-4 text-primary/20 group-hover:text-primary/40 transition-colors">
                  <Quote className="h-12 w-12" />
                </div>
                
                <CardContent className="pt-6 relative z-10">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <p className="text-muted-foreground italic leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>
                  
                  {/* Author */}
                  <div className="flex items-center gap-4 pt-4 border-t border-border">
                    <Avatar className="h-12 w-12">
                      {image && (
                        <AvatarImage src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
