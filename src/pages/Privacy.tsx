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
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Last Updated:</strong> March 16, 2026
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
                  <p><strong>Personal Information You Provide:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Account details such as name, email address, and role (student or tutor).</li>
                    <li>Profile details like subjects, qualifications, experience, and bio for tutors.</li>
                    <li>Session information such as bookings, messages, reviews, and feedback.</li>
                    <li>Payment and billing information processed through secure third-party providers.</li>
                    <li>Communications you send to us via contact forms or email.</li>
                  </ul>
                  <p className="mt-3"><strong>Information Collected Automatically:</strong></p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Device information (browser type, operating system, device type).</li>
                    <li>IP address and approximate geographic location.</li>
                    <li>Pages visited, time spent on pages, and navigation patterns.</li>
                    <li>Referring website URLs and search terms used to find our site.</li>
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
                    <li>Provide, operate, and maintain the TutorsPool platform.</li>
                    <li>Match students with suitable tutors based on subject and availability.</li>
                    <li>Process bookings, payments, and session scheduling.</li>
                    <li>Communicate important updates, support messages, and notifications.</li>
                    <li>Improve our services through analytics and usage data.</li>
                    <li>Ensure platform security and prevent fraudulent activity.</li>
                    <li>Comply with legal obligations and enforce our Terms of Service.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Cookies & Tracking Technologies</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We use cookies and similar tracking technologies to enhance your
                    browsing experience, remember your preferences, and analyze site
                    traffic. The types of cookies we use include:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Essential Cookies:</strong> Required for the platform to function properly (e.g., authentication, session management).</li>
                    <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site using Google Analytics (Measurement ID: G-EMJX84775R).</li>
                    <li><strong>Advertising Cookies:</strong> Used by Google AdSense and its partners to serve relevant advertisements based on your browsing history.</li>
                  </ul>
                  <p className="mt-2">
                    You can manage your cookie preferences at any time through the cookie consent banner displayed on your first visit. Declining non-essential cookies will disable personalized advertising and analytics tracking.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Third-Party Advertising (Google AdSense)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We use Google AdSense to display advertisements on our platform. Google AdSense is a third-party advertising service provided by Google LLC.
                  </p>
                  <p>
                    Google and its advertising partners may use cookies (such as the DoubleClick cookie) to serve ads based on your prior visits to TutorsPool or other websites. These cookies enable Google and its partners to deliver targeted advertisements that may be relevant to you.
                  </p>
                  <p>
                    You can opt out of personalized advertising by visiting{" "}
                    <a
                      href="https://www.google.com/settings/ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google Ads Settings
                    </a>{" "}
                    or by visiting{" "}
                    <a
                      href="https://optout.aboutads.info/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      aboutads.info
                    </a>{" "}
                    to opt out of third-party vendor cookies for personalized advertising.
                  </p>
                  <p>
                    For more information about how Google uses data when you use our site, please visit{" "}
                    <a
                      href="https://policies.google.com/technologies/partner-sites"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google's Privacy & Terms
                    </a>.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Google Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We use Google Analytics to collect anonymized data about how visitors interact with our site. This includes pages visited, session duration, bounce rate, and traffic sources. This data helps us improve the platform experience.
                  </p>
                  <p>
                    Google Analytics uses cookies to collect this information. The data is processed in accordance with{" "}
                    <a
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google's Privacy Policy
                    </a>. You can opt out of Google Analytics tracking by installing the{" "}
                    <a
                      href="https://tools.google.com/dlpage/gaoptout"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Google Analytics Opt-out Browser Add-on
                    </a>.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Data Sharing & Third-Party Services</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We do not sell your personal information. We may share limited data with
                    trusted third-party service providers strictly for operating the platform, including:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Payment Processors:</strong> To process transactions securely.</li>
                    <li><strong>Video Conferencing (Zoom):</strong> To facilitate online tutoring sessions.</li>
                    <li><strong>Google AdSense:</strong> To serve advertisements (see Section 4).</li>
                    <li><strong>Google Analytics:</strong> To analyze website traffic and usage patterns.</li>
                    <li><strong>Email Service Providers:</strong> To send transactional and support emails.</li>
                  </ul>
                  <p className="mt-2">
                    We implement administrative, technical, and physical safeguards to protect
                    your data. However, no online service can guarantee absolute security.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Data Retention</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We retain your personal information for as long as your account is active or as needed to provide you with our services. If you request account deletion, we will remove your personal data within 30 days, except where we are required to retain it for legal, regulatory, or legitimate business purposes.
                  </p>
                  <p>
                    Anonymized and aggregated data that cannot identify you may be retained indefinitely for analytics and platform improvement purposes.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>8. Children's Privacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    TutorsPool provides educational services and may be used by individuals under 18. Users under the age of 13 must have parental or guardian consent to create an account and use the platform. We do not knowingly collect personal information from children under 13 without verifiable parental consent.
                  </p>
                  <p>
                    If you believe we have inadvertently collected information from a child under 13 without proper consent, please contact us at <span className="font-medium">support@tutorspool.com</span> and we will promptly delete such information.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>9. Your Rights (GDPR & CCPA)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Depending on your location, you may have the following rights regarding your personal data:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
                    <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
                    <li><strong>Right to Erasure:</strong> Request deletion of your personal data ("right to be forgotten").</li>
                    <li><strong>Right to Restrict Processing:</strong> Request that we limit how we use your data.</li>
                    <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
                    <li><strong>Right to Object:</strong> Object to processing of your data for marketing or profiling purposes.</li>
                    <li><strong>Right to Withdraw Consent:</strong> Withdraw your consent for data processing at any time.</li>
                  </ul>
                  <p className="mt-2">
                    To exercise any of these rights, please contact us at <span className="font-medium">support@tutorspool.com</span>. We will respond to your request within 30 days.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>10. Your Choices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>You can:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Update your profile information at any time through your account settings.</li>
                    <li>Request deletion of your account by contacting our support team.</li>
                    <li>Manage communication preferences in your account settings.</li>
                    <li>Opt out of personalized ads via Google Ads Settings.</li>
                    <li>Disable analytics tracking by declining cookies in the consent banner.</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>11. Changes to This Policy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    We may update this Privacy Policy from time to time to reflect changes in our practices, technologies, or legal requirements. When we make material changes, we will notify you by updating the "Last Updated" date at the top of this page and, where appropriate, providing additional notice via email or an in-app notification.
                  </p>
                  <p>
                    Your continued use of TutorsPool after any changes constitutes acceptance of the updated Privacy Policy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>12. Contact Us</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
                  </p>
                  <ul className="list-none space-y-1 mt-2">
                    <li><strong>Email:</strong> support@tutorspool.com</li>
                    <li><strong>Phone:</strong> +92 (345) 3284 284</li>
                    <li><strong>Website:</strong>{" "}
                      <a href="https://www.tutorspool.com/contact" className="underline font-medium">
                        www.tutorspool.com/contact
                      </a>
                    </li>
                  </ul>
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
