
'use client';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { useFirestore, useUser } from "@/firebase"
// @ts-ignore - Firebase Firestore import issue
import { collection, addDoc } from "firebase/firestore"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { errorEmitter } from "@/firebase/error-emitter"
import { FirestorePermissionError } from "@/firebase/errors"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"


const formSchema = (z as any).object({
    title: (z as any).string().min(5, "Title must be at least 5 characters."),
    
    // Organization Details
    organizationType: (z as any).string().min(1, "Organization type is required."),
    organizationName: (z as any).string().min(2, "Organization name is required."),
    organizationDescription: (z as any).string().min(20, "Organization description must be at least 20 characters."),
    organizationWebsite: (z as any).string().url("Must be a valid URL.").optional().or((z as any).literal('')),
    organizationEmail: (z as any).string().email("Must be a valid email.").optional().or((z as any).literal('')),
    industry: (z as any).string().optional(),
    organizationSize: (z as any).string().optional(),
    
    // Job Details
    location: (z as any).string().min(2, "Location is required."),
    salary: (z as any).coerce.number().positive().optional(),
    applicationUrl: (z as any).string().url("Must be a valid URL.").optional().or((z as any).literal('')),
    description: (z as any).string().min(20, "Description must be at least 20 characters."),
    skills: (z as any).string().optional(),
    category: (z as any).string().min(1, "Category is required."),
})

interface CreateJobPostingDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CreateJobPostingDialog({ open, onOpenChange }: CreateJobPostingDialogProps) {
  const firestore = useFirestore();
  const { user } = useUser();

  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: "",
        organizationType: "",
        organizationName: "",
        organizationDescription: "",
        organizationWebsite: "",
        organizationEmail: "",
        industry: "",
        organizationSize: "",
        location: "",
        salary: undefined,
        applicationUrl: "",
        description: "",
        skills: "",
        category: "",
    },
  });
  
  const organizationType = form.watch('organizationType');

  async function onSubmit(values: any) {
    if (!firestore || !user) {
        toast({ variant: "destructive", title: "Error", description: "You must be logged in to post a job." });
        return;
    }
    
    const skillsArray = values.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];

    const jobData = {
        ...values,
        skills: skillsArray,
        posterId: user.uid,
        postedAt: new Date().toISOString(),
        status: 'active',
        // Add company field for backward compatibility
        company: values.organizationName || values.company || 'Unknown Company',
    };

    // Remove undefined and empty string values to avoid Firestore errors
    const cleanJobData = Object.fromEntries(
        Object.entries(jobData).filter(([_, value]) => value !== undefined && value !== '')
    );

    try {
        const jobsCollection = collection(firestore, 'job_postings');
        await addDoc(jobsCollection, cleanJobData)
        .catch(error => {
            errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: jobsCollection.path,
                operation: 'create',
                requestResourceData: cleanJobData,
            })
            )
            throw error;
        });

        toast({
            title: "Job Posted!",
            description: "Your job posting is now live.",
        });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        console.error("Error posting job:", error);
        toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "Could not post the job. Please try again.",
        });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        {/* @ts-ignore - DialogHeader children prop */}
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Job Posting</DialogTitle>
          <DialogDescription>
            Fill out the details below to post a new job opportunity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Organization Information Section */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Organization Information</h3>
              
              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <FormControl>
                      <select
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      >
                        <option value="">Select type</option>
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
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="organizationName"
                  render={({ field }) => (
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry / Field</FormLabel>
                      <FormControl>
                        <Input placeholder="Technology, Education, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="organizationDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder="About your organization..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="organizationWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="organizationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="organizationSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Size (Optional)</FormLabel>
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
            </div>
            
            {/* Job Details Section */}
            <div className="space-y-3 pt-2 border-t">
              <h3 className="text-sm font-semibold">Job Details</h3>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Senior Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    name="salary"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Salary (Optional)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g. 120000" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
            
            <FormField
              control={form.control}
              name="applicationUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://yourcompany.com/careers/apply"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a job category" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="software">Software Development</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="doctor">Doctor</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="housekeeper">Housekeeper</SelectItem>
                            <SelectItem value="babysitter">Baby Takecare</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Description</FormLabel>
                  <FormControl>
                    <Textarea rows={5} placeholder="Describe the role, responsibilities, and qualifications..." {...field} />
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
                  <FormLabel>Required Skills (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. React, TypeScript, Node.js" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Post Job
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
