import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { getParentLinks, getStudentSessions, getStudentGoals, type ParentLink } from "@/lib/firestore";
import { getStudentGamification, type StudentGamification } from "@/lib/gamification";
import { Users, BookOpen, Target, Trophy, Plus, Eye, Bell, Settings } from "lucide-react";

export default function ParentDashboard() {
  const { userProfile } = useAuth();
  const [links, setLinks] = useState<ParentLink[]>([]);
  const [childData, setChildData] = useState<Record<string, { sessions: number; goals: number; gamification: StudentGamification | null }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.uid) return;
    loadData();
  }, [userProfile?.uid]);

  const loadData = async () => {
    if (!userProfile?.uid) return;
    try {
      const parentLinks = await getParentLinks(userProfile.uid);
      setLinks(parentLinks);

      const data: typeof childData = {};
      await Promise.all(parentLinks.map(async (link) => {
        const [sessions, goals, gamification] = await Promise.all([
          getStudentSessions(link.childId),
          getStudentGoals(link.childId),
          getStudentGamification(link.childId),
        ]);
        data[link.childId] = { sessions: sessions.length, goals: goals.length, gamification };
      }));
      setChildData(data);
    } catch (error) {
      console.error("Error loading parent data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Parent Dashboard</h1>
            <p className="text-muted-foreground">Monitor your child's learning progress</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link to="/parent/notifications">
                <Bell className="mr-2 h-4 w-4" />
                Notifications
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/parent/notification-preferences">
                <Settings className="mr-2 h-4 w-4" />
                Preferences
              </Link>
            </Button>
            <Button asChild>
              <Link to="/parent/link-child">
                <Plus className="mr-2 h-4 w-4" />
                Link a Child
              </Link>
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : links.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Children Linked</h3>
              <p className="text-muted-foreground mb-4">Link your child's account to start monitoring their progress.</p>
              <Button asChild>
                <Link to="/parent/link-child">
                  <Plus className="mr-2 h-4 w-4" />
                  Link a Child
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {links.map((link) => {
              const data = childData[link.childId];
              return (
                <Card key={link.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle className="text-lg">{link.childName}</CardTitle>
                      <p className="text-sm text-muted-foreground">{link.childEmail}</p>
                    </div>
                    <Badge variant="secondary">{link.status}</Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{data?.sessions ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Sessions</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Target className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{data?.goals ?? 0}</p>
                        <p className="text-xs text-muted-foreground">Goals</p>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <Trophy className="h-5 w-5 mx-auto mb-1 text-primary" />
                        <p className="text-lg font-bold">{data?.gamification?.xp ?? 0}</p>
                        <p className="text-xs text-muted-foreground">XP</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full" asChild>
                      <Link to={`/parent/progress/${link.childId}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Progress
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
