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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  CalendarDays,
  Video,
  Trash2,
  ClipboardList,
  BookOpen,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { createTutorAssignment, getTutorQuizzes, Quiz } from "@/lib/firestore";
import {
  createGroupPackage,
  createGroupSession,
  deleteGroupPackage,
  deleteGroupSession,
  getGroupPackagesForTutor,
  getSessionsForTutor,
  getSubscriptionsForTutor,
  updateGroupSession,
  formatSchedule,
  seatsLeft,
  GROUP_LEVELS,
  WEEK_DAYS,
  GroupPackage,
  GroupScheduleSlot,
  GroupSession,
  GroupSubscription,
} from "@/lib/groupClasses";

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  paused: "bg-slate-100 text-slate-700",
  archived: "bg-slate-100 text-slate-500",
};

type AssignType = "task" | "resource" | "quiz";

export default function TutorGroupClasses() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const [packages, setPackages] = useState<GroupPackage[]>([]);
  const [subs, setSubs] = useState<GroupSubscription[]>([]);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // create package dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState(GROUP_LEVELS[2]);
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"batch" | "cohort">("cohort");
  const [seatLimit, setSeatLimit] = useState("8");
  const [priceUsd, setPriceUsd] = useState("40");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [schedule, setSchedule] = useState<GroupScheduleSlot[]>([{ day: "Monday", time: "17:00" }]);

  // session dialog
  const [sessionOpen, setSessionOpen] = useState(false);
  const [sessionPkg, setSessionPkg] = useState<GroupPackage | null>(null);
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("17:00");
  const [sessionDuration, setSessionDuration] = useState("60");
  const [creatingSession, setCreatingSession] = useState(false);

  // group assignment dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPkg, setAssignPkg] = useState<GroupPackage | null>(null);
  const [assignType, setAssignType] = useState<AssignType>("task");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDescription, setAssignDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [quizId, setQuizId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile?.uid]);

  const fetchAll = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const [pkgs, s, sess, qs] = await Promise.all([
        getGroupPackagesForTutor(userProfile.uid),
        getSubscriptionsForTutor(userProfile.uid),
        getSessionsForTutor(userProfile.uid),
        getTutorQuizzes(userProfile.uid),
      ]);
      setPackages(pkgs);
      setSubs(s);
      setSessions(sess);
      setQuizzes(qs);
    } catch {
      toast({ title: "Failed to load group classes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const enrolled = (packageId: string) =>
    subs.filter(s => s.packageId === packageId && s.status === "active");
  const pendingRequests = (packageId: string) =>
    subs.filter(s => s.packageId === packageId && s.status === "pending");
  const packageSessions = (packageId: string) =>
    sessions.filter(s => s.packageId === packageId);

  const resetCreateForm = () => {
    setTitle(""); setSubject(""); setLevel(GROUP_LEVELS[2]); setDescription("");
    setType("cohort"); setSeatLimit("8"); setPriceUsd("40"); setStartDate(""); setEndDate("");
    setSchedule([{ day: "Monday", time: "17:00" }]);
  };

  const handleCreatePackage = async () => {
    if (!userProfile?.uid) return;
    if (!title.trim() || !subject.trim()) {
      toast({ title: "Title and subject are required", variant: "destructive" });
      return;
    }
    const seats = parseInt(seatLimit, 10);
    const price = parseFloat(priceUsd);
    if (!seats || seats < 2) {
      toast({ title: "Seat limit must be at least 2", variant: "destructive" });
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast({ title: "Enter a valid monthly price", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createGroupPackage({
        tutorId: userProfile.uid,
        tutorName: userProfile.fullName,
        tutorEmail: userProfile.email,
        title: title.trim(),
        subject: subject.trim(),
        level,
        description: description.trim() || undefined,
        type,
        seatLimit: seats,
        priceUsd: price,
        billingPeriod: "monthly",
        schedule: schedule.filter(s => s.day && s.time),
        ...(type === "batch" ? { startDate: startDate || undefined, endDate: endDate || undefined } : {}),
      });
      toast({
        title: "Submitted for approval",
        description: "An admin will review your group class before it goes live.",
      });
      setCreateOpen(false);
      resetCreateForm();
      fetchAll();
    } catch (e: any) {
      toast({ title: "Could not create class", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePackage = async (pkg: GroupPackage) => {
    try {
      await deleteGroupPackage(pkg.id!);
      toast({ title: "Group class removed" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const openSessionDialog = (pkg: GroupPackage) => {
    setSessionPkg(pkg);
    setSessionTopic(pkg.title);
    setSessionDate("");
    setSessionTime("17:00");
    setSessionDuration("60");
    setSessionOpen(true);
  };

  const handleCreateSession = async () => {
    if (!sessionPkg || !userProfile?.uid) return;
    if (!sessionDate) {
      toast({ title: "Pick a date", variant: "destructive" });
      return;
    }
    setCreatingSession(true);
    try {
      const scheduledAt = `${sessionDate}T${sessionTime}:00`;
      const sessionId = await createGroupSession({
        packageId: sessionPkg.id!,
        packageTitle: sessionPkg.title,
        tutorId: userProfile.uid,
        topic: sessionTopic.trim() || sessionPkg.title,
        scheduledAt,
        durationMinutes: parseInt(sessionDuration, 10) || 60,
      });

      // Generate the Zoom link with the existing edge function
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          const response = await fetch(
            "https://yafjkpckhzpkrptmzcms.supabase.co/functions/v1/create-zoom-meeting",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
              },
              body: JSON.stringify({
                topic: `${sessionPkg.subject} group class — ${sessionTopic || sessionPkg.title}`,
                startTime: scheduledAt,
                duration: parseInt(sessionDuration, 10) || 60,
              }),
            }
          );
          const data = await response.json();
          if (data?.success && data?.joinUrl) {
            await updateGroupSession(sessionId, { zoomJoinUrl: data.joinUrl });
          }
        }
      } catch (zoomError) {
        console.error("Zoom link generation failed", zoomError);
        toast({
          title: "Session created without Zoom link",
          description: "You can retry generating the link from the session list.",
        });
      }

      toast({ title: "Group session scheduled" });
      setSessionOpen(false);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Could not schedule session", description: e?.message, variant: "destructive" });
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteGroupSession(id);
      toast({ title: "Session removed" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const openAssignDialog = (pkg: GroupPackage) => {
    setAssignPkg(pkg);
    setAssignType("task");
    setAssignTitle("");
    setAssignDescription("");
    setResourceUrl("");
    setQuizId("");
    setDueDate("");
    setAssignOpen(true);
  };

  const handleAssignToGroup = async () => {
    if (!assignPkg || !userProfile?.uid) return;
    const roster = enrolled(assignPkg.id!);
    if (roster.length === 0) {
      toast({ title: "No enrolled students yet", variant: "destructive" });
      return;
    }
    if (assignType === "quiz" && !quizId) {
      toast({ title: "Pick a quiz", variant: "destructive" });
      return;
    }
    if (assignType !== "quiz" && !assignTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (assignType === "resource" && !resourceUrl.trim()) {
      toast({ title: "Resource URL required", variant: "destructive" });
      return;
    }
    setAssigning(true);
    try {
      const selectedQuiz = quizzes.find(q => q.id === quizId);
      await Promise.all(
        roster.map(s =>
          createTutorAssignment({
            connectionId: `group:${assignPkg.id}`,
            groupPackageId: assignPkg.id!,
            tutorId: userProfile.uid,
            tutorName: userProfile.fullName,
            studentId: s.studentId,
            studentName: s.studentName,
            type: assignType,
            title: assignType === "quiz" ? selectedQuiz?.topic || "Quiz" : assignTitle.trim(),
            description: assignDescription.trim() || undefined,
            payload: {
              ...(assignType === "resource" ? { resourceUrl: resourceUrl.trim() } : {}),
              ...(assignType === "quiz" ? { quizId } : {}),
            },
            dueDate: dueDate || undefined,
          })
        )
      );
      toast({ title: `Sent to ${roster.length} student${roster.length === 1 ? "" : "s"}` });
      setAssignOpen(false);
    } catch (e: any) {
      toast({ title: "Could not assign", description: e?.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  const approvedPackages = useMemo(
    () => packages.filter(p => p.status === "approved"),
    [packages]
  );

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
            <Users className="h-7 w-7 text-emerald-600" /> Group Classes
          </h1>
          <p className="text-muted-foreground">
            Propose a small-group package. Once an admin approves it, students can subscribe monthly.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4 mr-2" /> New Group Class
        </Button>
      </div>

      {packages.length === 0 ? (
        <Card className="border-emerald-200">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">You haven't proposed any group classes yet.</p>
            <Button onClick={() => setCreateOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4 mr-2" /> Create your first one
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {packages.map(pkg => {
            const roster = enrolled(pkg.id!);
            const waiting = pendingRequests(pkg.id!);
            const pkgSessions = packageSessions(pkg.id!);
            return (
              <Card key={pkg.id} className="border-emerald-100">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <CardTitle>{pkg.title}</CardTitle>
                        <Badge className={`${statusStyles[pkg.status]} border-0 capitalize`}>
                          {pkg.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {pkg.subject} · {pkg.level} · ${pkg.priceUsd}/month ·{" "}
                        {pkg.type === "batch" ? "Fixed batch" : "Ongoing cohort"} ·{" "}
                        {roster.length}/{pkg.seatLimit} enrolled ({seatsLeft(pkg)} seats left)
                      </CardDescription>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatSchedule(pkg.schedule)}
                      </p>
                      {pkg.status === "rejected" && pkg.rejectionNote && (
                        <p className="text-sm text-red-700 mt-2">Admin note: {pkg.rejectionNote}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {pkg.status === "approved" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => openSessionDialog(pkg)}>
                            <CalendarDays className="h-4 w-4 mr-2" /> Schedule Session
                          </Button>
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => openAssignDialog(pkg)}
                          >
                            <Plus className="h-4 w-4 mr-2" /> Assign to Group
                          </Button>
                        </>
                      )}
                      {(pkg.status === "pending" || pkg.status === "rejected") && (
                        <Button size="icon" variant="ghost" onClick={() => handleDeletePackage(pkg)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="roster">
                    <TabsList>
                      <TabsTrigger value="roster">Roster ({roster.length})</TabsTrigger>
                      <TabsTrigger value="requests">Requests ({waiting.length})</TabsTrigger>
                      <TabsTrigger value="sessions">Sessions ({pkgSessions.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="roster" className="mt-4">
                      {roster.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                          No enrolled students yet. Students appear here once an admin confirms payment.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {roster.map(s => (
                            <div
                              key={s.id}
                              className="flex flex-wrap items-center justify-between gap-2 p-3 border rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{s.studentName}</p>
                                <p className="text-sm text-muted-foreground">{s.studentEmail}</p>
                              </div>
                              {s.paidThrough && (
                                <Badge variant="outline">
                                  Paid until {new Date(s.paidThrough).toLocaleDateString()}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="requests" className="mt-4">
                      {waiting.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">No pending requests.</p>
                      ) : (
                        <div className="space-y-2">
                          {waiting.map(s => (
                            <div key={s.id} className="p-3 border rounded-lg">
                              <p className="font-medium">{s.studentName}</p>
                              <p className="text-sm text-muted-foreground">
                                Requested {new Date(s.createdAt).toLocaleDateString()} — awaiting admin
                                payment confirmation.
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="sessions" className="mt-4">
                      {pkgSessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4">
                          No sessions scheduled yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {pkgSessions.map(s => (
                            <div
                              key={s.id}
                              className="flex flex-wrap items-center justify-between gap-3 p-3 border rounded-lg"
                            >
                              <div className="min-w-0">
                                <p className="font-medium">{s.topic}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(s.scheduledAt).toLocaleString()} · {s.durationMinutes} min
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                {s.zoomJoinUrl ? (
                                  <Button asChild size="sm" variant="outline">
                                    <a href={s.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                                      <Video className="h-4 w-4 mr-2" /> Join
                                    </a>
                                  </Button>
                                ) : (
                                  <Badge variant="outline">No Zoom link</Badge>
                                )}
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteSession(s.id!)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create package dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New group class</DialogTitle>
            <DialogDescription>
              Submit your package for admin approval. It becomes publicly bookable once approved.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Class title</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. O-Level Physics Crash Group"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Physics" />
              </div>
              <div>
                <Label>Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GROUP_LEVELS.map(l => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What students will cover, who it's for, what's included…"
              />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={type} onValueChange={(v: "batch" | "cohort") => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cohort">Ongoing cohort</SelectItem>
                    <SelectItem value="batch">Fixed batch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Seat limit</Label>
                <Input type="number" min={2} value={seatLimit} onChange={e => setSeatLimit(e.target.value)} />
              </div>
              <div>
                <Label>Price (USD/month)</Label>
                <Input type="number" min={1} value={priceUsd} onChange={e => setPriceUsd(e.target.value)} />
              </div>
            </div>
            {type === "batch" && (
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start date</Label>
                  <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <Label>End date</Label>
                  <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
            )}
            <div>
              <Label>Weekly schedule</Label>
              <div className="space-y-2 mt-1">
                {schedule.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Select
                      value={slot.day}
                      onValueChange={v =>
                        setSchedule(prev => prev.map((s, idx) => (idx === i ? { ...s, day: v } : s)))
                      }
                    >
                      <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {WEEK_DAYS.map(d => (
                          <SelectItem key={d} value={d}>{d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      className="w-32"
                      value={slot.time}
                      onChange={e =>
                        setSchedule(prev =>
                          prev.map((s, idx) => (idx === i ? { ...s, time: e.target.value } : s))
                        )
                      }
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label="Remove slot"
                      onClick={() => setSchedule(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSchedule(prev => [...prev, { day: "Wednesday", time: "17:00" }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Add slot
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePackage} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? "Submitting…" : "Submit for approval"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule session dialog */}
      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule group session</DialogTitle>
            <DialogDescription>
              A Zoom link is generated automatically and shared with every enrolled student.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic</Label>
              <Input value={sessionTopic} onChange={e => setSessionTopic(e.target.value)} />
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Date</Label>
                <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={sessionTime} onChange={e => setSessionTime(e.target.value)} />
              </div>
              <div>
                <Label>Minutes</Label>
                <Input
                  type="number"
                  min={15}
                  value={sessionDuration}
                  onChange={e => setSessionDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateSession}
              disabled={creatingSession}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {creatingSession ? "Scheduling…" : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign to group dialog */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to {assignPkg?.title}</DialogTitle>
            <DialogDescription>
              Sent to every enrolled student in this group at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={assignType} onValueChange={(v: AssignType) => setAssignType(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task"><ClipboardList className="inline h-4 w-4 mr-2" />Task</SelectItem>
                  <SelectItem value="resource"><BookOpen className="inline h-4 w-4 mr-2" />Resource</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {assignType === "quiz" ? (
              <div>
                <Label>Pick a quiz</Label>
                <Select value={quizId} onValueChange={setQuizId}>
                  <SelectTrigger>
                    <SelectValue placeholder={quizzes.length ? "Select quiz" : "No quizzes yet — create one first"} />
                  </SelectTrigger>
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
                  <Input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} />
                </div>
                {assignType === "resource" && (
                  <div>
                    <Label>Resource URL</Label>
                    <Input value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} placeholder="https://..." />
                  </div>
                )}
                <div>
                  <Label>Description / instructions</Label>
                  <Textarea value={assignDescription} onChange={e => setAssignDescription(e.target.value)} />
                </div>
              </>
            )}
            <div>
              <Label>Due date (optional)</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button onClick={handleAssignToGroup} disabled={assigning} className="bg-emerald-600 hover:bg-emerald-700">
              {assigning ? "Sending…" : "Send to group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
