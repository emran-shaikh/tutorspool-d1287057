import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Star,
  GraduationCap,
  BadgeCheck,
  Award,
  BookOpen,
  Sparkles,
  User,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { getTutorProfile, getAllReviews, TutorProfile, Review } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslatedText } from "@/hooks/useTranslatedText";
import { Price } from "@/components/Price";

export default function TutorProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user, userProfile } = useAuth();
  const { t, i18n } = useTranslation();
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const translatedBio = useTranslatedText(tutor?.bio, `tutor:${uid}:bio`);
  const translatedStyle = useTranslatedText(tutor?.teachingStyle, `tutor:${uid}:style`);

  useEffect(() => {
    if (!uid) return;
    (async () => {
      try {
        const [t, allReviews] = await Promise.all([getTutorProfile(uid), getAllReviews()]);
        setTutor(t);
        setReviews(allReviews.filter((r) => r.tutorId === uid));
      } catch (e) {
        console.error("Error loading tutor profile", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [uid]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

  const memberSince = tutor?.createdAt
    ? new Date(tutor.createdAt).toLocaleDateString(i18n.language, { month: "long", year: "numeric" })
    : null;

  const renderStars = (rating: number, size = "h-3.5 w-3.5") =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${i < Math.round(rating) ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
      />
    ));

  const bookHref =
    user && userProfile?.role === "student" ? `/student/book/${uid}` : "/login";

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Helmet>
        <title>{tutor ? `${tutor.fullName} — Tutor Profile | TutorsPool` : "Tutor Profile | TutorsPool"}</title>
        <meta
          name="description"
          content={tutor?.bio?.slice(0, 155) || "View tutor profile, subjects, experience, and reviews on TutorsPool."}
        />
        <link rel="canonical" href={`https://tutorspool.com/tutors/${uid}`} />
        <meta property="og:type" content="profile" />
        <meta
          property="og:title"
          content={tutor ? `${tutor.fullName} — Tutor Profile | TutorsPool` : "Tutor Profile | TutorsPool"}
        />
        <meta
          property="og:description"
          content={tutor?.bio?.slice(0, 155) || "View tutor profile, subjects, experience, and reviews on TutorsPool."}
        />
        <meta property="og:url" content={`https://tutorspool.com/tutors/${uid}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={tutor ? `${tutor.fullName} — Tutor Profile | TutorsPool` : "Tutor Profile | TutorsPool"}
        />
        <meta
          name="twitter:description"
          content={tutor?.bio?.slice(0, 155) || "View tutor profile, subjects, experience, and reviews on TutorsPool."}
        />
        {tutor && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Person",
              name: tutor.fullName,
              description: tutor.bio || undefined,
              image: tutor.photoURL || undefined,
              url: `https://tutorspool.com/tutors/${uid}`,
              jobTitle: "Tutor",
              knowsAbout: tutor.subjects || undefined,
              worksFor: { "@type": "EducationalOrganization", name: "TutorsPool", url: "https://tutorspool.com" },
              ...(reviews.length > 0
                ? {
                    aggregateRating: {
                      "@type": "AggregateRating",
                      ratingValue: avgRating,
                      reviewCount: reviews.length,
                    },
                  }
                : {}),
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
        ) : !tutor ? (
          <div className="max-w-3xl mx-auto py-24 text-center px-4">
            <h1 className="text-2xl font-display font-bold mb-2">{t("tutorProfile.notFound")}</h1>
            <p className="text-muted-foreground mb-6">{t("tutorProfile.notFoundDesc")}</p>
            <Link to="/tutors">
              <Button>{t("tutorProfile.browseTutors")}</Button>
            </Link>
          </div>
        ) : (
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            {/* Hero Banner */}
            <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-orange-100/50 to-transparent border border-primary/10 p-5 sm:p-8 mb-6 overflow-hidden">
              <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

              <Link
                to="/tutors"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-5"
              >
                <ArrowLeft className="h-4 w-4 mr-1 rtl:rotate-180" /> {t("tutorProfile.backToTutors")}
              </Link>

              <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
                {/* Left: identity */}
                <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
                  <Avatar className="h-28 w-28 sm:h-32 sm:w-32 ring-4 ring-background shadow-xl shrink-0">
                    <AvatarImage src={tutor.photoURL} alt={tutor.fullName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-3xl font-semibold">
                      {getInitials(tutor.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="font-display text-2xl sm:text-3xl font-bold">{tutor.fullName}</h1>
                      {tutor.isApproved && (
                        <BadgeCheck className="h-6 w-6 text-primary fill-primary/10" />
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                      {tutor.degreeLevel && (
                        <span className="inline-flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4" />
                          {tutor.degreeLevel}
                        </span>
                      )}
                      {reviews.length === 0 && (
                        <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-0">
                          {t("tutorProfile.newTutor")}
                        </Badge>
                      )}
                    </div>

                    {memberSince && (
                      <p className="mt-2 text-sm text-muted-foreground">{t("tutorProfile.memberSince", { date: memberSince })}</p>
                    )}

                    {/* Stats */}
                    {reviews.length > 0 && (
                      <div className="mt-5 inline-flex items-center gap-3 rounded-xl bg-background/80 backdrop-blur border border-border/60 px-4 py-3 shadow-sm">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Star className="h-5 w-5 text-warning fill-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground leading-none">{t("tutorProfile.rating")}</p>
                          <p className="font-bold text-lg leading-tight">
                            {avgRating.toFixed(1)}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({reviews.length})
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: booking card */}
                <Card className="shadow-xl border-primary/10 lg:sticky lg:top-24">
                  <CardContent className="p-5 space-y-4">
                    <div>
                      <p className="text-3xl font-bold text-primary">
                        <Price usd={tutor.hourlyRate || 0} />
                        <span className="text-base font-medium text-muted-foreground">{t("tutorProfile.perHour")}</span>
                      </p>
                      <p className="text-sm text-muted-foreground">{t("tutorProfile.sessionRate")}</p>
                    </div>
                    <Link to={bookHref} className="block">
                      <Button size="lg" className="w-full shadow-lg shadow-primary/20">
                        {t("common.bookSession")} <ChevronRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Content grid */}
            <div className="grid lg:grid-cols-[1fr_360px] gap-6">
              {/* Left column */}
              <div className="space-y-6">
                {tutor.bio && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-3">
                        <User className="h-5 w-5 text-primary" /> {t("tutorProfile.aboutMe")}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {translatedBio}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {tutor.subjects?.length > 0 && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-4">
                        <BookOpen className="h-5 w-5 text-primary" /> {t("tutorProfile.subjectsITeach")}
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {tutor.subjects.map((s) => (
                          <Badge
                            key={s}
                            className="bg-foreground text-background hover:bg-foreground/90 px-3 py-1.5 rounded-lg text-xs font-medium border-0"
                          >
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {tutor.qualifications && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-3">
                        <Award className="h-5 w-5 text-primary" /> {t("tutorProfile.qualification")}
                      </h2>
                      <p className="font-medium">{tutor.qualifications}</p>
                      {tutor.degreeLevel && (
                        <p className="text-sm text-muted-foreground mt-1">{tutor.degreeLevel}</p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {tutor.experience && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-3">
                        <GraduationCap className="h-5 w-5 text-primary" /> {t("tutorProfile.teachingExperience")}
                      </h2>
                      <p className="font-semibold text-lg">{tutor.experience}</p>
                    </CardContent>
                  </Card>
                )}

                {tutor.teachingStyle && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-3">
                        <Sparkles className="h-5 w-5 text-primary" /> {t("tutorProfile.teachingStyle")}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {translatedStyle}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* CTA banner */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/15 via-orange-100/60 to-primary/5 border border-primary/15 p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <h3 className="font-display text-xl font-bold">{t("tutorProfile.readyHeading")}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t("tutorProfile.readySubtitle", { name: tutor.fullName })}
                      </p>
                      <Link to={bookHref} className="inline-block mt-4">
                        <Button className="shadow-lg shadow-primary/20">
                          {t("common.bookSessionNow")} <ArrowRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                        </Button>
                      </Link>
                    </div>
                    <div className="hidden sm:flex h-20 w-20 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
                      <GraduationCap className="h-10 w-10 text-primary" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-6">
                {reviews.length > 0 && (
                  <Card>
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                          <Star className="h-5 w-5 text-warning fill-warning" /> {t("tutorProfile.studentReviews")}
                        </h2>
                      </div>
                      <div className="flex items-center gap-2 mb-5 pb-4 border-b">
                        <div className="flex gap-0.5">{renderStars(avgRating)}</div>
                        <span className="font-semibold">{avgRating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">
                          ({reviews.length} {reviews.length === 1 ? t("tutorProfile.review") : t("tutorProfile.reviews")})
                        </span>
                      </div>

                      <div className="space-y-5">
                        {reviews.slice(0, 6).map((r) => (
                          <div key={r.id} className="flex gap-3">
                            <Avatar className="h-9 w-9 shrink-0">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                {getInitials(r.studentName || "S")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-sm">{r.studentName}</p>
                                <div className="flex gap-0.5">{renderStars(r.rating, "h-3 w-3")}</div>
                                <span className="text-xs text-muted-foreground">{r.rating.toFixed(1)}</span>
                              </div>
                              {r.comment && (
                                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                                  {r.comment}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-destructive/20">
                  <CardContent className="p-5 sm:p-6">
                    <h2 className="flex items-center gap-2 font-display text-lg font-bold mb-2">
                      <AlertTriangle className="h-5 w-5 text-primary" /> {t("tutorProfile.reportTutor")}
                    </h2>
                    <p className="text-sm font-medium">{t("tutorProfile.reportQuestion")}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t("tutorProfile.reportSubtitle")}
                    </p>
                    <Link
                      to="/contact"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline mt-3"
                    >
                      {t("common.reportNow")} <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
