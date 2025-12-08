import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Clock, TrendingUp, Star, Radio } from "lucide-react";
import heroImage from "@/assets/hero-tutoring.jpg";

const stats = [
  { icon: Users, label: "Expert Tutors" },
  { icon: Clock, label: "24/7 Available" },
  { icon: TrendingUp, label: "95% Success Rate" },
];

const avatars = ["S1", "S2", "S3", "S4", "S5"];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden gradient-hero">
      <div className="container py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-background shadow-sm animate-fade-in">
              <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium">Trusted by 15,000+ students worldwide</span>
            </div>

            {/* Heading */}
            <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Transform Your
                <br />
                <span className="text-gradient">Learning Journey</span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-lg animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Connect with world-class tutors for personalized 1-on-1 sessions. Master any subject with expert guidance and flexible scheduling.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <stat.icon className="h-4 w-4 text-primary" />
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <Link to="/register">
                <Button variant="hero" size="xl" className="group">
                  Start Learning Today
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>

            {/* Social Proof */}
            <div className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex -space-x-2">
                {avatars.map((avatar, i) => (
                  <div
                    key={avatar}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium"
                    style={{ zIndex: avatars.length - i }}
                  >
                    {avatar}
                  </div>
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                <strong className="text-foreground">500+</strong> students joined this week
              </span>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative animate-fade-in-right" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={heroImage}
                alt="Students learning with tutor"
                className="w-full h-auto aspect-[4/3] object-cover"
              />

              {/* Floating Cards */}
              <div className="absolute top-4 right-4 bg-background rounded-lg px-3 py-2 shadow-card animate-float">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-xs font-semibold">Live Session</p>
                    <p className="text-[10px] text-muted-foreground">2:00 PM - Active now</p>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-4 left-4 bg-background rounded-lg px-3 py-2 shadow-card">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-warning fill-warning" />
                  <span className="text-sm font-semibold">4.8/5 Rating</span>
                </div>
              </div>

              <div className="absolute bottom-4 right-4 bg-background rounded-lg px-3 py-2 shadow-card">
                <div className="text-center">
                  <p className="text-lg font-bold text-success">95%</p>
                  <p className="text-[10px] text-muted-foreground">Success Rate</p>
                  <p className="text-[10px] text-muted-foreground">Student Satisfaction</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 pt-12 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "15,000+", label: "Happy Students" },
              { value: "500+", label: "Expert Tutors" },
              { value: "25+", label: "Subjects" },
              { value: "95%", label: "Success Rate" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${0.6 + i * 0.1}s` }}
              >
                <p className="font-display text-3xl lg:text-4xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
