// @ts-ignore - Firebase Firestore import issue
import { Timestamp } from "firebase/firestore";

export type JobPosting = {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: number;
  skills?: string[];
  posterId: string;
  category?: string;
};

export type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    location?: string;
    skills?: string[];
    education?: string[];
    resumeUrl?: string;
    profilePictureUrl?: string;
    interests?: string[];
    age?: number;
    videoDemoUrl?: string;
    savedJobIds?: string[];
    // Enhanced fields
    bio?: string;
    phoneNumber?: string;
    currentJobTitle?: string;
    currentCompany?: string;
    workExperience?: WorkExperience[];
    certificates?: Certificate[];
    videoUrls?: string[]; // Multiple video demos
    portfolioUrls?: string[];
    languages?: string[];
    availability?: 'available' | 'not_available' | 'open_to_offers';
    expectedSalary?: number;
    userType?: 'job_seeker' | 'recruiter';
    companyName?: string; // For recruiters
    companySize?: string;
    industry?: string;
    hiringRole?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type WorkExperience = {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current?: boolean;
};

export type Certificate = {
    id: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    certificateUrl?: string;
    credentialId?: string;
};

export type Application = {
  id: string;
  jobPostingId: string;
  applicantId: string;
  jobTitle: string;
  company: string;
  applicationDate: Timestamp;
  status: 'submitted' | 'reviewed' | 'interviewing' | 'offered' | 'rejected';
}

export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Timestamp | any; // Allow for serverTimestamp
};

export type Notification = {
    id: string;
    userId: string;
    message: string;
    timestamp: Timestamp | any; // Allow for serverTimestamp
    type: 'profile_view' | 'new_message' | 'application_update';
    isRead: boolean;
};
