import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Users, Clock, DollarSign, Video, GraduationCap, TrendingUp, Star } from "lucide-react";
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="tutor">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchData} className="border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950">Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      {/* Tutor Dashboard Header - Green/Emerald Theme */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-emerald-600/15 via-green-500/15 to-teal-500/15 border-2 border-emerald-300/50 dark:border-emerald-700/50 shadow-lg shadow-emerald-500/5">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/30">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Tutor Portal</span>
            <h1 className="font-display text-3xl font-bold">Welcome back, {userProfile?.fullName?.split(' ')[0] || 'Tutor'}!</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14">Manage your sessions and connect with students.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {[
          { label: "Total Students", value: uniqueStudents.toString(), icon: Users, color: "from-emerald-500 to-green-500", bgColor: "bg-emerald-50 dark:bg-emerald-950/50" },
          { label: "Sessions This Month", value: sessions.filter(s => {
            const sessionDate = new Date(s.date);
            const now = new Date();
            return sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear();
          }).length.toString(), icon: Video, color: "from-green-500 to-teal-500", bgColor: "bg-green-50 dark:bg-green-950/50" },
          { label: "Hours Taught", value: totalHours.toString(), icon: Clock, color: "from-teal-500 to-emerald-500", bgColor: "bg-teal-50 dark:bg-teal-950/50" },
          { label: "Earnings", value: `$${earnings}`, icon: DollarSign, color: "from-lime-500 to-green-500", bgColor: "bg-lime-50 dark:bg-lime-950/50" },
        ].map((stat) => (
          <Card key={stat.label} className={`h-full border-emerald-100 dark:border-emerald-900 ${stat.bgColor}`}>
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        <Card className="border-emerald-100 dark:border-emerald-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-green-500">
                <Calendar className="h-4 w-4 text-white" />
              </div>
              Session Requests
              {pendingSessions.length > 0 && (
                <span className="bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs px-2 py-0.5 rounded-full">
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
                  <div key={session.id} className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
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
            <Button variant="outline" className="w-full mt-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950" asChild>
              <Link to="/tutor/sessions">Manage Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-green-500 to-teal-500">
                <Video className="h-4 w-4 text-white" />
              </div>
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
                  <div key={session.id} className="flex items-center justify-between p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900">
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
            <Button variant="outline" className="w-full mt-4 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950" asChild>
              <Link to="/tutor/sessions">View All Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-teal-500 to-cyan-500">
                <Clock className="h-4 w-4 text-white" />
              </div>
              Availability
            </CardTitle>
            <CardDescription>Manage your available time slots</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Set your weekly availability so students can book sessions.</p>
            <Button variant="outline" className="w-full border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950" asChild>
              <Link to="/tutor/availability">Manage Availability</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/50 dark:to-green-950/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-lime-500">
                <Star className="h-4 w-4 text-white" />
              </div>
              Your Profile
            </CardTitle>
            <CardDescription>Update your tutor profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Keep your profile updated to attract more students.</p>
            <Button className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25" asChild>
              <Link to="/tutor/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
