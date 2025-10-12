'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { UserProfile } from '@/lib/types';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const profileFormSchema = (z as any).object({
  firstName: (z as any).string().min(2, {
    message: 'First name must be at least 2 characters.',
  }),
  lastName: (z as any).string().min(2, {
    message: 'Last name must be at least 2 characters.',
  }),
  location: (z as any).string().optional(),
  skills: (z as any).string().optional(),
  education: (z as any).string().optional(),
  profilePictureUrl: (z as any).string().url({ message: 'Please enter a valid URL.' }).optional().or((z as any).literal('')),
  resumeUrl: (z as any).string().url({ message: 'Please enter a valid URL.' }).optional().or((z as any).literal('')),
  videoDemoUrl: (z as any).string().url({ message: 'Please enter a valid URL.' }).optional().or((z as any).literal('')),
});

type ProfileFormValues = any;

interface UserProfileFormProps {
  userProfile: UserProfile;
}

export function UserProfileForm({ userProfile }: UserProfileFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const defaultValues: Partial<ProfileFormValues> = {
    firstName: userProfile.firstName || '',
    lastName: userProfile.lastName || '',
    location: userProfile.location || '',
    skills: userProfile.skills?.join(', ') || '',
    education: userProfile.education?.join('\n') || '',
    profilePictureUrl: userProfile.profilePictureUrl || '',
    resumeUrl: userProfile.resumeUrl || '',
    videoDemoUrl: userProfile.videoDemoUrl || '',
  };

  const form = useForm<any>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  function onSubmit(data: any) {
    if (!user || !firestore) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Authentication error. Please log in again."
        });
        return;
    }

    const profileRef = doc(firestore, 'users', user.uid);
    const publicProfileRef = doc(firestore, 'public_profiles', user.uid);

    const skillsArray = data.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
    const educationArray = data.education?.split('\n').map(s => s.trim()).filter(Boolean) || [];

    const updatedProfileData = {
        ...userProfile,
        ...data,
        skills: skillsArray,
        education: educationArray,
    };
    
    setDocumentNonBlocking(profileRef, updatedProfileData, { merge: true });
    setDocumentNonBlocking(publicProfileRef, updatedProfileData, { merge: true });

    toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                    <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                    <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g. San Francisco, CA" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="profilePictureUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-image.png" {...field} />
              </FormControl>
               <FormDescription>
                Link to your profile picture.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="skills"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Skills</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your skills, separated by commas"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                List your professional skills like "React, Node.js, UI/UX Design".
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="education"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Education</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter each degree or certification on a new line"
                  className="resize-y"
                  rows={4}
                  {...field}
                />
              </FormControl>
               <FormDescription>
                List your degrees or certifications, one per line.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="resumeUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resume URL</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/your-resume.pdf" {...field} />
              </FormControl>
               <FormDescription>
                Link to your resume (e.g., Google Drive, Dropbox).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

         <FormField
          control={form.control}
          name="videoDemoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video Demo URL</FormLabel>
              <FormControl>
                <Input placeholder="https://youtube.com/watch?v=..." {...field} />
              </FormControl>
               <FormDescription>
                Link to a video demonstration of your work.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
             {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Profile
        </Button>
      </form>
    </Form>
  );
}
