import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, BookOpen, PlayCircle, Users } from "lucide-react";
import { Price } from "@/components/Price";
import { getPublishedCourses, Course } from "@/lib/courses";

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("all");
  const [level, setLevel] = useState("all");

  useEffect(() => {
    (async () => {
      const data = await getPublishedCourses();
      setCourses(data);
      setLoading(false);
    })();
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(courses.map(c => c.subject).filter(Boolean))).sort(),
    [courses]
  );
  const levels = useMemo(
    () => Array.from(new Set(courses.map(c => c.level).filter(Boolean))).sort(),
    [courses]
  );

  const filtered = courses.filter(
    c => (subject === "all" || c.subject === subject) && (level === "all" || c.level === level)
  );

  const siteUrl = "https://tutorspool.com";
  const title = "Self-Paced Online Courses by Expert Tutors | TutorsPool";
  const description =
    "Buy self-paced online courses built by verified TutorsPool tutors — video lessons, notes and downloadable materials for math, science, languages and test prep.";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/courses`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/courses`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {filtered.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: filtered.slice(0, 20).map((c, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Course",
                  name: c.title,
                  description:
                    c.shortDescription || c.description || `${c.subject} course for ${c.level} learners.`,
                  url: `${siteUrl}/courses/${c.id}`,
                  provider: {
                    "@type": "EducationalOrganization",
                    name: "TutorsPool",
                    url: siteUrl,
                  },
                },
              })),
            })}
          </script>
        )}
      </Helmet>

      <Navbar />

      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-orange-100/40 to-transparent border-b border-primary/10">
          <div className="container py-12 sm:py-16">
            <Badge className="mb-3 bg-primary/15 text-primary border-0">Self-paced courses</Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold max-w-3xl">
              Learn at your own pace with courses built by real tutors
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Video lessons, structured notes and downloadable materials — buy once and keep lifetime
              access, with the same tutors who teach live on TutorsPool.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[200px]" aria-label="Filter courses by subject">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjects.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[200px]" aria-label="Filter courses by level">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {levels.map(l => (
                  <SelectItem key={l} value={l}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="mb-4">No courses are published yet.</p>
                <Button asChild variant="outline">
                  <Link to="/tutors">Browse 1-on-1 tutors</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(c => (
                <Card key={c.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                  {c.coverImageUrl ? (
                    <img
                      src={c.coverImageUrl}
                      alt={`${c.title} course cover`}
                      loading="lazy"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="h-40 w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <PlayCircle className="h-10 w-10 text-primary/60" />
                    </div>
                  )}
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <Badge variant="secondary">{c.subject}</Badge>
                      <Badge variant="outline">{c.level}</Badge>
                    </div>
                    <h2 className="font-display text-lg font-bold leading-snug">{c.title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">by {c.tutorName}</p>
                    {c.shortDescription && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{c.shortDescription}</p>
                    )}
                    {c.enrolledCount > 0 && (
                      <p className="mt-3 text-sm text-muted-foreground flex items-center gap-2">
                        <Users className="h-4 w-4" /> {c.enrolledCount} enrolled
                      </p>
                    )}
                    <div className="mt-auto pt-5 flex items-end justify-between gap-3">
                      <p className="text-2xl font-bold text-primary">
                        <Price usd={c.priceUsd} />
                      </p>
                      <Button asChild size="sm">
                        <Link to={`/courses/${c.id}`}>
                          View <ArrowRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
