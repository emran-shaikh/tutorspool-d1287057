import { BookOpen, Video, Target, Award, Clock, Users } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Expert Tutors",
    description: "Learn from verified professionals with proven track records in their subjects.",
  },
  {
    icon: Video,
    title: "Live Sessions",
    description: "Interactive 1-on-1 video sessions via Zoom for personalized learning experience.",
  },
  {
    icon: Target,
    title: "AI Career Guidance",
    description: "Get personalized career suggestions based on your skills and learning goals.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description: "Book sessions at your convenience with tutors across different time zones.",
  },
  {
    icon: BookOpen,
    title: "25+ Subjects",
    description: "From mathematics to languages, find tutors for virtually any subject.",
  },
  {
    icon: Award,
    title: "Track Progress",
    description: "Monitor your learning journey with detailed progress tracking and analytics.",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 lg:py-24 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
            Why Choose <span className="text-gradient">TutorsPool</span>?
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to accelerate your learning journey in one platform.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="group bg-card rounded-xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
