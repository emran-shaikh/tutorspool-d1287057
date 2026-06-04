import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, ClipboardList, BookOpen, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getConnectionsForTutor,
  getAssignmentsForTutor,
  createTutorAssignment,
  deleteTutorAssignment,
  getTutorQuizzes,
  StudentTutorConnection,
  TutorAssignment,
  Quiz,
} from "@/lib/firestore";

type AssignType = "task" | "resource" | "quiz";

export default function MyStudents() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [connections, setConnections] = useState<StudentTutorConnection[]>([]);
  const [assignments, setAssignments] = useState<TutorAssignment[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConn, setActiveConn] = useState<StudentTutorConnection | null>(null);

  // assign dialog
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AssignType>("task");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [quizId, setQuizId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (userProfile?.uid) fetchAll(); }, [userProfile]);

  const fetchAll = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const [conns, asgs, qs] = await Promise.all([
        getConnectionsForTutor(userProfile.uid),
        getAssignmentsForTutor(userProfile.uid),
        getTutorQuizzes(userProfile.uid),
      ]);
      setConnections(conns);
      setAssignments(asgs);
      setQuizzes(qs);
    } catch {
      toast({ title: "Failed to load your students", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const activeConnections = useMemo(() => connections.filter(c => c.status === "active"), [connections]);

  const startAssign = (conn: StudentTutorConnection) => {
    setActiveConn(conn);
    setType("task"); setTitle(""); setDescription(""); setResourceUrl(""); setQuizId(""); setDueDate("");
    setOpen(true);
  };

  const handleAssign = async () => {
    if (!activeConn || !userProfile?.uid) return;
    if (!title.trim() && type !== "quiz") {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (type === "quiz" && !quizId) {
      toast({ title: "Pick a quiz", variant: "destructive" });
      return;
    }
    if (type === "resource" && !resourceUrl.trim()) {
      toast({ title: "Resource URL required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const selectedQuiz = quizzes.find(q => q.id === quizId);
      await createTutorAssignment({
        connectionId: activeConn.id!,
        tutorId: userProfile.uid,
        tutorName: userProfile.fullName,
        studentId: activeConn.studentId,
        studentName: activeConn.studentName,
        type,
        title: type === "quiz" ? (selectedQuiz?.topic || "Quiz") : title.trim(),
        description: description.trim() || undefined,
        payload: {
          ...(type === "resource" ? { resourceUrl: resourceUrl.trim() } : {}),
          ...(type === "quiz" ? { quizId } : {}),
        },
        dueDate: dueDate || undefined,
      });
      toast({ title: "Assignment sent" });
      setOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Could not assign", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteTutorAssignment(id);
      toast({ title: "Removed" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const assignmentsByStudent = (studentId: string) =>
    assignments.filter(a => a.studentId === studentId);

  if (loading) {
    return <DashboardLayout role="tutor"><div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          <Users className="h-7 w-7 text-emerald-600" /> My Students
        </h1>
        <p className="text-muted-foreground">Students connected to you by an admin. Assign tasks, quizzes and resources directly.</p>
      </div>

      {activeConnections.length === 0 ? (
        <Card className="border-emerald-200">
          <CardContent className="py-10 text-center text-muted-foreground">
            <LinkIcon className="h-10 w-10 mx-auto mb-3 opacity-50" />
            No active connections yet. An admin will assign students to you.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue={activeConnections[0].id} className="w-full">
          <TabsList className="flex flex-wrap h-auto">
            {activeConnections.map(c => (
              <TabsTrigger key={c.id} value={c.id!}>{c.studentName}</TabsTrigger>
            ))}
          </TabsList>
          {activeConnections.map(c => {
            const items = assignmentsByStudent(c.studentId);
            return (
              <TabsContent key={c.id} value={c.id!} className="mt-4">
                <Card className="border-emerald-100">
                  <CardHeader>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <CardTitle>{c.studentName}</CardTitle>
                        <CardDescription>
                          Subjects: {c.subjects.join(", ") || "—"} · {c.studentEmail}
                        </CardDescription>
                      </div>
                      <Button onClick={() => startAssign(c)} size="lg" className="bg-emerald-600 hover:bg-emerald-700 shadow-md">
                        <Plus className="h-5 w-5 mr-2" /> Assign New Work
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium text-muted-foreground">
                        {items.length === 0 ? "No assignments yet — send the first one." : `${items.length} assignment${items.length === 1 ? "" : "s"} sent. Add more anytime.`}
                      </p>
                      <Button onClick={() => startAssign(c)} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Add task / quiz / resource
                      </Button>
                    </div>
                    {items.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <ClipboardList className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground mb-3">You haven't assigned anything to {c.studentName} yet.</p>
                        <Button onClick={() => startAssign(c)} className="bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="h-4 w-4 mr-2" /> Assign Now
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map(a => (
                          <div key={a.id} className="flex items-start justify-between gap-3 p-3 border rounded-lg">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="capitalize">{a.type}</Badge>
                                <p className="font-medium">{a.title}</p>
                                <Badge variant="secondary" className="capitalize">{a.status}</Badge>
                              </div>
                              {a.description && <p className="text-sm text-muted-foreground mt-1">{a.description}</p>}
                              {a.payload?.resourceUrl && (
                                <a href={a.payload.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">
                                  {a.payload.resourceUrl}
                                </a>
                              )}
                              {a.dueDate && <p className="text-xs text-muted-foreground mt-1">Due {new Date(a.dueDate).toLocaleDateString()}</p>}
                            </div>
                            <Button size="icon" variant="ghost" onClick={() => onDelete(a.id!)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to {activeConn?.studentName}</DialogTitle>
            <DialogDescription>Send a task, share a resource, or assign a quiz.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={type} onValueChange={(v: AssignType) => setType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task"><ClipboardList className="inline h-4 w-4 mr-2" />Task</SelectItem>
                  <SelectItem value="resource"><BookOpen className="inline h-4 w-4 mr-2" />Resource</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {type === "quiz" ? (
              <div>
                <Label>Pick a quiz</Label>
                <Select value={quizId} onValueChange={setQuizId}>
                  <SelectTrigger><SelectValue placeholder={quizzes.length ? "Select quiz" : "No quizzes yet — create one first"} /></SelectTrigger>
                  <SelectContent>
                    {quizzes.map(q => (
                      <SelectItem key={q.id} value={q.id!}>{q.topic}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div>
                  <Label>Title</Label>
                  <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={type === "task" ? "e.g. Practice algebra worksheet" : "e.g. Khan Academy: Linear equations"} />
                </div>
                {type === "resource" && (
                  <div>
                    <Label>Resource URL</Label>
                    <Input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div>
                  <Label>Description / instructions</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>Due date (optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleAssign} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Sending…" : "Send"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
