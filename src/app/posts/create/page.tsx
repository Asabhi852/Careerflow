'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as const,
    tags: '',
    imageUrl: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please log in to create a post.',
      });
      router.push('/login');
      return;
    }

    if (!formData.title.trim() || !formData.content.trim()) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please provide both title and content.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      await addDoc(collection(firestore, 'posts'), {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorProfilePicture: user.photoURL || '',
        authorJobTitle: '',
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: tagsArray,
        imageUrl: formData.imageUrl.trim() || undefined,
        likes: 0,
        likedBy: [],
        comments: 0,
        createdAt: serverTimestamp(),
        featured: false,
      });

      toast({
        title: 'Post created!',
        description: 'Your post has been published successfully.',
      });

      router.push('/posts');
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create post',
        description: error.message || 'Something went wrong.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>Please log in to create a post.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/login">Log In</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 py-12 bg-gray-50">
        <div className="container max-w-3xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/posts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Posts
            </Link>
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Create a Post</CardTitle>
              <CardDescription>
                Share your career insights, tips, or success stories with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter post title..."
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="career_advice">Career Advice</SelectItem>
                      <SelectItem value="job_search">Job Search</SelectItem>
                      <SelectItem value="interview_tips">Interview Tips</SelectItem>
                      <SelectItem value="industry_news">Industry News</SelectItem>
                      <SelectItem value="success_story">Success Story</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  <Textarea
                    id="content"
                    placeholder="Write your post content..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={10}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g., career, resume, networking (comma-separated)"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Separate tags with commas
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Publish Post
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/posts">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
