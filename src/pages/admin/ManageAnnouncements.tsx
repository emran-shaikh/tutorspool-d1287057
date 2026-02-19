import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Announcement,
  getAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageAnnouncements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [displayType, setDisplayType] = useState<"banner" | "popup">("banner");
  const [isActive, setIsActive] = useState(true);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const data = await getAnnouncements();
    setAnnouncements(data);
    setLoading(false);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const resetForm = () => {
    setEditId(null);
    setTitle("");
    setContent("");
    setDisplayType("banner");
    setIsActive(true);
  };

  const openCreate = () => { resetForm(); setDialogOpen(true); };

  const openEdit = (a: Announcement) => {
    setEditId(a.id!);
    setTitle(a.title);
    setContent(a.content);
    setDisplayType(a.displayType);
    setIsActive(a.isActive);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateAnnouncement(editId, { title, content, displayType, isActive });
        toast.success("Announcement updated");
      } else {
        await createAnnouncement({ title, content, displayType, isActive, createdBy: user?.uid || "" });
        toast.success("Announcement created");
      }
      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch {
      toast.error("Failed to save announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteAnnouncement(deleteId);
      toast.success("Announcement deleted");
      setDeleteId(null);
      fetchAnnouncements();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const toggleActive = async (a: Announcement) => {
    try {
      await updateAnnouncement(a.id!, { isActive: !a.isActive });
      toast.success(a.isActive ? "Announcement deactivated" : "Announcement activated");
      fetchAnnouncements();
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-primary" />
            Announcements
          </h1>
          <p className="text-muted-foreground">Create and manage site-wide announcements.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No announcements yet. Create your first one!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((a) => (
            <Card key={a.id} className={!a.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {a.isActive ? <Eye className="h-4 w-4 text-success" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                      {a.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {a.displayType === "banner" ? "Banner" : "Popup"} · {a.isActive ? "Active" : "Inactive"} · {new Date(a.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => toggleActive(a)}>
                      {a.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => setDeleteId(a.id!)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-line">{a.content}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Announcement" : "New Announcement"}</DialogTitle>
            <DialogDescription>Fill in the details below. Active announcements are shown to all visitors.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="ann-title">Title</Label>
              <Input id="ann-title" placeholder="e.g. Home Tutor Requirement" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ann-content">Content</Label>
              <Textarea
                id="ann-content"
                placeholder={"📢 Tutors Pool Home Tutor Requirement\n\nA male teacher is required..."}
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Display Type</Label>
                <Select value={displayType} onValueChange={(v) => setDisplayType(v as "banner" | "popup")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="banner">Banner (Top of page)</SelectItem>
                    <SelectItem value="popup">Popup (Modal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex items-center gap-2 pt-2">
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm text-muted-foreground">{isActive ? "Active" : "Inactive"}</span>
                </div>
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update Announcement" : "Create Announcement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
