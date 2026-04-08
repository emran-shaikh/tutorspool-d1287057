import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Star, Clock, DollarSign, GraduationCap, Users, Filter, ChevronRight, Award, ArrowRight, MapPin, Sparkles } from "lucide-react";
import { getTutors, TutorProfile, getAllReviews, Review } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";

const subjectFilters = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Programming",
  "Languages",
  "Music",
  "Arts"
];

interface TutorWithRating extends TutorProfile {
  avgRating: number;
  reviewCount: number;
}

export default function FindTutors() {
  const { user, userProfile } = useAuth();
  const [tutors, setTutors] = useState<TutorWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [selectedTutor, setSelectedTutor] = useState<TutorWithRating | null>(null);

  useEffect(() => {
    fetchTutorsWithRatings();
  }, []);

  const fetchTutorsWithRatings = async () => {
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

      setTutors(tutorsWithRatings);
    } catch (error) {
      console.error('Error fetching tutors:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch = tutor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = subjectFilter === "All Subjects" ||
      tutor.subjects.some(s => s.toLowerCase().includes(subjectFilter.toLowerCase()));
    return matchesSearch && matchesSubject;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3.5 w-3.5 ${i < Math.round(rating) ? 'text-warning fill-warning' : 'text-muted-foreground/30'}`}
      />
    ));
  };

  const BookButton = ({ tutorId, size = "default", className = "" }: { tutorId: string; size?: "default" | "sm" | "lg" | "icon"; className?: string }) => {
    if (user && userProfile?.role === 'student') {
      return (
        <Link to={`/student/book/${tutorId}`} className={className}>
          <Button size={size} className="w-full shadow-lg shadow-primary/20">
            Book Session <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      );
    }
    return (
      <Link to="/login" className={className}>
        <Button size={size} className="w-full shadow-lg shadow-primary/20">
          Login to Book <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </Link>
    );
  };

  return (
    <>
      <Helmet>
        <title>Find Tutors - TutorsPool | Browse Expert Tutors</title>
        <meta name="description" content="Browse verified expert tutors on TutorsPool. Filter by subject, read reviews, compare rates, and book personalized 1-on-1 sessions." />
        <link rel="canonical" href={`${window.location.origin}/tutors`} />
      </Helmet>
      <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 md:py-20 bg-gradient-to-b from-primary/5 via-primary/[0.02] to-background">
          <div className="container">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
                <Users className="h-3.5 w-3.5 mr-1.5" />
                {tutors.length}+ Verified Tutors
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-5">
                Find Your Perfect <span className="text-primary">Tutor</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Browse our community of expert tutors and find the perfect match for your learning journey.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or subject..."
                  className="pl-11 h-12 text-base rounded-xl border-border/60 focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-52 h-12 rounded-xl border-border/60">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjectFilters.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Results count */}
            {!loading && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Showing <span className="font-semibold text-foreground">{filteredTutors.length}</span> tutor{filteredTutors.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </section>

        {/* Tutors Grid */}
        <section className="py-12 md:py-16">
          <div className="container">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="rounded-2xl border border-border/40 bg-card p-6 animate-pulse">
                    <div className="flex items-start gap-4 mb-5">
                      <div className="h-20 w-20 rounded-full bg-muted shrink-0" />
                      <div className="flex-1 space-y-2 pt-2">
                        <div className="h-5 w-3/4 bg-muted rounded" />
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="h-3 w-2/3 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-muted rounded" />
                      <div className="h-10 w-full bg-muted rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-4">
                  <GraduationCap className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No tutors found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or filters</p>
                <Button variant="outline" onClick={() => { setSearchQuery(""); setSubjectFilter("All Subjects"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutors.map((tutor) => (
                  <div
                    key={tutor.uid}
                    className="group relative rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-all duration-500 hover:-translate-y-1.5"
                  >
                    {/* Top accent */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/70 to-primary/40" />

                    <div className="p-5 md:p-6">
                      {/* Header: Avatar + Info side by side */}
                      <div className="flex items-start gap-4 mb-5">
                        <div className="relative shrink-0">
                          <Avatar className="h-20 w-20 ring-[3px] ring-primary/10 shadow-md group-hover:ring-primary/25 transition-all duration-300">
                            <AvatarImage src={tutor.photoURL} alt={tutor.fullName} className="object-cover" />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-2xl font-bold">
                              {getInitials(tutor.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          {tutor.reviewCount > 0 && tutor.avgRating >= 4.5 && (
                            <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-md">
                              <Sparkles className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pt-1">
                          <h3 className="font-display font-bold text-lg text-foreground truncate group-hover:text-primary transition-colors">
                            {tutor.fullName}
                          </h3>
                          {tutor.degreeLevel && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <GraduationCap className="h-3 w-3 shrink-0" />
                              <span className="truncate">{tutor.degreeLevel}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {tutor.reviewCount > 0 ? (
                              <>
                                <div className="flex items-center gap-0.5">
                                  {renderStars(tutor.avgRating)}
                                </div>
                                <span className="text-xs font-medium text-foreground">{tutor.avgRating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({tutor.reviewCount})</span>
                              </>
                            ) : (
                              <Badge variant="outline" className="text-[10px] h-5 px-2 border-primary/20 text-primary/70">
                                New Tutor
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                        {tutor.bio || "Experienced tutor ready to help you achieve your learning goals."}
                      </p>

                      {/* Subjects */}
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {tutor.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject} variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                            {subject}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">+{tutor.subjects.length - 3}</Badge>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-border/50 mb-4" />

                      {/* Footer: Price, Experience, Actions */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {tutor.experience || "2+ yrs"}
                          </span>
                          {tutor.qualifications && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Award className="h-3 w-3" />
                              <span className="truncate max-w-[80px]">{tutor.qualifications}</span>
                            </span>
                          )}
                        </div>
                        <span className="flex items-center font-bold text-primary text-lg">
                          <DollarSign className="h-4 w-4" />
                          {tutor.hourlyRate || 30}
                          <span className="text-xs font-normal text-muted-foreground ml-0.5">/hr</span>
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2.5">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="flex-1 rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                              onClick={() => setSelectedTutor(tutor)}
                            >
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <div className="flex flex-col items-center text-center">
                                <Avatar className="h-28 w-28 mb-4 ring-4 ring-primary/10 shadow-xl">
                                  <AvatarImage src={tutor.photoURL} alt={tutor.fullName} className="object-cover" />
                                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-3xl font-semibold">
                                    {getInitials(tutor.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <DialogTitle className="text-2xl font-display">{tutor.fullName}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-2">
                                  {tutor.reviewCount > 0 ? (
                                    <span className="flex items-center gap-1.5">
                                      <div className="flex gap-0.5">{renderStars(tutor.avgRating)}</div>
                                      <span className="font-medium text-foreground">{tutor.avgRating.toFixed(1)}</span>
                                      <span>({tutor.reviewCount} {tutor.reviewCount === 1 ? 'review' : 'reviews'})</span>
                                    </span>
                                  ) : (
                                    <span>New tutor</span>
                                  )}
                                </DialogDescription>
                                {tutor.degreeLevel && (
                                  <Badge variant="outline" className="mt-3 border-primary/20">
                                    <GraduationCap className="h-3 w-3 mr-1" />
                                    {tutor.degreeLevel}
                                  </Badge>
                                )}
                              </div>
                            </DialogHeader>
                            <div className="space-y-5 py-4">
                              {tutor.qualifications && (
                                <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/10">
                                  <p className="text-sm font-medium flex items-center gap-2">
                                    <Award className="h-4 w-4 text-primary shrink-0" />
                                    {tutor.qualifications}
                                  </p>
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold mb-2.5 text-sm uppercase tracking-wider text-muted-foreground">Subjects</h4>
                                <div className="flex flex-wrap gap-2">
                                  {tutor.subjects.map((subject) => (
                                    <Badge key={subject} variant="secondary" className="px-3 py-1">{subject}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2.5 text-sm uppercase tracking-wider text-muted-foreground">About</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {tutor.bio || "Passionate educator with years of experience helping students achieve their goals."}
                                </p>
                              </div>
                              {tutor.teachingStyle && (
                                <div>
                                  <h4 className="font-semibold mb-2.5 text-sm uppercase tracking-wider text-muted-foreground">Teaching Style</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{tutor.teachingStyle}</p>
                                </div>
                              )}
                              <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-muted/50 text-center">
                                  <Clock className="h-4 w-4 mx-auto mb-1.5 text-muted-foreground" />
                                  <p className="text-xs text-muted-foreground">Experience</p>
                                  <p className="font-semibold mt-0.5">{tutor.experience || "2+ years"}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-primary/5 text-center border border-primary/10">
                                  <DollarSign className="h-4 w-4 mx-auto mb-1.5 text-primary" />
                                  <p className="text-xs text-muted-foreground">Hourly Rate</p>
                                  <p className="font-bold text-primary mt-0.5">${tutor.hourlyRate || 30}/hr</p>
                                </div>
                              </div>
                              <BookButton tutorId={tutor.uid} size="lg" className="w-full" />
                            </div>
                          </DialogContent>
                        </Dialog>

                        <BookButton tutorId={tutor.uid} className="flex-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
    </>
  );
}
