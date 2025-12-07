import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Calendar, 
  Users, 
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Video
} from "lucide-react";

const pendingRequests = [
  { id: 1, student: "John Smith", subject: "Algebra", date: "Dec 10, 2:00 PM", message: "Need help with quadratic equations" },
  { id: 2, student: "Emily Davis", subject: "Calculus", date: "Dec 11, 4:00 PM", message: "Preparing for final exam" },
];

const upcomingSessions = [
  { id: 1, student: "Alice Brown", subject: "Mathematics", date: "Today, 5:00 PM", zoomLink: "#" },
  { id: 2, student: "Bob Wilson", subject: "Physics", date: "Tomorrow, 11:00 AM", zoomLink: "#" },
];

export default function TutorDashboard() {
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
            <span className="text-sm text-muted-foreground">Welcome, Tutor</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Logout</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome back, Tutor!</h1>
          <p className="text-muted-foreground">Manage your sessions and connect with students.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: "45", icon: Users, color: "text-primary" },
            { label: "Sessions This Month", value: "28", icon: Video, color: "text-success" },
            { label: "Hours Taught", value: "56", icon: Clock, color: "text-warning" },
            { label: "Earnings", value: "$1,240", icon: DollarSign, color: "text-primary" },
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Session Requests
                <Badge variant="secondary" className="ml-auto">{pendingRequests.length} pending</Badge>
              </CardTitle>
              <CardDescription>Accept or decline student requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-lg bg-muted/50 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{request.student}</p>
                        <p className="text-sm text-muted-foreground">{request.subject}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{request.date}</p>
                    </div>
                    <p className="text-sm text-muted-foreground italic">"{request.message}"</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1">
                        <CheckCircle className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <XCircle className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Upcoming Sessions
              </CardTitle>
              <CardDescription>Your scheduled sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{session.student}</p>
                      <p className="text-sm text-muted-foreground">{session.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.date}</p>
                      <Button variant="link" size="sm" className="h-auto p-0">
                        Start Session
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

          {/* Availability Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Availability
              </CardTitle>
              <CardDescription>Manage your available time slots</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Set your weekly availability so students can book sessions with you.
              </p>
              <Button variant="outline" className="w-full">
                Manage Availability
              </Button>
            </CardContent>
          </Card>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Your Profile
              </CardTitle>
              <CardDescription>Update your tutor profile</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Keep your profile updated to attract more students.
              </p>
              <Button variant="hero" className="w-full">
                Edit Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
