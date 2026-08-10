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
  CalendarDays,
  Users,
  CheckCircle2,
  Clock,
  MessageCircle,
} from "lucide-react";
import { Price } from "@/components/Price";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createAdminNotification } from "@/lib/firestore";
import {
  getGroupPackage,
  getSubscriptionsForStudent,
  requestGroupSubscription,
  formatSchedule,
  seatsLeft,
  GroupPackage,
  GroupSubscription,
} from "@/lib/groupClasses";

const ADMIN_WHATSAPP = "923453284284";

export default function GroupClassDetail() {
  const { packageId } = useParams<{ packageId: string }>();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState<GroupPackage | null>(null);
  const [mySub, setMySub] = useState<GroupSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!packageId) return;
    (async () => {
      const data = await getGroupPackage(packageId);
      setPkg(data);
      if (user && userProfile?.role === "student") {
        const subs = await getSubscriptionsForStudent(user.uid);
        setMySub(subs.find(s => s.packageId === packageId && s.status !== "cancelled") || null);
      }
      setLoading(false);
    })();
  }, [packageId, user, userProfile]);

  const handleJoin = async () => {
    if (!user || !userProfile) {
      navigate("/login");
      return;
    }
    if (userProfile.role !== "student") {
      toast({
        title: "Student account required",
        description: "Sign in with a student account to join a group class.",
        variant: "destructive",
      });
      return;
    }
    if (!pkg?.id) return;

    setSubmitting(true);
    try {
      await requestGroupSubscription({
        packageId: pkg.id,
        packageTitle: pkg.title,
        studentId: user.uid,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        tutorId: pkg.tutorId,
        tutorName: pkg.tutorName,
      });
      await createAdminNotification({
        type: "group_join_request",
        title: "New group class request",
        message: `${userProfile.fullName} requested to join "${pkg.title}" with ${pkg.tutorName}.`,
        metadata: {
          userId: user.uid,
          userName: userProfile.fullName,
          userEmail: userProfile.email,
          tutorId: pkg.tutorId,
        },
      }).catch(() => undefined);

      setMySub({
        packageId: pkg.id,
        packageTitle: pkg.title,
        studentId: user.uid,
        studentName: userProfile.fullName,
        tutorId: pkg.tutorId,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      toast({
        title: "Request sent",
        description: "Our team will confirm your seat and share payment details shortly.",
      });
    } catch (e: any) {
      toast({ title: "Could not send request", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const siteUrl = "https://tutorspool.com";
  const title = pkg ? `${pkg.title} — Group Class | TutorsPool` : "Group Class | TutorsPool";
  const description = pkg
    ? (pkg.description || `${pkg.subject} small-group online class for ${pkg.level} students, taught live by ${pkg.tutorName}.`).slice(0, 155)
    : "Join a small-group online tuition package on TutorsPool.";

  const left = pkg ? seatsLeft(pkg) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/group-classes/${packageId}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/group-classes/${packageId}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {pkg && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Course",
              name: pkg.title,
              description: pkg.description || description,
              url: `${siteUrl}/group-classes/${pkg.id}`,
              educationalLevel: pkg.level,
              about: pkg.subject,
              provider: { "@type": "EducationalOrganization", name: "TutorsPool", url: siteUrl },
              hasCourseInstance: {
                "@type": "CourseInstance",
                courseMode: "Online",
                instructor: { "@type": "Person", name: pkg.tutorName },
                ...(pkg.startDate ? { startDate: pkg.startDate } : {}),
                ...(pkg.endDate ? { endDate: pkg.endDate } : {}),
              },
              offers: {
                "@type": "Offer",
                price: pkg.priceUsd,
                priceCurrency: "USD",
                category: "Subscription",
                availability:
                  left > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
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
        ) : !pkg || pkg.status !== "approved" ? (
          <div className="max-w-3xl mx-auto py-24 text-center px-4">
            <h1 className="text-2xl font-display font-bold mb-2">Group class not available</h1>
            <p className="text-muted-foreground mb-6">
              This class may have been closed or is not open for enrollment yet.
            </p>
            <Button asChild>
              <Link to="/group-classes">Browse group classes</Link>
            </Button>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <Link
              to="/group-classes"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-5"
            >
              <ArrowLeft className="h-4 w-4 mr-1 rtl:rotate-180" /> All group classes
            </Link>

            <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">{pkg.subject}</Badge>
                      <Badge variant="outline">{pkg.level}</Badge>
                      <Badge variant="outline">
                        {pkg.type === "batch" ? "Fixed batch" : "Ongoing cohort"}
                      </Badge>
                    </div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold">{pkg.title}</h1>
                    <p className="text-muted-foreground mt-2">
                      Taught live by{" "}
                      <Link to={`/tutors/${pkg.tutorId}`} className="text-primary hover:underline">
                        {pkg.tutorName}
                      </Link>
                    </p>
                    {pkg.description && (
                      <p className="mt-4 text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                        {pkg.description}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h2 className="font-display text-lg font-bold">Class details</h2>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium">Weekly schedule</p>
                          <p className="text-muted-foreground">{formatSchedule(pkg.schedule)}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium">Group size</p>
                          <p className="text-muted-foreground">
                            Max {pkg.seatLimit} students · {left} seat{left === 1 ? "" : "s"} left
                          </p>
                        </div>
                      </div>
                      {pkg.type === "batch" && (pkg.startDate || pkg.endDate) && (
                        <div className="flex items-start gap-2">
                          <Clock className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                          <div>
                            <p className="font-medium">Duration</p>
                            <p className="text-muted-foreground">
                              {pkg.startDate ? new Date(pkg.startDate).toLocaleDateString() : "—"}
                              {pkg.endDate ? ` to ${new Date(pkg.endDate).toLocaleDateString()}` : ""}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                        <div>
                          <p className="font-medium">Included</p>
                          <p className="text-muted-foreground">
                            Live Zoom sessions, quizzes and shared resources
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-xl border-primary/10 lg:sticky lg:top-24">
                <CardContent className="p-5 space-y-4">
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      <Price usd={pkg.priceUsd} />
                      <span className="text-base font-medium text-muted-foreground">/month</span>
                    </p>
                    <p className="text-sm text-muted-foreground">Per student, billed monthly</p>
                  </div>

                  {mySub?.status === "active" ? (
                    <div className="rounded-lg bg-primary/10 p-3 text-sm">
                      <p className="font-medium text-primary">You're enrolled</p>
                      <p className="text-muted-foreground mt-1">
                        {mySub.paidThrough
                          ? `Active until ${new Date(mySub.paidThrough).toLocaleDateString()}`
                          : "Your subscription is active."}
                      </p>
                      <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                        <Link to="/student/group-classes">Go to my group classes</Link>
                      </Button>
                    </div>
                  ) : mySub?.status === "pending" ? (
                    <div className="rounded-lg bg-muted p-3 text-sm">
                      <p className="font-medium">Request received</p>
                      <p className="text-muted-foreground mt-1">
                        Our team will confirm your seat and share payment details.
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full shadow-lg shadow-primary/20"
                      onClick={handleJoin}
                      disabled={submitting}
                    >
                      {submitting ? "Sending…" : left > 0 ? "Request to join" : "Join the waitlist"}
                    </Button>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Payment is confirmed by our team over WhatsApp or bank transfer. Prices are set in
                    USD; local amounts are approximate.
                  </p>

                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a
                      href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
                        `Hi TutorsPool, I'd like to know more about the group class "${pkg.title}".`
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

      <Footer />
    </div>
  );
}
