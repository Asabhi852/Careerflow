import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const testimonials = [
  {
    id: 'avatar1',
    name: 'Sarah Johnson',
    title: 'Senior Software Engineer',
    quote: "CareerFlow Connect's AI matching was spot on. It found me a role I wouldn't have discovered on my own. The entire process was seamless!",
  },
  {
    id: 'avatar2',
    name: 'Michael Chen',
    title: 'Product Manager',
    quote: 'The ability to directly message recruiters made all the difference. I got feedback faster and landed my dream job in weeks.',
  },
  {
    id: 'avatar3',
    name: 'Emily Rodriguez',
    title: 'UX Designer',
    quote: 'I loved creating my profile. It felt like I could really show off my portfolio and personality, not just a list of skills.',
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-muted/50 py-20 sm:py-32">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
            Trusted by Professionals Worldwide
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Hear what others have to say about their success with CareerFlow Connect.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
          {testimonials.map((testimonial) => {
            const image = PlaceHolderImages.find((img) => img.id === testimonial.id);
            return (
              <Card key={testimonial.name}>
                <CardContent className="pt-6">
                  <p className="text-muted-foreground">"{testimonial.quote}"</p>
                  <div className="mt-6 flex items-center gap-4">
                    <Avatar>
                      {image && (
                         <AvatarImage src={image.imageUrl} alt={image.description} data-ai-hint={image.imageHint} />
                      )}
                      <AvatarFallback>{testimonial.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
