import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Star, Clock, DollarSign, GraduationCap, Users, Filter, ChevronRight } from "lucide-react";
import { getTutors, TutorProfile } from "@/lib/firestore";
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

export default function FindTutors() {
  const { user, userProfile } = useAuth();
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    fetchTutors();
  }, []);

  const fetchTutors = async () => {
    const data = await getTutors();
    setTutors(data);
    setLoading(false);
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="text-center mb-8">
              <Badge variant="outline" className="mb-4">
                <Users className="h-3 w-3 mr-1" />
                {tutors.length}+ Verified Tutors
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Find Your Perfect <span className="text-primary">Tutor</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Browse our community of expert tutors and find the perfect match for your learning journey.
              </p>
            </div>

            {/* Search & Filter */}
            <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or subject..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="h-4 w-4 mr-2" />
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
          </div>
        </section>

        {/* Tutors Grid */}
        <section className="py-16">
          <div className="container">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredTutors.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No tutors found</h3>
                <p className="text-muted-foreground">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTutors.map((tutor) => (
                  <Card key={tutor.uid} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16">
                          <AvatarFallback className="bg-primary/10 text-primary text-lg">
                            {getInitials(tutor.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{tutor.fullName}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Star className="h-4 w-4 text-warning fill-warning" />
                            <span>4.9 (23 reviews)</span>
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {tutor.subjects.slice(0, 3).map((subject) => (
                          <Badge key={subject} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                        {tutor.subjects.length > 3 && (
                          <Badge variant="outline">+{tutor.subjects.length - 3}</Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {tutor.bio || "Experienced tutor ready to help you achieve your learning goals."}
                      </p>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {tutor.experience || "2+ years"}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <DollarSign className="h-4 w-4" />
                          {tutor.hourlyRate || 30}/hr
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              className="flex-1"
                              onClick={() => setSelectedTutor(tutor)}
                            >
                              View Profile
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                                    {getInitials(tutor.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <DialogTitle className="text-xl">{tutor.fullName}</DialogTitle>
                                  <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Star className="h-4 w-4 text-warning fill-warning" />
                                    4.9 rating • 23 reviews
                                  </DialogDescription>
                                </div>
                              </div>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div>
                                <h4 className="font-medium mb-2">Subjects</h4>
                                <div className="flex flex-wrap gap-2">
                                  {tutor.subjects.map((subject) => (
                                    <Badge key={subject} variant="secondary">{subject}</Badge>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium mb-2">About</h4>
                                <p className="text-sm text-muted-foreground">
                                  {tutor.bio || "Passionate educator with years of experience helping students achieve their goals. I believe in personalized learning and creating an engaging environment."}
                                </p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="p-3 rounded-lg bg-muted/50">
                                  <p className="text-muted-foreground">Experience</p>
                                  <p className="font-medium">{tutor.experience || "2+ years"}</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted/50">
                                  <p className="text-muted-foreground">Hourly Rate</p>
                                  <p className="font-medium text-primary">${tutor.hourlyRate || 30}/hr</p>
                                </div>
                              </div>
                              {user && userProfile?.role === 'student' ? (
                                <Link to={`/student/book/${tutor.uid}`}>
                                  <Button className="w-full">
                                    Book a Session <ChevronRight className="h-4 w-4 ml-2" />
                                  </Button>
                                </Link>
                              ) : (
                                <Link to="/login">
                                  <Button className="w-full">
                                    Login to Book <ChevronRight className="h-4 w-4 ml-2" />
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {user && userProfile?.role === 'student' ? (
                          <Link to={`/student/book/${tutor.uid}`} className="flex-1">
                            <Button className="w-full">Book Now</Button>
                          </Link>
                        ) : (
                          <Link to="/login" className="flex-1">
                            <Button className="w-full">Book Now</Button>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
