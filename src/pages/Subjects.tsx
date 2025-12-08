import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  Calculator, 
  FlaskConical, 
  BookOpen, 
  Globe2, 
  Music, 
  Code, 
  Palette, 
  Languages,
  Brain,
  GraduationCap,
  ArrowRight
} from "lucide-react";

const subjects = [
  {
    category: "Mathematics",
    icon: Calculator,
    color: "bg-blue-500/10 text-blue-500",
    subjects: ["Algebra", "Calculus", "Geometry", "Statistics", "Trigonometry", "Linear Algebra"],
    tutorCount: 45
  },
  {
    category: "Sciences",
    icon: FlaskConical,
    color: "bg-green-500/10 text-green-500",
    subjects: ["Physics", "Chemistry", "Biology", "Environmental Science", "Astronomy"],
    tutorCount: 38
  },
  {
    category: "Languages",
    icon: Languages,
    color: "bg-purple-500/10 text-purple-500",
    subjects: ["English", "Spanish", "French", "German", "Mandarin", "Japanese"],
    tutorCount: 52
  },
  {
    category: "Humanities",
    icon: BookOpen,
    color: "bg-amber-500/10 text-amber-500",
    subjects: ["History", "Literature", "Philosophy", "Psychology", "Sociology"],
    tutorCount: 29
  },
  {
    category: "Programming",
    icon: Code,
    color: "bg-cyan-500/10 text-cyan-500",
    subjects: ["Python", "JavaScript", "Java", "C++", "Web Development", "Data Science"],
    tutorCount: 41
  },
  {
    category: "Arts",
    icon: Palette,
    color: "bg-pink-500/10 text-pink-500",
    subjects: ["Drawing", "Painting", "Digital Art", "Photography", "Graphic Design"],
    tutorCount: 18
  },
  {
    category: "Music",
    icon: Music,
    color: "bg-orange-500/10 text-orange-500",
    subjects: ["Piano", "Guitar", "Violin", "Voice", "Music Theory", "Drums"],
    tutorCount: 24
  },
  {
    category: "Test Prep",
    icon: Brain,
    color: "bg-red-500/10 text-red-500",
    subjects: ["SAT", "ACT", "GRE", "GMAT", "TOEFL", "IELTS"],
    tutorCount: 33
  }
];

export default function Subjects() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container text-center">
            <Badge variant="outline" className="mb-4">
              <GraduationCap className="h-3 w-3 mr-1" />
              50+ Subjects Available
            </Badge>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Explore Our <span className="text-primary">Subjects</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From mathematics to music, find expert tutors in any subject. 
              Our verified educators are ready to help you achieve your learning goals.
            </p>
          </div>
        </section>

        {/* Subjects Grid */}
        <section className="py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {subjects.map((category) => (
                <Card key={category.category} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-3`}>
                      <category.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="flex items-center justify-between">
                      {category.category}
                      <Badge variant="secondary" className="text-xs">
                        {category.tutorCount} tutors
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Expert tutors available for all levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {category.subjects.slice(0, 4).map((subject) => (
                        <Badge key={subject} variant="outline" className="text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {category.subjects.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.subjects.length - 4} more
                        </Badge>
                      )}
                    </div>
                    <Link to="/tutors">
                      <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        Find Tutors <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
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
              Can't find your subject?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              We're always adding new subjects and tutors. Let us know what you're looking for!
            </p>
            <Link to="/contact">
              <Button size="lg">Contact Us</Button>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
