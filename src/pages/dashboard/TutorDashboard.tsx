import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, DollarSign, Video } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorSessions, getTutorProfile, Session, TutorProfile } from "@/lib/firestore";

export default function TutorDashboard() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [tutorProfile, setTutorProfile] = useState<TutorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, profileData] = await Promise.all([
        getTutorSessions(userProfile.uid),
        getTutorProfile(userProfile.uid)
      ]);
      setSessions(sessionsData);
      setTutorProfile(profileData);
    } catch (error) {
      console.error('Error fetching tutor data', error);
      setError('We could not load your tutor overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'accepted' && new Date(s.date) >= new Date());
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const uniqueStudents = [...new Set(sessions.map(s => s.studentId))].length;
  const totalHours = completedSessions.length; // Assuming 1 hour per session
  const earnings = tutorProfile?.hourlyRate ? completedSessions.length * tutorProfile.hourlyRate : 0;

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="tutor">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchData}>Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome back, {userProfile?.fullName?.split(' ')[0] || 'Tutor'}!</h1>
        <p className="text-muted-foreground">Manage your sessions and connect with students.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Students", value: uniqueStudents.toString(), icon: Users, color: "text-primary" },
          { label: "Sessions This Month", value: sessions.filter(s => {
            const sessionDate = new Date(s.date);
            const now = new Date();
            return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
          }).length.toString(), icon: Video, color: "text-success" },
          { label: "Hours Taught", value: totalHours.toString(), icon: Clock, color: "text-warning" },
          { label: "Earnings", value: `$${earnings}`, icon: DollarSign, color: "text-primary" },
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
              {pendingSessions.length > 0 && (
                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                  {pendingSessions.length}
                </span>
              )}
            </CardTitle>
            <CardDescription>Accept or decline student requests</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {pendingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{session.studentName}</p>
                      <p className="text-sm text-muted-foreground">{session.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(session.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{session.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
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
            {upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{session.studentName}</p>
                      <p className="text-sm text-muted-foreground">{session.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(session.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">{session.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
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
