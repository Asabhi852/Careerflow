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
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { ref, uploadBytes as uploadBytesStorage, getDownloadURL as getDownloadURLStorage } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useState, useCallback, useEffect } from 'react';
import { initializeFirebase } from '@/firebase';

const formSchema = (z as any).object({
  userType: (z as any).enum(['job_seeker', 'recruiter'], { required_error: 'Please select your user type.' }),
  firstName: (z as any).string().min(1, { message: 'First name is required.' }),
  lastName: (z as any).string().min(1, { message: 'Last name is required.' }),
  email: (z as any).string().email({ message: 'Please enter a valid email.' }),
  password: (z as any).string().min(8, { message: 'Password must be at least 8 characters.' }),
  location: (z as any).string().optional(),
  age: (z as any).coerce.number().positive().optional(),
  interests: (z as any).string().optional(),
  // Job seeker specific fields
  resume: (z as any).any().optional(),
  currentJobTitle: (z as any).string().optional(),
  currentCompany: (z as any).string().optional(),
  workExperience: (z as any).array((z as any).object({
    company: (z as any).string(),
    position: (z as any).string(),
    startDate: (z as any).string(),
    endDate: (z as any).string().optional(),
    description: (z as any).string().optional(),
  })).optional(),
  skills: (z as any).string().optional(),
  education: (z as any).string().optional(),
  // Recruiter specific fields
  companyName: (z as any).string().optional(),
  companySize: (z as any).string().optional(),
  industry: (z as any).string().optional(),
  hiringRole: (z as any).string().optional(),
});

// Form steps
type SignupStep = 'userType' | 'resume' | 'basic' | 'experience' | 'final';

