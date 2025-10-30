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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
// @ts-ignore - Lucide icons import issue
import { Loader2, Plus, X, GraduationCap } from 'lucide-react';
import type { UserProfile, WorkExperience, Certificate, EducationDetail } from '@/lib/types';
import { useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { FileUpload } from '@/components/shared/file-upload';
import { ResumeUpload } from '@/components/shared/resume-upload';
import { useState } from 'react';
import { UserAvatar } from '@/components/shared/user-avatar';

const profileFormSchema = (z as any).object({
  firstName: (z as any).string().min(2, { message: 'First name must be at least 2 characters.' }),
  lastName: (z as any).string().min(2, { message: 'Last name must be at least 2 characters.' }),
  bio: (z as any).string().optional(),
  phoneNumber: (z as any).string().optional(),
  location: (z as any).string().optional(),
  age: (z as any).coerce.number().positive().optional(),
  currentJobTitle: (z as any).string().optional(),
  currentCompany: (z as any).string().optional(),
  skills: (z as any).string().optional(),
  education: (z as any).string().optional(),
  interests: (z as any).string().optional(),
  languages: (z as any).string().optional(),
  availability: (z as any).enum(['available', 'not_available', 'open_to_offers']).optional(),
  expectedSalary: (z as any).coerce.number().positive().optional(),
  portfolioUrls: (z as any).string().optional(),
});

interface EnhancedProfileFormProps {
  userProfile: UserProfile;
}

export function EnhancedProfileForm({ userProfile }: EnhancedProfileFormProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [profilePictureUrl, setProfilePictureUrl] = useState(userProfile.profilePictureUrl || '');
  const [resumeUrl, setResumeUrl] = useState(userProfile.resumeUrl || '');
  const [videoUrls, setVideoUrls] = useState<string[]>(userProfile.videoUrls || []);
  const [workExperience, setWorkExperience] = useState<WorkExperience[]>(userProfile.workExperience || []);
  const [certificates, setCertificates] = useState<Certificate[]>(userProfile.certificates || []);
  const [educationDetails, setEducationDetails] = useState<EducationDetail[]>(userProfile.educationDetails || []);

  const form = useForm<any>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: userProfile.firstName || '',
      lastName: userProfile.lastName || '',
      bio: userProfile.bio || '',
      phoneNumber: userProfile.phoneNumber || '',
      location: userProfile.location || '',
      age: userProfile.age || undefined,
      currentJobTitle: userProfile.currentJobTitle || '',
      currentCompany: userProfile.currentCompany || '',
      skills: userProfile.skills?.join(', ') || '',
      education: userProfile.education?.join('\n') || '',
      interests: userProfile.interests?.join(', ') || '',
      languages: userProfile.languages?.join(', ') || '',
      availability: userProfile.availability || 'available',
      expectedSalary: userProfile.expectedSalary || undefined,
      portfolioUrls: userProfile.portfolioUrls?.join('\n') || '',
    },
  });

  const addWorkExperience = () => {
    setWorkExperience([
      ...workExperience,
      { company: '', position: '', startDate: '', endDate: '', description: '', current: false },
    ]);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_, i) => i !== index));
  };

  const updateWorkExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const addCertificate = () => {
    setCertificates([
      ...certificates,
      { id: Date.now().toString(), name: '', issuer: '', issueDate: '', certificateUrl: '' },
    ]);
  };

  const removeCertificate = (index: number) => {
    setCertificates(certificates.filter((_, i) => i !== index));
  };

  const updateCertificate = (index: number, field: keyof Certificate, value: any) => {
    const updated = [...certificates];
    updated[index] = { ...updated[index], [field]: value };
    setCertificates(updated);
  };

  const addVideoUrl = (url: string) => {
    setVideoUrls([...videoUrls, url]);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const addEducation = () => {
    setEducationDetails([
      ...educationDetails,
      { 
        id: Date.now().toString(), 
        level: 'Bachelors', 
        institution: '', 
        field: '', 
        startYear: '', 
        endYear: '', 
        grade: '',
        current: false 
      },
    ]);
  };

  const removeEducation = (index: number) => {
    setEducationDetails(educationDetails.filter((_, i) => i !== index));
  };

  const updateEducation = (index: number, field: keyof EducationDetail, value: any) => {
    const updated = [...educationDetails];
    updated[index] = { ...updated[index], [field]: value };
    setEducationDetails(updated);
  };

  const handleParsedResumeData = (parsedData: any) => {
    // Auto-fill form fields with parsed data
    if (parsedData.personalInfo) {
      if (parsedData.personalInfo.firstName) {
        form.setValue('firstName', parsedData.personalInfo.firstName);
      }
      if (parsedData.personalInfo.lastName) {
        form.setValue('lastName', parsedData.personalInfo.lastName);
      }
      if (parsedData.personalInfo.phoneNumber) {
        form.setValue('phoneNumber', parsedData.personalInfo.phoneNumber);
      }
      if (parsedData.personalInfo.location) {
        form.setValue('location', parsedData.personalInfo.location);
      }
      if (parsedData.personalInfo.age) {
        form.setValue('age', parsedData.personalInfo.age);
      }
    }

    if (parsedData.professionalSummary) {
      if (parsedData.professionalSummary.bio) {
        form.setValue('bio', parsedData.professionalSummary.bio);
      }
      if (parsedData.professionalSummary.currentJobTitle) {
        form.setValue('currentJobTitle', parsedData.professionalSummary.currentJobTitle);
      }
      if (parsedData.professionalSummary.currentCompany) {
        form.setValue('currentCompany', parsedData.professionalSummary.currentCompany);
      }
    }

    // Fill skills
    if (parsedData.skills) {
      const allSkills = [
        ...(parsedData.skills.technical || []),
        ...(parsedData.skills.soft || []),
      ];
      if (allSkills.length > 0) {
        form.setValue('skills', allSkills.join(', '));
      }
      
      // Fill languages
      if (parsedData.skills.languages && parsedData.skills.languages.length > 0) {
        form.setValue('languages', parsedData.skills.languages.join(', '));
      }
    }

    // Fill education (old format for backward compatibility)
    if (parsedData.education && parsedData.education.length > 0) {
      const educationText = parsedData.education
        .map((edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}`)
        .join('\n');
      form.setValue('education', educationText);

      // Fill detailed education
      const formattedEducation = parsedData.education.map((edu: any, index: number) => {
        // Determine education level based on degree
        let level: 'SSC' | 'PUC' | 'Diploma' | 'Bachelors' | 'Masters' | 'PhD' | 'Other' = 'Bachelors';
        const degreeStr = (edu.degree || '').toLowerCase();
        
        if (degreeStr.includes('10th') || degreeStr.includes('ssc') || degreeStr.includes('secondary')) {
          level = 'SSC';
        } else if (degreeStr.includes('12th') || degreeStr.includes('puc') || degreeStr.includes('higher secondary')) {
          level = 'PUC';
        } else if (degreeStr.includes('diploma')) {
          level = 'Diploma';
        } else if (degreeStr.includes('bachelor') || degreeStr.includes('b.tech') || degreeStr.includes('b.e') || degreeStr.includes('b.sc') || degreeStr.includes('b.a')) {
          level = 'Bachelors';
        } else if (degreeStr.includes('master') || degreeStr.includes('m.tech') || degreeStr.includes('m.e') || degreeStr.includes('m.sc') || degreeStr.includes('mba')) {
          level = 'Masters';
        } else if (degreeStr.includes('phd') || degreeStr.includes('doctorate')) {
          level = 'PhD';
        }

        return {
          id: Date.now().toString() + index,
          level: level,
          institution: edu.institution || '',
          board: (level === 'SSC' || level === 'PUC') ? '' : undefined,
          university: (level !== 'SSC' && level !== 'PUC') ? '' : undefined,
          degree: edu.degree || '',
          field: edu.field || '',
          startYear: '',
          endYear: edu.graduationYear || '',
          grade: edu.gpa || '',
          current: false,
          achievements: '',
        };
      });
      setEducationDetails(formattedEducation);
    }

    // Fill interests
    if (parsedData.interests && parsedData.interests.length > 0) {
      form.setValue('interests', parsedData.interests.join(', '));
    }

    // Fill work experience
    if (parsedData.workExperience && parsedData.workExperience.length > 0) {
      const formattedExperience = parsedData.workExperience.map((exp: any) => ({
        company: exp.company || '',
        position: exp.position || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        description: exp.description || '',
        current: exp.current || false,
      }));
      setWorkExperience(formattedExperience);
    }

    // Fill certificates
    if (parsedData.certificates && parsedData.certificates.length > 0) {
      const formattedCerts = parsedData.certificates.map((cert: any, index: number) => ({
        id: Date.now().toString() + index,
        name: cert.name || '',
        issuer: cert.issuer || '',
        issueDate: cert.issueDate || '',
        expiryDate: cert.expiryDate || '',
        credentialId: cert.credentialId || '',
        certificateUrl: '',
      }));
      setCertificates(formattedCerts);
    }

    // Fill availability
    if (parsedData.availability) {
      form.setValue('availability', parsedData.availability);
    }

    // Fill expected salary
    if (parsedData.expectedSalary) {
      form.setValue('expectedSalary', parsedData.expectedSalary);
    }
  };

  function onSubmit(data: any) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authentication error. Please log in again.',
      });
      return;
    }

    const profileRef = doc(firestore, 'users', user.uid);
    const publicProfileRef = doc(firestore, 'public_profiles', user.uid);

    const skillsArray = data.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    const educationArray = data.education?.split('\n').map((s: string) => s.trim()).filter(Boolean) || [];
    const interestsArray = data.interests?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    const languagesArray = data.languages?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
    const portfolioUrlsArray = data.portfolioUrls?.split('\n').map((s: string) => s.trim()).filter(Boolean) || [];

    const updatedProfileData: UserProfile = {
      ...userProfile,
      ...data,
      skills: skillsArray,
      education: educationArray,
      interests: interestsArray,
      languages: languagesArray,
      portfolioUrls: portfolioUrlsArray,
      profilePictureUrl,
      resumeUrl,
      videoUrls,
      workExperience: workExperience.filter(exp => exp.company && exp.position),
      certificates: certificates.filter(cert => cert.name && cert.issuer),
      educationDetails: educationDetails.filter(edu => edu.institution && edu.field),
      updatedAt: new Date().toISOString(),
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <FormLabel>Profile Picture</FormLabel>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <UserAvatar 
                    user={{
                      firstName: userProfile.firstName,
                      lastName: userProfile.lastName,
                      profilePictureUrl: profilePictureUrl
                    }}
                    size="lg"
                  />
                  <p className="text-xs text-muted-foreground text-center">Preview</p>
                </div>
                <div className="flex-1">
                  <FileUpload
                    onUploadComplete={setProfilePictureUrl}
                    accept="image/*"
                    maxSize={5}
                    folder="profile-pictures"
                    label="Upload Profile Picture"
                    currentFile={profilePictureUrl}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }: any) => (
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
                render={({ field }: any) => (
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
              name="bio"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A brief description about yourself and your career goals.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="age"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco, CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languages"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Languages</FormLabel>
                  <FormControl>
                    <Input placeholder="English, Spanish, French" {...field} />
                  </FormControl>
                  <FormDescription>Comma-separated list of languages you speak</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Professional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Information</CardTitle>
            <CardDescription>Your career details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentJobTitle"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Current Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentCompany"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Current Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Tech Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availability"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Availability</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="not_available">Not Available</SelectItem>
                        <SelectItem value="open_to_offers">Open to Offers</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="expectedSalary"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Expected Salary (USD)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="80000" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="skills"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Skills</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="React, Node.js, Python, UI/UX Design"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated list of your skills</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interests"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Web Development, AI, Machine Learning"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Comma-separated list of your interests</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="education"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Education</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Bachelor of Science in Computer Science - MIT - 2020"
                      className="resize-y"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>One degree per line</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolioUrls"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Portfolio URLs</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="https://github.com/username&#10;https://portfolio.com"
                      className="resize-y"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>One URL per line</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Work Experience */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Work Experience</CardTitle>
                <CardDescription>Your professional experience</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
                <Plus className="h-4 w-4 mr-2" />
                Add Experience
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {workExperience.map((exp, index) => (
              <Card key={index}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Experience {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeWorkExperience(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FormLabel>Company</FormLabel>
                      <Input
                        placeholder="Company name"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel>Position</FormLabel>
                      <Input
                        placeholder="Job title"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel>Start Date</FormLabel>
                      <Input
                        type="date"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel>End Date</FormLabel>
                      <Input
                        type="date"
                        value={exp.endDate || ''}
                        onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                        disabled={exp.current}
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      placeholder="Describe your role and achievements"
                      value={exp.description || ''}
                      onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                      className="resize-none"
                    />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`current-${index}`}
                      checked={exp.current || false}
                      onChange={(e) => updateWorkExperience(index, 'current', e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor={`current-${index}`} className="text-sm">
                      I currently work here
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Education Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education Details
                </CardTitle>
                <CardDescription>Add your educational qualifications (SSC, PUC, Degree, etc.)</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addEducation}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {educationDetails.map((edu, index) => (
              <Card key={edu.id} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium text-blue-700">Education {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeEducation(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FormLabel>Education Level *</FormLabel>
                        <Select
                          value={edu.level}
                          onValueChange={(value) => updateEducation(index, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="SSC">SSC (10th)</SelectItem>
                            <SelectItem value="PUC">PUC (12th)</SelectItem>
                            <SelectItem value="Diploma">Diploma</SelectItem>
                            <SelectItem value="Bachelors">Bachelor's Degree</SelectItem>
                            <SelectItem value="Masters">Master's Degree</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <FormLabel>Institution/School/College *</FormLabel>
                        <Input
                          placeholder="e.g., ABC High School, XYZ University"
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                        />
                      </div>
                    </div>

                    {(edu.level === 'SSC' || edu.level === 'PUC') && (
                      <div>
                        <FormLabel>Board</FormLabel>
                        <Input
                          placeholder="e.g., CBSE, State Board, ICSE"
                          value={edu.board || ''}
                          onChange={(e) => updateEducation(index, 'board', e.target.value)}
                        />
                      </div>
                    )}

                    {(edu.level === 'Bachelors' || edu.level === 'Masters' || edu.level === 'PhD' || edu.level === 'Diploma') && (
                      <>
                        <div>
                          <FormLabel>University</FormLabel>
                          <Input
                            placeholder="e.g., University of Mumbai"
                            value={edu.university || ''}
                            onChange={(e) => updateEducation(index, 'university', e.target.value)}
                          />
                        </div>
                        <div>
                          <FormLabel>Degree</FormLabel>
                          <Input
                            placeholder="e.g., Bachelor of Science, Master of Technology"
                            value={edu.degree || ''}
                            onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <FormLabel>Field of Study/Major *</FormLabel>
                      <Input
                        placeholder="e.g., Computer Science, Mathematics"
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <FormLabel>Start Year</FormLabel>
                        <Input
                          type="text"
                          placeholder="2018"
                          value={edu.startYear}
                          onChange={(e) => updateEducation(index, 'startYear', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel>End Year</FormLabel>
                        <Input
                          type="text"
                          placeholder="2022"
                          value={edu.endYear || ''}
                          onChange={(e) => updateEducation(index, 'endYear', e.target.value)}
                          disabled={edu.current}
                        />
                      </div>
                      <div>
                        <FormLabel>Grade/Percentage/CGPA</FormLabel>
                        <Input
                          placeholder="e.g., 85%, 8.5 CGPA"
                          value={edu.grade || ''}
                          onChange={(e) => updateEducation(index, 'grade', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id={`edu-current-${index}`}
                        checked={edu.current || false}
                        onChange={(e) => updateEducation(index, 'current', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={`edu-current-${index}`} className="text-sm">
                        Currently pursuing
                      </label>
                    </div>

                    <div>
                      <FormLabel>Achievements/Honors (Optional)</FormLabel>
                      <Textarea
                        placeholder="Any special achievements, honors, or awards"
                        value={edu.achievements || ''}
                        onChange={(e) => updateEducation(index, 'achievements', e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Certificates */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Certifications</CardTitle>
                <CardDescription>Add your professional certifications</CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCertificate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Certificate
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {certificates.map((cert, index) => (
              <Card key={cert.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-medium">Certificate {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCertificate(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <FormLabel>Certificate Name</FormLabel>
                        <Input
                          placeholder="AWS Certified Solutions Architect"
                          value={cert.name}
                          onChange={(e) => updateCertificate(index, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel>Issuer</FormLabel>
                        <Input
                          placeholder="Amazon Web Services"
                          value={cert.issuer}
                          onChange={(e) => updateCertificate(index, 'issuer', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel>Issue Date</FormLabel>
                        <Input
                          type="date"
                          value={cert.issueDate}
                          onChange={(e) => updateCertificate(index, 'issueDate', e.target.value)}
                        />
                      </div>
                      <div>
                        <FormLabel>Expiry Date (Optional)</FormLabel>
                        <Input
                          type="date"
                          value={cert.expiryDate || ''}
                          onChange={(e) => updateCertificate(index, 'expiryDate', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <FormLabel>Credential ID (Optional)</FormLabel>
                      <Input
                        placeholder="ABC123XYZ"
                        value={cert.credentialId || ''}
                        onChange={(e) => updateCertificate(index, 'credentialId', e.target.value)}
                      />
                    </div>
                    <div>
                      <FormLabel>Certificate URL</FormLabel>
                      <FileUpload
                        onUploadComplete={(url) => updateCertificate(index, 'certificateUrl', url)}
                        accept="image/*,.pdf"
                        maxSize={5}
                        folder="certificates"
                        label="Upload Certificate"
                        currentFile={cert.certificateUrl}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        {/* Media */}
        <Card>
          <CardHeader>
            <CardTitle>Media & Documents</CardTitle>
            <CardDescription>Upload your resume and demo videos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <FormLabel>Resume</FormLabel>
              <ResumeUpload
                onUploadComplete={setResumeUrl}
                onParsedData={handleParsedResumeData}
                currentFile={resumeUrl}
                enableParsing={true}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Upload your resume to automatically fill your profile information
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Demo Videos</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const url = prompt('Enter video URL (YouTube, Vimeo, etc.):');
                    if (url) addVideoUrl(url);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video URL
                </Button>
              </div>
              <div className="space-y-2">
                {videoUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input value={url} readOnly />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeVideoUrl(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <FileUpload
                onUploadComplete={addVideoUrl}
                accept="video/*"
                maxSize={50}
                folder="videos"
                label="Or Upload Video File"
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
          {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Profile
        </Button>
      </form>
    </Form>
  );
}
