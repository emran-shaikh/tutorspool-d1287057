import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { HelpCircle, Mail, MessageSquare, BookOpen, Users, Shield, ArrowRight } from "lucide-react";
import { Helmet } from "react-helmet-async";

const helpCategories = [
  {
    title: "Getting Started",
    description: "New to TutorsPool? Learn how to create an account, find tutors, and book your first session.",
    links: [
      "Creating your student account",
      "Finding the right tutor",
      "Booking your first session",
      "Understanding pricing & payments",
    ],
  },
  {
    title: "For Students",
    description: "Guides and tips for getting the most out of your learning experience.",
    links: [
      "Managing your sessions",
      "Setting learning goals",
      "Rescheduling & cancellations",
      "Leaving tutor reviews",
    ],
  },
  {
    title: "For Tutors",
    description: "Everything you need to know to succeed as a tutor on TutorsPool.",
    links: [
      "Completing your tutor profile",
      "Managing availability",
      "Accepting & declining requests",
      "Best practices for online sessions",
    ],
  },
  {
    title: "Account & Billing",
    description: "Help with your account, security, and payment details.",
    links: [
      "Updating account information",
      "Payment methods & invoices",
      "Security & privacy settings",
      "Troubleshooting login issues",
    ],
  },
];

export default function HelpCenter() {
  const canonicalUrl = `${window.location.origin}/help`;

  return (
    <>
      <Helmet>
        <title>Help Center - TutorsPool | Support & Guides</title>
        <meta
          name="description"
          content="Visit the TutorsPool Help Center for support, FAQs, and step-by-step guides for students and tutors."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          {/* Hero */}
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container text-center">
              <Badge variant="outline" className="mb-4">
                <HelpCircle className="h-3 w-3 mr-1" />
                Help Center
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                How can we <span className="text-primary">help</span> you?
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Find quick answers, step-by-step guides, and support resources for
                students and tutors using TutorsPool.
              </p>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="py-10 border-b">
            <div className="container grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    Student Guides
                  </CardTitle>
                  <CardDescription>Learn how to find tutors and manage your sessions.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/student/tutors">
                      Browse Tutors
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Tutor Resources
                  </CardTitle>
                  <CardDescription>Get set up as a tutor and grow your student base.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" className="w-full justify-between">
                    <Link to="/register?role=tutor">
                      Become a Tutor
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Contact Support
                  </CardTitle>
                  <CardDescription>Can’t find what you’re looking for? Reach out to our team.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full justify-between">
                    <Link to="/contact">
                      Go to Contact Page
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                  <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                    <Mail className="h-4 w-4" /> support@tutorspool.com
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Help Categories */}
          <section className="py-16">
            <div className="container">
              <div className="mb-10 text-center max-w-2xl mx-auto">
                <h2 className="font-display text-3xl font-bold mb-3">Browse help topics</h2>
                <p className="text-muted-foreground">
                  Explore our most popular help articles and guides for students and tutors.
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {helpCategories.map((category) => (
                  <Card key={category.title} className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {category.links.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="mt-10 bg-muted/60 border-dashed">
                <CardContent className="py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium">Trust & Safety</p>
                      <p className="text-sm text-muted-foreground">
                        Learn how we keep your data and learning experience secure.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild variant="outline" size="sm">
                      <Link to="/privacy">View Privacy Policy</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/terms">View Terms of Service</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
