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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import type { JobPosting } from '@/lib/types';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const jobFormSchema = (z as any).object({
  title: (z as any).string().min(3, { message: 'Job title must be at least 3 characters.' }),
  
  // Organization Details
  organizationType: (z as any).string().min(1, { message: 'Organization type is required.' }),
  organizationName: (z as any).string().min(2, { message: 'Organization name must be at least 2 characters.' }),
  organizationWebsite: (z as any).string().url({ message: 'Must be a valid URL.' }).optional().or((z as any).literal('')),
  organizationEmail: (z as any).string().email({ message: 'Must be a valid email.' }).optional().or((z as any).literal('')),
  organizationPhone: (z as any).string().optional(),
  organizationAddress: (z as any).string().optional(),
  organizationDescription: (z as any).string().min(20, { message: 'Organization description must be at least 20 characters.' }),
  
  // Industry/Field specific
  industry: (z as any).string().optional(),
  organizationSize: (z as any).string().optional(),
  foundedYear: (z as any).coerce.number().positive().optional().or((z as any).literal('')),
  
  // For Schools/Colleges
  accreditation: (z as any).string().optional(),
  programsOffered: (z as any).string().optional(),
  
  // Job Details
  location: (z as any).string().min(2, { message: 'Location is required.' }),
  description: (z as any).string().min(50, { message: 'Description must be at least 50 characters.' }),
  salary: (z as any).coerce.number().positive().optional(),
  applicationUrl: (z as any).string().url({ message: 'Must be a valid URL.' }).optional().or((z as any).literal('')),
  skills: (z as any).string().optional(),
  category: (z as any).string().optional(),
  employmentType: (z as any).string().optional(),
  experienceLevel: (z as any).string().optional(),
  benefits: (z as any).string().optional(),
});

