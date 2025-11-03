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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Loader2, ArrowLeft, FileText, Video, Award, Briefcase } from 'lucide-react';
import Link from 'next/link';
import type { Certificate, WorkExperience } from '@/lib/types';

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<'text' | 'video' | 'certificate' | 'work_experience'>('text');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'other' as const,
    tags: '',
    imageUrl: '',
    videoUrl: '',
    videoThumbnail: '',
  });
  const [certificate, setCertificate] = useState<Omit<Certificate, 'id'>>({
    name: '',
    issuer: '',
    issueDate: '',
    expiryDate: '',
    certificateUrl: '',
    credentialId: '',
  });
  const [workExperience, setWorkExperience] = useState<WorkExperience>({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: '',
    current: false,
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

      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Anonymous',
        authorProfilePicture: user.photoURL || '',
        authorJobTitle: '',
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: postType,
        category: formData.category,
        tags: tagsArray,
        visibility: 'public',
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        createdAt: serverTimestamp(),
        featured: false,
      };

      // Add type-specific data
      if (postType === 'video' && formData.videoUrl) {
        postData.videoUrl = formData.videoUrl.trim();
        postData.videoThumbnail = formData.videoThumbnail.trim();
      } else if (postType === 'certificate' && certificate.name) {
        postData.certificate = { id: Date.now().toString(), ...certificate };
      } else if (postType === 'work_experience' && workExperience.company) {
        postData.workExperience = workExperience;
      } else if (formData.imageUrl) {
        postData.imageUrl = formData.imageUrl.trim();
      }

      await addDoc(collection(firestore, 'posts'), postData);

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
                Share your career insights, tips, videos, certificates, or work experience with the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Post Type Selector */}
                <div className="space-y-2">
                  <Label>Post Type *</Label>
                  <Tabs value={postType} onValueChange={(value: any) => setPostType(value)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="text" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Text</span>
                      </TabsTrigger>
                      <TabsTrigger value="video" className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        <span className="hidden sm:inline">Video</span>
                      </TabsTrigger>
                      <TabsTrigger value="certificate" className="flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        <span className="hidden sm:inline">Certificate</span>
                      </TabsTrigger>
                      <TabsTrigger value="work_experience" className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        <span className="hidden sm:inline">Experience</span>
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Badge variant="secondary" className="mt-2">
                    All posts are public and visible to everyone
                  </Badge>
                </div>

                {/* Common Fields */}
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
                      <SelectItem value="work_experience">Work Experience</SelectItem>
                      <SelectItem value="certification">Certification</SelectItem>
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
                    rows={8}
                    required
                  />
                </div>

                {/* Type-Specific Fields */}
                {postType === 'video' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Video className="h-5 w-5" />
                      Video Details
                    </h3>
                    <div className="space-y-2">
                      <Label htmlFor="videoUrl">Video URL * (YouTube, Vimeo, etc.)</Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.videoUrl}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="videoThumbnail">Thumbnail URL (Optional)</Label>
                      <Input
                        id="videoThumbnail"
                        type="url"
                        placeholder="https://example.com/thumbnail.jpg"
                        value={formData.videoThumbnail}
                        onChange={(e) => setFormData({ ...formData, videoThumbnail: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {postType === 'certificate' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certificate Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="certName">Certificate Name *</Label>
                        <Input
                          id="certName"
                          placeholder="e.g., AWS Certified Solutions Architect"
                          value={certificate.name}
                          onChange={(e) => setCertificate({ ...certificate, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issuer">Issuing Organization *</Label>
                        <Input
                          id="issuer"
                          placeholder="e.g., Amazon Web Services"
                          value={certificate.issuer}
                          onChange={(e) => setCertificate({ ...certificate, issuer: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="issueDate">Issue Date *</Label>
                        <Input
                          id="issueDate"
                          type="date"
                          value={certificate.issueDate}
                          onChange={(e) => setCertificate({ ...certificate, issueDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                        <Input
                          id="expiryDate"
                          type="date"
                          value={certificate.expiryDate}
                          onChange={(e) => setCertificate({ ...certificate, expiryDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="certUrl">Certificate URL (Optional)</Label>
                        <Input
                          id="certUrl"
                          type="url"
                          placeholder="https://example.com/certificate.pdf"
                          value={certificate.certificateUrl}
                          onChange={(e) => setCertificate({ ...certificate, certificateUrl: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="credentialId">Credential ID (Optional)</Label>
                        <Input
                          id="credentialId"
                          placeholder="e.g., ABC123XYZ"
                          value={certificate.credentialId}
                          onChange={(e) => setCertificate({ ...certificate, credentialId: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {postType === 'work_experience' && (
                  <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      Work Experience Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company Name *</Label>
                        <Input
                          id="company"
                          placeholder="e.g., Google Inc."
                          value={workExperience.company}
                          onChange={(e) => setWorkExperience({ ...workExperience, company: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Position/Role *</Label>
                        <Input
                          id="position"
                          placeholder="e.g., Senior Software Engineer"
                          value={workExperience.position}
                          onChange={(e) => setWorkExperience({ ...workExperience, position: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Start Date *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={workExperience.startDate}
                          onChange={(e) => setWorkExperience({ ...workExperience, startDate: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={workExperience.endDate}
                          onChange={(e) => setWorkExperience({ ...workExperience, endDate: e.target.value })}
                          disabled={workExperience.current}
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="checkbox"
                            id="current"
                            checked={workExperience.current}
                            onChange={(e) => setWorkExperience({ ...workExperience, current: e.target.checked, endDate: e.target.checked ? '' : workExperience.endDate })}
                            className="rounded"
                          />
                          <Label htmlFor="current" className="cursor-pointer">I currently work here</Label>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="workDesc">Description (Optional)</Label>
                        <Textarea
                          id="workDesc"
                          placeholder="Describe your responsibilities and achievements..."
                          value={workExperience.description}
                          onChange={(e) => setWorkExperience({ ...workExperience, description: e.target.value })}
                          rows={4}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {postType === 'text' && (
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
                )}

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
