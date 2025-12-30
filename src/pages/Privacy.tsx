import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function Privacy() {
  const canonicalUrl = `${window.location.origin}/privacy`;

  return (
    <>
      <Helmet>
        <title>Privacy Policy - TutorsPool</title>
        <meta
          name="description"
          content="Learn how TutorsPool collects, uses, and protects your personal data in our Privacy Policy."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
              <p className="text-lg text-muted-foreground">
                Your privacy and trust are important to us. This policy explains what data we
                collect, how we use it, and the choices you have.
              </p>
            </div>
          </section>

          <section className="py-12">
            <div className="container max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Information We Collect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>We collect information that you provide directly, including:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Account details such as name, email, and role (student or tutor).</li>
                    <li>Profile details like subjects, experience, and bio for tutors.</li>
                    <li>Session information such as bookings, messages, and reviews.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. How We Use Your Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>We use your information to:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Provide and improve the TutorsPool platform.</li>
                    <li>Match students with suitable tutors.</li>
                    <li>Process bookings and payments.</li>
                    <li>Communicate important updates and support messages.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Data Sharing & Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We do not sell your personal information. We may share limited data with
                    trusted service providers (such as payment processors) strictly for
                    operating the platform.
                  </p>
                  <p>
                    We implement administrative, technical, and physical safeguards to protect
                    your data. However, no online service can guarantee absolute security.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Your Choices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>You can:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Update your profile information at any time.</li>
                    <li>Request deletion of your account subject to legal obligations.</li>
                    <li>Manage communication preferences in your account settings.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    If you have questions about this policy or your data, please contact us at
                    <span className="font-medium"> support@tutorspool.com</span>.
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
