import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, TrendingUp, Clock, ArrowRight, Brain, Video, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function StudentDashboard() {
  return (
    <DashboardLayout role="student">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Track your progress and continue learning.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Sessions Completed", value: "0", icon: Video, color: "text-primary" },
          { label: "Learning Goals", value: "0", icon: Target, color: "text-success" },
          { label: "Hours Learned", value: "0", icon: Clock, color: "text-warning" },
          { label: "Average Rating", value: "-", icon: TrendingUp, color: "text-primary" },
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
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Sessions
            </CardTitle>
            <CardDescription>View and manage your tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">No sessions yet</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/student/sessions">View All Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              AI Career Insights
            </CardTitle>
            <CardDescription>Based on your learning profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Complete sessions to get personalized career suggestions.</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Learning Goals
            </CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">Set your first learning goal</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/student/goals">Manage Goals</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Find Tutors
            </CardTitle>
            <CardDescription>Book your next session</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Browse expert tutors and book a session.</p>
            <Button className="w-full" asChild>
              <Link to="/student/tutors">Browse Tutors <ArrowRight className="h-4 w-4 ml-2" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}