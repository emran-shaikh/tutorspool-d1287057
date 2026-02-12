import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  GraduationCap, 
  Target, 
  Heart, 
  Globe2, 
  Users, 
  Award,
  CheckCircle,
  ArrowRight 
} from "lucide-react";
import uzairImage from "@/assets/team-uzair.jpg";
import bilalImage from "@/assets/team-bilal.jpg";
import imranImage from "@/assets/team-imran.jpg";

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for excellence in education, ensuring every student receives the highest quality tutoring experience."
  },
  {
    icon: Heart,
    title: "Passion",
    description: "Our tutors are passionate educators who genuinely care about student success and growth."
  },
  {
    icon: Globe2,
    title: "Accessibility",
    description: "Quality education should be accessible to everyone, regardless of location or background."
  },
  {
    icon: Users,
    title: "Community",
    description: "We foster a supportive learning community where students and tutors thrive together."
  }
];

const team = [
  {
    name: "Bilal Shakil",
    role: "Founder",
    image: bilalImage,
    bio: "The Founder of TutorsPool with over 8 years of experience teaching O Level Additional Mathematics. He holds a degree in Mechanical Engineering from NED University and is passionate about delivering quality education through personalized online tutoring."
  },
  {
    name: "Uzair Syed",
    role: "Co-Founder",
    image: uzairImage,
    bio: "Co-Founder at TutorsPool with an MS in Computer Science. He specializes in O and A Level subjects, focusing on making complex concepts accessible and helping students achieve academic success."
  },
  {
    name: "Muhammad Imran",
    role: "Chief Technology Officer",
    image: imranImage,
    bio: "Tech leader with 10+ years in web development and emerging technologies. Passionate about AI, automation, and building smart, scalable systems that solve real-world problems and drive business growth."
  }
];

const achievements = [
  "5,000+ students helped achieve their academic goals",
  "200+ verified expert tutors across 50+ subjects",
  "98% student satisfaction rate",
  "Available in 25+ countries worldwide",
  "Partnership with leading educational institutions",
  "Award-winning online learning platform"
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4">
                <GraduationCap className="h-3 w-3 mr-1" />
                About TutorsPool
              </Badge>
              <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
                Empowering Students to <span className="text-primary">Succeed</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                TutorsPool connects students with expert tutors for personalized 
                learning experiences. Our mission is to make quality education 
                accessible to everyone, everywhere.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16">
          <div className="container">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="font-display text-3xl font-bold mb-4">Our Mission</h2>
                <p className="text-muted-foreground mb-6">
                  We believe that every student deserves access to quality education 
                  and personalized support. TutorsPool was founded with a simple yet 
                  powerful idea: connect passionate educators with motivated learners 
                  to create meaningful educational experiences.
                </p>
                <p className="text-muted-foreground mb-6">
                  Through our platform, we've helped thousands of students improve 
                  their grades, build confidence, and develop a genuine love for learning. 
                  Our verified tutors bring expertise, patience, and dedication to every session.
                </p>
                <Link to="/register">
                  <Button>
                    Join Our Community <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{achievement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                These core values guide everything we do at TutorsPool
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value) => (
                <Card key={value.title} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 mx-auto rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold mb-2">{value.title}</h3>
                    <p className="text-sm text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl font-bold mb-4">Leadership Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Meet the passionate people behind TutorsPool
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {team.map((member) => (
                <Card key={member.name} className="overflow-hidden group hover:shadow-xl transition-all duration-300 border-0 shadow-md">
                  <div className="relative overflow-hidden">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-72 object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="font-display text-xl font-bold text-white">{member.name}</h3>
                      <p className="text-primary-foreground/90 font-medium text-sm bg-primary/80 inline-block px-3 py-1 rounded-full mt-1">{member.role}</p>
                    </div>
                  </div>
                  <CardContent className="p-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary/5">
          <div className="container text-center">
            <Award className="h-12 w-12 mx-auto text-primary mb-4" />
            <h2 className="font-display text-3xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
              Join thousands of students who have achieved their academic goals with TutorsPool.
            </p>
            <div className="flex justify-center gap-4">
              <Link to="/tutors">
                <Button size="lg">Find a Tutor</Button>
              </Link>
              <Link to="/register?role=tutor">
                <Button size="lg" variant="outline">Become a Tutor</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
