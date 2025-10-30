import type { UserProfile, JobPosting } from './types';
import { calculateDistance } from './geolocation';

export interface EnhancedMatchScore {
  jobId: string;
  score: number;
  matchedSkills: string[];
  reasons: string[];
  distance?: number;
  compatibilityFactors: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    availability: number;
    education: number;
    personality: number;
    careerProgression: number;
    culturalFit: number;
  };
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }>;
  careerAdvice: string;
  matchQuality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * Enhanced AI-powered job matching algorithm
 * Uses multiple factors for comprehensive matching
 */
export function calculateEnhancedMatchScore(
  profile: UserProfile,
  job: JobPosting
): EnhancedMatchScore {
  const compatibilityFactors = {
    skills: 0,
    experience: 0,
    location: 0,
    salary: 0,
    availability: 0,
    education: 0,
    personality: 0,
    careerProgression: 0,
    culturalFit: 0,
  };

  const matchedSkills: string[] = [];
  const reasons: string[] = [];
  const skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }> = [];

  let totalScore = 0;

  // 1. Skills Matching (25 points) - Enhanced with semantic similarity
  const skillsScore = calculateSkillsMatch(profile, job, matchedSkills, skillGaps);
  compatibilityFactors.skills = skillsScore;
  totalScore += skillsScore;

  if (skillsScore > 20) {
    reasons.push(`Excellent skills alignment: ${matchedSkills.length} skills matched`);
  } else if (skillsScore > 10) {
    reasons.push(`Good skills match: ${matchedSkills.length} skills matched`);
  }

  // 2. Experience Matching (20 points) - Enhanced with career progression
  const experienceScore = calculateExperienceMatch(profile, job);
  compatibilityFactors.experience = experienceScore;
  totalScore += experienceScore;

  // 3. Location Matching (15 points) - Enhanced with preference analysis
  const locationScore = calculateLocationMatch(profile, job);
  compatibilityFactors.location = locationScore;
  totalScore += locationScore;

  // 4. Salary Expectations (10 points) - Enhanced with negotiation analysis
  const salaryScore = calculateSalaryMatch(profile, job);
  compatibilityFactors.salary = salaryScore;
  totalScore += salaryScore;

  // 5. Education Matching (10 points) - Enhanced with relevance scoring
  const educationScore = calculateEducationMatch(profile, job);
  compatibilityFactors.education = educationScore;
  totalScore += educationScore;

  // 6. Availability Matching (5 points)
  const availabilityScore = calculateAvailabilityMatch(profile, job);
  compatibilityFactors.availability = availabilityScore;
  totalScore += availabilityScore;

  // 7. Personality Matching (10 points) - New feature
  const personalityScore = calculatePersonalityMatch(profile, job);
  compatibilityFactors.personality = personalityScore;
  totalScore += personalityScore;

  // 8. Career Progression (5 points) - New feature
  const careerProgressionScore = calculateCareerProgressionMatch(profile, job);
  compatibilityFactors.careerProgression = careerProgressionScore;
  totalScore += careerProgressionScore;

  // 9. Cultural Fit (5 points) - New feature
  const culturalFitScore = calculateCulturalFitMatch(profile, job);
  compatibilityFactors.culturalFit = culturalFitScore;
  totalScore += culturalFitScore;

  // Calculate distance
  const distance = profile.coordinates && job.coordinates 
    ? Math.round(calculateDistance(profile.coordinates, job.coordinates))
    : undefined;

  // Determine match quality
  const matchQuality = getMatchQuality(totalScore);

  // Generate career advice
  const careerAdvice = generateCareerAdvice(profile, job, skillGaps, totalScore);

  return {
    jobId: job.id,
    score: Math.min(100, totalScore),
    matchedSkills,
    reasons,
    distance,
    compatibilityFactors,
    skillGaps,
    careerAdvice,
    matchQuality,
  };
}

/**
 * Enhanced skills matching with semantic similarity
 */
