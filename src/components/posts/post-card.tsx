'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2, Bookmark, Clock, Award, Briefcase, ExternalLink, Calendar } from 'lucide-react';
import type { Post } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface PostCardProps {
  post: Post;
  onLike?: (postId: string) => void;
  isLiked?: boolean;
}

export function PostCard({ post, onLike, isLiked }: PostCardProps) {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'career_advice':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'job_search':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'interview_tips':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'industry_news':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      case 'success_story':
        return 'bg-pink-100 text-pink-800 hover:bg-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'career_advice':
        return 'Career Advice';
      case 'job_search':
        return 'Job Search';
      case 'interview_tips':
        return 'Interview Tips';
      case 'industry_news':
        return 'Industry News';
      case 'success_story':
        return 'Success Story';
      default:
        return 'General';
    }
  };

  const getTimeAgo = () => {
    try {
      const date = typeof post.createdAt === 'string' 
        ? new Date(post.createdAt) 
        : post.createdAt.toDate();
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Video Display */}
      {post.videoUrl && post.type === 'video' && (
        <div className="relative w-full overflow-hidden bg-black">
          <video 
            src={post.videoUrl}
            controls
            className="w-full max-h-96 object-contain"
            poster={post.videoThumbnail}
          />
          {post.featured && (
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500">
              Featured
            </Badge>
          )}
        </div>
      )}

      {/* Image Display */}
      {post.imageUrl && post.type !== 'certificate' && !post.videoUrl && (
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            src={post.imageUrl} 
            alt={post.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
          {post.featured && (
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500">
              Featured
            </Badge>
          )}
        </div>
      )}

      {/* Certificate Display */}
      {post.certificate && post.type === 'certificate' && (
        <div className="relative w-full overflow-hidden border-b">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-white rounded-lg shadow-sm">
                <Award className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg text-blue-900">{post.certificate.name}</h3>
                <p className="text-sm text-gray-600">{post.certificate.issuingOrganization}</p>
                {post.certificate.issueDate && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {(() => {
                      const date = new Date(post.certificate.issueDate);
                      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                      return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
                    })()}
                  </p>
                )}
                {post.certificate.credentialId && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <ExternalLink className="h-3 w-3" />
                    ID: {post.certificate.credentialId}
                  </p>
                )}
              </div>
            </div>
            {post.certificate.imageUrl && (
              <img 
                src={post.certificate.imageUrl}
                alt={post.certificate.name}
                className="w-full max-h-64 object-contain rounded-lg border-2 border-white shadow-md"
              />
            )}
          </div>
        </div>
      )}

      {/* Work Experience Display */}
      {post.workExperience && post.type === 'work_experience' && (
        <div className="relative w-full overflow-hidden border-b bg-gradient-to-br from-slate-50 to-gray-50 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <Briefcase className="h-8 w-8 text-slate-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-900">{post.workExperience.position}</h3>
              <p className="text-sm text-gray-600">{post.workExperience.company}</p>
              <p className="text-xs text-gray-500 mt-1">
                {post.workExperience.startDate} - {post.workExperience.current ? 'Present' : post.workExperience.endDate}
              </p>
              {post.workExperience.description && (
                <p className="text-sm text-gray-700 mt-3 line-clamp-3">{post.workExperience.description}</p>
              )}
            </div>
          </div>
          {post.workExperience.imageUrl && (
            <img 
              src={post.workExperience.imageUrl}
              alt={post.workExperience.company}
              className="w-full h-48 object-cover rounded-lg mt-4 shadow-sm"
            />
          )}
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorProfilePicture} alt={post.authorName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                {post.authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{post.authorName}</p>
              {post.authorJobTitle && (
                <p className="text-xs text-muted-foreground truncate">{post.authorJobTitle}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3" />
                <span>{getTimeAgo()}</span>
              </div>
            </div>
          </div>
          {post.category && (
            <Badge variant="secondary" className={getCategoryColor(post.category)}>
              {getCategoryLabel(post.category)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div>
          <CardTitle className="text-xl mb-2 line-clamp-2">{post.title}</CardTitle>
          <CardDescription className="text-sm line-clamp-3 leading-relaxed">
            {post.content}
          </CardDescription>
        </div>

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                #{tag}
              </Badge>
            ))}
            {post.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{post.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${isLiked ? 'text-red-500' : ''}`}
            onClick={() => onLike?.(post.id)}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{post.likes || 0}</span>
          </Button>
          
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="text-sm">{post.comments || 0}</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

export function PostCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <div className="flex gap-4">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardFooter>
    </Card>
  );
}
