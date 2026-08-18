import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, CheckCircle2, Download, FileText, PlayCircle, Video } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Course,
  CourseEnrollment,
  CourseLesson,
  getCourse,
  getEnrollmentsForStudent,
  getLessonsForCourse,
  getCourseProgress,
  setLessonCompleted,
  groupBySection,
} from "@/lib/courses";

/** Convert common video links into an embeddable URL. */
const toEmbedUrl = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed${u.pathname}`;
    if (u.hostname.includes("vimeo.com") && !u.pathname.startsWith("/video"))
      return `https://player.vimeo.com/video${u.pathname}`;
    return url;
  } catch {
    return url;
  }
};

export default function MyCourses() {
  const { courseId } = useParams<{ courseId?: string }>();
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const list = await getEnrollmentsForStudent(user.uid);
      setEnrollments(list);

      if (courseId) {
        const active = list.find(e => e.courseId === courseId && e.status === "active");
        if (active) {
          const [c, ls, prog] = await Promise.all([
            getCourse(courseId),
            getLessonsForCourse(courseId),
            getCourseProgress(user.uid, courseId),
          ]);
          setCourse(c);
          setLessons(ls);
          setCompleted(prog?.completedLessonIds || []);
          setActiveLesson(ls.find(l => l.id === prog?.lastLessonId) || ls[0] || null);
        } else {
          setCourse(null);
        }
      }
      setLoading(false);
    })();
  }, [user, courseId]);

  const percent = useMemo(
    () => (lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0),
    [completed, lessons]
  );

  const toggleComplete = async (lesson: CourseLesson) => {
    if (!user || !courseId || !lesson.id) return;
    const isDone = completed.includes(lesson.id);
    const next = await setLessonCompleted(user.uid, courseId, lesson.id, !isDone);
    setCompleted(next);
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  // ---- Course player ----
  if (courseId) {
    if (!course) {
      return (
        <DashboardLayout role="student">
          <Card>
            <CardContent className="py-16 text-center space-y-4">
              <p className="text-muted-foreground">
                You don't have access to this course yet. Access unlocks once your payment is confirmed.
              </p>
              <Button asChild variant="outline">
                <Link to="/student/courses">Back to my courses</Link>
              </Button>
            </CardContent>
          </Card>
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout role="student">
        <div className="mb-6">
          <Link to="/student/courses" className="text-sm text-muted-foreground hover:text-foreground">
            ← My courses
          </Link>
          <h1 className="font-display text-2xl sm:text-3xl font-bold mt-2">{course.title}</h1>
          <p className="text-muted-foreground">by {course.tutorName}</p>
          <div className="mt-3 max-w-sm">
            <Progress value={percent} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completed.length} of {lessons.length} lessons complete ({percent}%)
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <Card>
            <CardContent className="p-5 space-y-4">
              {!activeLesson ? (
                <p className="text-muted-foreground py-8 text-center">
                  Your tutor hasn't added lessons yet.
                </p>
              ) : (
                <>
                  <h2 className="font-display text-xl font-bold">{activeLesson.title}</h2>
                  {activeLesson.type === "video" && activeLesson.videoUrl && (
                    <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
                      <iframe
                        src={toEmbedUrl(activeLesson.videoUrl)}
                        title={activeLesson.title}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                  {activeLesson.type === "file" && activeLesson.fileUrl && (
                    <Button asChild variant="outline">
                      <a href={activeLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Download className="h-4 w-4 mr-2" />
                        {activeLesson.fileName || "Download material"}
                      </a>
                    </Button>
                  )}
                  {activeLesson.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                      {activeLesson.content}
                    </p>
                  )}
                  <Button
                    variant={completed.includes(activeLesson.id!) ? "secondary" : "default"}
                    onClick={() => toggleComplete(activeLesson)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {completed.includes(activeLesson.id!) ? "Completed" : "Mark as complete"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">Course content</CardTitle>
              <CardDescription>{lessons.length} lessons</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupBySection(lessons).map(([section, items]) => (
                <div key={section}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                    {section}
                  </p>
                  <ul className="space-y-1">
                    {items.map(l => (
                      <li key={l.id}>
                        <button
                          onClick={() => setActiveLesson(l)}
                          className={`w-full text-left flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                            activeLesson?.id === l.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                          }`}
                        >
                          {completed.includes(l.id!) ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                          ) : l.type === "video" ? (
                            <Video className="h-4 w-4 shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 shrink-0" />
                          )}
                          <span className="flex-1 truncate">{l.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ---- Course list ----
  const active = enrollments.filter(e => e.status === "active");
  const pending = enrollments.filter(e => e.status === "pending");

  return (
    <DashboardLayout role="student">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-1">Self-paced courses you've purchased.</p>
      </div>

      {pending.length > 0 && (
        <Card className="mb-6 border-amber-200 dark:border-amber-900">
          <CardHeader>
            <CardTitle className="text-base">Awaiting payment confirmation</CardTitle>
            <CardDescription>Our team will unlock these once payment is confirmed.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {pending.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border">
                <p className="font-medium">{e.courseTitle}</p>
                <Badge variant="secondary">Pending</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {active.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center text-muted-foreground">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">You haven't enrolled in any course yet.</p>
            <Button asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {active.map(e => (
            <Card key={e.id} className="flex flex-col">
              <CardContent className="p-5 flex flex-col flex-1">
                <PlayCircle className="h-8 w-8 text-primary mb-3" />
                <h2 className="font-semibold text-lg">{e.courseTitle}</h2>
                <p className="text-sm text-muted-foreground">by {e.tutorName}</p>
                <Button asChild className="mt-auto pt-0 w-full mt-5">
                  <Link to={`/student/courses/${e.courseId}`}>Continue learning</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
