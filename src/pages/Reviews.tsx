import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, Quote, Users, Award, ThumbsUp } from "lucide-react";

const reviews = [
  {
    id: 1,
    studentName: "Sarah Johnson",
    tutorName: "Dr. Michael Chen",
    subject: "Calculus",
    rating: 5,
    review: "Dr. Chen is an incredible tutor! His patient explanation of complex calculus concepts helped me go from struggling to excelling. I went from a C to an A in just one semester.",
    date: "2 weeks ago"
  },
  {
    id: 2,
    studentName: "James Wilson",
    tutorName: "Prof. Emily Parker",
    subject: "Physics",
    rating: 5,
    review: "Professor Parker made physics fun and understandable. Her real-world examples and interactive sessions kept me engaged throughout. Highly recommend!",
    date: "1 month ago"
  },
  {
    id: 3,
    studentName: "Maria Garcia",
    tutorName: "Alex Thompson",
    subject: "Python Programming",
    rating: 5,
    review: "Alex is a fantastic programming tutor. He helped me understand algorithms and data structures in a way that finally clicked. Now I'm confident in my coding skills.",
    date: "3 weeks ago"
  },
  {
    id: 4,
    studentName: "David Kim",
    tutorName: "Sarah Mitchell",
    subject: "Spanish",
    rating: 5,
    review: "Sarah's immersive teaching style made learning Spanish enjoyable. Her conversational approach helped me gain confidence quickly. I can now hold conversations fluently!",
    date: "1 month ago"
  },
  {
    id: 5,
    studentName: "Emma Thompson",
    tutorName: "Dr. Robert Lee",
    subject: "Chemistry",
    rating: 4,
    review: "Dr. Lee explains chemistry concepts clearly and provides excellent exam preparation strategies. My grades improved significantly after just a few sessions.",
    date: "2 months ago"
  },
  {
    id: 6,
    studentName: "Ryan Brown",
    tutorName: "Jessica Wang",
    subject: "SAT Prep",
    rating: 5,
    review: "Jessica's SAT prep sessions were incredibly helpful. Her test-taking strategies and practice methods helped me improve my score by 200 points!",
    date: "1 month ago"
  }
];

const stats = [
  { label: "Happy Students", value: "5,000+", icon: Users },
  { label: "5-Star Reviews", value: "2,500+", icon: Star },
  { label: "Expert Tutors", value: "200+", icon: Award },
  { label: "Satisfaction Rate", value: "98%", icon: ThumbsUp }
];

export default function Reviews() {
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4">
              <Star className="h-3 w-3 mr-1 fill-warning text-warning" />
              4.9 Average Rating
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
                        <p className="text-sm text-muted-foreground">{review.date}</p>
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

                    <p className="text-muted-foreground mb-4 line-clamp-4">
                      "{review.review}"
                    </p>

                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Badge variant="secondary">{review.subject}</Badge>
                      <span className="text-sm text-muted-foreground">
                        with {review.tutorName}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/50">
          <div className="container text-center">
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join thousands of students who have improved their grades and achieved their goals.
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
