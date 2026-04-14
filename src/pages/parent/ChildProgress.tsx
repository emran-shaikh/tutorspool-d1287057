import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import {
  getStudentSessions,
  getStudentGoals,
  type Session,
  type LearningGoal,
} from "@/lib/firestore";
import { getStudentGamification, getStudentQuizResults, type StudentGamification } from "@/lib/gamification";
import { ArrowLeft, BookOpen, Target, Trophy, Clock, CheckCircle, XCircle, Calendar } from "lucide-react";
import LevelBadge from "@/components/gamification/LevelBadge";
import StreakCounter from "@/components/gamification/StreakCounter";

export default function ChildProgress() {
  const { childId } = useParams<{ childId: string }>();
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [gamification, setGamification] = useState<StudentGamification | null>(null);
  const [quizResults, setQuizResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!childId) return;
    loadData();
  }, [childId]);

  const loadData = async () => {
    if (!childId) return;
    try {
      const [sess, gls, gam, qr] = await Promise.all([
        getStudentSessions(childId),
        getStudentGoals(childId),
        getStudentGamification(childId),
        getStudentQuizResults(childId),
      ]);
      setSessions(sess);
      setGoals(gls);
      setGamification(gam);
      setQuizResults(qr);
    } catch (error) {
      console.error("Error loading child data:", error);
    } finally {
      setLoading(false);
    }
  };

  const recentSessions = sessions.slice(0, 5);
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const pendingSessions = sessions.filter(s => s.status === 'pending').length;

  if (loading) {
    return (
      <DashboardLayout role="parent">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="parent">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/parent/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Child's Progress</h1>
            <p className="text-muted-foreground">Detailed overview of your child's learning journey</p>
          </div>
        </div>

        {/* Gamification Overview */}
        {gamification && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Achievements & Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                <LevelBadge xp={gamification.xp} />
                <StreakCounter streak={gamification.streak} />
                <div className="text-sm">
                  <span className="text-muted-foreground">Total XP: </span>
                  <span className="font-bold text-primary">{gamification.xp}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Badges: </span>
                  <span className="font-bold">{gamification.badges?.length ?? 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <BookOpen className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{sessions.length}</p>
              <p className="text-sm text-muted-foreground">Total Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{completedSessions}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{goals.length}</p>
              <p className="text-sm text-muted-foreground">Learning Goals</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-amber-500" />
              <p className="text-2xl font-bold">{pendingSessions}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{s.subject}</p>
                      <p className="text-sm text-muted-foreground">with {s.tutorName} • {s.date} at {s.time}</p>
                    </div>
                    <Badge variant={s.status === 'completed' ? 'default' : s.status === 'pending' ? 'secondary' : 'outline'}>
                      {s.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No learning goals set.</p>
            ) : (
              <div className="space-y-4">
                {goals.map((g) => (
                  <div key={g.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{g.title}</span>
                      <span className="text-muted-foreground">{g.progress}%</span>
                    </div>
                    <Progress value={g.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Subject: {g.subject}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quiz Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {quizResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No quiz results yet.</p>
            ) : (
              <div className="space-y-3">
                {quizResults.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{r.totalQuestions} Questions</p>
                      <p className="text-sm text-muted-foreground">
                        {r.correctAnswers}/{r.totalQuestions} correct • {new Date(r.completedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={r.accuracy >= 80 ? 'default' : r.accuracy >= 50 ? 'secondary' : 'destructive'}>
                      {r.accuracy}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
