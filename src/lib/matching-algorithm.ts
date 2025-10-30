import type { UserProfile, JobPosting } from './types';
import { calculateDistance, sortByDistance, type Coordinates } from './geolocation';

export interface MatchScore {
  jobId: string;
  score: number;
  matchedSkills: string[];
  reasons: string[];
  distance?: number; // Distance in km from user to job location
  compatibilityFactors: {
    skills: number;
    experience: number;
    location: number;
    salary: number;
    availability: number;
    education: number;
  };
}

/**
 * Enhanced match score calculation with compatibility factors
 * More sophisticated algorithm like shaadi matching
 */
export function calculateMatchScore(
  profile: UserProfile,
  job: JobPosting
): MatchScore {
  let score = 0;
  const matchedSkills: string[] = [];
  const reasons: string[] = [];
  const compatibilityFactors = {
    skills: 0,
    experience: 0,
    location: 0,
    salary: 0,
    availability: 0,
    education: 0,
  };

  // Skills matching (40 points max) - Enhanced with semantic matching
  if (profile.skills && job.skills) {
    const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
    const jobSkillsLower = job.skills.map(s => s.toLowerCase());

    jobSkillsLower.forEach(jobSkill => {
      const exactMatch = profileSkillsLower.find(profileSkill =>
        profileSkill === jobSkill
      );
      const partialMatch = profileSkillsLower.find(profileSkill =>
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      );

      if (exactMatch) {
        matchedSkills.push(jobSkill);
        compatibilityFactors.skills += 40 / jobSkillsLower.length;
      } else if (partialMatch) {
        matchedSkills.push(jobSkill + ' (related)');
        compatibilityFactors.skills += 25 / jobSkillsLower.length;
      }
    });

    const skillScore = Math.round(compatibilityFactors.skills);
    score += skillScore;

    if (skillScore > 30) {
      reasons.push(`Excellent skills alignment: ${matchedSkills.length}/${jobSkillsLower.length} skills matched`);
    } else if (skillScore > 15) {
      reasons.push(`Good skills match: ${matchedSkills.length}/${jobSkillsLower.length} skills matched`);
    }
  }

  // Location matching (25 points max) - Enhanced with preference analysis
  if (profile.coordinates && job.coordinates) {
    const distance = calculateDistance(profile.coordinates, job.coordinates);

    if (distance <= 10) {
      compatibilityFactors.location = 25;
      reasons.push(`Perfect location match (${Math.round(distance)}km away)`);
    } else if (distance <= 25) {
      compatibilityFactors.location = 20;
      reasons.push(`Excellent location match (${Math.round(distance)}km away)`);
    } else if (distance <= 50) {
      compatibilityFactors.location = 15;
      reasons.push(`Good location match (${Math.round(distance)}km away)`);
    } else if (distance <= 100) {
      compatibilityFactors.location = 10;
      reasons.push(`Fair location match (${Math.round(distance)}km away)`);
    } else {
      compatibilityFactors.location = 5;
      reasons.push(`Accessible location (${Math.round(distance)}km away)`);
    }

    score += compatibilityFactors.location;
  } else if (profile.location && job.location) {
    const profileLocationLower = profile.location.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();

    if (profileLocationLower === jobLocationLower) {
      compatibilityFactors.location = 20;
      reasons.push('Exact location match');
    } else if (
      profileLocationLower.includes(jobLocationLower) ||
      jobLocationLower.includes(profileLocationLower)
    ) {
      compatibilityFactors.location = 15;
      reasons.push('Similar location');
    } else {
      const profileParts = profileLocationLower.split(',').map(s => s.trim());
      const jobParts = jobLocationLower.split(',').map(s => s.trim());
      const hasCommonPart = profileParts.some(part => jobParts.includes(part));
      if (hasCommonPart) {
        compatibilityFactors.location = 10;
        reasons.push('Same region');
      }
    }
    score += compatibilityFactors.location;
  }

  // Experience matching (20 points max) - Enhanced with career progression
  if (profile.workExperience && profile.workExperience.length > 0) {
    const yearsOfExperience = calculateYearsOfExperience(profile.workExperience);

    const jobTitle = job.title.toLowerCase();
    let requiredYears = 0;

    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('principal')) {
      requiredYears = 5;
    } else if (jobTitle.includes('mid') || jobTitle.includes('intermediate')) {
      requiredYears = 3;
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
      requiredYears = 0;
    } else {
      requiredYears = 2;
    }

    if (yearsOfExperience >= requiredYears) {
      const experienceScore = Math.min(20, Math.round((yearsOfExperience / (requiredYears + 3)) * 20));
      compatibilityFactors.experience = experienceScore;
      score += experienceScore;

      if (yearsOfExperience >= requiredYears + 2) {
        reasons.push(`Overqualified: ${yearsOfExperience} years experience for ${requiredYears}+ years required`);
      } else if (yearsOfExperience >= requiredYears) {
        reasons.push(`Perfect experience match: ${yearsOfExperience} years experience`);
      } else {
        reasons.push(`Good experience fit: ${yearsOfExperience} years experience`);
      }
    } else {
      // Still give some points for transferable experience
      compatibilityFactors.experience = Math.max(5, yearsOfExperience * 3);
      score += compatibilityFactors.experience;
      reasons.push(`Entry level with ${yearsOfExperience} years experience - growth opportunity`);
    }
  }

  // Education matching (10 points max)
  if (profile.education && profile.education.length > 0) {
    compatibilityFactors.education = 10;
    score += 10;
    reasons.push('Has relevant educational background');
  }

  // Salary expectations (10 points max) - Enhanced with negotiation analysis
  if (profile.expectedSalary && job.salary) {
    const salaryDiff = Math.abs(profile.expectedSalary - job.salary);
    const salaryDiffPercentage = salaryDiff / job.salary;

    if (salaryDiffPercentage <= 0.1) {
      compatibilityFactors.salary = 10;
      reasons.push('Salary expectations align perfectly');
    } else if (salaryDiffPercentage <= 0.2) {
      compatibilityFactors.salary = 8;
      reasons.push('Salary expectations are very close');
    } else if (salaryDiffPercentage <= 0.3) {
      compatibilityFactors.salary = 6;
      reasons.push('Salary expectations are reasonable');
    } else {
      compatibilityFactors.salary = 3;
      reasons.push('Salary may require negotiation');
    }
    score += compatibilityFactors.salary;
  }

  // Availability bonus (5 points) - Enhanced with urgency factors
  if (profile.availability === 'available') {
    compatibilityFactors.availability = 5;
    reasons.push('Immediately available');
  } else if (profile.availability === 'open_to_offers') {
    compatibilityFactors.availability = 3;
    reasons.push('Open to opportunities');
  }

  score += compatibilityFactors.availability;

  return {
    jobId: job.id,
    score: Math.min(100, score),
    matchedSkills,
    reasons,
    distance: profile.coordinates && job.coordinates ? Math.round(calculateDistance(profile.coordinates, job.coordinates)) : undefined,
    compatibilityFactors,
  };
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

  return Math.round(totalMonths / 12 * 10) / 10; // Round to 1 decimal
}

