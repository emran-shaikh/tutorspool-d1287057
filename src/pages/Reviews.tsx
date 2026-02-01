import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Quote, Users, Award, ThumbsUp, Loader2 } from "lucide-react";
import { getAllReviews, Review, getTutorProfile } from "@/lib/firestore";

const stats = [
  { label: "Happy Students", value: "250+", icon: Users },
  { label: "5-Star Reviews", value: "100+", icon: Star },
  { label: "Expert Tutors", value: "35+", icon: Award },
  { label: "Satisfaction Rate", value: "92%", icon: ThumbsUp }
];

export default function Reviews() {
  const [reviews, setReviews] = useState<(Review & { tutorPhoto?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const reviewsData = await getAllReviews();
      
      // Fetch tutor photos for each review
      const reviewsWithPhotos = await Promise.all(
        reviewsData.map(async (review) => {
          const tutorProfile = await getTutorProfile(review.tutorId);
          return {
            ...review,
            tutorPhoto: tutorProfile?.photoURL
          };
        })
      );
      
      setReviews(reviewsWithPhotos);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "??";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) > 1 ? 's' : ''} ago`;
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4">
              <Star className="h-3 w-3 mr-1 fill-warning text-warning" />
              {reviews.length > 0 ? `${averageRating} Average Rating` : "Student Reviews"}
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              What Our <span className="text-primary">Students</span> Say
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Read real reviews from students who have transformed their learning 
              journey with our expert tutors.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 border-b">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews Grid */}
        <section className="py-16">
          <div className="container">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <Quote className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Reviews Yet</h3>
                <p className="text-muted-foreground">
                  Be the first to leave a review after completing a session with one of our tutors!
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-primary/10">
                      <Quote className="h-12 w-12" />
                    </div>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Avatar>
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getInitials(review.studentName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.studentName}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? 'text-warning fill-warning' : 'text-muted'}`} 
                          />
                        ))}
                      </div>

                      {review.comment && (
                        <p className="text-muted-foreground mb-4 line-clamp-4">
                          "{review.comment}"
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-4 border-t">
                        <Badge variant="secondary">{review.subject}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center gap-2">
                          with
                          {review.tutorPhoto && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={review.tutorPhoto} alt={review.tutorName} />
                              <AvatarFallback className="text-[10px]">
                                {getInitials(review.tutorName)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          {review.tutorName}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join hundreds of students who have improved their grades and achieved their goals.
            </p>
            <div className="flex justify-center gap-4">
              <a href="/tutors">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  Find a Tutor
                </button>
              </a>
              <a href="/register">
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                  Get Started
                </button>
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}