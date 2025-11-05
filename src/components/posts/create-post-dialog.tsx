'use client';

import { useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeFirebase } from '@/firebase';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { ImagePlus, Video, Award, Briefcase, X, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type PostType = 'text' | 'image' | 'video' | 'certificate' | 'work_experience';

export function CreatePostDialog() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<PostType>('text');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  
  // Media uploads
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePreview, setCertificatePreview] = useState<string>('');
  
  // Certificate details
  const [certificateName, setCertificateName] = useState('');
  const [issuingOrganization, setIssuingOrganization] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  
  // Work Experience details
  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [current, setCurrent] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Image must be less than 5MB',
        });
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Video must be less than 50MB',
        });
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: 'Certificate must be less than 5MB',
        });
        return;
      }
      setCertificateFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCertificatePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const { storage } = initializeFirebase();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setTags('');
    setImageFile(null);
    setImagePreview('');
    setVideoFile(null);
    setVideoPreview('');
    setCertificateFile(null);
    setCertificatePreview('');
    setCertificateName('');
    setIssuingOrganization('');
    setIssueDate('');
    setCredentialId('');
    setCompany('');
    setPosition('');
    setStartDate('');
    setEndDate('');
    setDescription('');
    setCurrent(false);
    setPostType('text');
  };

  const handleSubmit = async () => {
    if (!firestore || !user) return;
    if (!title || !content) {
      toast({
        variant: 'destructive',
        title: 'Missing fields',
        description: 'Please fill in title and content',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = '';
      let videoUrl = '';
      let certificateUrl = '';

      // Upload image if provided
      if (imageFile && (postType === 'image' || postType === 'text')) {
        imageUrl = await uploadFile(imageFile, `posts/images/${user.uid}/${Date.now()}_${imageFile.name}`);
      }

      // Upload video if provided
      if (videoFile && postType === 'video') {
        videoUrl = await uploadFile(videoFile, `posts/videos/${user.uid}/${Date.now()}_${videoFile.name}`);
      }

      // Upload certificate if provided
      if (certificateFile && postType === 'certificate') {
        certificateUrl = await uploadFile(certificateFile, `posts/certificates/${user.uid}/${Date.now()}_${certificateFile.name}`);
      }

      // Prepare post data
      const postData: any = {
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorProfilePicture: user.photoURL,
        title,
        content,
        type: postType,
        category: category || 'other',
        tags: tags ? tags.split(',').map(t => t.trim()) : [],
        likes: 0,
        likedBy: [],
        comments: 0,
        shares: 0,
        visibility: 'public',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Add media URLs
      if (imageUrl) postData.imageUrl = imageUrl;
      if (videoUrl) postData.videoUrl = videoUrl;

      // Add certificate details
      if (postType === 'certificate' && certificateUrl) {
        postData.certificate = {
          name: certificateName,
          issuingOrganization,
          issueDate,
          credentialId,
          imageUrl: certificateUrl,
        };
        postData.category = 'certification';
      }

      // Add work experience details
      if (postType === 'work_experience') {
        postData.workExperience = {
          company,
          position,
          startDate,
          endDate: current ? null : endDate,
          description,
          current,
        };
        postData.category = 'work_experience';
        if (imageUrl) postData.workExperience.imageUrl = imageUrl;
      }

      // Save to Firestore
      await addDoc(collection(firestore, 'posts'), postData);

      toast({
        title: 'Post created!',
        description: 'Your post has been published successfully.',
      });

      resetForm();
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to create post',
        description: error.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">Create Post</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a Post</DialogTitle>
          <DialogDescription>
            Share your experience, achievements, or certificates with the community
          </DialogDescription>
        </DialogHeader>

        <Tabs value={postType} onValueChange={(value) => setPostType(value as PostType)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="image">
              <ImagePlus className="h-4 w-4 mr-1" />
              Image
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="h-4 w-4 mr-1" />
              Video
            </TabsTrigger>
            <TabsTrigger value="certificate">
              <Award className="h-4 w-4 mr-1" />
              Certificate
            </TabsTrigger>
            <TabsTrigger value="work_experience">
              <Briefcase className="h-4 w-4 mr-1" />
              Experience
            </TabsTrigger>
          </TabsList>

          {/* Common Fields */}
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Give your post a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="Share your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
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

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g. javascript, react, career"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Text/Image Tab */}
          <TabsContent value="text" className="space-y-4">
            <div>
              <Label htmlFor="image-upload">Add Image (Optional)</Label>
              <div className="mt-2">
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              {imagePreview && (
                <div className="relative mt-4">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Image Tab */}
          <TabsContent value="image" className="space-y-4">
            <div>
              <Label htmlFor="image-upload-main">Upload Image *</Label>
              <div className="mt-2">
                <Input
                  id="image-upload-main"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  required
                />
              </div>
              {imagePreview && (
                <div className="relative mt-4">
                  <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Video Tab */}
          <TabsContent value="video" className="space-y-4">
            <div>
              <Label htmlFor="video-upload">Upload Video *</Label>
              <div className="mt-2">
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Max size: 50MB</p>
              </div>
              {videoPreview && (
                <div className="relative mt-4">
                  <video src={videoPreview} controls className="w-full h-64 rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setVideoFile(null);
                      setVideoPreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Certificate Tab */}
          <TabsContent value="certificate" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-name">Certificate Name *</Label>
                <Input
                  id="cert-name"
                  placeholder="e.g. AWS Certified Developer"
                  value={certificateName}
                  onChange={(e) => setCertificateName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cert-org">Issuing Organization *</Label>
                <Input
                  id="cert-org"
                  placeholder="e.g. Amazon Web Services"
                  value={issuingOrganization}
                  onChange={(e) => setIssuingOrganization(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cert-date">Issue Date</Label>
                <Input
                  id="cert-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="cert-id">Credential ID</Label>
                <Input
                  id="cert-id"
                  placeholder="Certificate ID or URL"
                  value={credentialId}
                  onChange={(e) => setCredentialId(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cert-upload">Upload Certificate Image *</Label>
              <div className="mt-2">
                <Input
                  id="cert-upload"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleCertificateUpload}
                  required
                />
              </div>
              {certificatePreview && (
                <div className="relative mt-4">
                  <img src={certificatePreview} alt="Certificate" className="w-full h-64 object-contain rounded-lg border" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setCertificateFile(null);
                      setCertificatePreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Work Experience Tab */}
          <TabsContent value="work_experience" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-company">Company *</Label>
                <Input
                  id="exp-company"
                  placeholder="Company name"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exp-position">Position *</Label>
                <Input
                  id="exp-position"
                  placeholder="Job title"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="exp-start">Start Date</Label>
                <Input
                  id="exp-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="exp-end">End Date</Label>
                <Input
                  id="exp-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={current}
                />
                <div className="flex items-center mt-2">
                  <input
                    id="exp-current"
                    type="checkbox"
                    checked={current}
                    onChange={(e) => setCurrent(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="exp-current" className="text-sm">I currently work here</label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="exp-desc">Description</Label>
              <Textarea
                id="exp-desc"
                placeholder="Describe your role and achievements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="exp-image">Add Image (Optional)</Label>
              <div className="mt-2">
                <Input
                  id="exp-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </div>
              {imagePreview && (
                <div className="relative mt-4">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              'Publish Post'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
