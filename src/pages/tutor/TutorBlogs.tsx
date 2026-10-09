import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileText, ExternalLink } from "lucide-react";
import { getBlogPostsByAuthor, deleteBlogPost, getBlogStatus, BlogPost } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const statusLabel: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  published: { label: "Published", variant: "default" },
  pending: { label: "Pending Review", variant: "outline" },
  draft: { label: "Draft", variant: "secondary" },
  rejected: { label: "Needs Changes", variant: "destructive" },
};

export default function TutorBlogs() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile) return;
    getBlogPostsByAuthor(userProfile.uid)
      .then(setPosts)
      .catch(() => toast({ title: "Error", description: "Could not load your articles", variant: "destructive" }))
      .finally(() => setLoading(false));
  }, [userProfile]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this article?")) return;
    try {
      await deleteBlogPost(id);
      setPosts(p => p.filter(x => x.id !== id));
      toast({ title: "Deleted" });
    } catch {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="tutor">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">My Articles</h1>
          <p className="text-muted-foreground">Write articles to share your expertise and attract students</p>
        </div>
        <Button asChild>
          <Link to="/tutor/blogs/new"><Plus className="h-4 w-4 mr-2" />Write Article</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Your Articles</CardTitle>
          <CardDescription>Articles are reviewed by the TutorsPool team before publishing</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
          ) : posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No articles yet. Write your first one!</p>
          ) : (
            <div className="space-y-3">
              {posts.map(post => {
                const st = getBlogStatus(post);
                const meta = statusLabel[st];
                return (
                  <div key={post.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-1">{post.title}</p>
                      <p className="text-xs text-muted-foreground">Updated {format(new Date(post.updatedAt || post.createdAt), "MMM d, yyyy")}</p>
                      {st === "rejected" && post.reviewNote && (
                        <p className="text-xs text-destructive mt-1">Reviewer note: {post.reviewNote}</p>
                      )}
                    </div>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <div className="flex gap-1">
                      {st === "published" ? (
                        <Button variant="ghost" size="icon" asChild title="View">
                          <Link to={`/blog/${post.slug}`}><ExternalLink className="h-4 w-4" /></Link>
                        </Button>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" asChild title="Edit">
                            <Link to={`/tutor/blogs/edit/${post.id}`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(post.id!)} title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
