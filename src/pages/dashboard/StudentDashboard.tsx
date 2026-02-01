import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Calendar, TrendingUp, Clock, ArrowRight, Brain, Video, Users, Sparkles, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getStudentSessions, getStudentGoals, Session, LearningGoal } from "@/lib/firestore";

interface CareerSuggestion {
  career: string;
  description: string;
  matchScore: number;
}

export default function StudentDashboard() {
  const { userProfile } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<CareerSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const [sessionsData, goalsData] = await Promise.all([
        getStudentSessions(userProfile.uid),
        getStudentGoals(userProfile.uid)
      ]);
      setSessions(sessionsData);
      setGoals(goalsData);
      if (goalsData.length > 0) {
        generateAISuggestions(goalsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      setError('We could not load your dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateAISuggestions = async (goals: LearningGoal[]) => {
    setAiLoading(true);
    try {
      // Generate career suggestions based on learning goals
      const subjects = [...new Set(goals.map(g => g.subject))];
      const avgProgress = goals.reduce((sum, g) => sum + g.progress, 0) / goals.length;
      
      // Simple AI-like career matching based on subjects
      const careerMap: Record<string, CareerSuggestion[]> = {
        'Mathematics': [
          { career: 'Data Scientist', description: 'Analyze complex data sets using mathematical models', matchScore: 95 },
          { career: 'Financial Analyst', description: 'Use quantitative skills for financial planning', matchScore: 88 },
          { career: 'Actuary', description: 'Apply statistics to assess risk in insurance', matchScore: 85 }
        ],
        'Physics': [
          { career: 'Engineer', description: 'Apply physics principles to design solutions', matchScore: 92 },
          { career: 'Research Scientist', description: 'Conduct experiments and advance scientific knowledge', matchScore: 90 },
          { career: 'Aerospace Engineer', description: 'Design aircraft and spacecraft systems', matchScore: 87 }
        ],
        'Chemistry': [
          { career: 'Pharmacist', description: 'Develop and dispense medications', matchScore: 90 },
          { career: 'Chemical Engineer', description: 'Design chemical manufacturing processes', matchScore: 88 },
          { career: 'Environmental Scientist', description: 'Study and protect the environment', matchScore: 82 }
        ],
        'Biology': [
          { career: 'Medical Doctor', description: 'Diagnose and treat patients', matchScore: 94 },
          { career: 'Biotechnologist', description: 'Develop biological products and processes', matchScore: 89 },
          { career: 'Marine Biologist', description: 'Study ocean life and ecosystems', matchScore: 85 }
        ],
        'Computer Science': [
          { career: 'Software Engineer', description: 'Build applications and software systems', matchScore: 96 },
          { career: 'AI/ML Engineer', description: 'Develop artificial intelligence solutions', matchScore: 93 },
          { career: 'Cybersecurity Analyst', description: 'Protect systems from security threats', matchScore: 88 }
        ],
        'English': [
          { career: 'Content Writer', description: 'Create engaging written content', matchScore: 91 },
          { career: 'Journalist', description: 'Research and report on news stories', matchScore: 87 },
          { career: 'Editor', description: 'Review and refine written materials', matchScore: 85 }
        ],
        'History': [
          { career: 'Historian', description: 'Research and document historical events', matchScore: 90 },
          { career: 'Museum Curator', description: 'Manage and present historical collections', matchScore: 86 },
          { career: 'Policy Analyst', description: 'Use historical context to inform policy', matchScore: 82 }
        ],
        'Economics': [
          { career: 'Economist', description: 'Analyze economic trends and data', matchScore: 94 },
          { career: 'Investment Banker', description: 'Advise on financial transactions', matchScore: 89 },
          { career: 'Business Consultant', description: 'Help businesses improve operations', matchScore: 86 }
        ]
      };
      
      // Collect suggestions from all subjects
      const suggestions: CareerSuggestion[] = [];
      subjects.forEach(subject => {
        const careers = careerMap[subject] || careerMap['Computer Science'];
        suggestions.push(...careers.slice(0, 2));
      });
      
      // Adjust match scores based on progress
      const adjustedSuggestions = suggestions
        .map(s => ({
          ...s,
          matchScore: Math.min(100, Math.round(s.matchScore * (0.7 + (avgProgress / 100) * 0.3)))
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);
      
      setAiSuggestions(adjustedSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions');
    } finally {
      setAiLoading(false);
    }
  };

  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const upcomingSessions = sessions.filter(s => s.status === 'accepted' && new Date(s.date) >= new Date());
  const totalHours = completedSessions; // Assuming 1 hour per session
  const avgGoalProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
    : 0;

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="student">
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
    <DashboardLayout role="student">
      {/* Student Dashboard Header */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-blue-500/10 via-cyan-500/10 to-teal-500/10 border border-blue-200/50 dark:border-blue-800/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-blue-500/20">
            <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="font-display text-3xl font-bold">Welcome back, {userProfile?.fullName?.split(' ')[0] || 'Student'}!</h1>
        </div>
        <p className="text-muted-foreground ml-12">Track your progress and continue your learning journey.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-6 sm:mb-8">
        {[
          { label: "Sessions Completed", value: completedSessions.toString(), icon: Video, color: "text-primary" },
          { label: "Learning Goals", value: goals.length.toString(), icon: Target, color: "text-success" },
          { label: "Hours Learned", value: totalHours.toString(), icon: Clock, color: "text-warning" },
          { label: "Avg Goal Progress", value: `${avgGoalProgress}%`, icon: TrendingUp, color: "text-primary" },
        ].map((stat) => (
          <Card key={stat.label} className="h-full">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                </div>
                <stat.icon className={`h-6 w-6 sm:h-8 sm:w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              My Sessions
            </CardTitle>
            <CardDescription>Your upcoming tutoring sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No upcoming sessions</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.slice(0, 3).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">with {session.tutorName}</p>
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
              <Link to="/student/sessions">View All Sessions</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <Sparkles className="h-4 w-4 text-yellow-500" />
              AI Career Insights
            </CardTitle>
            <CardDescription>Based on your learning goals</CardDescription>
          </CardHeader>
          <CardContent>
            {aiLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : aiSuggestions.length === 0 ? (
              <p className="text-sm text-muted-foreground mb-4">
                Add learning goals to get personalized career suggestions.
              </p>
            ) : (
              <div className="space-y-3">
                {aiSuggestions.map((suggestion, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{suggestion.career}</p>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {suggestion.matchScore}% match
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Learning Goals
            </CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent>
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Set your first learning goal</p>
            ) : (
              <div className="space-y-3">
                {goals.slice(0, 3).map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-sm text-muted-foreground">{goal.subject}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-background rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all" 
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{goal.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" asChild>
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