export default function EditJobPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = use(params as Promise<{ id: string }>);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const jobRef = useMemoFirebase(() => {
    if (!firestore || !resolvedParams.id) return null;
    return doc(firestore, 'jobs', resolvedParams.id);
  }, [firestore, resolvedParams.id]);

  const { data: job, isLoading } = useDoc<JobPosting>(jobRef);

  const form = useForm<any>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      organizationType: '',
      organizationName: '',
      organizationWebsite: '',
      organizationEmail: '',
      organizationPhone: '',
      organizationAddress: '',
      organizationDescription: '',
      industry: '',
      organizationSize: '',
      foundedYear: undefined,
      accreditation: '',
      programsOffered: '',
      location: '',
      description: '',
      salary: undefined,
      applicationUrl: '',
      skills: '',
      category: '',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      benefits: '',
    },
  });

  const organizationType = form.watch('organizationType');

  // Populate form when job data loads
  useEffect(() => {
    if (job) {
      const skillsString = Array.isArray(job.skills) ? job.skills.join(', ') : '';
      const benefitsString = Array.isArray(job.benefits) ? job.benefits.join('\n') : '';
      
      form.reset({
        title: job.title || '',
        organizationType: job.organizationType || '',
        organizationName: job.organizationName || job.company || '',
        organizationWebsite: job.organizationWebsite || '',
        organizationEmail: job.organizationEmail || '',
        organizationPhone: job.organizationPhone || '',
        organizationAddress: job.organizationAddress || '',
        organizationDescription: job.organizationDescription || '',
        industry: job.industry || '',
        organizationSize: job.organizationSize || '',
        foundedYear: job.foundedYear || undefined,
        accreditation: job.accreditation || '',
        programsOffered: job.programsOffered || '',
        location: job.location || '',
        description: job.description || '',
        salary: job.salary || undefined,
        applicationUrl: job.applicationUrl || '',
        skills: skillsString,
        category: job.category || '',
        employmentType: job.employmentType || 'full-time',
        experienceLevel: job.experienceLevel || 'mid',
        benefits: benefitsString,
      });
    }
  }, [job, form]);

  // Check if user is the job owner
  if (!isLoading && job && user && job.posterId !== user.uid) {
    console.log('User is not the owner, redirecting...', {
      userId: user.uid,
      posterId: job.posterId
    });
    router.push(`/jobs/${resolvedParams.id}`);
    return null;
  }

  console.log('Edit page loaded', {
    isLoading,
    hasJob: !!job,
    hasUser: !!user,
    isOwner: job && user && job.posterId === user.uid
  });

  async function onSubmit(data: any) {
    if (!user || !firestore || !jobRef) {
      console.error('Missing required data:', { user: !!user, firestore: !!firestore, jobRef: !!jobRef });
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to edit a job.',
      });
      return;
    }

    console.log('Submitting job update...', data);

    try {
      const skillsArray = data.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
      const benefitsArray = data.benefits?.split('\n').map((s: string) => s.trim()).filter(Boolean) || [];

      const jobData = {
        ...data,
        skills: skillsArray,
        benefits: benefitsArray,
        company: data.organizationName || data.company || 'Unknown Company',
        updatedAt: new Date().toISOString(),
      };

      // Remove undefined and empty string values
      const cleanJobData = Object.fromEntries(
        Object.entries(jobData).filter(([_, value]) => value !== undefined && value !== '')
      );

      console.log('Updating job with data:', cleanJobData);
      
      await updateDoc(jobRef, cleanJobData);

      console.log('Job updated successfully');
      
      toast({
        title: 'Job Updated',
        description: 'Your job posting has been updated successfully.',
      });

      router.push(`/jobs/${resolvedParams.id}`);
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not update job.',
      });
    }
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-12 w-3/4" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <h3 className="text-2xl font-semibold">Job not found</h3>
        <p className="text-muted-foreground mt-2">This job posting may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href={`/jobs/${resolvedParams.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job
          </Link>
        </Button>
      </div>
      
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Edit Job</h1>
        <p className="text-muted-foreground mt-2">
          Update the job posting details
        </p>
      </div>

      {/* Rest of the form - same structure as post-job page */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Organization Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>Update details about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Select organization type</option>
                        <option value="company">Company / Business</option>
                        <option value="startup">Startup</option>
                        <option value="school">School</option>
                        <option value="college">College / University</option>
                        <option value="nonprofit">Non-Profit Organization</option>
                        <option value="government">Government Agency</option>
                        <option value="healthcare">Healthcare Facility</option>
                        <option value="other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Corp Inc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Industry / Field</FormLabel>
                      <FormControl>
                        <Input placeholder="Technology, Education, Healthcare, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="organizationDescription"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Organization Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your organization, its mission, and what makes it unique..."
                        className="resize-y min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This helps candidates understand your organization better
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationWebsite"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationEmail"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationPhone"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="organizationAddress"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="organizationSize"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Organization Size</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="">Select size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501-1000">501-1000 employees</option>
                          <option value="1000+">1000+ employees</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foundedYear"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Founded Year</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2020"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Conditional fields for Schools/Colleges */}
              {(organizationType === 'school' || organizationType === 'college') && (
                <>
                  <FormField
                    control={form.control}
                    name="accreditation"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Accreditation</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Regional, National, or specific accrediting body" {...field} />
                        </FormControl>
                        <FormDescription>
                          Accreditation details for your institution
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="programsOffered"
                    render={({ field }: any) => (
                      <FormItem>
                        <FormLabel>Programs Offered</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="List main programs, degrees, or courses offered..."
                            className="resize-y"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Job Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
              <CardDescription>Update the position information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Job Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Engineering, Design, Marketing, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  name="salary"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Salary (USD/year)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="120000"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>Annual salary in USD</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="applicationUrl"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Application URL (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="https://yourcompany.com/careers/apply"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Direct link where candidates can apply (e.g., your company's career page). If provided, an "Apply on Website" button will be shown.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="full-time">Full-time</option>
                          <option value="part-time">Part-time</option>
                          <option value="contract">Contract</option>
                          <option value="internship">Internship</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="experienceLevel"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Experience Level</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                        >
                          <option value="entry">Entry Level</option>
                          <option value="mid">Mid Level</option>
                          <option value="senior">Senior Level</option>
                          <option value="lead">Lead/Principal</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>


              <FormField
                control={form.control}
                name="description"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and requirements..."
                        className="resize-y min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed description of the position
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="skills"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Required Skills</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="React, Node.js, TypeScript, AWS"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Comma-separated list of required skills</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Health insurance&#10;401k matching&#10;Remote work&#10;Flexible hours"
                        className="resize-y"
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>One benefit per line</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
              {form.formState.isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Update Job
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
