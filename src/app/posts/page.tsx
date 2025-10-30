'use client';

import { useState, useEffect } from 'react';
import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import { PostCard, PostCardSkeleton } from '@/components/posts/post-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, limit as firestoreLimit } from 'firebase/firestore';
import type { Post } from '@/lib/types';
import { Search, TrendingUp, Sparkles, PenSquare } from 'lucide-react';
import Link from 'next/link';

export default function PostsPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch all posts
  const postsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(50)
    );
  }, [firestore]);

  const { data: posts, isLoading } = useCollection<Post>(postsQuery);

  // Fetch featured posts
  const featuredQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'posts'),
      where('featured', '==', true),
      orderBy('createdAt', 'desc'),
      firestoreLimit(3)
    );
  }, [firestore]);

  const { data: featuredPosts } = useCollection<Post>(featuredQuery);

  const categories = [
    { value: 'all', label: 'All Posts', icon: Sparkles },
    { value: 'career_advice', label: 'Career Advice', icon: TrendingUp },
    { value: 'job_search', label: 'Job Search', icon: Search },
    { value: 'interview_tips', label: 'Interview Tips', icon: PenSquare },
    { value: 'industry_news', label: 'Industry News', icon: TrendingUp },
    { value: 'success_story', label: 'Success Stories', icon: Sparkles },
  ];

  const filteredPosts = posts?.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-20">
          <div className="container max-w-6xl">
            <div className="text-center space-y-6">
              <div className="inline-block">
                <Badge className="bg-white/20 text-white border-white/30 mb-4">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Community Posts
                </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Career Insights & Stories
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto">
                Discover career advice, job search tips, and success stories from professionals around the world
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mt-8">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 py-6 text-lg bg-white/95 backdrop-blur border-0 focus:ring-2 focus:ring-white/50"
                  />
                </div>
              </div>

              {user && (
                <div className="mt-6">
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/posts/create">
                      <PenSquare className="mr-2 h-5 w-5" />
                      Create Post
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Featured Posts */}
        {featuredPosts && featuredPosts.length > 0 && (
          <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
            <div className="container max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <h2 className="text-3xl font-bold">Featured Posts</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Category Tabs */}
        <section className="py-12">
          <div className="container max-w-6xl">
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="space-y-8">
              <TabsList className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 h-auto p-2 bg-gray-100">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.value}
                    value={category.value}
                    className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{category.label}</span>
                    <span className="sm:hidden">{category.label.split(' ')[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="space-y-6">
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <PostCardSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-muted-foreground">
                        {filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'} found
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredPosts.map((post) => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                      <Search className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">No posts found</h3>
                    <p className="text-muted-foreground mb-6">
                      {searchQuery 
                        ? `No posts match "${searchQuery}"`
                        : 'Be the first to create a post in this category!'}
                    </p>
                    {user && (
                      <Button asChild>
                        <Link href="/posts/create">
                          <PenSquare className="mr-2 h-4 w-4" />
                          Create Post
                        </Link>
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
