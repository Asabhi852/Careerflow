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
import { useState } from 'react';
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

export function SignupForm() {
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
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
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Resume file must be less than 5MB.',
        });
        return;
      }
      setResumeFile(file);
      
      // Parse resume and auto-fill form
      await parseResumeAndFillForm(file);
    }
  };

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
        return;
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
          // Store phone number if needed (add to form schema)
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
      toast({
        variant: 'destructive',
        title: 'Resume parsing failed',
        description: 'Could not parse your resume. Please fill the form manually.',
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
          
          if (file.type === 'application/pdf') {
            // For PDF files, use pdfjs-dist
            try {
              const pdfjsLib = await import('pdfjs-dist');
              
              // Set worker source
              pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
              
              const typedArray = new Uint8Array(content as ArrayBuffer);
              const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
              
              let fullText = '';
              
              // Extract text from each page
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                  .map((item: any) => item.str)
                  .join(' ');
                fullText += pageText + '\n';
              }
              
              resolve(fullText);
            } catch (pdfError) {
              console.error('PDF parsing error:', pdfError);
              reject(new Error('Failed to parse PDF file'));
            }
          } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     file.type === 'application/msword') {
            // For Word documents, read as text (basic implementation)
            // For better parsing, consider using mammoth.js
            const text = content as string;
            resolve(text);
          } else {
            // For plain text files
            resolve(content as string);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      // Read as ArrayBuffer for PDF, text for others
      if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
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
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* User Type Selection */}
        <FormField
          control={form.control}
          name="userType"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>I am a</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="job_seeker">Job Seeker</SelectItem>
                  <SelectItem value="recruiter">Recruiter</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Your personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              name="email"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location"
                render={({ field }: any) => (
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
                name="age"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 25" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interests"
              render={({ field }: any) => (
                <FormItem>
                  <FormLabel>Interests</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your interests, separated by commas"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    List a few of your interests like "Web Development, Hiking, Photography".
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Job Seeker Specific Fields */}
        {userType === 'job_seeker' && (
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
              <CardDescription>Your career details and experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Resume Upload */}
              <div className="space-y-2">
                <FormLabel>Resume</FormLabel>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleResumeUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={isParsing}
                  />
                  <label
                    htmlFor="resume-upload"
                    className={`flex items-center space-x-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 flex-1 ${isParsing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isParsing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Parsing resume...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>{resumeFile ? resumeFile.name : 'Upload Resume'}</span>
                      </>
                    )}
                  </label>
                  {resumeFile && !isParsing && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setResumeFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <FormDescription>
                  Upload your resume (PDF, DOC, DOCX, TXT) - Max 5MB. Your information will be automatically filled.
                </FormDescription>
              </div>

              {/* Current Position */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="currentJobTitle"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Current Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Software Engineer" {...field} />
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
                        <Input placeholder="e.g. Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Skills */}
              <FormField
                control={form.control}
                name="skills"
                render={({ field }: any) => (
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
                      List your technical and soft skills like "JavaScript, React, Leadership".
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Education */}
              <FormField
                control={form.control}
                name="education"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Education</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your educational background"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Include your degree, university, and graduation year.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Work Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormLabel>Work Experience</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addWorkExperience}
                  >
                    Add Experience
                  </Button>
                </div>
                {workExperience.map((exp: any, index: any) => (
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
                            onChange={(e: any) => updateWorkExperience(index, 'company', e.target.value)}
                          />
                        </div>
                        <div>
                          <FormLabel>Position</FormLabel>
                          <Input
                            placeholder="Job title"
                            value={exp.position}
                            onChange={(e: any) => updateWorkExperience(index, 'position', e.target.value)}
                          />
                        </div>
                        <div>
                          <FormLabel>Start Date</FormLabel>
                          <Input
                            type="date"
                            value={exp.startDate}
                            onChange={(e: any) => updateWorkExperience(index, 'startDate', e.target.value)}
                          />
                        </div>
                        <div>
                          <FormLabel>End Date</FormLabel>
                          <Input
                            type="date"
                            placeholder="Leave empty if current"
                            value={exp.endDate}
                            onChange={(e: any) => updateWorkExperience(index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="mt-4">
                        <FormLabel>Description</FormLabel>
                        <Textarea
                          placeholder="Describe your role and achievements"
                          value={exp.description}
                          onChange={(e: any) => updateWorkExperience(index, 'description', e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recruiter Specific Fields */}
        {userType === 'recruiter' && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Your company and hiring details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