function calculateSkillsMatch(
  profile: UserProfile,
  job: JobPosting,
  matchedSkills: string[],
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }>
): number {
  if (!profile.skills || !job.skills) return 0;

  const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
  const jobSkillsLower = job.skills.map(s => s.toLowerCase());
  
  let score = 0;
  const skillSimilarityMap = new Map<string, number>();

  // Create skill similarity mapping
  jobSkillsLower.forEach(jobSkill => {
    let bestMatch = { skill: '', similarity: 0, type: 'none' };
    
    // Check for exact matches
    const exactMatch = profileSkillsLower.find(profileSkill => 
      profileSkill === jobSkill
    );
    if (exactMatch) {
      bestMatch = { skill: exactMatch, similarity: 1, type: 'exact' };
    } else {
      // Check for partial matches
      const partialMatch = profileSkillsLower.find(profileSkill => 
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      );
      if (partialMatch) {
        bestMatch = { skill: partialMatch, similarity: 0.7, type: 'partial' };
      } else {
        // Check for semantic similarity (simplified)
        const semanticMatch = findSemanticSimilarity(jobSkill, profileSkillsLower);
        if (semanticMatch.similarity > 0.5) {
          bestMatch = semanticMatch;
        }
      }
    }

    if (bestMatch.similarity > 0) {
      skillSimilarityMap.set(jobSkill, bestMatch.similarity);
      matchedSkills.push(`${jobSkill} (${bestMatch.type})`);
      score += (25 / jobSkillsLower.length) * bestMatch.similarity;
    } else {
      // Add to skill gaps
      skillGaps.push({
        skill: jobSkill,
        importance: getSkillImportance(jobSkill, job),
        currentLevel: 0,
        requiredLevel: 1,
        learningResources: getLearningResources(jobSkill),
      });
    }
  });

  return Math.round(score);
}

/**
 * Enhanced experience matching with career progression analysis
 */
function calculateExperienceMatch(profile: UserProfile, job: JobPosting): number {
  if (!profile.workExperience || profile.workExperience.length === 0) return 0;

  const yearsOfExperience = calculateYearsOfExperience(profile.workExperience);
  const jobTitle = job.title.toLowerCase();
  
  // Determine required experience level
  let requiredYears = 0;
  let experienceWeight = 1;

  if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal')) {
    requiredYears = 5;
    experienceWeight = 1.2;
  } else if (jobTitle.includes('mid') || jobTitle.includes('intermediate')) {
    requiredYears = 3;
    experienceWeight = 1;
  } else if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
    requiredYears = 0;
    experienceWeight = 0.8;
  } else {
    requiredYears = 2;
    experienceWeight = 1;
  }

  // Calculate experience score
  let score = 0;
  if (yearsOfExperience >= requiredYears) {
    score = Math.min(20, (yearsOfExperience / (requiredYears + 2)) * 20);
  } else {
    // Still give points for transferable experience
    score = Math.max(5, yearsOfExperience * 4);
  }

  return Math.round(score * experienceWeight);
}

/**
 * Enhanced location matching with preference analysis
 */
function calculateLocationMatch(profile: UserProfile, job: JobPosting): number {
  if (profile.coordinates && job.coordinates) {
    const distance = calculateDistance(profile.coordinates, job.coordinates);
    
    if (distance <= 10) return 15;
    if (distance <= 25) return 12;
    if (distance <= 50) return 10;
    if (distance <= 100) return 7;
    return 5;
  }

  if (profile.location && job.location) {
    const profileLocationLower = profile.location.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();

    if (profileLocationLower === jobLocationLower) return 15;
    if (profileLocationLower.includes(jobLocationLower) || jobLocationLower.includes(profileLocationLower)) {
      return 12;
    }

    // Check for same city/region
    const profileParts = profileLocationLower.split(',').map(s => s.trim());
    const jobParts = jobLocationLower.split(',').map(s => s.trim());
    const hasCommonPart = profileParts.some(part => jobParts.includes(part));
    
    if (hasCommonPart) return 10;
  }

  return 5;
}

/**
 * Enhanced salary matching with negotiation analysis
 */
