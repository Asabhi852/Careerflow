'use client';
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SignupForm } from "@/components/auth/signup-form"
import { Logo } from "@/components/shared/logo"
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SignupPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Only run this effect on the client-side after hydration
    if (typeof window !== 'undefined' && !isUserLoading && user) {
      router.replace('/home');
    }
  }, [user, isUserLoading, router]);

  // Avoid rendering the form until we know the user isn't logged in
  if (isUserLoading || user) {
      return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
       <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        <Card>
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
            <CardDescription>
              Join CareerFlow Connect to find your next opportunity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupForm />
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline text-primary">
                Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
