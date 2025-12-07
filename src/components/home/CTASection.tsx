import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, GraduationCap, Users } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-16 lg:py-24">
      <div className="container">
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {/* Student CTA */}
          <div className="relative overflow-hidden rounded-2xl gradient-primary p-8 lg:p-10 text-primary-foreground">
            <div className="relative z-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-foreground/20 mb-6">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold mb-3">
                Ready to Learn?
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-sm">
                Join thousands of students already learning with expert tutors. Start your journey today.
              </p>
              <Link to="/register?role=student">
                <Button
                  variant="secondary"
                  size="lg"
                  className="group bg-primary-foreground text-primary hover:bg-primary-foreground/90"
                >
                  Start Learning
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Tutor CTA */}
          <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 lg:p-10 text-secondary-foreground">
            <div className="relative z-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary mb-6">
                <Users className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-2xl lg:text-3xl font-bold mb-3">
                Share Your Expertise
              </h3>
              <p className="text-secondary-foreground/80 mb-6 max-w-sm">
                Become a tutor and help students achieve their goals while earning on your schedule.
              </p>
              <Link to="/register?role=tutor">
                <Button variant="hero" size="lg" className="group">
                  Become a Tutor
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
            </div>
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-foreground/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-foreground/5 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        </div>
      </div>
    </section>
  );
}