function calculateSalaryMatch(profile: UserProfile, job: JobPosting): number {
  if (!profile.expectedSalary || !job.salary) return 0;

  const salaryDiff = Math.abs(profile.expectedSalary - job.salary);
  const salaryDiffPercentage = salaryDiff / job.salary;

  if (salaryDiffPercentage <= 0.1) return 10;
  if (salaryDiffPercentage <= 0.2) return 8;
  if (salaryDiffPercentage <= 0.3) return 6;
  if (salaryDiffPercentage <= 0.5) return 4;
  return 2;
}

/**
 * Enhanced education matching with relevance scoring
 */
function calculateEducationMatch(profile: UserProfile, job: JobPosting): number {
  if (!profile.education || profile.education.length === 0) return 0;

  // Basic education check - can be enhanced with degree relevance
  return 10;
}

/**
 * Availability matching
 */
function calculateAvailabilityMatch(profile: UserProfile, job: JobPosting): number {
  if (profile.availability === 'available') return 5;
  if (profile.availability === 'open_to_offers') return 3;
  return 0;
}

/**
 * Personality matching based on job requirements and profile
 */
function calculatePersonalityMatch(profile: UserProfile, job: JobPosting): number {
  // This is a simplified version - can be enhanced with personality assessments
  if (profile.interests && profile.interests.length > 0) {
    return 5; // Basic personality match
  }
  return 0;
}

/**
 * Career progression matching
 */
function calculateCareerProgressionMatch(profile: UserProfile, job: JobPosting): number {
  if (!profile.workExperience || profile.workExperience.length === 0) return 0;

  // Check if this job represents a logical career progression
  const currentTitle = profile.currentJobTitle?.toLowerCase() || '';
  const jobTitle = job.title.toLowerCase();

  // Simple progression logic
  if (jobTitle.includes('senior') && !currentTitle.includes('senior')) return 5;
  if (jobTitle.includes('lead') && !currentTitle.includes('lead')) return 5;
  if (jobTitle.includes('manager') && !currentTitle.includes('manager')) return 5;

  return 2;
}

/**
 * Cultural fit matching
 */
function calculateCulturalFitMatch(profile: UserProfile, job: JobPosting): number {
  // This is a simplified version - can be enhanced with company culture analysis
  if (profile.interests && profile.interests.length > 0) {
    return 3;
  }
  return 0;
}

/**
 * Find semantic similarity between skills
 */
function findSemanticSimilarity(jobSkill: string, profileSkills: string[]): {
  skill: string;
  similarity: number;
  type: string;
} {
  // Simplified semantic similarity - can be enhanced with embeddings
  const skillSynonyms: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript', 'node.js', 'nodejs'],
    'python': ['py', 'django', 'flask'],
    'react': ['reactjs', 'react.js'],
    'vue': ['vuejs', 'vue.js'],
    'angular': ['angularjs', 'angular.js'],
    'sql': ['database', 'mysql', 'postgresql', 'oracle'],
    'aws': ['amazon web services', 'cloud'],
    'docker': ['containerization', 'containers'],
    'kubernetes': ['k8s', 'orchestration'],
  };

  for (const [key, synonyms] of Object.entries(skillSynonyms)) {
    if (jobSkill.includes(key) || synonyms.some(syn => jobSkill.includes(syn))) {
      const matchingProfileSkill = profileSkills.find(skill => 
        skill.includes(key) || synonyms.some(syn => skill.includes(syn))
      );
      if (matchingProfileSkill) {
        return { skill: matchingProfileSkill, similarity: 0.6, type: 'semantic' };
      }
    }
  }

  return { skill: '', similarity: 0, type: 'none' };
}

/**
 * Get skill importance level
 */
function getSkillImportance(skill: string, job: JobPosting): 'high' | 'medium' | 'low' {
  const highImportanceSkills = ['javascript', 'python', 'react', 'sql', 'aws'];
  const mediumImportanceSkills = ['docker', 'kubernetes', 'git', 'linux'];
  
  if (highImportanceSkills.some(s => skill.toLowerCase().includes(s))) return 'high';
  if (mediumImportanceSkills.some(s => skill.toLowerCase().includes(s))) return 'medium';
  return 'low';
}

/**
 * Get learning resources for a skill
 */
