import type { UserProfile, JobPosting } from './types';

export interface MatchScore {
  jobId: string;
  score: number;
  matchedSkills: string[];
  reasons: string[];
}

/**
 * Calculate match score between a user profile and a job posting
 * Score ranges from 0-100
 */
export function calculateMatchScore(
  profile: UserProfile,
  job: JobPosting
): MatchScore {
  let score = 0;
  const matchedSkills: string[] = [];
  const reasons: string[] = [];

  // Skills matching (40 points max)
  if (profile.skills && job.skills) {
    const profileSkillsLower = profile.skills.map(s => s.toLowerCase());
    const jobSkillsLower = job.skills.map(s => s.toLowerCase());
    
    jobSkillsLower.forEach(jobSkill => {
      const matched = profileSkillsLower.find(profileSkill => 
        profileSkill.includes(jobSkill) || jobSkill.includes(profileSkill)
      );
      if (matched) {
        matchedSkills.push(jobSkill);
      }
    });

    const skillMatchPercentage = matchedSkills.length / jobSkillsLower.length;
    const skillScore = Math.round(skillMatchPercentage * 40);
    score += skillScore;

    if (skillScore > 20) {
      reasons.push(`Strong skill match: ${matchedSkills.length}/${jobSkillsLower.length} skills matched`);
    }
  }

  // Location matching (15 points max)
  if (profile.location && job.location) {
    const profileLocationLower = profile.location.toLowerCase();
    const jobLocationLower = job.location.toLowerCase();
    
    if (profileLocationLower === jobLocationLower) {
      score += 15;
      reasons.push('Perfect location match');
    } else if (
      profileLocationLower.includes(jobLocationLower) ||
      jobLocationLower.includes(profileLocationLower)
    ) {
      score += 10;
      reasons.push('Similar location');
    } else {
      // Check for same state/country
      const profileParts = profileLocationLower.split(',').map(s => s.trim());
      const jobParts = jobLocationLower.split(',').map(s => s.trim());
      const hasCommonPart = profileParts.some(part => jobParts.includes(part));
      if (hasCommonPart) {
        score += 5;
        reasons.push('Same region');
      }
    }
  }

  // Experience matching (20 points max)
  if (profile.workExperience && profile.workExperience.length > 0) {
    const yearsOfExperience = calculateYearsOfExperience(profile.workExperience);
    
    // Assume job requires certain experience based on title
    const jobTitle = job.title.toLowerCase();
    let requiredYears = 0;
    
    if (jobTitle.includes('senior') || jobTitle.includes('lead')) {
      requiredYears = 5;
    } else if (jobTitle.includes('mid') || jobTitle.includes('intermediate')) {
      requiredYears = 2;
    } else if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
      requiredYears = 0;
    } else {
      requiredYears = 2; // Default
    }

    if (yearsOfExperience >= requiredYears) {
      const experienceScore = Math.min(20, Math.round((yearsOfExperience / (requiredYears + 3)) * 20));
      score += experienceScore;
      if (experienceScore > 10) {
        reasons.push(`${yearsOfExperience} years of experience`);
      }
    }
  }

  // Education matching (10 points max)
  if (profile.education && profile.education.length > 0) {
    score += 10;
    reasons.push('Has relevant education');
  }

  // Salary expectations (10 points max)
  if (profile.expectedSalary && job.salary) {
    const salaryDiff = Math.abs(profile.expectedSalary - job.salary);
    const salaryDiffPercentage = salaryDiff / job.salary;
    
    if (salaryDiffPercentage <= 0.1) {
      score += 10;
      reasons.push('Salary expectations align perfectly');
    } else if (salaryDiffPercentage <= 0.2) {
      score += 7;
      reasons.push('Salary expectations are close');
    } else if (salaryDiffPercentage <= 0.3) {
      score += 4;
    }
  }

  // Availability bonus (5 points)
  if (profile.availability === 'available') {
    score += 5;
    reasons.push('Currently available');
  } else if (profile.availability === 'open_to_offers') {
    score += 3;
  }

  return {
    jobId: job.id,
    score: Math.min(100, score),
    matchedSkills,
    reasons,
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
