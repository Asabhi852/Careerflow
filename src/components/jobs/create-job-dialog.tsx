
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
    company: (z as any).string().min(2, "Company name is required."),
    location: (z as any).string().min(2, "Location is required."),
    salary: (z as any).coerce.number().positive().optional(),
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
        company: "",
        location: "",
        salary: undefined,
        description: "",
        skills: "",
        category: "",
    },
  });

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
    };

    try {
        const jobsCollection = collection(firestore, 'job_postings');
        await addDoc(jobsCollection, jobData)
        .catch(error => {
            errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: jobsCollection.path,
                operation: 'create',
                requestResourceData: jobData,
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
      <DialogContent className="sm:max-w-[625px]">
        {/* @ts-ignore - DialogHeader children prop */}
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New Job Posting</DialogTitle>
          <DialogDescription>
            Fill out the details below to post a new job opportunity.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g. Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
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
