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
  Settings
} from "lucide-react";
import { 
  createBlogPost, 
  updateBlogPost, 
  getBlogPostById, 
  BlogPost 
} from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function BlogEditor() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

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
    } else {
      toast({ title: "Error", description: "Blog post not found", variant: "destructive" });
      navigate('/admin/blogs');
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

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (publish: boolean = false) => {
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
      const postData: Omit<BlogPost, 'id'> = {
        title,
        slug,
        content,
        excerpt,
        coverImage: coverImage || undefined,
        authorId: userProfile.uid,
        authorName: userProfile.fullName,
        isPublished: publish || isPublished,
        publishedAt: (publish || isPublished) ? new Date().toISOString() : undefined,
        createdAt: originalPost?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined
      };

      if (isEditing && id) {
        await updateBlogPost(id, postData);
        toast({ title: "Success", description: "Blog post updated successfully" });
      } else {
        await createBlogPost(postData);
        toast({ title: "Success", description: "Blog post created successfully" });
      }

      navigate('/admin/blogs');
    } catch (error) {
      toast({ title: "Error", description: "Failed to save blog post", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/blogs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
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
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              <Eye className="h-4 w-4 mr-2" />
              {saving ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
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
          {/* Publish Settings */}
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