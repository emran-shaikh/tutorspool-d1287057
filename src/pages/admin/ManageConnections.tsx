import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Link2, Pause, Play, Trash2, Plus, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAllUsers,
  getAllTutors,
  getAllConnections,
  createConnection,
  updateConnectionStatus,
  deleteConnection,
  StudentTutorConnection,
} from "@/lib/firestore";

export default function ManageConnections() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<StudentTutorConnection[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // dialog state
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [subjectsText, setSubjectsText] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [tutorSearch, setTutorSearch] = useState("");

  const filteredStudents = useMemo(() => {
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter(s =>
      (s.fullName || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  }, [students, studentSearch]);

  const filteredTutors = useMemo(() => {
    const q = tutorSearch.trim().toLowerCase();
    if (!q) return tutors;
    return tutors.filter(t =>
      (t.fullName || "").toLowerCase().includes(q) ||
      (t.email || "").toLowerCase().includes(q)
    );
  }, [tutors, tutorSearch]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [users, tuts, conns] = await Promise.all([
        getAllUsers(),
        getAllTutors(),
        getAllConnections(),
      ]);
      setStudents(users.filter((u: any) => u.role === "student"));
      setTutors(tuts.filter((t: any) => t.isApproved));
      setConnections(conns);
    } catch {
      toast({ title: "Failed to load connections", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!studentId || !tutorId || !subjectsText.trim()) {
      toast({ title: "Pick a student, tutor and at least one subject", variant: "destructive" });
      return;
    }
    const stu = students.find(s => s.uid === studentId);
    const tut = tutors.find(t => t.uid === tutorId);
    if (!stu || !tut) return;
    setSaving(true);
    try {
      await createConnection({
        studentId: stu.uid,
        studentName: stu.fullName || stu.email,
        studentEmail: stu.email,
        tutorId: tut.uid,
        tutorName: tut.fullName,
        tutorEmail: tut.email,
        subjects: subjectsText.split(",").map(s => s.trim()).filter(Boolean),
        notes: notes.trim() || undefined,
        createdBy: userProfile?.uid || "",
      });
      toast({ title: "Connection created" });
      setOpen(false);
      setStudentId(""); setTutorId(""); setSubjectsText(""); setNotes("");
      fetchAll();
    } catch (e: any) {
      toast({ title: "Could not create connection", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onStatusChange = async (id: string, status: StudentTutorConnection["status"]) => {
    try {
      await updateConnectionStatus(id, status, userProfile?.uid);
      toast({ title: `Connection ${status}` });
      fetchAll();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteConnection(id);
      toast({ title: "Connection removed" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const filtered = useMemo(() => connections.filter(c => {
    if (filterStatus !== "all" && c.status !== filterStatus) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return c.studentName?.toLowerCase().includes(q) ||
           c.tutorName?.toLowerCase().includes(q) ||
           c.subjects?.some(s => s.toLowerCase().includes(q));
  }), [connections, search, filterStatus]);

  const statusBadge = (s: StudentTutorConnection["status"]) => {
    const cls = s === "active" ? "bg-emerald-500" : s === "paused" ? "bg-amber-500" : "bg-destructive";
    return <Badge className={`${cls} text-white`}>{s}</Badge>;
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
            <Link2 className="h-7 w-7 text-primary" /> Student–Tutor Connections
          </h1>
          <p className="text-muted-foreground">Create and manage direct connections between students and tutors.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Connection</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Connection</DialogTitle>
              <DialogDescription>Connect a student with a tutor. Once active, the tutor can assign tasks, quizzes and resources directly.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Student</Label>
                <div className="relative mb-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={studentSearch}
                    onChange={e => setStudentSearch(e.target.value)}
                    placeholder="Search students by name or email"
                    className="pl-9"
                  />
                </div>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                  <SelectContent>
                    {filteredStudents.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
                    ) : filteredStudents.map(s => (
                      <SelectItem key={s.uid} value={s.uid}>{s.fullName || s.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tutor</Label>
                <div className="relative mb-2">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={tutorSearch}
                    onChange={e => setTutorSearch(e.target.value)}
                    placeholder="Search tutors by name or email"
                    className="pl-9"
                  />
                </div>
                <Select value={tutorId} onValueChange={setTutorId}>
                  <SelectTrigger><SelectValue placeholder="Select tutor" /></SelectTrigger>
                  <SelectContent>
                    {filteredTutors.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">No matches</div>
                    ) : filteredTutors.map(t => (
                      <SelectItem key={t.uid} value={t.uid}>{t.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subjects (comma separated)</Label>
                <Input value={subjectsText} onChange={e => setSubjectsText(e.target.value)} placeholder="Math, Physics" />
              </div>
              <div>
                <Label>Admin notes (optional)</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal note" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={saving}>{saving ? "Creating…" : "Create"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student, tutor or subject" className="pl-9" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="revoked">Revoked</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">No connections found.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {filtered.map(c => (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{c.studentName} ↔ {c.tutorName}</CardTitle>
                    <CardDescription>
                      Subjects: {c.subjects.join(", ") || "—"} · Created {new Date(c.createdAt).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  {statusBadge(c.status)}
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {c.status !== "active" && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(c.id!, "active")}>
                    <Play className="h-4 w-4 mr-1" /> Activate
                  </Button>
                )}
                {c.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(c.id!, "paused")}>
                    <Pause className="h-4 w-4 mr-1" /> Pause
                  </Button>
                )}
                {c.status !== "revoked" && (
                  <Button size="sm" variant="outline" onClick={() => onStatusChange(c.id!, "revoked")}>
                    Revoke
                  </Button>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4 mr-1" /> Delete</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this connection?</AlertDialogTitle>
                      <AlertDialogDescription>The tutor will lose direct access to assign work to this student. Existing assignments remain.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(c.id!)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {c.notes && <p className="w-full text-xs text-muted-foreground mt-2">Note: {c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
