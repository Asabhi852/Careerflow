'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Target, 
  BookOpen,
  Lightbulb,
  BarChart3,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Filter,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { useEnhancedAIMatches } from '@/hooks/use-enhanced-ai-matches';
import { cn } from '@/lib/utils';

interface MatchQualityConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
}

const matchQualityConfig: Record<string, MatchQualityConfig> = {
  excellent: {
    label: 'Excellent Match',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: Star,
  },
  good: {
    label: 'Good Match',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: CheckCircle2,
  },
  fair: {
    label: 'Fair Match',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: Target,
  },
  poor: {
    label: 'Low Match',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: AlertCircle,
  },
};

export default function EnhancedAIMatchesPage() {
  const [sortBy, setSortBy] = useState<'score' | 'distance'>('score');
  const [filterBy, setFilterBy] = useState<'all' | 'excellent' | 'good' | 'fair' | 'poor'>('all');

  const {
    enhancedMatches,
    isLoading,
    error,
    userProfile,
    hasProfile,
    totalMatches,
    matchingSummary,
    excellentMatches,
    goodMatches,
    fairMatches,
    poorMatches,
    averageScore,
    topSkills,
  } = useEnhancedAIMatches({
    limit: 20,
    minScore: 30,
    includeSkillGaps: true,
    includeCareerAdvice: true,
  });

  const filteredMatches = enhancedMatches.filter(match => {
    if (filterBy === 'all') return true;
    return match.matchQuality === filterBy;
  });

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    } else {
      if (a.distance === undefined && b.distance === undefined) return 0;
      if (a.distance === undefined) return 1;
      if (b.distance === undefined) return -1;
      return a.distance - b.distance;
    }
  });

  if (!hasProfile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Complete Your Profile</h3>
              <p className="text-muted-foreground mb-4">
                To get AI-powered job matches, please complete your profile with your skills, experience, and preferences.
              </p>
              <Button>Complete Profile</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI-Powered Job Matches</h1>
          <p className="text-muted-foreground">
            Advanced matching algorithm based on your profile and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <SortAsc className="h-4 w-4 mr-2" />
            Sort
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {matchingSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Total Matches</p>
                  <p className="text-2xl font-bold">{matchingSummary.totalMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Excellent</p>
                  <p className="text-2xl font-bold">{matchingSummary.excellentMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">Average Score</p>
                  <p className="text-2xl font-bold">{matchingSummary.averageScore}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm font-medium">Good Matches</p>
                  <p className="text-2xl font-bold">{matchingSummary.goodMatches}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="matches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="matches">Job Matches</TabsTrigger>
          <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="matches" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={filterBy === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterBy('all')}
            >
              All ({totalMatches})
            </Badge>
            <Badge 
              variant={filterBy === 'excellent' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterBy('excellent')}
            >
              Excellent ({excellentMatches.length})
            </Badge>
            <Badge 
              variant={filterBy === 'good' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterBy('good')}
            >
              Good ({goodMatches.length})
            </Badge>
            <Badge 
              variant={filterBy === 'fair' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterBy('fair')}
            >
              Fair ({fairMatches.length})
            </Badge>
            <Badge 
              variant={filterBy === 'poor' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterBy('poor')}
            >
              Low ({poorMatches.length})
            </Badge>
          </div>

          {/* Job Matches */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <Skeleton className="h-6 w-48" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-14" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedMatches.map((match, index) => {
                const qualityConfig = matchQualityConfig[match.matchQuality];
                const QualityIcon = qualityConfig.icon;

                return (
                  <Card key={match.jobId} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-semibold">Software Engineer</h3>
                            <Badge className={cn(qualityConfig.bgColor, qualityConfig.color)}>
                              <QualityIcon className="h-3 w-3 mr-1" />
                              {qualityConfig.label}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">Tech Corp • San Francisco, CA</p>
                          <p className="text-sm text-muted-foreground">
                            Looking for a skilled software engineer to join our team...
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{match.score}%</div>
                          <div className="text-sm text-muted-foreground">Match Score</div>
                        </div>
                      </div>

                      {/* Compatibility Factors */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <Brain className="h-4 w-4 text-blue-600 mr-1" />
                            <span className="text-sm font-medium">Skills</span>
                          </div>
                          <Progress value={match.compatibilityFactors.skills} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{match.compatibilityFactors.skills}/25</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                            <span className="text-sm font-medium">Experience</span>
                          </div>
                          <Progress value={match.compatibilityFactors.experience} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{match.compatibilityFactors.experience}/20</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <MapPin className="h-4 w-4 text-red-600 mr-1" />
                            <span className="text-sm font-medium">Location</span>
                          </div>
                          <Progress value={match.compatibilityFactors.location} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{match.compatibilityFactors.location}/15</div>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-1">
                            <DollarSign className="h-4 w-4 text-yellow-600 mr-1" />
                            <span className="text-sm font-medium">Salary</span>
                          </div>
                          <Progress value={match.compatibilityFactors.salary} className="h-2" />
                          <div className="text-xs text-muted-foreground mt-1">{match.compatibilityFactors.salary}/10</div>
                        </div>
                      </div>

                      {/* Matched Skills */}
                      {match.matchedSkills.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium mb-2">Matched Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {match.matchedSkills.slice(0, 8).map((skill, skillIndex) => (
                              <Badge key={skillIndex} variant="secondary">
                                {skill}
                              </Badge>
                            ))}
                            {match.matchedSkills.length > 8 && (
                              <Badge variant="outline">
                                +{match.matchedSkills.length - 8} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Match Reasons */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Why This Match?</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {match.reasons.slice(0, 3).map((reason, reasonIndex) => (
                            <li key={reasonIndex} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Posted 2 days ago
                          {match.distance && (
                            <>
                              <span>•</span>
                              <MapPin className="h-4 w-4" />
                              {match.distance}km away
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Job
                          </Button>
                          <Button size="sm">
                            Apply Now
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Your Top Skills
                </CardTitle>
                <CardDescription>
                  Skills that appear most frequently in your matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSkills.slice(0, 10).map((skill, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{skill.skill}</span>
                      <Badge variant="secondary">{skill.count} matches</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI-Powered Skill Development Recommendations */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      AI-Recommended Skills to Develop
                    </CardTitle>
                    <CardDescription>
                      Based on your profile analysis and {enhancedMatches.length} job matches
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span>Developing these skills can significantly improve your match scores</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {enhancedMatches.flatMap(m => m.skillGaps)
                    .filter((gap, index, self) => 
                      index === self.findIndex(g => g.skill === gap.skill)
                    )
                    .sort((a, b) => {
                      const importanceOrder = { high: 0, medium: 1, low: 2 };
                      return importanceOrder[a.importance] - importanceOrder[b.importance];
                    })
                    .slice(0, 10)
                    .map((gap, index) => (
                      <div 
                        key={index} 
                        className={`p-4 border rounded-lg space-y-2 transition-all hover:shadow-md ${
                          gap.importance === 'high' 
                            ? 'border-red-200 bg-red-50/50' 
                            : gap.importance === 'medium'
                            ? 'border-orange-200 bg-orange-50/50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">{gap.skill}</span>
                          <Badge 
                            variant={gap.importance === 'high' ? 'destructive' : 'outline'}
                            className={
                              gap.importance === 'high' 
                                ? 'bg-red-600' 
                                : gap.importance === 'medium'
                                ? 'bg-orange-500 text-white'
                                : ''
                            }
                          >
                            {gap.importance} priority
                          </Badge>
                        </div>
                        
                        {gap.learningResources && gap.learningResources.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <div className="font-medium mb-1">Learning Resources:</div>
                            <div className="flex flex-wrap gap-1">
                              {gap.learningResources.slice(0, 4).map((resource, idx) => (
                                <span 
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 bg-white border rounded hover:bg-blue-50 cursor-pointer transition-colors"
                                >
                                  {resource}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>
                AI-generated advice to improve your job search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {matchingSummary?.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-muted rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
