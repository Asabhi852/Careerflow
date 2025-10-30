'use client';

// @ts-ignore - React hooks import issue
import { useState, useEffect } from 'react';
// @ts-ignore - Lucide icons import issue
import { Briefcase, Users, Building2, TrendingUp } from 'lucide-react';

interface Stat {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
}

const stats: Stat[] = [
  {
    icon: <Briefcase className="h-8 w-8" />,
    value: 1250,
    label: 'Active Jobs',
    suffix: '+'
  },
  {
    icon: <Building2 className="h-8 w-8" />,
    value: 350,
    label: 'Companies',
    suffix: '+'
  },
  {
    icon: <Users className="h-8 w-8" />,
    value: 5000,
    label: 'Job Seekers',
    suffix: '+'
  },
  {
    icon: <TrendingUp className="h-8 w-8" />,
    value: 92,
    label: 'Success Rate',
    suffix: '%'
  }
];

function AnimatedCounter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="text-4xl sm:text-5xl font-bold text-primary">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="py-16 sm:py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Trusted by Thousands
          </h2>
          <p className="text-lg text-muted-foreground">
            Join the fastest-growing career platform
          </p>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="flex flex-col items-center text-center p-6 rounded-lg bg-background/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}
            >
              <div className="mb-4 text-primary">
                {stat.icon}
              </div>
              <AnimatedCounter 
                target={stat.value} 
                suffix={stat.suffix} 
                prefix={stat.prefix}
              />
              <p className="mt-2 text-sm text-muted-foreground font-medium">
                {stat.label}
              </p>
            </div>
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
