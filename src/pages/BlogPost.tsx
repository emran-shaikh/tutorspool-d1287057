import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, User, ArrowLeft, Clock, Facebook, Twitter, Linkedin, Link2, Globe } from "lucide-react";
import { getBlogPostBySlug, BlogPost as BlogPostType } from "@/lib/firestore";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { toast } from "@/hooks/use-toast";

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const data = await getBlogPostBySlug(slug);
      setPost(data);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  // Calculate reading time (avg 200 words per minute)
  const getReadingTime = (content: string) => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isTutorAuthor = post.authorRole === 'tutor';
  const isGuestAuthor = post.authorRole === 'guest';

  // JSON-LD structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.metaTitle || post.title,
    "description": post.metaDescription || post.excerpt,
    "image": post.coverImage,
    "author": {
      "@type": "Person",
      "name": post.authorName,
      ...(isTutorAuthor ? { "url": `https://www.tutorspool.com/tutors/${post.authorId}` } : {}),
      ...(post.linkedinUrl ? { "sameAs": [post.linkedinUrl, post.portfolioUrl].filter(Boolean) } : {})
    },
    "datePublished": post.publishedAt || post.createdAt,
    "dateModified": post.updatedAt,
    "publisher": {
      "@type": "Organization",
      "name": "TutorsPool",
      "logo": {
        "@type": "ImageObject",
        "url": `https://tutorspool.com/favicon.ico`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://tutorspool.com/blog/${post.slug}`
    }
  };

  return (
    <>
      <Helmet>
        <title>{post.metaTitle || post.title} | TutorsPool Blog</title>
        <meta name="description" content={post.metaDescription || post.excerpt} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <link rel="canonical" href={`https://tutorspool.com/blog/${post.slug}`} />
        
        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.metaTitle || post.title} />
        <meta property="og:description" content={post.metaDescription || post.excerpt} />
        {post.coverImage && <meta property="og:image" content={post.coverImage} />}
        <meta property="og:url" content={`https://tutorspool.com/blog/${post.slug}`} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.metaTitle || post.title} />
        <meta name="twitter:description" content={post.metaDescription || post.excerpt} />
        {post.coverImage && <meta name="twitter:image" content={post.coverImage} />}
        
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <article className="py-12 lg:py-16">
            <div className="container max-w-4xl">
              {/* Back Button */}
              <Link to="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Blog
              </Link>

              {/* Header */}
              <header className="mb-8">
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <h1 className="font-display text-3xl lg:text-4xl font-bold mb-4">
                  {post.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                  {isTutorAuthor ? (
                    <span className="flex items-center gap-2">
                      {post.authorPhoto ? (
                        <img src={post.authorPhoto} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" />
                      ) : <User className="h-4 w-4" />}
                      <Link to={`/tutors/${post.authorId}`} className="font-medium text-foreground hover:text-primary">{post.authorName}</Link>
                      {post.linkedinUrl && (
                        <a href={post.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label="LinkedIn" className="hover:text-primary">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {(post.authorSubjects || []).slice(0, 2).map(s => (
                        <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                      ))}
                    </span>
                  ) : isGuestAuthor ? (
                    <span className="flex items-center gap-2">
                      {post.authorPhoto ? (
                        <img src={post.authorPhoto} alt={post.authorName} className="h-8 w-8 rounded-full object-cover" />
                      ) : <User className="h-4 w-4" />}
                      <span className="font-medium text-foreground">{post.authorName}</span>
                      {post.linkedinUrl && (
                        <a href={post.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" aria-label="LinkedIn" className="hover:text-primary">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      <Badge variant="outline" className="text-xs">{post.authorTitle || 'Guest Contributor'}</Badge>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {post.authorName}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(post.publishedAt || post.createdAt), 'MMMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {getReadingTime(post.content)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-muted-foreground">Share this article:</span>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const shareUrl = `https://tutorspool.com/share/blog/${post.slug}`;
                      return (
                        <>
                          <a
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                            aria-label="Share on Facebook"
                          >
                            <Facebook className="h-4 w-4" />
                          </a>
                          <a
                            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                            aria-label="Share on X (Twitter)"
                          >
                            <Twitter className="h-4 w-4" />
                          </a>
                          <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                            aria-label="Share on LinkedIn"
                          >
                            <Linkedin className="h-4 w-4" />
                          </a>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(shareUrl);
                                toast({ title: "Link copied", description: "The blog URL has been copied to your clipboard." });
                              } catch {
                                toast({ title: "Copy failed", description: "Unable to copy the link. Please try again.", variant: "destructive" });
                              }
                            }}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-primary hover:border-primary transition-colors"
                            aria-label="Copy link"
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </header>

              {/* Cover Image */}
              {post.coverImage && (
                <figure className="mb-8">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full rounded-xl shadow-lg object-cover aspect-video"
                  />
                </figure>
              )}

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
                dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }}
              />

              {/* Optional Author Card */}
              {post.showAuthorCard && (
                <aside className="mt-12 p-6 border border-border rounded-xl flex flex-col sm:flex-row gap-5">
                  {post.authorPhoto && (
                    <img src={post.authorPhoto} alt={post.authorName} className="h-20 w-20 rounded-full object-cover shrink-0" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-display text-lg font-semibold">
                      Written by {post.authorName}
                      {isTutorAuthor && `, Verified ${post.authorSubjects?.[0] ? post.authorSubjects[0] + ' ' : ''}Tutor on TutorsPool`}
                      {isGuestAuthor && `, ${post.authorTitle || 'Guest Contributor'}`}
                    </p>
                    {post.authorQualifications && <p className="text-sm text-muted-foreground">{post.authorQualifications}</p>}
                    {post.authorBio && <p className="text-sm text-muted-foreground">{post.authorBio}</p>}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {post.linkedinUrl && (
                        <a href={post.linkedinUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                      {post.portfolioUrl && (
                        <a href={post.portfolioUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                          <Globe className="h-4 w-4" /> Portfolio
                        </a>
                      )}
                      {isTutorAuthor && (
                        <Button asChild size="sm" className="sm:ml-auto">
                          <Link to={`/tutors/${post.authorId}`}>Book a Session with {post.authorName.split(' ')[0]}</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </aside>
              )}

              {/* CTA */}
              <div className="mt-12 p-8 bg-muted/50 rounded-xl text-center">
                <h3 className="font-display text-xl font-semibold mb-2">
                  Ready to Start Learning?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Connect with expert tutors and achieve your learning goals
                </p>
                <Link to={isTutorAuthor ? `/tutors/${post.authorId}` : "/tutors"}>
                  <Button size="lg">{isTutorAuthor ? `Book a Session with ${post.authorName.split(' ')[0]}` : "Find a Tutor"}</Button>
                </Link>
              </div>
            </div>
          </article>
        </main>
        <Footer />
      </div>
    </>
  );
}