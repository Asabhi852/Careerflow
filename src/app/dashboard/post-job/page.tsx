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
import { Loader2 } from 'lucide-react';
import { useUser, useFirestore, addDocumentNonBlocking } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const jobFormSchema = (z as any).object({
  title: (z as any).string().min(3, { message: 'Job title must be at least 3 characters.' }),
  company: (z as any).string().min(2, { message: 'Company name must be at least 2 characters.' }),
  location: (z as any).string().min(2, { message: 'Location is required.' }),
  description: (z as any).string().min(50, { message: 'Description must be at least 50 characters.' }),
  salary: (z as any).coerce.number().positive().optional(),
  skills: (z as any).string().optional(),
  category: (z as any).string().optional(),
  employmentType: (z as any).string().optional(),
  experienceLevel: (z as any).string().optional(),
  benefits: (z as any).string().optional(),
});

export default function PostJobPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<any>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      description: '',
      salary: undefined,
      skills: '',
      category: '',
      employmentType: 'full-time',
      experienceLevel: 'mid',
      benefits: '',
    },
  });

  async function onSubmit(data: any) {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to post a job.',
      });
      return;
    }

    try {
      const skillsArray = data.skills?.split(',').map((s: string) => s.trim()).filter(Boolean) || [];
      const benefitsArray = data.benefits?.split('\n').map((s: string) => s.trim()).filter(Boolean) || [];

      const jobData = {
        ...data,
        skills: skillsArray,
        benefits: benefitsArray,
        posterId: user.uid,
        postedAt: new Date().toISOString(),
        status: 'active',
      };

      const jobsRef = collection(firestore, 'jobs');
      await addDocumentNonBlocking(jobsRef, jobData);

      toast({
        title: 'Job Posted',
        description: 'Your job posting has been published successfully.',
      });

      router.push('/dashboard/jobs');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Could not post job.',
      });
    }
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-headline text-3xl font-bold tracking-tight">Post a Job</h1>
        <p className="text-muted-foreground mt-2">
          Create a new job posting to find the perfect candidate
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
          <CardDescription>Fill in the information about the position</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                  name="company"
                  render={({ field }: any) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Tech Corp" {...field} />
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
                name="category"
                render={({ field }: any) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input placeholder="Engineering, Design, Marketing, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex gap-4">
                <Button type="submit" disabled={form.formState.isSubmitting} className="flex-1">
                  {form.formState.isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Post Job
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
        </CardContent>
      </Card>
    </div>
  );
}
