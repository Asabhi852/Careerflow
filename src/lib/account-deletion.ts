import { Firestore, collection, doc, deleteDoc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { Auth, deleteUser as firebaseDeleteUser } from 'firebase/auth';
import { getStorage, ref, deleteObject, listAll } from 'firebase/storage';

/**
 * Comprehensive account deletion
 * Removes all user data including:
 * - Firebase Authentication account
 * - User profile
 * - Public profile
 * - Posted jobs
 * - Applications
 * - Messages
 * - Notifications
 * - Uploaded files (resume, profile pictures)
 */
export async function deleteUserAccount(
  auth: Auth,
  firestore: Firestore,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!auth.currentUser || auth.currentUser.uid !== userId) {
      return { success: false, error: 'User not authenticated or ID mismatch' };
    }

    console.log(`Starting account deletion for user: ${userId}`);

    // Use batch operations where possible for better performance
    const batch = writeBatch(firestore);
    
    // 1. Delete user profile
    try {
      const userProfileRef = doc(firestore, 'users', userId);
      batch.delete(userProfileRef);
      console.log('User profile marked for deletion');
    } catch (error) {
      console.error('Error deleting user profile:', error);
    }

    // 2. Delete public profile
    try {
      const publicProfileRef = doc(firestore, 'public_profiles', userId);
      batch.delete(publicProfileRef);
      console.log('Public profile marked for deletion');
    } catch (error) {
      console.error('Error deleting public profile:', error);
    }

    // Commit the batch for user profiles
    await batch.commit();
    console.log('User and public profiles deleted');

    // 3. Delete all jobs posted by the user
    try {
      const jobsQuery = query(
        collection(firestore, 'job_postings'),
        where('posterId', '==', userId)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      
      if (!jobsSnapshot.empty) {
        const jobBatch = writeBatch(firestore);
        jobsSnapshot.docs.forEach((doc) => {
          jobBatch.delete(doc.ref);
        });
        await jobBatch.commit();
        console.log(`Deleted ${jobsSnapshot.size} job postings`);
      }
    } catch (error) {
      console.error('Error deleting jobs:', error);
    }

    // 4. Delete all applications by the user
    try {
      const applicationsQuery = query(
        collection(firestore, 'applications'),
        where('candidateId', '==', userId)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
      
      if (!applicationsSnapshot.empty) {
        const appBatch = writeBatch(firestore);
        applicationsSnapshot.docs.forEach((doc) => {
          appBatch.delete(doc.ref);
        });
        await appBatch.commit();
        console.log(`Deleted ${applicationsSnapshot.size} applications`);
      }
    } catch (error) {
      console.error('Error deleting applications:', error);
    }

    // 5. Delete user's subcollections (notifications, messages)
    try {
      // Delete notifications
      const notificationsRef = collection(firestore, 'users', userId, 'notifications');
      const notificationsSnapshot = await getDocs(notificationsRef);
      
      if (!notificationsSnapshot.empty) {
        const notifBatch = writeBatch(firestore);
        notificationsSnapshot.docs.forEach((doc) => {
          notifBatch.delete(doc.ref);
        });
        await notifBatch.commit();
        console.log(`Deleted ${notificationsSnapshot.size} notifications`);
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
    }

    try {
      // Delete messages
      const messagesRef = collection(firestore, 'users', userId, 'messages');
      const messagesSnapshot = await getDocs(messagesRef);
      
      if (!messagesSnapshot.empty) {
        const msgBatch = writeBatch(firestore);
        messagesSnapshot.docs.forEach((doc) => {
          msgBatch.delete(doc.ref);
        });
        await msgBatch.commit();
        console.log(`Deleted ${messagesSnapshot.size} messages`);
      }
    } catch (error) {
      console.error('Error deleting messages:', error);
    }

    // 6. Delete user's uploaded files from Storage
    try {
      const storage = getStorage();
      const userStorageRef = ref(storage, `users/${userId}`);
      
      // List all files in user's directory
      const filesList = await listAll(userStorageRef);
      
      // Delete all files
      const deletePromises = filesList.items.map((fileRef) => {
        return deleteObject(fileRef).catch((err) => {
          console.error(`Error deleting file ${fileRef.fullPath}:`, err);
        });
      });
      
      await Promise.all(deletePromises);
      console.log(`Deleted ${filesList.items.length} files from storage`);
    } catch (error) {
      console.error('Error deleting storage files:', error);
      // Storage errors shouldn't block account deletion
    }

    // 7. Delete posts created by the user
    try {
      const postsQuery = query(
        collection(firestore, 'posts'),
        where('authorId', '==', userId)
      );
      const postsSnapshot = await getDocs(postsQuery);
      
      if (!postsSnapshot.empty) {
        const postsBatch = writeBatch(firestore);
        postsSnapshot.docs.forEach((doc) => {
          postsBatch.delete(doc.ref);
        });
        await postsBatch.commit();
        console.log(`Deleted ${postsSnapshot.size} posts`);
      }
    } catch (error) {
      console.error('Error deleting posts:', error);
    }

    // 8. Delete saved jobs
    try {
      const savedJobsRef = collection(firestore, 'users', userId, 'saved_jobs');
      const savedJobsSnapshot = await getDocs(savedJobsRef);
      
      if (!savedJobsSnapshot.empty) {
        const savedBatch = writeBatch(firestore);
        savedJobsSnapshot.docs.forEach((doc) => {
          savedBatch.delete(doc.ref);
        });
        await savedBatch.commit();
        console.log(`Deleted ${savedJobsSnapshot.size} saved jobs`);
      }
    } catch (error) {
      console.error('Error deleting saved jobs:', error);
    }

    // 9. Finally, delete the Firebase Authentication account
    try {
      await firebaseDeleteUser(auth.currentUser);
      console.log('Firebase Authentication account deleted');
    } catch (error: any) {
      if (error?.code === 'auth/requires-recent-login') {
        return { 
          success: false, 
          error: 'Please log in again before deleting your account (recent authentication required)' 
        };
      }
      throw error;
    }

    console.log('Account deletion completed successfully');
    return { success: true };

  } catch (error: any) {
    console.error('Error during account deletion:', error);
    return { 
      success: false, 
      error: error?.message || 'Failed to delete account. Please try again.' 
    };
  }
}

/**
 * Check if user can delete their account
 * (e.g., no active applications, no pending payments, etc.)
 */
export async function canDeleteAccount(
  firestore: Firestore,
  userId: string
): Promise<{ canDelete: boolean; reason?: string }> {
  try {
    // Check for active applications
    const activeAppsQuery = query(
      collection(firestore, 'applications'),
      where('candidateId', '==', userId),
      where('status', 'in', ['pending', 'reviewed', 'interview'])
    );
    const activeAppsSnapshot = await getDocs(activeAppsQuery);

    if (!activeAppsSnapshot.empty) {
      return {
        canDelete: true, // Allow deletion but warn
        reason: `You have ${activeAppsSnapshot.size} active job applications. These will be deleted.`
      };
    }

    // Check for active job postings
    const activeJobsQuery = query(
      collection(firestore, 'job_postings'),
      where('posterId', '==', userId),
      where('status', '==', 'active')
    );
    const activeJobsSnapshot = await getDocs(activeJobsQuery);

    if (!activeJobsSnapshot.empty) {
      return {
        canDelete: true,
        reason: `You have ${activeJobsSnapshot.size} active job postings. These will be deleted.`
      };
    }

    return { canDelete: true };
  } catch (error) {
    console.error('Error checking account deletion eligibility:', error);
    return { canDelete: true }; // Allow deletion even if check fails
  }
}
