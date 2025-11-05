// @ts-ignore - Firebase Firestore import issue
import { Timestamp } from "firebase/firestore";

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type JobPosting = {
  id: string;
  title: string;
  description: string;
  company: string; // Kept for backward compatibility
  
  // Organization Details
  organizationType?: 'company' | 'startup' | 'school' | 'college' | 'nonprofit' | 'government' | 'healthcare' | 'other';
  organizationName?: string;
  organizationDescription?: string;
  organizationWebsite?: string;
  organizationEmail?: string;
  organizationPhone?: string;
  organizationAddress?: string;
  industry?: string;
  organizationSize?: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1000+';
  foundedYear?: number;
  
  // For Schools/Colleges
  accreditation?: string;
  programsOffered?: string;
  
  // Job Details
  location: string;
  coordinates?: Coordinates; // Geographic coordinates for location-based search
  salary?: number;
  skills?: string[];
  posterId: string;
  category?: string;
  source?: 'internal' | 'linkedin' | 'naukri' | 'external';
  externalUrl?: string;
  applicationUrl?: string; // Direct URL to apply on company website
  postedDate?: string;
  postedAt?: string;
  employmentType?: string;
  experienceLevel?: string;
  benefits?: string[];
  companyLogo?: string;
  distance?: number; // Calculated distance from user (in km)
  status?: 'active' | 'closed' | 'draft';
};

export type UserProfile = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    location?: string;
    coordinates?: Coordinates; // Geographic coordinates for location-based search
    skills?: string[];
    education?: string[] | EducationDetail[]; // Support both formats
    resumeUrl?: string;
    profilePictureUrl?: string;
    interests?: string[];
    age?: number;
    videoDemoUrl?: string;
    savedJobIds?: string[];
    // Enhanced fields
    bio?: string;
    phone?: string;
    phoneNumber?: string;
    website?: string;
    jobTitle?: string;
    currentJobTitle?: string;
    currentCompany?: string;
    experience?: WorkExperience[];
    workExperience?: WorkExperience[];
    certificates?: Certificate[];
    educationDetails?: EducationDetail[]; // Detailed education information
    videoUrls?: string[]; // Multiple video demos
    portfolioUrls?: string[];
    languages?: string[];
    availability?: 'available' | 'not_available' | 'open_to_offers' | 'immediate' | 'two_weeks' | 'one_month' | 'exploring';
    expectedSalary?: number;
    userType?: 'job_seeker' | 'recruiter';
    companyName?: string; // For recruiters
    companySize?: string;
    industry?: string;
    hiringRole?: string;
    createdAt?: string;
    updatedAt?: string;
    distance?: number; // Calculated distance from user (in km)
};

export type WorkExperience = {
    company: string;
    position: string;
    startDate: string;
    endDate?: string;
    description?: string;
    current?: boolean;
    imageUrl?: string; // Image associated with the experience
};

export type Certificate = {
    id?: string;
    name: string;
    issuer?: string;
    issuingOrganization?: string; // Alternative to issuer
    issueDate: string;
    expiryDate?: string;
    certificateUrl?: string;
    imageUrl?: string; // Image of the certificate
    credentialId?: string;
};

export type EducationDetail = {
    id: string;
    level: 'SSC' | 'PUC' | 'Diploma' | 'Bachelors' | 'Masters' | 'PhD' | 'Other';
    institution: string;
    board?: string; // For SSC/PUC
    university?: string; // For higher education
    degree?: string; // e.g., "Bachelor of Science", "Master of Technology"
    field: string; // Field of study/major
    startYear: string;
    endYear?: string;
    grade?: string; // Percentage, CGPA, or grade
    current?: boolean; // Currently pursuing
    achievements?: string; // Any special achievements or honors
};

export type Application = {
  id: string;
  jobPostingId: string;
  applicantId: string;
  posterId: string; // Job poster/owner ID
  jobTitle: string;
  company: string;
  applicationDate: Timestamp;
  status: 'submitted' | 'reviewed' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';
}

export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: Timestamp | any; // Allow for serverTimestamp
    status?: 'sending' | 'sent' | 'delivered' | 'read'; // Message delivery status
    read?: boolean; // Whether the message has been read
};

export type Conversation = {
    id: string;
    participantId: string; // The other user's ID
    participantName: string;
    participantProfilePicture?: string;
    lastMessage?: string;
    lastMessageTimestamp?: Timestamp | any;
    isArchived?: boolean;
    isPinned?: boolean;
    unreadCount?: number;
};

export type ConversationWithParticipant = Conversation & {
    participant: UserProfile;
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'job_match' | 'message' | 'application' | 'system' | 'new_job_posted' | 'profile_view' | 'new_message' | 'application_update' | 'application_success';
  read: boolean;
  timestamp: Timestamp;
  data?: {
    // For job-related notifications
    jobId?: string;
    posterId?: string;
    jobTitle?: string;
    companyName?: string;
    
    // For candidate/application notifications
    candidateId?: string;
    applicantId?: string;
    
    // For application status
    applicationId?: string;
    applicationStatus?: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';
    previousStatus?: string;
    
    // For message notifications
    senderId?: string;
    conversationId?: string;
    
    // For profile view notifications
    viewerId?: string;
    viewerName?: string;
    
    // Generic data
    [key: string]: any;
  };
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorProfilePicture?: string;
  authorJobTitle?: string;
  title: string;
  content: string;
  type?: 'text' | 'video' | 'certificate' | 'work_experience' | 'achievement';
  imageUrl?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  certificate?: Certificate;
  workExperience?: WorkExperience;
  category?: 'career_advice' | 'job_search' | 'interview_tips' | 'industry_news' | 'success_story' | 'work_experience' | 'certification' | 'other';
  tags?: string[];
  likes?: number;
  likedBy?: string[];
  comments?: number;
  shares?: number;
  visibility?: 'public' | 'connections' | 'private';
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;
  featured?: boolean;
};
