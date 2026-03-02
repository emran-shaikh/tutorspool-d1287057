import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";

export default function Disclaimer() {
  const canonicalUrl = `${window.location.origin}/disclaimer`;

  return (
    <>
      <Helmet>
        <title>Disclaimer - TutorsPool</title>
        <meta
          name="description"
          content="Read the TutorsPool Disclaimer to understand the limitations of our platform and the responsibilities of users."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
            <div className="container max-w-3xl">
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Disclaimer
              </h1>
              <p className="text-lg text-muted-foreground">
                Please read this disclaimer carefully before using TutorsPool.
              </p>
            </div>
          </section>

          <section className="py-12">
            <div className="container max-w-3xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. General Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    The information provided on TutorsPool is for general
                    educational purposes only. While we strive to keep the
                    information accurate and up-to-date, we make no
                    representations or warranties of any kind, express or
                    implied, about the completeness, accuracy, reliability, or
                    suitability of the information, products, services, or
                    related graphics contained on the platform.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Tutoring Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    TutorsPool is a marketplace that connects students with
                    independent tutors. We do not guarantee specific academic
                    outcomes, grades, or test scores. The quality of tutoring
                    sessions depends on the individual tutor and the student's
                    engagement.
                  </p>
                  <p>
                    Tutors on our platform are independent contractors, not
                    employees of TutorsPool. We verify tutor profiles to the best
                    of our ability, but we do not assume responsibility for the
                    content delivered during sessions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Third-Party Content & Advertising</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    This website may contain advertisements served by Google
                    AdSense and other third-party advertising partners. These ads
                    are provided by external networks and TutorsPool does not
                    endorse, verify, or take responsibility for the content or
                    accuracy of third-party advertisements.
                  </p>
                  <p>
                    Third-party advertisers may use cookies and similar
                    technologies to serve ads based on your prior visits to this
                    or other websites. You may opt out of personalized
                    advertising by visiting{" "}
                    <a
                      href="https://www.google.com/settings/ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google Ads Settings
                    </a>
                    .
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. External Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Our platform may contain links to external websites that are
                    not operated by us. We have no control over the content or
                    practices of these sites and cannot accept responsibility for
                    their content or privacy policies.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Limitation of Liability</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    In no event shall TutorsPool be liable for any loss or damage
                    including, without limitation, indirect or consequential loss
                    or damage, arising from the use of our platform or reliance
                    on information provided through our services.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    If you have questions about this disclaimer, please contact
                    us at
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
