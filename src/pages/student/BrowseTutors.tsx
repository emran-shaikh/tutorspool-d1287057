import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Star, DollarSign, Clock, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTutors, TutorProfile, getAllReviews, Review } from "@/lib/firestore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TutorWithMeta extends TutorProfile {
  avgRating: number;
  reviewCount: number;
}

export default function BrowseTutors() {
  const [tutors, setTutors] = useState<TutorWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"relevance" | "price-asc" | "price-desc" | "rating-desc">("relevance");

  useEffect(() => {
    const fetchTutors = async () => {
      setError(null);
      try {
        const [tutorsData, reviewsData] = await Promise.all([
          getTutors(),
          getAllReviews(),
        ]);

        const tutorsWithMeta: TutorWithMeta[] = tutorsData.map((tutor) => {
          const tutorReviews = reviewsData.filter((r) => r.tutorId === tutor.uid);
          const avgRating = tutorReviews.length
            ? tutorReviews.reduce((sum, r) => sum + r.rating, 0) / tutorReviews.length
            : 0;

          return {
            ...tutor,
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: tutorReviews.length,
          };
        });

        setTutors(tutorsWithMeta);
      } catch (error) {
        console.error("Error loading tutors", error);
        setError("We could not load tutors right now. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const uniqueSubjects = Array.from(new Set(tutors.flatMap((t) => t.subjects))).sort();

  const filteredTutors = tutors.filter((tutor) => {
    const matchesSearch =
      tutor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutor.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSubject = subjectFilter === "all" || tutor.subjects.includes(subjectFilter);
    return matchesSearch && matchesSubject;
  });

  const sortedTutors = [...filteredTutors].sort((a, b) => {
    if (sortBy === "price-asc") return a.hourlyRate - b.hourlyRate;
    if (sortBy === "price-desc") return b.hourlyRate - a.hourlyRate;
    if (sortBy === "rating-desc") return b.avgRating - a.avgRating;
    return 0; // relevance: keep filtered order
  });

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <Link
          to="/student/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Browse Tutors</h1>
        <p className="text-muted-foreground">Find the perfect tutor for your learning goals</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or subject..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <SlidersHorizontal className="h-4 w-4" />
          <span>Filter & sort tutors</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent className="bg-card text-card-foreground shadow-lg z-50">
              <SelectItem value="all">All subjects</SelectItem>
              {uniqueSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(val) => setSortBy(val as typeof sortBy)}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-card text-card-foreground shadow-lg z-50">
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="rating-desc">Rating: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredTutors.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No tutors found. Check back later!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {sortedTutors.map((tutor) => (
            <Card key={tutor.uid} className="h-full hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{tutor.fullName}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" /> {tutor.experience}
                    </CardDescription>
                  </div>
                  {tutor.reviewCount > 0 ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-current" /> {tutor.avgRating.toFixed(1)}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      New tutor
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tutor.subjects.map((subject) => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{tutor.bio}</p>
                <div className="flex items-center justify-between">
                  <span className="flex items-center text-sm font-medium">
                    <DollarSign className="h-4 w-4" />
                    {tutor.hourlyRate}/hr
                  </span>
                  <Button size="sm" asChild>
                    <Link to={`/student/book/${tutor.uid}`}>Book Session</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
