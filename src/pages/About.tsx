import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Helmet } from "react-helmet-async";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTranslatedText } from "@/hooks/useTranslatedText";
import { 
  GraduationCap, 
  Target, 
  Heart, 
  Globe2, 
  Users, 
  Award,
  CheckCircle,
  ArrowRight 
} from "lucide-react";
import uzairImage from "@/assets/team-uzair.jpg";
import bilalImage from "@/assets/team-bilal.jpg";
import imranImage from "@/assets/team-imran.jpg";

const values = [
  { key: "excellence", icon: Target },
  { key: "passion", icon: Heart },
  { key: "accessibility", icon: Globe2 },
  { key: "community", icon: Users },
];

const team = [
  {
    name: "Bilal Shakil",
    roleKey: "founder",
    image: bilalImage,
    bio: "The Founder of TutorsPool with over 8 years of experience teaching O Level Additional Mathematics. He holds a degree in Mechanical Engineering from NED University and is passionate about delivering quality education through personalized online tutoring.",
  },
  {
    name: "Uzair Syed",
    roleKey: "coFounder",
    image: uzairImage,
    bio: "Co-Founder at TutorsPool with an MS in Computer Science. He specializes in O and A Level subjects, focusing on making complex concepts accessible and helping students achieve academic success.",
  },
  {
    name: "Muhammad Imran",
    roleKey: "cto",
    image: imranImage,
    bio: "Tech leader with 10+ years in web development and emerging technologies. Passionate about AI, automation, and building smart, scalable systems that solve real-world problems and drive business growth.",
  },
];

const achievementsCount = 6;

function TeamMember({ member }: { member: typeof team[number] }) {
  const { t } = useTranslation();
  const translatedBio = useTranslatedText(member.bio, `about:team:${member.roleKey}:bio`);
  return (
    <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
      <div className="relative overflow-hidden">
        <img 
          src={member.image} 
          alt={member.name}
          className="w-full h-72 object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="font-display text-xl font-bold text-white">{member.name}</h3>
          <p className="text-primary-foreground/90 font-medium text-sm bg-primary/80 inline-block px-3 py-1 rounded-full mt-1">
            {t(`about.team.roles.${member.roleKey}`)}
          </p>
        </div>
      </div>
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground leading-relaxed">{translatedBio}</p>
      </CardContent>
    </Card>
  );
}

export default function About() {
  const { t } = useTranslation();
  const siteUrl = "https://tutorspool.com";

  return (
    <>
      <Helmet>
        <title>{t("about.metaTitle")}</title>
        <meta name="description" content={t("about.hero.description")} />
        <link rel="canonical" href={`${siteUrl}/about`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={t("about.metaTitle")} />
        <meta property="og:description" content={t("about.hero.description")} />
        <meta property="og:url" content={`${siteUrl}/about`} />
        <meta name="twitter:title" content={t("about.metaTitle")} />
        <meta name="twitter:description" content={t("about.hero.description")} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "TutorsPool",
          "url": "https://tutorspool.com",
          "logo": "https://tutorspool.com/logo.png",
          "email": "support@tutorspool.com",
          "telephone": "+92-345-3284284"
        })}</script>
      </Helmet>
      <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                <GraduationCap className="h-3 w-3 mr-1" />
                {t("about.badge")}
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                {t("about.hero.heading")} <span className="text-primary">{t("about.hero.headingAccent")}</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                {t("about.hero.description")}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold mb-4">{t("about.mission.title")}</h2>
                <p className="text-muted-foreground mb-6">
                  {t("about.mission.p1")}
                </p>
                <p className="text-muted-foreground mb-6">
                  {t("about.mission.p2")}
                </p>
                <Link to="/register">
                  <Button>
                    {t("about.mission.cta")} <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {Array.from({ length: achievementsCount }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t(`about.achievements.${index}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">{t("about.values.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("about.values.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.key} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{t(`about.values.${value.key}.title`)}</h3>
                    <p className="text-sm text-muted-foreground">{t(`about.values.${value.key}.description`)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">{t("about.team.title")}</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {t("about.team.subtitle")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member) => (
                <TeamMember key={member.name} member={member} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container text-center">
            <Award className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="font-display text-3xl font-bold mb-4">
              {t("about.cta.title")}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              {t("about.cta.subtitle")}
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/tutors">
                <Button size="lg">{t("about.cta.findTutor")}</Button>
              </Link>
              <Link to="/register?role=tutor">
                <Button size="lg" variant="outline">{t("about.cta.becomeTutor")}</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
    </>
  );
}
