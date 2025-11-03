import { collection, doc, addDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { Notification } from './types';

/**
 * Create a notification for a user
 */
export async function createNotification(
  firestore: Firestore,
  userId: string,
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Promise<void> {
  try {
    const notificationsRef = collection(firestore, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

/**
 * Notify when a new job is posted
 */
export async function notifyNewJobPosted(
  firestore: Firestore,
  userId: string,
  jobData: {
    jobId: string;
    jobTitle: string;
    companyName: string;
    posterId: string;
  }
): Promise<void> {
  await createNotification(firestore, userId, {
    userId,
    title: 'New Job Posted',
    message: `New job: ${jobData.jobTitle} at ${jobData.companyName}`,
    type: 'new_job_posted',
    data: {
      jobId: jobData.jobId,
      posterId: jobData.posterId,
      jobTitle: jobData.jobTitle,
      companyName: jobData.companyName,
    },
  });
}

/**
 * Notify recruiter when a new candidate applies to their job
 * Includes full candidate profile information for easy access
 */
export async function notifyNewCandidateApplication(
  firestore: Firestore,
  posterId: string,
  applicationData: {
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    applicationId: string;
    candidateEmail?: string;
    candidatePhone?: string;
    candidateLocation?: string;
    candidateCurrentRole?: string;
    candidateSkills?: string[];
    candidateResumeUrl?: string;
  }
): Promise<void> {
  // Build detailed message with candidate information
  const messageDetails = [
    `${applicationData.candidateName} applied for ${applicationData.jobTitle}`,
  ];
  
  if (applicationData.candidateCurrentRole) {
    messageDetails.push(`Current Role: ${applicationData.candidateCurrentRole}`);
  }
  
  if (applicationData.candidateLocation) {
    messageDetails.push(`Location: ${applicationData.candidateLocation}`);
  }

  await createNotification(firestore, posterId, {
    userId: posterId,
    title: '🎯 New Application Received!',
    message: messageDetails.join(' • '),
    type: 'application',
    data: {
      candidateId: applicationData.candidateId,
      applicantId: applicationData.candidateId,
      candidateName: applicationData.candidateName,
      candidateEmail: applicationData.candidateEmail,
      candidatePhone: applicationData.candidatePhone,
      candidateLocation: applicationData.candidateLocation,
      candidateCurrentRole: applicationData.candidateCurrentRole,
      candidateSkills: applicationData.candidateSkills,
      candidateResumeUrl: applicationData.candidateResumeUrl,
      jobId: applicationData.jobId,
      applicationId: applicationData.applicationId,
      jobTitle: applicationData.jobTitle,
      applicationStatus: 'pending',
      viewProfileUrl: `/candidates/${applicationData.candidateId}`,
    },
  });
}

/**
 * Notify candidate about application status update
 */
export async function notifyApplicationStatusUpdate(
  firestore: Firestore,
  candidateId: string,
  statusData: {
    applicationId: string;
    applicationStatus: 'pending' | 'reviewed' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';
    previousStatus?: string;
    jobTitle: string;
    companyName: string;
    jobId: string;
    posterId?: string;
  }
): Promise<void> {
  const statusMessages: Record<string, string> = {
    pending: 'Your application is pending',
    reviewed: 'Your application is being reviewed',
    shortlisted: 'Congratulations! You\'ve been shortlisted',
    interview: 'Interview scheduled',
    accepted: 'Congratulations! Your application was accepted',
    rejected: 'Thank you for your application',
  };

  const statusEmojis: Record<string, string> = {
    pending: '⏳',
    reviewed: '👀',
    shortlisted: '✅',
    interview: '📅',
    accepted: '🎉',
    rejected: '❌',
  };

  await createNotification(firestore, candidateId, {
    userId: candidateId,
    title: `Application Update - ${statusData.applicationStatus.toUpperCase()}`,
    message: `${statusEmojis[statusData.applicationStatus]} ${statusMessages[statusData.applicationStatus]} for ${statusData.jobTitle} at ${statusData.companyName}`,
    type: 'application_update',
    data: {
      applicationId: statusData.applicationId,
      applicationStatus: statusData.applicationStatus,
      previousStatus: statusData.previousStatus,
      jobId: statusData.jobId,
      jobTitle: statusData.jobTitle,
      companyName: statusData.companyName,
      posterId: statusData.posterId,
    },
  });
}

/**
 * Notify recruiter when someone views their posted job
 */
export async function notifyJobView(
  firestore: Firestore,
  posterId: string,
  viewData: {
    jobId: string;
    jobTitle: string;
    viewerId: string;
  }
): Promise<void> {
  // Only notify if it's not the poster viewing their own job
  if (viewData.viewerId !== posterId) {
    await createNotification(firestore, posterId, {
      userId: posterId,
      title: 'Job Viewed',
      message: `Your job "${viewData.jobTitle}" was viewed`,
      type: 'system',
      data: {
        jobId: viewData.jobId,
        jobTitle: viewData.jobTitle,
        viewerId: viewData.viewerId,
      },
    });
  }
}

/**
 * Notify candidate when their profile is viewed
 */
export async function notifyProfileView(
  firestore: Firestore,
  candidateId: string,
  viewData: {
    viewerId: string;
    viewerName?: string;
  }
): Promise<void> {
  // Don't notify if viewing own profile
  if (viewData.viewerId === candidateId) {
    return;
  }
  
  await createNotification(firestore, candidateId, {
    userId: candidateId,
    title: 'Profile Viewed',
    message: viewData.viewerName 
      ? `${viewData.viewerName} viewed your profile`
      : 'Someone viewed your profile',
    type: 'profile_view',
    data: {
      viewerId: viewData.viewerId,
      viewerName: viewData.viewerName,
    },
  });
}

/**
 * Notify candidate when their application is submitted successfully
 */
export async function notifyApplicationSuccess(
  firestore: Firestore,
  candidateId: string,
  applicationData: {
    applicationId: string;
    jobId: string;
    jobTitle: string;
    companyName: string;
  }
): Promise<void> {
  await createNotification(firestore, candidateId, {
    userId: candidateId,
    title: 'Application Submitted! ✅',
    message: `Your application for ${applicationData.jobTitle} at ${applicationData.companyName} has been submitted successfully`,
    type: 'application_success',
    data: {
      applicationId: applicationData.applicationId,
      jobId: applicationData.jobId,
      jobTitle: applicationData.jobTitle,
      companyName: applicationData.companyName,
    },
  });
}

/**
 * Notify user when they receive a new message
 */
export async function notifyNewMessage(
  firestore: Firestore,
  receiverId: string,
  messageData: {
    senderId: string;
    senderName?: string;
    conversationId: string;
    messagePreview: string;
  }
): Promise<void> {
  await createNotification(firestore, receiverId, {
    userId: receiverId,
    title: 'New Message',
    message: messageData.senderName
      ? `${messageData.senderName}: ${messageData.messagePreview}`
      : `New message: ${messageData.messagePreview}`,
    type: 'new_message',
    data: {
      senderId: messageData.senderId,
      conversationId: messageData.conversationId,
    },
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  firestore: Firestore,
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const notificationRef = doc(firestore, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  firestore: Firestore,
  userId: string,
  notifications: Notification[]
): Promise<void> {
  try {
    const unreadNotifications = notifications.filter(n => !n.read);
    const updatePromises = unreadNotifications.map(n => 
      markNotificationAsRead(firestore, userId, n.id)
    );
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
}

/**
 * Get notification icon based on type
 */
export function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'new_job_posted':
      return '💼';
    case 'application':
      return '📝';
    case 'application_success':
      return '✅';
    case 'application_update':
      return '📊';
    case 'new_message':
      return '💬';
    case 'profile_view':
      return '👁️';
    case 'job_match':
      return '🎯';
    default:
      return '🔔';
  }
}

/**
 * Get notification color based on type
 */
export function getNotificationColor(type: Notification['type']): string {
  switch (type) {
    case 'application_update':
      return 'text-blue-600';
    case 'application':
      return 'text-green-600';
    case 'application_success':
      return 'text-emerald-600';
    case 'new_job_posted':
      return 'text-purple-600';
    case 'new_message':
      return 'text-orange-600';
    case 'profile_view':
      return 'text-pink-600';
    default:
      return 'text-gray-600';
  }
}
