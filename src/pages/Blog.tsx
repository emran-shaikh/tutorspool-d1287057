import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, ArrowRight } from "lucide-react";
import { getPublishedBlogPosts, BlogPost } from "@/lib/firestore";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const data = await getPublishedBlogPosts();
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);

  return (
    <>
      <Helmet>
        <title>Blog - TutorsPool | Educational Insights & Learning Tips</title>
        <meta name="description" content="Explore our blog for expert educational insights, learning tips, study strategies, and career guidance from TutorsPool's experienced tutors." />
        <meta name="keywords" content="tutoring blog, education tips, learning strategies, study guides, career advice" />
        <link rel="canonical" href={`${window.location.origin}/blog`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <section className="py-12 lg:py-16 bg-muted/30">
            <div className="container">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <Badge variant="outline" className="mb-4">Our Blog</Badge>
                <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">
                  Educational <span className="text-primary">Insights</span>
                </h1>
                <p className="text-muted-foreground text-lg">
                  Expert tips, learning strategies, and career guidance from our tutors
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No blog posts yet. Check back soon!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {posts.map((post) => (
                    <Link key={post.id} to={`/blog/${post.slug}`}>
                      <Card className="h-full group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                        {post.coverImage && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={post.coverImage} 
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardContent className="p-6">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {post.tags.slice(0, 2).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.authorName}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}