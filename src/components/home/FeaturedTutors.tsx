import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowRight, GraduationCap, Clock, DollarSign, Sparkles } from "lucide-react";
import { getTutors, TutorProfile, getAllReviews } from "@/lib/firestore";

interface TutorWithRating extends TutorProfile {
  avgRating: number;
  reviewCount: number;
}

export function FeaturedTutors() {
  const [tutors, setTutors] = useState<TutorWithRating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        const [tutorsData, reviewsData] = await Promise.all([
          getTutors(),
          getAllReviews()
        ]);

        const tutorsWithRatings: TutorWithRating[] = tutorsData.map(tutor => {
          const tutorReviews = reviewsData.filter(r => r.tutorId === tutor.uid);
          const avgRating = tutorReviews.length > 0
            ? tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length
            : 0;
          return {
            ...tutor,
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: tutorReviews.length
          };
        });

        setTutors(tutorsWithRatings.slice(0, 4));
      } catch (error) {
        console.error('Error fetching tutors:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (tutors.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-muted/40 to-background">
      <div className="container">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Top Rated Tutors
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Meet Our <span className="text-primary">Expert Tutors</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn from the best. Our verified tutors are here to help you succeed.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tutors.map((tutor) => (
            <div
              key={tutor.uid}
              className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-500 hover:-translate-y-2"
            >
              {/* Top accent bar */}
              <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-primary/50" />

              <div className="p-6 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-5">
                  <Avatar className="h-28 w-28 ring-4 ring-primary/10 shadow-lg group-hover:ring-primary/25 transition-all duration-300">
                    <AvatarImage src={tutor.photoURL} alt={tutor.fullName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-3xl font-bold">
                      {getInitials(tutor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  {tutor.reviewCount > 0 && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 rounded-full shadow-md">
                      <Star className="h-3 w-3 fill-warning text-warning" />
                      {tutor.avgRating.toFixed(1)}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className="font-display font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                  {tutor.fullName}
                </h3>

                {/* Rating text */}
                <p className="text-xs text-muted-foreground mb-3">
                  {tutor.reviewCount > 0
                    ? `${tutor.reviewCount} ${tutor.reviewCount === 1 ? 'review' : 'reviews'}`
                    : 'New tutor'}
                </p>

                {/* Degree badge */}
                {tutor.degreeLevel && (
                  <Badge variant="outline" className="mb-3 text-xs border-primary/20 text-primary/80">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    {tutor.degreeLevel}
                  </Badge>
                )}

                {/* Subjects */}
                <div className="flex flex-wrap justify-center gap-1.5 mb-4">
                  {tutor.subjects.slice(0, 2).map((subject) => (
                    <Badge key={subject} variant="secondary" className="text-xs font-medium">
                      {subject}
                    </Badge>
                  ))}
                  {tutor.subjects.length > 2 && (
                    <Badge variant="outline" className="text-xs">+{tutor.subjects.length - 2}</Badge>
                  )}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-border/60 mb-4" />

                {/* Price & Experience */}
                <div className="w-full flex items-center justify-between text-sm mb-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {tutor.experience || "2+ yrs"}
                  </span>
                  <span className="flex items-center gap-0.5 font-bold text-primary text-base">
                    <DollarSign className="h-4 w-4" />
                    {tutor.hourlyRate || 30}/hr
                  </span>
                </div>

                {/* CTA */}
                <Link to="/tutors" className="w-full">
                  <Button
                    variant="outline"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300"
                  >
                    View Profile
                    <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/tutors">
            <Button size="lg" className="px-8 shadow-lg shadow-primary/20">
              View All Tutors
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
