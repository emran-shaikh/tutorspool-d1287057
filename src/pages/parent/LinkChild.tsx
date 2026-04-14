import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getParentLinks, createParentLink, deleteParentLink, type ParentLink } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { Mail, Plus, Trash2, Users } from "lucide-react";

export default function LinkChild() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [childEmail, setChildEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (userProfile?.uid) loadLinks();
  }, [userProfile?.uid]);

  const loadLinks = async () => {
    if (!userProfile?.uid) return;
    try {
      const data = await getParentLinks(userProfile.uid);
      setLinks(data);
    } finally {
      setFetching(false);
    }
  };

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !childEmail.trim()) return;

    setLoading(true);
    try {
      await createParentLink(userProfile.uid, childEmail.trim());
      toast({ title: "Child linked successfully!", description: "You can now monitor their progress." });
      setChildEmail("");
      await loadLinks();
    } catch (error: any) {
      toast({
        title: "Failed to link child",
        description: error.message || "Please check the email and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      await deleteParentLink(linkId);
      toast({ title: "Child unlinked" });
      await loadLinks();
    } catch {
      toast({ title: "Failed to unlink", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Link Your Child</h1>
          <p className="text-muted-foreground">Enter your child's registered email to start monitoring their progress.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add a Child</CardTitle>
            <CardDescription>Your child must have a registered student account on TutorsPool.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLink} className="flex gap-3">
              <div className="flex-1">
                <Label htmlFor="childEmail" className="sr-only">Child's Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="childEmail"
                    type="email"
                    placeholder="child@example.com"
                    value={childEmail}
                    onChange={(e) => setChildEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading}>
                <Plus className="mr-2 h-4 w-4" />
                {loading ? "Linking..." : "Link"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Linked Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="flex justify-center py-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : links.length === 0 ? (
              <p className="text-center text-muted-foreground py-6">No children linked yet.</p>
            ) : (
              <div className="space-y-3">
                {links.map((link) => (
                  <div key={link.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div>
                      <p className="font-medium">{link.childName}</p>
                      <p className="text-sm text-muted-foreground">{link.childEmail}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{link.status}</Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleUnlink(link.id!)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Button variant="outline" asChild>
          <Link to="/parent/dashboard">← Back to Dashboard</Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