export function SignupForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<SignupStep>('userType');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [workExperience, setWorkExperience] = useState<Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    current?: boolean;
  }>>([]);

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userType: 'job_seeker',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      location: '',
      age: undefined,
      interests: '',
      currentJobTitle: '',
      currentCompany: '',
      skills: '',
      education: '',
      companyName: '',
      companySize: '',
      industry: '',
      hiringRole: '',
    },
  });

  const userType = form.watch('userType');

  const handleResumeUpload = async (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain'
      ];
      const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
      const hasValidType = validTypes.includes(file.type) || 
                          validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!hasValidType) {
        toast({
          variant: 'destructive',
          title: 'Invalid file type',
          description: 'Please upload a PDF, DOCX, DOC, or TXT file.',
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Please upload a resume under 5MB.',
        });
        return;
      }
      
      setResumeFile(file);
      
      toast({
        title: 'Processing resume...',
        description: 'Extracting information from your resume.',
      });
      
      // Parse resume and auto-fill form
      const success = await parseResumeAndFillForm(file);
      if (success) {
        setCurrentStep('basic');
      }
    }
  };

  const handleResumeDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleResumeUpload({ target: { files: [file] } });
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const parseResumeAndFillForm = async (file: File) => {
    setIsParsing(true);
    try {
      // Extract text from the resume file
      const resumeText = await extractTextFromFile(file);
      
      if (!resumeText || resumeText.trim().length < 50) {
        toast({
          variant: 'destructive',
          title: 'Unable to parse resume',
          description: 'Could not extract text from the resume. Please fill the form manually.',
        });
        setIsParsing(false);
        return false;
      }

      // Call API route to parse resume
      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resumeText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to parse resume');
      }

      const result = await response.json();
      const parsedData = result.data;
      
      // Store parsed data for multi-step form
      setParsedData(parsedData);
      
      // Auto-fill form fields with parsed data
      if (parsedData.personalInfo) {
        if (parsedData.personalInfo.firstName) {
          form.setValue('firstName', parsedData.personalInfo.firstName);
        }
        if (parsedData.personalInfo.lastName) {
          form.setValue('lastName', parsedData.personalInfo.lastName);
        }
        if (parsedData.personalInfo.email) {
          form.setValue('email', parsedData.personalInfo.email);
        }
        if (parsedData.personalInfo.phoneNumber) {
          form.setValue('phone', parsedData.personalInfo.phoneNumber);
        }
        if (parsedData.personalInfo.location) {
          form.setValue('location', parsedData.personalInfo.location);
        }
        if (parsedData.personalInfo.age) {
          form.setValue('age', parsedData.personalInfo.age);
        }
      }

      if (parsedData.professionalSummary) {
        if (parsedData.professionalSummary.currentJobTitle) {
          form.setValue('currentJobTitle', parsedData.professionalSummary.currentJobTitle);
        }
        if (parsedData.professionalSummary.currentCompany) {
          form.setValue('currentCompany', parsedData.professionalSummary.currentCompany);
        }
        if (parsedData.professionalSummary.bio) {
          form.setValue('summary', parsedData.professionalSummary.bio);
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
      }

      // Fill education
      if (parsedData.education && parsedData.education.length > 0) {
        const educationText = parsedData.education
          .map(edu => `${edu.degree} in ${edu.field} from ${edu.institution}${edu.graduationYear ? ` (${edu.graduationYear})` : ''}`)
          .join('\n');
        form.setValue('education', educationText);
      }
      
      // Fill work experience if available
      if (parsedData.workExperience && parsedData.workExperience.length > 0) {
        setWorkExperience(parsedData.workExperience);
      }

      // Fill interests
      if (parsedData.interests && parsedData.interests.length > 0) {
        form.setValue('interests', parsedData.interests.join(', '));
      }

      // Fill work experience
      if (parsedData.workExperience && parsedData.workExperience.length > 0) {
        const formattedExperience = parsedData.workExperience.map(exp => ({
          company: exp.company || '',
          position: exp.position || '',
          startDate: exp.startDate || '',
          endDate: exp.endDate || '',
          description: exp.description || '',
          current: exp.current || false,
        }));
        setWorkExperience(formattedExperience);
      }

      toast({
        title: 'Resume parsed successfully!',
        description: 'Your information has been automatically filled. Please review and update as needed.',
      });
    } catch (error: any) {
      console.error('Resume parsing error:', error);
      
      // Provide specific error messages
      let errorMessage = 'Could not parse your resume. Please fill the form manually.';
      
      if (error.message?.includes('PDF')) {
        errorMessage = 'Failed to extract text from PDF. The file may be image-based, corrupted, or password-protected. Try converting to DOCX or fill manually.';
      } else if (error.message?.includes('Word') || error.message?.includes('DOCX')) {
        errorMessage = 'Failed to parse Word document. The file may be corrupted. Try saving as PDF or fill manually.';
      } else if (error.message?.includes('API') || error.message?.includes('parse-resume')) {
        errorMessage = 'Resume parsing service is unavailable. Please fill the form manually.';
      }
      
      toast({
        variant: 'destructive',
        title: 'Resume parsing failed',
        description: errorMessage,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result;
          
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // For PDF files, use API route to parse on server side
            try {
              if (!content) {
                throw new Error('No content to parse');
              }
              
              // Convert ArrayBuffer to base64 for API transmission
              const bytes = new Uint8Array(content as ArrayBuffer);
              let binary = '';
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64 = btoa(binary);
              
              console.log('Sending PDF to server for parsing...');
              
              // Send to API route for server-side parsing
              const response = await fetch('/api/parse-pdf', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ pdfData: base64 }),
              });
              
              if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to parse PDF');
              }
              
              const result = await response.json();
              const fullText = result.text || '';
              
              if (!fullText || fullText.trim().length === 0) {
                throw new Error('No text could be extracted from PDF. The PDF may be image-based or empty.');
              }
              
              console.log(`Successfully extracted ${fullText.length} characters from PDF`);
              resolve(fullText);
            } catch (pdfError: any) {
              console.error('PDF parsing error:', pdfError);
              const errorMessage = pdfError?.message || 'Unknown error';
              reject(new Error(`Failed to parse PDF file: ${errorMessage}`));
            }
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     file.type === 'application/msword' || 
                     file.name.endsWith('.docx') || 
                     file.name.endsWith('.doc')) {
            // For Word documents, use mammoth.js to extract text
            try {
              const mammoth = await import('mammoth');
              const arrayBuffer = content as ArrayBuffer;
              const result = await mammoth.extractRawText({ arrayBuffer });
              resolve(result.value);
            } catch (docxError) {
              console.error('DOCX parsing error:', docxError);
              reject(new Error('Failed to parse Word document. Please ensure mammoth is installed.'));
            }
          } else {
            // For plain text files
            resolve(content as string);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Read as ArrayBuffer for PDF and DOCX, text for others
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const isWord = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                     file.type === 'application/msword' ||
                     file.name.toLowerCase().endsWith('.docx') || 
                     file.name.toLowerCase().endsWith('.doc');
      
      if (isPDF || isWord) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  async function onSubmit(values: any) {
    if (!auth || !firestore) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );
      const user = userCredential.user;

      if (user) {
        const profileRef = doc(firestore, 'users', user.uid);
        const publicProfileRef = doc(firestore, 'public_profiles', user.uid);
        const interestsArray = values.interests?.split(',').map((s: any) => s.trim()).filter(Boolean) || [];
        const skillsArray = values.skills?.split(',').map((s: any) => s.trim()).filter(Boolean) || [];

        let resumeUrl = '';
        if (resumeFile && values.userType === 'job_seeker') {
          const { storage } = initializeFirebase();
          const resumeRef = ref(storage, `resumes/${user.uid}/${resumeFile.name}`);
          await uploadBytesStorage(resumeRef, resumeFile);
          resumeUrl = await getDownloadURLStorage(resumeRef);
        }

        const profileData = {
          id: user.uid,
          userType: values.userType,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          location: values.location,
          age: values.age,
          interests: interestsArray,
          createdAt: new Date().toISOString(),
          ...(values.userType === 'job_seeker' ? {
            currentJobTitle: values.currentJobTitle,
            currentCompany: values.currentCompany,
            workExperience: workExperience.filter((exp: any) => exp.company && exp.position),
            skills: skillsArray,
            education: values.education,
            resumeUrl: resumeUrl,
          } : {
            companyName: values.companyName,
            companySize: values.companySize,
            industry: values.industry,
            hiringRole: values.hiringRole,
          }),
        };

        setDocumentNonBlocking(profileRef, profileData, { merge: true });
        setDocumentNonBlocking(publicProfileRef, profileData, { merge: true });

        toast({
          title: 'Account Created',
          description: 'You have successfully signed up.',
        });
        router.push('/home');
      }
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Signup Failed',
          description: 'This email is already registered. Please try logging in.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Uh oh! Something went wrong.',
          description: error.message || 'Could not create account.',
        });
      }
    }
  };

  const addWorkExperience = () => {
    setWorkExperience([...workExperience, {
      company: '',
      position: '',
      startDate: '',
      endDate: '',
      description: '',
    }]);
  };

  const removeWorkExperience = (index: number) => {
    setWorkExperience(workExperience.filter((_: any, i: any) => i !== index));
  };

  const updateWorkExperience = (index: number, field: string, value: string) => {
    const updated = [...workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setWorkExperience(updated);
  };

  const renderUserTypeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Welcome to CareerFlow</h2>
        <p className="text-muted-foreground">Let's get started by selecting your account type</p>
      </div>
      
      <FormField
        control={form.control}
        name="userType"
        render={({ field }) => (
          <FormItem>
            <FormLabel>I am a</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              // Auto-advance to next step based on user type
              setTimeout(() => {
                if (value === 'job_seeker') {
                  setCurrentStep('resume');
                } else {
                  setCurrentStep('basic');
                }
              }, 500);
            }} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger className="h-16 text-lg">
                  <SelectValue placeholder="Select your account type" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="job_seeker" className="cursor-pointer py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold">Job Seeker</span>
                    <span className="text-sm text-muted-foreground">Looking for opportunities</span>
                  </div>
                </SelectItem>
                <SelectItem value="recruiter" className="cursor-pointer py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold">Recruiter</span>
                    <span className="text-sm text-muted-foreground">Hiring talented professionals</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );

  const renderResumeStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground">We'll use your resume to pre-fill your profile information</p>
      </div>
      
      <div 
        className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
        onDrop={handleResumeDrop}
        onDragOver={handleDragOver}
        onClick={() => document.getElementById('resume-upload')?.click()}
      >
        <div className="flex flex-col items-center justify-center space-y-4">
          <Upload className="h-12 w-12 text-muted-foreground" />
          <div>
            <p className="font-medium">Drag & drop your resume here</p>
            <p className="text-sm text-muted-foreground">or click to browse files</p>
            <p className="text-xs text-muted-foreground mt-2">Supports PDF and DOCX (max 5MB)</p>
          </div>
        </div>
        <input
          id="resume-upload"
          type="file"
          accept=".pdf,.docx"
          className="hidden"
          onChange={handleResumeUpload}
        />
      </div>
      
      <div className="text-center">
        <Button 
          variant="outline" 
          onClick={() => setCurrentStep('basic')}
          disabled={isParsing}
        >
          {isParsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Parsing resume...
            </>
          ) : (
            'Skip and fill manually'
          )}
        </Button>
      </div>
    </div>
  );

  const renderFormSteps = () => {
    switch (currentStep) {
      case 'userType':
        return renderUserTypeStep();
      
      case 'resume':
        // Only show resume step for job seekers
        if (userType === 'job_seeker') {
          return renderResumeStep();
        }
        // For recruiters, skip to basic info
        setCurrentStep('basic');
        return null;
      case 'basic':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Basic Information</h2>
              <p className="text-muted-foreground">We've pre-filled some details from your resume</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Create a strong password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (userType === 'job_seeker') {
                    setCurrentStep('resume');
                  } else {
                    setCurrentStep('userType');
                  }
                }}
              >
                Back
              </Button>
              <Button 
                onClick={() => {
                  if (userType === 'job_seeker') {
                    setCurrentStep('experience');
                  } else {
                    setCurrentStep('final');
                  }
                }}
              >
                Next: {userType === 'job_seeker' ? 'Experience' : 'Review'}
              </Button>
            </div>
          </div>
        );
      
      case 'experience':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Your Experience</h2>
              <p className="text-muted-foreground">Review and edit your work experience</p>
            </div>
            
            <FormField
              control={form.control}
              name="currentJobTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currentCompany"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Company</FormLabel>
                  <FormControl>
                    <Input placeholder="Company name" {...field} />
                  </FormControl>
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
                    <Input placeholder="e.g. JavaScript, React, Node.js" {...field} />
                  </FormControl>
                  <FormDescription>
                    Add your top skills separated by commas
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
                      placeholder="e.g. B.Tech in Computer Science from XYZ University (2020)" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep('basic')}
              >
                Back
              </Button>
              <Button 
                onClick={() => setCurrentStep('final')}
              >
                Next: Review
              </Button>
            </div>
          </div>
        );
      
      case 'final':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Review Your Profile</h2>
              <p className="text-muted-foreground">Make sure everything looks good before you continue</p>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium">Basic Information</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Account Type:</span> <span className="capitalize">{userType === 'job_seeker' ? 'Job Seeker' : 'Recruiter'}</span></p>
                  <p><span className="text-muted-foreground">Name:</span> {form.watch('firstName')} {form.watch('lastName')}</p>
                  <p><span className="text-muted-foreground">Email:</span> {form.watch('email')}</p>
                </div>
              </div>

              {/* Job Seeker Specific Info */}
              {userType === 'job_seeker' && (
                <>
                  {(form.watch('currentJobTitle') || form.watch('currentCompany')) && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Professional Details</h3>
                      <div className="mt-2 space-y-2 text-sm">
                        {form.watch('currentJobTitle') && (
                          <p><span className="text-muted-foreground">Current Role:</span> {form.watch('currentJobTitle')}</p>
                        )}
                        {form.watch('currentCompany') && (
                          <p><span className="text-muted-foreground">Company:</span> {form.watch('currentCompany')}</p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {form.watch('skills') && (
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium">Skills</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {form.watch('skills').split(',').map((skill: string, index: number) => (
                          <span key={index} className="bg-muted px-2 py-1 rounded-md text-sm">
                            {skill.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Recruiter Specific Info */}
              {userType === 'recruiter' && (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tech Corp" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companySize"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Company Size</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select company size" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-10">1-10 employees</SelectItem>
                              <SelectItem value="11-50">11-50 employees</SelectItem>
                              <SelectItem value="51-200">51-200 employees</SelectItem>
                              <SelectItem value="201-500">201-500 employees</SelectItem>
                              <SelectItem value="501-1000">501-1000 employees</SelectItem>
                              <SelectItem value="1000+">1000+ employees</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="industry"
                      render={({ field }: any) => (
                        <FormItem>
                          <FormLabel>Industry</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Technology, Healthcare" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="hiringRole"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Your Role in Hiring</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. HR Manager, Talent Acquisition" {...field} />
                        </FormControl>
                        <FormDescription>
                          Describe your role in the hiring process.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

            </div>
            
            <div className="flex justify-between pt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  if (userType === 'job_seeker') {
                    setCurrentStep('experience');
                  } else {
                    setCurrentStep('basic');
                  }
                }}
              >
                Back
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getSteps = () => {
    if (userType === 'job_seeker') {
      return ['userType', 'resume', 'basic', 'experience', 'final'];
    }
    return ['userType', 'basic', 'final'];
  };

  const getStepLabel = (step: string) => {
    const labels: { [key: string]: string } = {
      userType: 'Type',
      resume: 'Resume',
      basic: 'Basic',
      experience: 'Experience',
      final: 'Review'
    };
    return labels[step] || step;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between items-center">
          {getSteps().map((step, index) => (
            <div key={step} className="flex flex-col items-center flex-1">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep === step 
                    ? 'bg-primary text-primary-foreground' 
                    : getSteps().indexOf(currentStep) > index
                      ? 'bg-green-500 text-white'
                      : 'bg-muted text-muted-foreground'
                }`}
              >
                {getSteps().indexOf(currentStep) > index ? '✓' : index + 1}
              </div>
              <span className="text-xs mt-2 text-center">
                {getStepLabel(step)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your information to create an account</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {renderFormSteps()}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
