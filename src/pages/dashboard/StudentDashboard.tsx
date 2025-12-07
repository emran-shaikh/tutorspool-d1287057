import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  BookOpen, 
  Target, 
  Calendar, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowRight,
  Brain,
  Video
} from "lucide-react";

const upcomingSessions = [
  { id: 1, tutor: "Dr. Sarah Johnson", subject: "Mathematics", date: "Today, 3:00 PM", status: "upcoming" },
  { id: 2, tutor: "Prof. Michael Chen", subject: "Physics", date: "Tomorrow, 10:00 AM", status: "upcoming" },
];

const learningGoals = [
  { id: 1, title: "Master Calculus", progress: 65, subject: "Mathematics" },
  { id: 2, title: "Learn Python Basics", progress: 40, subject: "Programming" },
  { id: 3, title: "Improve Essay Writing", progress: 80, subject: "English" },
];

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-bold">
              <span className="text-secondary">Tutors</span>
              <span className="text-primary">Pool</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Welcome, Student</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Logout</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back, Student!</h1>
          <p className="text-muted-foreground">Track your progress and continue learning.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Sessions Completed", value: "24", icon: Video, color: "text-primary" },
            { label: "Learning Goals", value: "3", icon: Target, color: "text-success" },
            { label: "Hours Learned", value: "48", icon: Clock, color: "text-warning" },
            { label: "Average Rating", value: "4.8", icon: TrendingUp, color: "text-primary" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Sessions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>Your scheduled tutoring sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">{session.tutor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.date}</p>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Join Session
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Sessions
              </Button>
            </CardContent>
          </Card>

          {/* AI Career Suggestions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                AI Career Insights
              </CardTitle>
              <CardDescription>Based on your learning profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="font-medium text-sm">Recommended Career</p>
                  <p className="text-lg font-bold text-primary">Data Scientist</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on your math and programming skills
                  </p>
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/student/career-suggestions">
                    Explore More <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Learning Goals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Learning Goals
              </CardTitle>
              <CardDescription>Track your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningGoals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{goal.title}</span>
                      <span className="text-muted-foreground">{goal.progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full gradient-primary rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{goal.subject}</p>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                Manage Goals
              </Button>
            </CardContent>
          </Card>

          {/* Find Tutors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Find Tutors
              </CardTitle>
              <CardDescription>Book your next session</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Browse our expert tutors and book a personalized session.
              </p>
              <Button variant="hero" className="w-full" asChild>
                <Link to="/tutors">
                  Browse Tutors <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
