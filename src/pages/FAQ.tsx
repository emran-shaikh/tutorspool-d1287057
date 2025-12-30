import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Helmet } from "react-helmet-async";
import { HelpCircle, Users, BookOpen, Clock, Shield } from "lucide-react";

const faqGroups = [
  {
    title: "Getting Started",
    icon: BookOpen,
    items: [
      {
        question: "How do I create a student account?",
        answer:
          "Click on Get Started, choose the student option, and complete the short sign-up form with your basic details.",
      },
      {
        question: "How do I find the right tutor?",
        answer:
          "Use filters on the Find Tutors page to narrow by subject, level, price, and availability, then review tutor profiles and reviews.",
      },
    ],
  },
  {
    title: "Sessions & Scheduling",
    icon: Clock,
    items: [
      {
        question: "How are sessions conducted?",
        answer:
          "Sessions are held online using Zoom. Once a tutor accepts your request, you’ll receive a meeting link with the date and time.",
      },
      {
        question: "Can I reschedule or cancel a session?",
        answer:
          "Yes. You can manage upcoming sessions from your dashboard. Please review your tutor’s cancellation policy before making changes.",
      },
    ],
  },
  {
    title: "For Tutors",
    icon: Users,
    items: [
      {
        question: "How do I become a tutor?",
        answer:
          "Apply through the Become a Tutor option during registration. We review your experience, subjects, and profile before approval.",
      },
      {
        question: "How do I get more students?",
        answer:
          "Keep your profile complete, maintain high review scores, and set clear availability so students can easily book with you.",
      },
    ],
  },
  {
    title: "Security & Payments",
    icon: Shield,
    items: [
      {
        question: "Is my payment information secure?",
        answer:
          "Yes. We work with trusted payment providers and never store full card details on our servers.",
      },
      {
        question: "How is my data protected?",
        answer:
          "We follow industry best practices for data protection. Learn more in our Privacy Policy.",
      },
    ],
  },
];

export default function FAQ() {
  const canonicalUrl = `${window.location.origin}/faq`;

  return (
    <>
      <Helmet>
        <title>FAQ - TutorsPool | Frequently Asked Questions</title>
        <meta
          name="description"
          content="Find quick answers to common questions about TutorsPool, including accounts, sessions, tutors, security, and payments."
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
                <HelpCircle className="h-3 w-3 mr-1" />
                FAQ
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Frequently Asked <span className="text-primary">Questions</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Quick answers to the most common questions from students and tutors.
              </p>
            </div>
          </section>

          {/* FAQ Groups */}
          <section className="py-12">
            <div className="container grid gap-6 md:grid-cols-2">
              {faqGroups.map((group) => (
                <Card key={group.title} className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2 mb-1">
                      <group.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-lg">{group.title}</CardTitle>
                    </div>
                    <CardDescription>
                      Answers related to {group.title.toLowerCase()} on TutorsPool.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {group.items.map((item) => (
                      <div key={item.question}>
                        <p className="font-medium mb-1">{item.question}</p>
                        <p className="text-sm text-muted-foreground">{item.answer}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="container max-w-2xl mt-10">
              <Card className="bg-muted/60 border-dashed">
                <CardContent className="py-6 flex items-start gap-3">
                  <HelpCircle className="h-6 w-6 text-primary mt-1" />
                  <div>
                    <p className="font-medium mb-1">Still have questions?</p>
                    <p className="text-sm text-muted-foreground">
                      If you can&apos;t find the answer you&apos;re looking for, our support
                      team is here to help. Visit our Help Center or contact us directly.
                    </p>
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
