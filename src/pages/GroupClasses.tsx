import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, CalendarDays, ArrowRight, GraduationCap } from "lucide-react";
import { Price } from "@/components/Price";
import {
  getApprovedGroupPackages,
  formatSchedule,
  seatsLeft,
  GroupPackage,
} from "@/lib/groupClasses";

export default function GroupClasses() {
  const [packages, setPackages] = useState<GroupPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("all");
  const [level, setLevel] = useState("all");

  useEffect(() => {
    (async () => {
      const data = await getApprovedGroupPackages();
      setPackages(data);
      setLoading(false);
    })();
  }, []);

  const subjects = useMemo(
    () => Array.from(new Set(packages.map(p => p.subject).filter(Boolean))).sort(),
    [packages]
  );
  const levels = useMemo(
    () => Array.from(new Set(packages.map(p => p.level).filter(Boolean))).sort(),
    [packages]
  );

  const filtered = packages.filter(
    p => (subject === "all" || p.subject === subject) && (level === "all" || p.level === level)
  );

  const siteUrl = "https://tutorspool.com";
  const title = "Group Tuition Classes & Monthly Packages | TutorsPool";
  const description =
    "Join affordable small-group online tuition. Monthly subscription packages for math, science, languages and test prep, taught live by verified TutorsPool tutors.";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${siteUrl}/group-classes`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${siteUrl}/group-classes`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {filtered.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              itemListElement: filtered.slice(0, 20).map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                item: {
                  "@type": "Course",
                  name: p.title,
                  description: p.description || `${p.subject} group class for ${p.level} students.`,
                  url: `${siteUrl}/group-classes/${p.id}`,
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
            <Badge className="mb-3 bg-primary/15 text-primary border-0">Group Tuition</Badge>
            <h1 className="font-display text-3xl sm:text-4xl font-bold max-w-3xl">
              Small-group classes on a simple monthly package
            </h1>
            <p className="mt-3 text-muted-foreground max-w-2xl">
              Learn live with a verified tutor and a small group of peers — a lower monthly price than
              1-on-1, with the same structured lessons, quizzes and resources.
            </p>
          </div>
        </section>

        <section className="container py-8">
          <div className="flex flex-wrap gap-3 mb-6">
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger className="w-[200px]" aria-label="Filter by subject">
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
              <SelectTrigger className="w-[200px]" aria-label="Filter by level">
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
                <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="mb-4">No group classes are open right now.</p>
                <Button asChild variant="outline">
                  <Link to="/tutors">Browse 1-on-1 tutors</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map(p => {
                const left = seatsLeft(p);
                return (
                  <Card key={p.id} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardContent className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <Badge variant="secondary">{p.subject}</Badge>
                        <Badge variant="outline">{p.level}</Badge>
                        <Badge variant="outline">
                          {p.type === "batch" ? "Fixed batch" : "Ongoing"}
                        </Badge>
                      </div>
                      <h2 className="font-display text-lg font-bold leading-snug">{p.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1">with {p.tutorName}</p>
                      {p.description && (
                        <p className="text-sm text-muted-foreground mt-3 line-clamp-3">{p.description}</p>
                      )}
                      <div className="mt-4 space-y-1.5 text-sm text-muted-foreground">
                        <p className="flex items-start gap-2">
                          <CalendarDays className="h-4 w-4 mt-0.5 shrink-0" />
                          {formatSchedule(p.schedule)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Users className="h-4 w-4 shrink-0" />
                          {left > 0 ? `${left} of ${p.seatLimit} seats left` : "Full — join the waitlist"}
                        </p>
                      </div>
                      <div className="mt-auto pt-5 flex items-end justify-between gap-3">
                        <p className="text-2xl font-bold text-primary">
                          <Price usd={p.priceUsd} />
                          <span className="text-sm font-medium text-muted-foreground">/month</span>
                        </p>
                        <Button asChild size="sm">
                          <Link to={`/group-classes/${p.id}`}>
                            View <ArrowRight className="h-4 w-4 ml-1 rtl:rotate-180" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
