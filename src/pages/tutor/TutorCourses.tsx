import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  DollarSign,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  COURSE_LEVELS,
  Course,
  CourseEnrollment,
  CourseLesson,
  DEFAULT_COMMISSION_RATE,
  LessonType,
  createCourse,
  createLesson,
  deleteCourse,
  deleteLesson,
  getCoursesForTutor,
  getEnrollmentsForTutor,
  getLessonsForCourse,
  updateCourse,
  updateLesson,
} from "@/lib/courses";

const SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Computer Science",
  "Economics",
  "Accounting",
  "Quran & Islamic Studies",
  "Languages",
  "Test Prep",
  "Other",
];

/** Compress a cover image to a small base64 JPEG (Firestore-safe). */
const compressImage = (file: File, maxWidth = 800): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => reject(new Error("Invalid image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

const emptyCourse = {
  title: "",
  subject: "Mathematics",
  level: "High School",
  shortDescription: "",
  description: "",
  outcomes: "",
  priceUsd: "49",
  coverImageUrl: "",
};

const emptyLesson = {
  sectionTitle: "Course content",
  title: "",
  type: "video" as LessonType,
  videoUrl: "",
  content: "",
  fileUrl: "",
  fileName: "",
  durationMinutes: "",
  isFreePreview: false,
};

export default function TutorCourses() {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [courseDialog, setCourseDialog] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyCourse);

  const [curriculumCourse, setCurriculumCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [lessonForm, setLessonForm] = useState(emptyLesson);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [c, e] = await Promise.all([
      getCoursesForTutor(user.uid),
      getEnrollmentsForTutor(user.uid),
    ]);
    setCourses(c);
    setEnrollments(e);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const activeEnrollments = enrollments.filter(e => e.status === "active");
  const earnings = useMemo(
    () =>
      activeEnrollments.reduce(
        (sum, e) => sum + (e.tutorEarningsUsd ?? 0),
        0
      ),
    [activeEnrollments]
  );

  const openCreate = () => {
    setEditingCourse(null);
    setForm(emptyCourse);
    setCourseDialog(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      subject: course.subject,
      level: course.level,
      shortDescription: course.shortDescription || "",
      description: course.description || "",
      outcomes: (course.outcomes || []).join("\n"),
      priceUsd: String(course.priceUsd),
      coverImageUrl: course.coverImageUrl || "",
    });
    setCourseDialog(true);
  };

  const handleCover = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please choose an image file", variant: "destructive" });
      return;
    }
    try {
      const compressed = await compressImage(file);
      setForm(f => ({ ...f, coverImageUrl: compressed }));
    } catch {
      toast({ title: "Could not process that image", variant: "destructive" });
    }
  };

  const saveCourse = async () => {
    if (!user || !userProfile) return;
    if (!form.title.trim() || !form.priceUsd) {
      toast({ title: "Title and price are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subject: form.subject,
        level: form.level,
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        outcomes: form.outcomes
          .split("\n")
          .map(o => o.trim())
          .filter(Boolean),
        priceUsd: Number(form.priceUsd),
        coverImageUrl: form.coverImageUrl,
      };
      if (editingCourse?.id) {
        await updateCourse(editingCourse.id, payload);
        toast({ title: "Course updated" });
      } else {
        await createCourse({
          ...payload,
          tutorId: user.uid,
          tutorName: userProfile.fullName,
          tutorEmail: userProfile.email,
          status: "draft",
          commissionRate: DEFAULT_COMMISSION_RATE,
        });
        toast({ title: "Course created", description: "Add lessons, then publish it." });
      }
      setCourseDialog(false);
      load();
    } catch (e: any) {
      toast({ title: "Could not save course", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (course: Course) => {
    if (!course.id) return;
    const next = course.status === "published" ? "draft" : "published";
    await updateCourse(course.id, { status: next });
    toast({ title: next === "published" ? "Course published" : "Course unpublished" });
    load();
  };

  const removeCourse = async (course: Course) => {
    if (!course.id) return;
    if (course.enrolledCount > 0) {
      toast({
        title: "Cannot delete",
        description: "Students are enrolled. Unpublish it instead.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) return;
    await deleteCourse(course.id);
    toast({ title: "Course deleted" });
    load();
  };

  const openCurriculum = async (course: Course) => {
    setCurriculumCourse(course);
    setEditingLesson(null);
    setLessonForm(emptyLesson);
    setLessons(await getLessonsForCourse(course.id!));
  };

  const saveLesson = async () => {
    if (!curriculumCourse?.id || !user) return;
    if (!lessonForm.title.trim()) {
      toast({ title: "Lesson title is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        sectionTitle: lessonForm.sectionTitle.trim() || "Course content",
        title: lessonForm.title.trim(),
        type: lessonForm.type,
        videoUrl: lessonForm.videoUrl.trim(),
        content: lessonForm.content.trim(),
        fileUrl: lessonForm.fileUrl.trim(),
        fileName: lessonForm.fileName.trim(),
        durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : 0,
        isFreePreview: lessonForm.isFreePreview,
      };
      if (editingLesson?.id) {
        await updateLesson(editingLesson.id, payload);
      } else {
        await createLesson({
          ...payload,
          courseId: curriculumCourse.id,
          tutorId: user.uid,
          order: lessons.length + 1,
        });
      }
      setLessonForm(emptyLesson);
      setEditingLesson(null);
      setLessons(await getLessonsForCourse(curriculumCourse.id));
      toast({ title: editingLesson ? "Lesson updated" : "Lesson added" });
    } catch (e: any) {
      toast({ title: "Could not save lesson", description: e?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const editLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      sectionTitle: lesson.sectionTitle,
      title: lesson.title,
      type: lesson.type,
      videoUrl: lesson.videoUrl || "",
      content: lesson.content || "",
      fileUrl: lesson.fileUrl || "",
      fileName: lesson.fileName || "",
      durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : "",
      isFreePreview: lesson.isFreePreview,
    });
  };

  const removeLesson = async (lesson: CourseLesson) => {
    if (!lesson.id || !curriculumCourse?.id) return;
    if (!confirm(`Delete lesson "${lesson.title}"?`)) return;
    await deleteLesson(lesson.id);
    setLessons(await getLessonsForCourse(curriculumCourse.id));
  };

  return (
    <DashboardLayout role="tutor">
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-emerald-600/15 via-green-500/15 to-teal-500/15 border-2 border-emerald-300/50 dark:border-emerald-700/50">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Tutor Portal
            </span>
            <h1 className="font-display text-3xl font-bold">My Courses</h1>
            <p className="text-muted-foreground mt-1">
              Sell self-paced courses with video lessons and downloadable materials.
            </p>
          </div>
          <Button onClick={openCreate} className="bg-gradient-to-r from-emerald-600 to-teal-600">
            <Plus className="h-4 w-4 mr-2" /> New course
          </Button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Courses", value: courses.length, icon: BookOpen },
          { label: "Students enrolled", value: activeEnrollments.length, icon: Users },
          { label: "Your earnings", value: `$${earnings.toFixed(2)}`, icon: DollarSign },
        ].map(s => (
          <Card key={s.label} className="border-emerald-100 dark:border-emerald-900">
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
              <s.icon className="h-6 w-6 text-emerald-600" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="sales">Sales ({enrollments.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : courses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="mb-4">You haven't created any courses yet.</p>
                <Button onClick={openCreate}>Create your first course</Button>
              </CardContent>
            </Card>
          ) : (
            courses.map(course => (
              <Card key={course.id} className="border-emerald-100 dark:border-emerald-900">
                <CardContent className="p-5 flex flex-col md:flex-row gap-4">
                  {course.coverImageUrl ? (
                    <img
                      src={course.coverImageUrl}
                      alt={`${course.title} cover`}
                      className="h-24 w-40 rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-24 w-40 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <ImageIcon className="h-6 w-6 text-emerald-500/60" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge
                        variant={course.status === "published" ? "default" : "secondary"}
                        className="capitalize"
                      >
                        {course.status}
                      </Badge>
                      <Badge variant="outline">{course.subject}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                    </div>
                    <h3 className="font-semibold text-lg">{course.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {course.shortDescription}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-semibold text-emerald-600">${course.priceUsd}</span>
                      <span className="text-muted-foreground">
                        {" "}· {course.enrolledCount} enrolled · platform fee {course.commissionRate}%
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap md:flex-col gap-2 md:w-44">
                    <Button size="sm" variant="outline" onClick={() => openCurriculum(course)}>
                      <FileText className="h-4 w-4 mr-2" /> Curriculum
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => openEdit(course)}>
                      <Pencil className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={course.status === "published" ? "secondary" : "default"}
                      onClick={() => togglePublish(course)}
                    >
                      {course.status === "published" ? "Unpublish" : "Publish"}
                    </Button>
                    {course.status === "published" && (
                      <Button size="sm" variant="ghost" asChild>
                        <Link to={`/courses/${course.id}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-2" /> View
                        </Link>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => removeCourse(course)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course sales</CardTitle>
              <CardDescription>
                Payments are collected by TutorsPool; your share is shown after the platform fee.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {enrollments.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No sales yet.</p>
              ) : (
                enrollments.map(e => (
                  <div
                    key={e.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{e.studentName}</p>
                      <p className="text-sm text-muted-foreground">{e.courseTitle}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={e.status === "active" ? "default" : "secondary"} className="capitalize">
                        {e.status}
                      </Badge>
                      <p className="text-sm mt-1">
                        ${e.amountPaidUsd ?? e.priceUsd}
                        {e.status === "active" && (
                          <span className="text-emerald-600 font-medium">
                            {" "}· you earn ${Number(e.tutorEarningsUsd ?? 0).toFixed(2)}
                          </span>
                        )}
                      </p>
                      {e.payoutPaid && <p className="text-xs text-emerald-600">Payout sent</p>}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Course dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit course" : "Create a course"}</DialogTitle>
            <DialogDescription>
              New courses start as a draft. Publish when your lessons are ready.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="course-title">Title</Label>
              <Input
                id="course-title"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Complete O-Level Physics Crash Course"
              />
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>Subject</Label>
                <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COURSE_LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="course-price">Price (USD)</Label>
                <Input
                  id="course-price"
                  type="number"
                  min="1"
                  value={form.priceUsd}
                  onChange={e => setForm({ ...form, priceUsd: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="course-short">Short description</Label>
              <Input
                id="course-short"
                value={form.shortDescription}
                onChange={e => setForm({ ...form, shortDescription: e.target.value })}
                placeholder="One line shown on the course card"
              />
            </div>

            <div>
              <Label htmlFor="course-desc">Full description</Label>
              <Textarea
                id="course-desc"
                rows={4}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="course-outcomes">What students will learn (one per line)</Label>
              <Textarea
                id="course-outcomes"
                rows={3}
                value={form.outcomes}
                onChange={e => setForm({ ...form, outcomes: e.target.value })}
                placeholder={"Solve kinematics problems\nMaster exam techniques"}
              />
            </div>

            <div>
              <Label>Cover image</Label>
              <div className="flex items-center gap-3 mt-1">
                {form.coverImageUrl && (
                  <img
                    src={form.coverImageUrl}
                    alt="Course cover preview"
                    className="h-16 w-28 rounded object-cover"
                  />
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleCover(e.target.files?.[0])}
                />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" /> Upload
                </Button>
                {form.coverImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm({ ...form, coverImageUrl: "" })}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)}>Cancel</Button>
            <Button onClick={saveCourse} disabled={saving}>
              {saving ? "Saving…" : editingCourse ? "Save changes" : "Create course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Curriculum dialog */}
      <Dialog open={!!curriculumCourse} onOpenChange={o => !o && setCurriculumCourse(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Curriculum — {curriculumCourse?.title}</DialogTitle>
            <DialogDescription>
              Add video links (YouTube, Vimeo or any embed URL), written notes, or downloadable files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {lessons.length === 0 ? (
              <p className="text-sm text-muted-foreground">No lessons yet.</p>
            ) : (
              lessons.map((l, i) => (
                <div key={l.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <span className="text-sm text-muted-foreground w-6">{i + 1}</span>
                  {l.type === "video" ? (
                    <Video className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <FileText className="h-4 w-4 text-emerald-600" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground">{l.sectionTitle}</p>
                  </div>
                  {l.isFreePreview && <Badge variant="secondary">Preview</Badge>}
                  <Button size="icon" variant="ghost" onClick={() => editLesson(l)} aria-label="Edit lesson">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeLesson(l)}
                    aria-label="Delete lesson"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 space-y-4">
            <p className="font-medium">{editingLesson ? "Edit lesson" : "Add a lesson"}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lesson-section">Section</Label>
                <Input
                  id="lesson-section"
                  value={lessonForm.sectionTitle}
                  onChange={e => setLessonForm({ ...lessonForm, sectionTitle: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="lesson-title">Lesson title</Label>
                <Input
                  id="lesson-title"
                  value={lessonForm.title}
                  onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={lessonForm.type}
                  onValueChange={(v: LessonType) => setLessonForm({ ...lessonForm, type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="text">Written notes</SelectItem>
                    <SelectItem value="file">Downloadable file</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="lesson-duration">Duration (minutes)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min="0"
                  value={lessonForm.durationMinutes}
                  onChange={e => setLessonForm({ ...lessonForm, durationMinutes: e.target.value })}
                />
              </div>
            </div>

            {lessonForm.type === "video" && (
              <div>
                <Label htmlFor="lesson-video">Video URL</Label>
                <Input
                  id="lesson-video"
                  value={lessonForm.videoUrl}
                  onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </div>
            )}

            {lessonForm.type === "file" && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lesson-file">File URL</Label>
                  <Input
                    id="lesson-file"
                    value={lessonForm.fileUrl}
                    onChange={e => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                    placeholder="https://drive.google.com/…"
                  />
                </div>
                <div>
                  <Label htmlFor="lesson-filename">File name</Label>
                  <Input
                    id="lesson-filename"
                    value={lessonForm.fileName}
                    onChange={e => setLessonForm({ ...lessonForm, fileName: e.target.value })}
                    placeholder="Chapter 1 notes.pdf"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="lesson-content">
                {lessonForm.type === "text" ? "Lesson notes" : "Notes shown with this lesson (optional)"}
              </Label>
              <Textarea
                id="lesson-content"
                rows={4}
                value={lessonForm.content}
                onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="lesson-preview"
                checked={lessonForm.isFreePreview}
                onCheckedChange={v => setLessonForm({ ...lessonForm, isFreePreview: v })}
              />
              <Label htmlFor="lesson-preview">Free preview (visible before purchase)</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveLesson} disabled={saving}>
                {editingLesson ? "Save lesson" : "Add lesson"}
              </Button>
              {editingLesson && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingLesson(null);
                    setLessonForm(emptyLesson);
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
