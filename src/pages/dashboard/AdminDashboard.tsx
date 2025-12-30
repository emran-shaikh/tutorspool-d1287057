import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, Video, TrendingUp, Download, Shield, BookOpen, FileText, Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUsers, getAllTutors, getAllSessions } from "@/lib/firestore";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeTutors: 0,
    pendingTutors: 0,
    sessionsToday: 0,
    totalSessions: 0,
    completedSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const [users, tutors, sessions] = await Promise.all([
        getAllUsers(),
        getAllTutors(),
        getAllSessions()
      ]);

      const today = new Date().toISOString().split('T')[0];
      const students = users.filter(u => u.role === 'student');
      const activeTutors = tutors.filter(t => t.isApproved);
      const pendingTutors = tutors.filter(t => !t.isApproved);
      const sessionsToday = sessions.filter(s => s.date === today);
      const completedSessions = sessions.filter(s => s.status === 'completed');

      setStats({
        totalStudents: students.length,
        activeTutors: activeTutors.length,
        pendingTutors: pendingTutors.length,
        sessionsToday: sessionsToday.length,
        totalSessions: sessions.length,
        completedSessions: completedSessions.length
      });
    } catch (error) {
      console.error('Error fetching admin stats', error);
      setError('We could not load your admin overview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="admin">
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchStats}>Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage users, sessions, and platform settings.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Students", value: stats.totalStudents.toString(), icon: Users, color: "text-primary" },
          { label: "Active Tutors", value: stats.activeTutors.toString(), icon: UserCheck, color: "text-success" },
          { label: "Sessions Today", value: stats.sessionsToday.toString(), icon: Video, color: "text-warning" },
          { label: "Total Sessions", value: stats.totalSessions.toString(), icon: TrendingUp, color: "text-primary" },
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
              <Shield className="h-5 w-5 text-primary" />
              Pending Tutor Approvals
              {stats.pendingTutors > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTutors}
                </span>
              )}
            </CardTitle>
            <CardDescription>Review and approve tutor registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.pendingTutors === 0 ? (
              <p className="text-muted-foreground text-center py-4">No pending approvals</p>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                {stats.pendingTutors} tutor(s) awaiting approval
              </p>
            )}
            <Button variant="outline" className="w-full" asChild>
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Management
            </CardTitle>
            <CardDescription>Manage students and tutors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/users"><Users className="h-4 w-4 mr-2" /> Manage All Users</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Session Monitoring
            </CardTitle>
            <CardDescription>View all platform sessions ({stats.completedSessions} completed)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/sessions"><BookOpen className="h-4 w-4 mr-2" /> View All Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              Reports
            </CardTitle>
            <CardDescription>Download platform reports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/reports"><Download className="h-4 w-4 mr-2" /> Download Reports</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Blog Management
            </CardTitle>
            <CardDescription>Create and manage blog posts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link to="/admin/blogs"><FileText className="h-4 w-4 mr-2" /> Manage Blogs</Link>
            </Button>
            <Button variant="default" className="w-full justify-start" asChild>
              <Link to="/admin/blogs/new"><Plus className="h-4 w-4 mr-2" /> Create New Post</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
