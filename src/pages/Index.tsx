import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { FeaturesSection } from "@/components/home/FeaturesSection";
import { FeaturedTutors } from "@/components/home/FeaturedTutors";
import { CTASection } from "@/components/home/CTASection";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { Helmet } from "react-helmet-async";

const Index = () => {
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const title = "TutorsPool | Personalized Online Tutoring";
  const description = "Connect with expert tutors for 1-on-1 online sessions in math, science, languages, test prep, and more.";
  const imageUrl = `${siteUrl}/hero-tutoring.jpg`;

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={siteUrl + "/"} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl + "/"} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={imageUrl} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={imageUrl} />
      </Helmet>

      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <HeroSection />
          <FeaturedTutors />
          <FeaturesSection />
          <CTASection />
        </main>
        <Footer />
      </div>
      <ExitIntentPopup />
    </>
  );
};

export default Index;
