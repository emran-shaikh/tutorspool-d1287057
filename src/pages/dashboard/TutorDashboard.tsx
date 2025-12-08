import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, DollarSign, Video } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function TutorDashboard() {
  return (
    <DashboardLayout role="tutor">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Manage your sessions and connect with students.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Students", value: "0", icon: Users, color: "text-primary" },
          { label: "Sessions This Month", value: "0", icon: Video, color: "text-success" },
          { label: "Hours Taught", value: "0", icon: Clock, color: "text-warning" },
          { label: "Earnings", value: "$0", icon: DollarSign, color: "text-primary" },
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Session Requests
            </CardTitle>
            <CardDescription>Accept or decline student requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">No pending requests</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tutor/sessions">Manage Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Upcoming Sessions
            </CardTitle>
            <CardDescription>Your scheduled sessions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tutor/sessions">View All Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Availability
            </CardTitle>
            <CardDescription>Manage your available time slots</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Set your weekly availability so students can book sessions.</p>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/tutor/availability">Manage Availability</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Your Profile
            </CardTitle>
            <CardDescription>Update your tutor profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Keep your profile updated to attract more students.</p>
            <Button className="w-full" asChild>
              <Link to="/tutor/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
