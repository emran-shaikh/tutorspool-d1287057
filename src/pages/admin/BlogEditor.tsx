import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  X, 
  Plus,
  Image as ImageIcon,
  FileText,
  Settings,
  Send,
  UserCircle
} from "lucide-react";
import { 
  createBlogPost, 
  updateBlogPost, 
  getBlogPostById, 
  getTutorProfile,
  getAllTutors,
  BlogPost,
  TutorProfile
} from "@/lib/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const isTutor = userProfile?.role === 'tutor';
  const basePath = isTutor ? '/tutor/blogs' : '/admin/blogs';
  const layoutRole = isTutor ? 'tutor' : 'admin';

  // Optional author card
  const [showAuthorCard, setShowAuthorCard] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [tutorExtras, setTutorExtras] = useState<{ photo?: string; subjects?: string[]; qualifications?: string; bio?: string }>({});

  // Admin-only: who the article is attributed to
  const [authorMode, setAuthorMode] = useState<'admin' | 'tutor' | 'guest'>('admin');
  const [tutorsList, setTutorsList] = useState<TutorProfile[]>([]);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestTitle, setGuestTitle] = useState("");
  const [guestPhoto, setGuestPhoto] = useState("");

  useEffect(() => {
    if (isTutor || !userProfile) return;
    getAllTutors().then(list => setTutorsList(list.filter(t => t.isApproved && t.fullName))).catch(() => {});
  }, [isTutor, userProfile]);

  const selectedTutor = tutorsList.find(t => t.uid === selectedTutorId);

  const handleGuestPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const dataUrl = await new Promise<string>((res, rej) => { const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(file); });
    const img = new Image(); img.src = dataUrl;
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });
    const size = 300; const c = document.createElement('canvas'); c.width = size; c.height = size;
    const s = Math.min(img.width, img.height);
    c.getContext('2d')!.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
    setGuestPhoto(c.toDataURL('image/jpeg', 0.8));
  };

  useEffect(() => {
    if (!isTutor || !userProfile) return;
    getTutorProfile(userProfile.uid).then((tp: any) => {
      if (!tp) return;
      setTutorExtras({
        photo: tp.photoURL,
        subjects: tp.subjects,
        qualifications: Array.isArray(tp.qualifications) ? tp.qualifications.join(', ') : tp.qualifications,
        bio: tp.bio,
      });
      setAuthorBio(prev => prev || tp.bio || "");
    }).catch(() => {});
  }, [isTutor, userProfile]);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(() => new URLSearchParams(window.location.search).get('preview') === '1');

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  
  // Original post data for editing
  const [originalPost, setOriginalPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    if (isEditing && id) {
      fetchPost(id);
    }
  }, [id, isEditing]);

  const fetchPost = async (postId: string) => {
    const data = await getBlogPostById(postId);
    if (data) {
      setOriginalPost(data);
      setTitle(data.title);
      setSlug(data.slug);
      setContent(data.content);
      setExcerpt(data.excerpt);
      setCoverImage(data.coverImage || "");
      setIsPublished(data.isPublished);
      setTags(data.tags);
      setMetaTitle(data.metaTitle || "");
      setMetaDescription(data.metaDescription || "");
      setShowAuthorCard(!!data.showAuthorCard);
      setLinkedinUrl(data.linkedinUrl || "");
      setPortfolioUrl(data.portfolioUrl || "");
      setAuthorBio(data.authorBio || "");
      if (data.authorRole === 'guest') {
        setAuthorMode('guest'); setGuestName(data.authorName || ""); setGuestTitle(data.authorTitle || ""); setGuestPhoto(data.authorPhoto || "");
      } else if (data.authorRole === 'tutor') {
        setAuthorMode('tutor'); setSelectedTutorId(data.authorId);
      }
    } else {
      toast({ title: "Error", description: "Blog post not found", variant: "destructive" });
      navigate(basePath);
    }
    setLoading(false);
  };

  // Auto-generate slug from title
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditing || slug === generateSlug(originalPost?.title || '')) {
      setSlug(generateSlug(value));
    }
  };

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleCoverImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Invalid file", description: "Please select an image", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 10MB", variant: "destructive" });
      return;
    }

    // Resize/compress to keep Firestore document under the 1 MiB limit
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const MAX_W = 1200;
      const scale = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', 0.8);

      // Firestore field cap is ~1 MiB; base64 inflates ~33%, keep well under
      if (compressed.length > 700_000) {
        const more = canvas.toDataURL('image/jpeg', 0.6);
        setCoverImage(more);
      } else {
        setCoverImage(compressed);
      }
    } catch (err) {
      toast({ title: "Image error", description: "Could not process image. Try a smaller one.", variant: "destructive" });
    }
  };

  const handleSave = async (mode: 'draft' | 'submit' | 'publish' = 'draft') => {
    const publish = mode === 'publish';
    if (!title.trim() || !content.trim() || !excerpt.trim()) {
      toast({ 
        title: "Missing fields", 
        description: "Please fill in title, content, and excerpt", 
        variant: "destructive" 
      });
      return;
    }

    if (!userProfile) return;
    setSaving(true);

    try {
      const willPublish = !isTutor && (publish || isPublished);
      const status: BlogPost['status'] = willPublish ? 'published' : (isTutor && mode === 'submit') ? 'pending' : 'draft';
      const cleanUrl = (u: string) => { const t = u.trim(); if (!t) return ''; return /^https?:\/\//i.test(t) ? t : `https://${t}`; };
      if (!isTutor && authorMode === 'tutor' && !selectedTutor) {
        toast({ title: "Select a tutor", description: "Choose which tutor this article is written for.", variant: "destructive" });
        setSaving(false); return;
      }
      if (!isTutor && authorMode === 'guest' && !guestName.trim()) {
        toast({ title: "Guest name required", description: "Enter the guest author's name.", variant: "destructive" });
        setSaving(false); return;
      }
      const origIsAdmin = originalPost && (!originalPost.authorRole || originalPost.authorRole === 'admin');
      let author: Pick<BlogPost, 'authorId' | 'authorName' | 'authorRole' | 'authorPhoto' | 'authorSubjects' | 'authorQualifications' | 'authorTitle'>;
      if (isTutor) {
        author = { authorId: userProfile.uid, authorName: userProfile.fullName, authorRole: 'tutor',
          authorPhoto: tutorExtras.photo || '', authorSubjects: tutorExtras.subjects || [], authorQualifications: tutorExtras.qualifications || '', authorTitle: '' };
      } else if (authorMode === 'tutor' && selectedTutor) {
        const q: any = selectedTutor.qualifications;
        author = { authorId: selectedTutor.uid, authorName: selectedTutor.fullName, authorRole: 'tutor',
          authorPhoto: selectedTutor.photoURL || '', authorSubjects: selectedTutor.subjects || [],
          authorQualifications: Array.isArray(q) ? q.join(', ') : (q || ''), authorTitle: '' };
      } else if (authorMode === 'guest') {
        author = { authorId: originalPost?.authorRole === 'guest' ? originalPost.authorId : `guest-${Date.now()}`,
          authorName: guestName.trim(), authorRole: 'guest', authorPhoto: guestPhoto, authorSubjects: [],
          authorQualifications: '', authorTitle: guestTitle.trim() };
      } else {
        author = { authorId: origIsAdmin ? originalPost!.authorId : userProfile.uid,
          authorName: origIsAdmin ? originalPost!.authorName : userProfile.fullName, authorRole: 'admin',
          authorPhoto: '', authorSubjects: [], authorQualifications: '', authorTitle: '' };
      }
      const postData: Omit<BlogPost, 'id'> = {
        title,
        slug,
        content,
        excerpt,
        coverImage: coverImage || undefined,
        ...author,
        isPublished: willPublish,
        status,
        publishedAt: willPublish ? (originalPost?.publishedAt || new Date().toISOString()) : undefined,
        createdAt: originalPost?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        showAuthorCard,
        linkedinUrl: cleanUrl(linkedinUrl),
        portfolioUrl: cleanUrl(portfolioUrl),
        authorBio: authorBio.trim(),
      };

      // Firestore rejects undefined field values — strip them
      const cleanData = Object.fromEntries(
        Object.entries(postData).filter(([, v]) => v !== undefined)
      ) as Omit<BlogPost, 'id'>;

      if (isEditing && id) {
        await updateBlogPost(id, cleanData);
        toast({ title: "Success", description: "Blog post updated successfully" });
      } else {
        await createBlogPost(cleanData);
        toast({ title: "Success", description: "Blog post created successfully" });
      }

      if (status === 'pending') {
        supabase.functions.invoke('send-email', {
          body: { type: 'admin_blog_submitted', tutorName: userProfile.fullName, postTitle: title, excerpt },
        }).catch(() => {});
        toast({ title: "Submitted for review", description: "The admin team will review your article shortly." });
      }

      navigate(basePath);
    } catch (error: any) {
      console.error('Blog save failed:', error);
      const msg = error?.message || error?.code || 'Failed to save blog post';
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role={layoutRole}>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={layoutRole}>
      <div className="mb-6">
        <Link to={basePath} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Blogs
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">
              {isEditing ? 'Edit Blog Post' : 'Create New Post'}
            </h1>
            <p className="text-muted-foreground">
              {isEditing ? 'Update your blog post' : 'Write and publish a new blog post'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('draft')} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            {isTutor ? (
              <Button onClick={() => handleSave('submit')} disabled={saving}>
                <Send className="h-4 w-4 mr-2" />
                {saving ? "Submitting..." : "Submit for Review"}
              </Button>
            ) : (
              <Button onClick={() => handleSave('publish')} disabled={saving}>
                <Eye className="h-4 w-4 mr-2" />
                {saving ? "Publishing..." : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button variant={showPreview ? "outline" : "default"} size="sm" onClick={() => setShowPreview(false)}>
          <FileText className="h-4 w-4 mr-2" />Edit
        </Button>
        <Button variant={showPreview ? "default" : "outline"} size="sm" onClick={() => setShowPreview(true)}>
          <Eye className="h-4 w-4 mr-2" />Live Preview
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {showPreview && (
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              {coverImage && <img src={coverImage} alt="Cover" className="w-full aspect-video object-cover" />}
              <CardContent className="p-6 md:p-8 space-y-4">
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">{tags.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}</div>
                )}
                <h1 className="font-display text-3xl md:text-4xl font-bold">{title || "Untitled article"}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {isTutor && tutorExtras.photo ? (
                    <img src={tutorExtras.photo} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : <UserCircle className="h-9 w-9" />}
                  <div>
                    <p className="font-medium text-foreground">{isTutor ? userProfile?.fullName : (originalPost?.authorName || "TutorsPool Editorial Team")}</p>
                    <p>{Math.max(1, Math.ceil((content.split(/\s+/).filter(Boolean).length) / 200))} min read</p>
                  </div>
                </div>
                {excerpt && <p className="text-lg text-muted-foreground italic">{excerpt}</p>}
                <Separator />
                <div className="prose max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
                  {content || "Start writing to see your article here..."}
                </div>
                {showAuthorCard && (
                  <Card className="bg-muted/40 mt-6">
                    <CardContent className="p-5 space-y-2">
                      <p className="font-semibold">Written by {isTutor ? userProfile?.fullName : (originalPost?.authorName || userProfile?.fullName)}</p>
                      {isTutor && tutorExtras.subjects?.[0] && (
                        <p className="text-sm text-muted-foreground">Verified {tutorExtras.subjects[0]} Tutor on TutorsPool</p>
                      )}
                      {authorBio && <p className="text-sm">{authorBio}</p>}
                      <div className="flex flex-wrap gap-3 text-sm">
                        {linkedinUrl && <span className="text-primary">LinkedIn</span>}
                        {portfolioUrl && <span className="text-primary">Portfolio</span>}
                      </div>
                      <Button size="sm" disabled>{isTutor ? `Book a Session with ${userProfile?.fullName}` : "Find a Tutor"}</Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {/* Main Content */}
        <div className={`lg:col-span-2 space-y-6 ${showPreview ? 'hidden' : ''}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Content
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter post title..."
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  placeholder="post-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(generateSlug(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">/blog/{slug || 'your-post-slug'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  placeholder="Brief summary of the post (shown in listings)..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Write your blog post content here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  className="min-h-[300px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                Cover Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coverImage ? (
                <div className="relative">
                  <img 
                    src={coverImage} 
                    alt="Cover" 
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setCoverImage("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <ImageIcon className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload cover image</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageChange}
                  />
                </label>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {isTutor ? (
            <Card>
              <CardHeader><CardTitle>Review Process</CardTitle></CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>Your article is reviewed by the TutorsPool team before it goes live.</p>
                {originalPost?.status === 'rejected' && originalPost.reviewNote && (
                  <p className="text-destructive">Reviewer note: {originalPost.reviewNote}</p>
                )}
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader>
              <CardTitle>Publish Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="publish">Publish immediately</Label>
                <Switch
                  id="publish"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {isPublished ? "Post will be visible to the public" : "Post will be saved as draft"}
              </p>
            </CardContent>
          </Card>
          )}

          {/* Author Card (optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCircle className="h-5 w-5 text-primary" />
                Author Card
              </CardTitle>
              <CardDescription>Optional — show your bio and links on this article</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showAuthorCard">Show author card</Label>
                <Switch id="showAuthorCard" checked={showAuthorCard} onCheckedChange={setShowAuthorCard} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedinUrl">LinkedIn (optional)</Label>
                <Input id="linkedinUrl" placeholder="linkedin.com/in/yourname" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio / Website (optional)</Label>
                <Input id="portfolioUrl" placeholder="yourwebsite.com" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authorBio">Short bio (optional)</Label>
                <Textarea id="authorBio" rows={3} value={authorBio} onChange={(e) => setAuthorBio(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>Add tags to categorize your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                SEO Settings
              </CardTitle>
              <CardDescription>Optimize for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">Meta Title</Label>
                <Input
                  id="metaTitle"
                  placeholder="SEO title (defaults to post title)"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  {metaTitle.length || title.length}/60 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="metaDescription">Meta Description</Label>
                <Textarea
                  id="metaDescription"
                  placeholder="SEO description (defaults to excerpt)"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  {metaDescription.length || excerpt.length}/160 characters
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}