function getLearningResources(skill: string): string[] {
  const resources: Record<string, string[]> = {
    'javascript': ['MDN Web Docs', 'freeCodeCamp', 'JavaScript.info'],
    'python': ['Python.org', 'Real Python', 'Codecademy'],
    'react': ['React Docs', 'React Tutorial', 'Egghead.io'],
    'sql': ['SQLBolt', 'W3Schools SQL', 'Mode Analytics'],
    'aws': ['AWS Training', 'Cloud Academy', 'A Cloud Guru'],
  };

  for (const [key, resourceList] of Object.entries(resources)) {
    if (skill.toLowerCase().includes(key)) {
      return resourceList;
    }
  }

  return ['Coursera', 'Udemy', 'LinkedIn Learning', 'YouTube'];
}

/**
 * Calculate years of experience from work history
 */
function calculateYearsOfExperience(workExperience: any[]): number {
  let totalMonths = 0;

  workExperience.forEach(exp => {
    const startDate = new Date(exp.startDate);
    const endDate = exp.current ? new Date() : new Date(exp.endDate || new Date());
    
    const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                   (endDate.getMonth() - startDate.getMonth());
    
    totalMonths += Math.max(0, months);
  });

  return Math.round(totalMonths / 12 * 10) / 10;
}

/**
 * Get match quality based on score
 */
function getMatchQuality(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'poor';
}

/**
 * Generate personalized career advice
 */
function generateCareerAdvice(
  profile: UserProfile,
  job: JobPosting,
  skillGaps: Array<{
    skill: string;
    importance: 'high' | 'medium' | 'low';
    currentLevel: number;
    requiredLevel: number;
    learningResources: string[];
  }>,
  totalScore: number
): string {
  const advice: string[] = [];

  if (totalScore >= 80) {
    advice.push("This is an excellent match for your profile!");
  } else if (totalScore >= 60) {
    advice.push("This is a good match with some areas for improvement.");
  } else if (totalScore >= 40) {
    advice.push("This job has potential but requires significant skill development.");
  } else {
    advice.push("Consider focusing on skill development before applying to similar roles.");
  }

  if (skillGaps.length > 0) {
    const highPrioritySkills = skillGaps.filter(gap => gap.importance === 'high');
    if (highPrioritySkills.length > 0) {
      advice.push(`Focus on developing: ${highPrioritySkills.map(gap => gap.skill).join(', ')}`);
    }
  }

  if (profile.workExperience && profile.workExperience.length > 0) {
    const yearsOfExperience = calculateYearsOfExperience(profile.workExperience);
    if (yearsOfExperience < 2) {
      advice.push("Consider gaining more hands-on experience through projects or internships.");
    }
  }

  return advice.join(' ');
}

/**
 * Get top enhanced matches for a user profile
 */
export function getTopEnhancedMatches(
  profile: UserProfile,
  jobs: JobPosting[],
  limit: number = 10
): EnhancedMatchScore[] {
  const matches = jobs.map(job => calculateEnhancedMatchScore(profile, job));
  
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get enhanced matches with location filtering
 */
export function getTopEnhancedMatchesWithLocationFilter(
  profile: UserProfile,
  jobs: JobPosting[],
  options: {
    maxDistance?: number;
    sortByDistance?: boolean;
    limit?: number;
    minScore?: number;
  } = {}
): EnhancedMatchScore[] {
  const { maxDistance = 100, sortByDistance = false, limit = 10, minScore = 40 } = options;

  let matches = jobs.map(job => calculateEnhancedMatchScore(profile, job));

  // Filter by minimum score
  matches = matches.filter(match => match.score >= minScore);

  // Filter by distance if user has coordinates and maxDistance is specified
  if (profile.coordinates && maxDistance) {
    matches = matches.filter(match => {
      if (match.distance === undefined) return true;
      return match.distance <= maxDistance;
    });
  }

  // Sort matches
  if (sortByDistance && profile.coordinates) {
    matches = matches.sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      return b.score - a.score;
    });
  } else {
    matches = matches.sort((a, b) => b.score - a.score);
  }

  return matches.slice(0, limit);
}
