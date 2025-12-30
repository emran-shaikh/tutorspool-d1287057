import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function Terms() {
  const canonicalUrl = `${window.location.origin}/terms`;

  return (
    <>
      <Helmet>
        <title>Terms of Service - TutorsPool</title>
        <meta
          name="description"
          content="Read the TutorsPool Terms of Service to understand your rights, responsibilities, and our platform policies."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
              <p className="text-lg text-muted-foreground">
                Please review these terms carefully before using TutorsPool. By creating an
                account or booking a session, you agree to these terms.
              </p>
            </div>
          </section>

          <section className="py-12">
            <div className="container max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    TutorsPool is an online platform that connects students with independent
                    tutors for personalized learning sessions. We provide the technology and
                    marketplace; tutors are not employees of TutorsPool.
                  </p>
                  <p>
                    By accessing or using the platform, you confirm that you are at least 13
                    years old (or have parental consent) and have the legal capacity to enter
                    into these terms.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. User Accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    You are responsible for maintaining the confidentiality of your account
                    credentials and for all activities that occur under your account.
                  </p>
                  <p>
                    You agree to provide accurate information during registration and to keep
                    your profile details up to date. We reserve the right to suspend or
                    terminate accounts that violate these terms or our policies.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Bookings & Payments</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Students can request sessions with tutors at the rates displayed on their
                    profiles. Session confirmations, rescheduling, and cancellations are
                    handled through the platform.
                  </p>
                  <p>
                    You agree to use TutorsPool solely for legitimate educational purposes
                    and to comply with all applicable laws and regulations when making or
                    accepting bookings.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Acceptable Use</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>You agree not to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use the platform for any illegal or harmful activities.</li>
                    <li>Harass, bully, or discriminate against other users.</li>
                    <li>Share inappropriate, offensive, or copyrighted materials.</li>
                    <li>Circumvent the platform to avoid fees or policies.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Liability & Disclaimers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We strive to provide a safe and reliable platform but cannot guarantee
                    uninterrupted access or specific learning outcomes. TutorsPool is not
                    liable for any indirect, incidental, or consequential damages arising
                    from your use of the platform.
                  </p>
                  <p>
                    We may update these terms periodically. Continued use of TutorsPool after
                    changes are published constitutes acceptance of the revised terms.
                  </p>
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
