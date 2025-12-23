import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, ArrowRight, GraduationCap } from "lucide-react";
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
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (tutors.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-muted/30">
      <div className="container">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <Star className="h-3 w-3 mr-1" />
            Top Rated
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Meet Our <span className="text-primary">Expert Tutors</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Learn from the best. Our verified tutors are here to help you succeed.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {tutors.map((tutor) => (
            <Card key={tutor.uid} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-24 w-24 mb-4 ring-4 ring-primary/10 shadow-lg">
                    <AvatarImage src={tutor.photoURL} alt={tutor.fullName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-2xl font-semibold">
                      {getInitials(tutor.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="font-semibold text-lg mb-1">{tutor.fullName}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                    {tutor.reviewCount > 0 ? (
                      <>
                        <Star className="h-4 w-4 text-warning fill-warning" />
                        <span>{tutor.avgRating.toFixed(1)} ({tutor.reviewCount})</span>
                      </>
                    ) : (
                      <span>New tutor</span>
                    )}
                  </div>
                  {tutor.degreeLevel && (
                    <Badge variant="outline" className="mb-2 text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {tutor.degreeLevel}
                    </Badge>
                  )}
                  <div className="flex flex-wrap justify-center gap-1 mb-3">
                    {tutor.subjects.slice(0, 2).map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                    {tutor.subjects.length > 2 && (
                      <Badge variant="outline" className="text-xs">+{tutor.subjects.length - 2}</Badge>
                    )}
                  </div>
                  <p className="text-primary font-semibold">${tutor.hourlyRate || 30}/hr</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/tutors">
            <Button variant="outline" size="lg" className="group">
              View All Tutors
              <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
