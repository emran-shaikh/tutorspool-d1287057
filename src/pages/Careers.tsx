import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { Briefcase, Users, Globe2, Heart, ArrowRight } from "lucide-react";

const benefits = [
  "Work remotely from anywhere in the world.",
  "Flexible hours that fit your schedule.",
  "Grow your teaching profile and reach more students.",
  "Be part of a supportive global educator community.",
];

const roles = [
  {
    title: "Online Tutor (All Subjects)",
    type: "Contract",
    location: "Remote",
    description:
      "Help students worldwide with 1-on-1 online sessions across school, college, and test-prep subjects.",
  },
  {
    title: "Senior Math & Science Tutor",
    type: "Part-time",
    location: "Remote",
    description:
      "Support advanced STEM students preparing for exams and competitive assessments.",
  },
  {
    title: "Academic Success Coach",
    type: "Part-time",
    location: "Remote",
    description:
      "Guide students on study skills, motivation, and long-term academic planning.",
  },
];

export default function Careers() {
  const canonicalUrl = `${window.location.origin}/careers`;

  return (
    <>
      <Helmet>
        <title>Careers - TutorsPool | Join Our Tutor Community</title>
        <meta
          name="description"
          content="Explore tutoring opportunities with TutorsPool. Join our global community of expert educators and help students succeed."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {/* Hero */}
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container text-center max-w-2xl mx-auto">
              <Badge variant="outline" className="mb-4">
                <Briefcase className="h-3 w-3 mr-1" />
                Careers
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Teach with <span className="text-primary">TutorsPool</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Join our global community of passionate educators helping students unlock
                their full potential.
              </p>
            </div>
          </section>

          {/* Benefits */}
          <section className="py-12">
            <div className="container grid gap-8 md:grid-cols-[1.2fr,1fr] items-start">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Why tutor with TutorsPool?
                  </CardTitle>
                  <CardDescription>
                    Designed for educators who value flexibility, impact, and growth.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6 text-center space-y-3">
                  <Globe2 className="h-8 w-8 mx-auto text-primary" />
                  <h2 className="font-display text-2xl font-bold">Global impact</h2>
                  <p className="text-sm text-muted-foreground">
                    Work with motivated learners from different countries and backgrounds,
                    all from the comfort of your home.
                  </p>
                  <Button asChild className="w-full justify-center mt-2">
                    <a href="/register?role=tutor">
                      Apply as a Tutor
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Open Roles */}
          <section className="pb-16">
            <div className="container">
              <div className="mb-6 flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                <h2 className="font-display text-2xl font-bold">Featured tutoring roles</h2>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                {roles.map((role) => (
                  <Card key={role.title} className="h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg mb-1">{role.title}</CardTitle>
                      <CardDescription className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5">
                          {role.type}
                        </span>
                        <span className="rounded-full bg-muted px-2 py-0.5">{role.location}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-between">
                      <p className="text-sm text-muted-foreground mb-4">{role.description}</p>
                      <Button asChild variant="outline" className="w-full mt-auto justify-center">
                        <a href="/register?role=tutor">
                          Express Interest
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
