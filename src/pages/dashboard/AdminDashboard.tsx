import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  GraduationCap, 
  Users, 
  UserCheck,
  Video,
  TrendingUp,
  Download,
  Shield,
  BookOpen,
  AlertCircle
} from "lucide-react";

const pendingTutors = [
  { id: 1, name: "Dr. James Wilson", subject: "Physics", experience: "10 years", status: "pending" },
  { id: 2, name: "Maria Garcia", subject: "Spanish", experience: "5 years", status: "pending" },
];

const recentActivity = [
  { id: 1, action: "New student registered", user: "John Doe", time: "2 hours ago" },
  { id: 2, action: "Session completed", user: "Alice & Dr. Smith", time: "3 hours ago" },
  { id: 3, action: "Tutor approved", user: "Prof. Chen", time: "5 hours ago" },
  { id: 4, action: "New booking", user: "Bob Wilson", time: "6 hours ago" },
];

export default function AdminDashboard() {
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
            <Badge variant="secondary" className="ml-2">Admin</Badge>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Admin Panel</span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/">Logout</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users, sessions, and platform settings.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: "15,234", icon: Users, color: "text-primary" },
            { label: "Active Tutors", value: "523", icon: UserCheck, color: "text-success" },
            { label: "Sessions Today", value: "156", icon: Video, color: "text-warning" },
            { label: "Revenue (MTD)", value: "$45,678", icon: TrendingUp, color: "text-primary" },
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
          {/* Pending Tutor Approvals */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Pending Tutor Approvals
                <Badge variant="destructive" className="ml-auto">{pendingTutors.length}</Badge>
              </CardTitle>
              <CardDescription>Review and approve tutor registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingTutors.map((tutor) => (
                  <div
                    key={tutor.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{tutor.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {tutor.subject} • {tutor.experience}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm">Approve</Button>
                      <Button size="sm" variant="outline">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4">
                View All Pending
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                    <div>
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.user} • {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                User Management
              </CardTitle>
              <CardDescription>Manage students and tutors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Users className="h-4 w-4 mr-2" /> Manage Students
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <UserCheck className="h-4 w-4 mr-2" /> Manage Tutors
              </Button>
            </CardContent>
          </Card>

          {/* Session Monitoring */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                Session Monitoring
              </CardTitle>
              <CardDescription>View all platform sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Video className="h-4 w-4 mr-2" /> Active Sessions (12)
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" /> Session History
              </Button>
            </CardContent>
          </Card>

          {/* Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Reports
              </CardTitle>
              <CardDescription>Download platform reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" /> Tutor Performance
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" /> Student Activity
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" /> Revenue Report
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