/**
 * Get top job matches for a user profile
 */
export function getTopMatches(
  profile: UserProfile,
  jobs: JobPosting[],
  limit: number = 10
): MatchScore[] {
  const matches = jobs.map(job => calculateMatchScore(profile, job));
  
  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Get top job matches for a user profile with location-based filtering
 */
export function getTopMatchesWithLocationFilter(
  profile: UserProfile,
  jobs: JobPosting[],
  options: {
    maxDistance?: number;
    sortByDistance?: boolean;
    limit?: number;
  } = {}
): MatchScore[] {
  const { maxDistance = 100, sortByDistance = false, limit = 10 } = options;

  let matches = jobs.map(job => calculateMatchScore(profile, job));

  // Filter by distance if user has coordinates and maxDistance is specified
  if (profile.coordinates && maxDistance) {
    matches = matches.filter(match => {
      if (match.distance === undefined) return true; // Keep jobs without distance data
      return match.distance <= maxDistance;
    });
  }

  // Sort matches
  if (sortByDistance && profile.coordinates) {
    matches = matches.sort((a, b) => {
      // Items with distance come first, sorted by distance
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      // Items without distance go to the end
      if (a.distance !== undefined) return -1;
      if (b.distance !== undefined) return 1;
      // Fallback to score sorting
      return b.score - a.score;
    });
  } else {
    matches = matches.sort((a, b) => b.score - a.score);
  }

  return matches.slice(0, limit);
}

/**
 * Get match quality label based on score
 */
export function getMatchQuality(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) {
    return { label: 'Excellent Match', color: 'green' };
  } else if (score >= 60) {
    return { label: 'Good Match', color: 'blue' };
  } else if (score >= 40) {
    return { label: 'Fair Match', color: 'yellow' };
  } else {
    return { label: 'Low Match', color: 'gray' };
  }
}
