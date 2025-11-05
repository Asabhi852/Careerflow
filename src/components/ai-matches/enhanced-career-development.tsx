'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
// @ts-ignore - Firebase Firestore import issue
import { doc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  TrendingUp,
  Target,
  BookOpen,
  Briefcase,
  Award,
  Lightbulb,
  Star,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  DollarSign,
  MapPin
} from 'lucide-react';
import type { UserProfile } from '@/lib/types';

interface CareerFocusArea {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  actions: string[];
  resources: string[];
  timeEstimate: string;
  impact: string;
}

interface CareerInsight {
  type: 'strength' | 'opportunity' | 'warning';
  title: string;
  description: string;
  icon: any;
}

export function EnhancedCareerDevelopment() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [focusAreas, setFocusAreas] = useState<CareerFocusArea[]>([]);
  const [insights, setInsights] = useState<CareerInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasAnalyzed = useRef(false);

  const userProfileRef = firestore && user ? doc(firestore, 'users', user.uid) : null;
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const generateCareerAnalysis = useCallback(async (profile: UserProfile) => {
    setIsLoading(true);

    try {
      // Generate career focus areas based on profile
      const areas = await analyzeCareerFocusAreas(profile);
      const profileInsights = await generateCareerInsights(profile);

      setFocusAreas(areas);
      setInsights(profileInsights);
    } catch (error) {
      console.error('Error generating career analysis:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userProfile && !hasAnalyzed.current) {
      hasAnalyzed.current = true;
      generateCareerAnalysis(userProfile);
    }
  }, [userProfile, generateCareerAnalysis]);

  const analyzeCareerFocusAreas = async (profile: UserProfile): Promise<CareerFocusArea[]> => {
    const areas: CareerFocusArea[] = [];

    // Analyze skills gap
    if (profile.skills && profile.skills.length < 5) {
      areas.push({
        id: 'skill-expansion',
        title: 'Expand Technical Skills',
        description: 'Your current skill set could be broadened to increase job opportunities',
        priority: 'high',
        progress: Math.min((profile.skills.length / 8) * 100, 100),
        actions: [
          'Complete 2-3 online courses in high-demand technologies',
          'Contribute to open-source projects',
          'Obtain relevant certifications',
          'Participate in coding challenges'
        ],
        resources: ['Coursera', 'Udemy', 'freeCodeCamp', 'Codecademy'],
        timeEstimate: '3-6 months',
        impact: 'Increase job opportunities by 40-60%'
      });
    }

    // Analyze experience level
    const experienceYears = profile.workExperience?.length || 0;
    if (experienceYears < 3) {
      areas.push({
        id: 'experience-building',
        title: 'Build Professional Experience',
        description: 'Gain more hands-on experience to advance your career',
        priority: 'high',
        progress: Math.min((experienceYears / 5) * 100, 100),
        actions: [
          'Take on challenging projects at current role',
          'Seek mentorship opportunities',
          'Volunteer for cross-functional teams',
          'Pursue relevant certifications'
        ],
        resources: ['LinkedIn Learning', 'Mentorcruise', 'Local meetups', 'Professional associations'],
        timeEstimate: '6-12 months',
        impact: 'Accelerate career progression significantly'
      });
    }

    // Network building
    areas.push({
      id: 'networking',
      title: 'Expand Professional Network',
      description: 'Build meaningful connections in your industry',
      priority: 'medium',
      progress: 30, // This is hard to measure automatically
      actions: [
        'Attend industry conferences and meetups',
        'Join professional online communities',
        'Connect with alumni from your educational background',
        'Engage with industry leaders on LinkedIn'
      ],
      resources: ['LinkedIn', 'Meetup.com', 'Industry conferences', 'Professional associations'],
      timeEstimate: 'Ongoing',
      impact: 'Access to hidden job opportunities and career advice'
    });

    // Industry knowledge
    areas.push({
      id: 'industry-knowledge',
      title: 'Stay Current with Industry Trends',
      description: 'Keep up with latest developments in your field',
      priority: 'medium',
      progress: 25, // Hard to measure
      actions: [
        'Read industry publications and blogs',
        'Follow thought leaders on social media',
        'Attend webinars and online courses',
        'Participate in industry forums'
      ],
      resources: ['TechCrunch', 'Industry-specific blogs', 'Twitter', 'Reddit communities'],
      timeEstimate: 'Ongoing',
      impact: 'Stay competitive and relevant in your field'
    });

    // Career goal setting
    if (!profile.expectedSalary || profile.expectedSalary < 50000) {
      areas.push({
        id: 'career-goals',
        title: 'Define Clear Career Goals',
        description: 'Set specific, measurable career objectives',
        priority: 'high',
        progress: profile.expectedSalary ? 50 : 10,
        actions: [
          'Define 1-3 year career objectives',
          'Set salary expectations based on market research',
          'Identify target companies and roles',
          'Create a personal development plan'
        ],
        resources: ['Glassdoor salary data', 'Career counseling', 'Industry reports', 'Mentorship programs'],
        timeEstimate: '1-3 months',
        impact: 'Provide direction and motivation for career growth'
      });
    }

    return areas;
  };

  const generateCareerInsights = async (profile: UserProfile): Promise<CareerInsight[]> => {
    const insights: CareerInsight[] = [];

    // Strengths
    if (profile.skills && profile.skills.length > 3) {
      insights.push({
        type: 'strength',
        title: 'Strong Skill Foundation',
        description: `You have ${profile.skills.length} skills listed, showing good technical breadth.`,
        icon: Star
      });
    }

    if (profile.workExperience && profile.workExperience.length > 2) {
      insights.push({
        type: 'strength',
        title: 'Solid Experience Base',
        description: `${profile.workExperience.length} positions show career progression and stability.`,
        icon: Briefcase
      });
    }

    // Opportunities
    if (!profile.portfolioUrls || profile.portfolioUrls.length === 0) {
      insights.push({
        type: 'opportunity',
        title: 'Showcase Your Work',
        description: 'Add portfolio projects or GitHub repositories to demonstrate your skills.',
        icon: Target
      });
    }

    if (!profile.certificates || profile.certificates.length === 0) {
      insights.push({
        type: 'opportunity',
        title: 'Certifications Matter',
        description: 'Industry-recognized certifications can significantly boost your profile.',
        icon: Award
      });
    }

    // Warnings
    if (profile.skills && profile.skills.length < 3) {
      insights.push({
        type: 'warning',
        title: 'Limited Skill Set',
        description: 'Consider expanding your technical skills to improve job prospects.',
        icon: AlertTriangle
      });
    }

    return insights;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'strength': return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'opportunity': return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      case 'warning': return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-sm font-medium">Analyzing your career profile...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Career Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Career Insights
          </CardTitle>
          <CardDescription>
            AI-powered analysis of your career profile and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <Alert key={index} className={getInsightColor(insight.type)}>
                <insight.icon className="h-4 w-4" />
                <AlertTitle className="text-sm font-medium">{insight.title}</AlertTitle>
                <AlertDescription className="text-sm">{insight.description}</AlertDescription>
              </Alert>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Areas to Focus On
          </CardTitle>
          <CardDescription>
            Prioritized development areas to accelerate your career growth
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {focusAreas.map((area) => (
              <div key={area.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{area.title}</h3>
                      <Badge className={getPriorityColor(area.priority)}>
                        {area.priority} priority
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{area.description}</p>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{Math.round(area.progress)}%</span>
                      </div>
                      <Progress value={area.progress} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Impact */}
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Expected Impact:</span>
                  <span>{area.impact}</span>
                </div>

                {/* Time Estimate */}
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Time Estimate:</span>
                  <span>{area.timeEstimate}</span>
                </div>

                {/* Actions */}
                <div>
                  <p className="font-medium text-sm mb-2">Recommended Actions:</p>
                  <ul className="space-y-1">
                    {area.actions.map((action, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Resources */}
                <div>
                  <p className="font-medium text-sm mb-2">Learning Resources:</p>
                  <div className="flex flex-wrap gap-2">
                    {area.resources.map((resource, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {resource}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
