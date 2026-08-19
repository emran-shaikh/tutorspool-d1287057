import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  MessageCircle,
  PlayCircle,
  Video,
} from "lucide-react";
import { Price } from "@/components/Price";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createAdminNotification } from "@/lib/firestore";
import {
  getCourse,
  getPreviewLessons,
  getEnrollmentsForStudent,
  requestEnrollment,
  groupBySection,
  Course,
  CourseEnrollment,
  CourseLesson,
} from "@/lib/courses";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ADMIN_WHATSAPP = "923453284284";

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

const lessonIcon = (type: CourseLesson["type"]) =>
  type === "video" ? Video : type === "file" ? FileText : PlayCircle;


export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [previews, setPreviews] = useState<CourseLesson[]>([]);
  const [myEnrollment, setMyEnrollment] = useState<CourseEnrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      const [data, preview] = await Promise.all([
        getCourse(courseId),
        getPreviewLessons(courseId),
      ]);
      setCourse(data);
      setPreviews(preview);
      if (user && userProfile?.role === "student") {
        const enrollments = await getEnrollmentsForStudent(user.uid);
        setMyEnrollment(
          enrollments.find(e => e.courseId === courseId && e.status !== "cancelled") || null
        );
      }
      setLoading(false);
    })();
  }, [courseId, user, userProfile]);

  const handleEnroll = async () => {
    if (!user || !userProfile) {
      navigate("/login");
      return;
    }
    if (userProfile.role !== "student") {
      toast({
        title: "Student account required",
        description: "Sign in with a student account to buy a course.",
        variant: "destructive",
      });
      return;
    }
    if (!course?.id) return;

    setSubmitting(true);
    try {
      await requestEnrollment({
        courseId: course.id,
        courseTitle: course.title,
        studentId: user.uid,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        tutorId: course.tutorId,
        tutorName: course.tutorName,
        priceUsd: course.priceUsd,
        commissionRate: course.commissionRate,
      });
      await createAdminNotification({
        type: "course_enrollment_request",
        title: "New course purchase request",
        message: `${userProfile.fullName} wants to buy "${course.title}" by ${course.tutorName} ($${course.priceUsd}).`,
        metadata: {
          userId: user.uid,
          userName: userProfile.fullName,
          userEmail: userProfile.email,
          tutorId: course.tutorId,
        },
      }).catch(() => undefined);

      setMyEnrollment({
        courseId: course.id,
        courseTitle: course.title,
        studentId: user.uid,
        studentName: userProfile.fullName,
        tutorId: course.tutorId,
        status: "pending",
        priceUsd: course.priceUsd,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Request sent",
        description: "Our team will share payment details and unlock your course shortly.",
      });
    } catch (e: any) {
      toast({ title: "Could not send request", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const siteUrl = "https://tutorspool.com";
  const title = course ? `${course.title} — Online Course | TutorsPool` : "Course | TutorsPool";
  const description = course
    ? (course.shortDescription ||
        course.description ||
        `${course.subject} self-paced online course for ${course.level} learners by ${course.tutorName}.`
      ).slice(0, 155)
    : "Buy a self-paced online course from a verified TutorsPool tutor.";

  const sections = groupBySection(previews);

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/courses/${courseId}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/courses/${courseId}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {course && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: course.title,
              description: course.description || description,
              url: `${siteUrl}/courses/${course.id}`,
              educationalLevel: course.level,
              about: course.subject,
              provider: { "@type": "EducationalOrganization", name: "TutorsPool", url: siteUrl },
              hasCourseInstance: {
                "@type": "CourseInstance",
                courseMode: "Online",
                courseWorkload: "PT1H",
                instructor: { "@type": "Person", name: course.tutorName },
              },
              offers: {
                "@type": "Offer",
                price: course.priceUsd,
                priceCurrency: "USD",
                category: "Paid",
                availability: "https://schema.org/InStock",
              },
            })}
          </script>
        )}
      </Helmet>

      <Navbar />

      <main className="flex-1">
        {loading ? (
          <div className="flex justify-center py-24">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : !course || course.status !== "published" ? (
          <div className="max-w-3xl mx-auto py-24 text-center px-4">
            <h1 className="text-2xl font-display font-bold mb-2">Course not available</h1>
            <p className="text-muted-foreground mb-6">
              This course may have been unpublished or removed.
            </p>
            <Button asChild>
              <Link to="/courses">Browse courses</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <Link
              to="/courses"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-5"
            >
              <ArrowLeft className="h-4 w-4 mr-1 rtl:rotate-180" /> All courses
            </Link>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  {course.coverImageUrl && (
                    <img
                      src={course.coverImageUrl}
                      alt={`${course.title} course cover`}
                      className="w-full max-h-72 object-cover"
                    />
                  )}
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">{course.subject}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                      <Badge variant="outline">Self-paced</Badge>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold">{course.title}</h1>
                    <p className="text-muted-foreground mt-2">
                      Created by{" "}
                      <Link to={`/tutors/${course.tutorId}`} className="text-primary hover:underline">
                        {course.tutorName}
                      </Link>
                    </p>
                    {course.description && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {course.description}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {(course.outcomes?.length || 0) > 0 && (
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="font-display text-lg font-bold mb-3">What you'll learn</h2>
                      <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                        {course.outcomes!.map((o, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                            <span className="text-muted-foreground">{o}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardContent className="p-6">
                    <h2 className="font-display text-lg font-bold mb-3">Course content</h2>
                    {sections.length === 0 ? (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Lock className="h-4 w-4" /> The full curriculum unlocks after enrollment.
                      </p>
                    ) : (
                      <div className="space-y-5">
                        {sections.map(([section, lessons]) => (
                          <div key={section}>
                            <p className="font-medium text-sm mb-2">{section}</p>
                            <ul className="space-y-2">
                              {lessons.map(l => {
                                const Icon = lessonIcon(l.type);
                                return (
                                  <li key={l.id}>
                                    <button
                                      type="button"
                                      onClick={() => setPreviewLesson(l)}
                                      className="w-full flex items-center gap-2 text-sm text-muted-foreground rounded-md px-2 py-1.5 -mx-2 hover:bg-muted hover:text-foreground transition-colors text-left"
                                    >
                                      <Icon className="h-4 w-4 text-primary shrink-0" />
                                      <span className="flex-1">{l.title}</span>
                                      <Badge variant="secondary" className="text-[11px]">Free preview</Badge>
                                    </button>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ))}

                        <p className="text-xs text-muted-foreground flex items-center gap-2">
                          <Lock className="h-3.5 w-3.5" /> Remaining lessons unlock after enrollment.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-xl border-primary/10 lg:sticky lg:top-24">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      <Price usd={course.priceUsd} />
                    </p>
                    <p className="text-sm text-muted-foreground">One-time payment, lifetime access</p>
                  </div>

                  {myEnrollment?.status === "active" ? (
                    <div className="rounded-lg bg-primary/10 p-3 text-sm">
                      <p className="font-medium text-primary">You own this course</p>
                      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                        <Link to={`/student/courses/${course.id}`}>Start learning</Link>
                      </Button>
                    </div>
                  ) : myEnrollment?.status === "pending" ? (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">Request received</p>
                      <p className="text-muted-foreground mt-1">
                        Our team will confirm payment and unlock the course.
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full shadow-lg shadow-primary/20"
                      onClick={handleEnroll}
                      disabled={submitting}
                    >
                      {submitting ? "Sending…" : "Enroll in this course"}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Payment is confirmed by our team over WhatsApp or bank transfer. Prices are set in
                    USD; local amounts are approximate.
                  </p>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a
                      href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
                        `Hi TutorsPool, I'd like to buy the course "${course.title}".`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" /> Ask a question
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!previewLesson} onOpenChange={o => !o && setPreviewLesson(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{previewLesson?.title}</DialogTitle>
            <DialogDescription>Free preview lesson</DialogDescription>
          </DialogHeader>
          {previewLesson?.type === "video" && previewLesson.videoUrl && (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={toEmbedUrl(previewLesson.videoUrl)}
                title={previewLesson.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
          {previewLesson?.type === "file" && previewLesson.fileUrl && (
            <Button asChild variant="outline">
              <a href={previewLesson.fileUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4 mr-2" />
                {previewLesson.fileName || "Open material"}
              </a>
            </Button>
          )}
          {previewLesson?.content && (
            <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground max-h-[50vh] overflow-y-auto">
              {previewLesson.content}
            </p>
          )}
          {previewLesson &&
            !previewLesson.content &&
            !previewLesson.videoUrl &&
            !previewLesson.fileUrl && (
              <p className="text-sm text-muted-foreground">
                This preview lesson has no content yet.
              </p>
            )}
        </DialogContent>
      </Dialog>

      <Footer />

    </div>
  );
}
