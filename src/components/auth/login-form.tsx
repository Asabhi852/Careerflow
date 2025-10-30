'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/firebase';
// @ts-ignore - Firebase auth import issue
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const formSchema = (z as any).object({
  email: (z as any).string().email({ message: 'Please enter a valid email.' }),
  password: (z as any).string().min(1, { message: 'Password is required.' }),
});

export function LoginForm() {
  const auth = useAuth();
  const router = useRouter();
  const form = useForm<any>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: any) {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'Firebase Auth is not initialized. Please refresh the page.',
      });
      return;
    }
    
    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: 'Login Successful',
        description: 'You are now logged in.',
      });
      router.push('/home');
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Could not sign in.';
      
      if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
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
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Login
        </Button>
      </form>
    </Form>
  );
}
