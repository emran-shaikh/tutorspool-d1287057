import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, BookOpen, Clock, CheckCircle, Play, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getStudentAssignments, 
  getStudentResults,
  getQuizById,
  QuizAssignment, 
  QuizResult,
  Quiz
} from "@/lib/firestore";

interface AssignmentWithQuiz extends QuizAssignment {
  quiz?: Quiz;
}

export default function StudentQuizzes() {
  const { userProfile } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithQuiz[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.uid) {
      fetchData();
    }
  }, [userProfile]);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const [assignmentsData, resultsData] = await Promise.all([
        getStudentAssignments(userProfile.uid),
        getStudentResults(userProfile.uid)
      ]);

      // Fetch quiz details for each assignment
      const assignmentsWithQuiz = await Promise.all(
        assignmentsData.map(async (assignment) => {
          const quiz = await getQuizById(assignment.quizId);
          return { ...assignment, quiz: quiz || undefined };
        })
      );

      setAssignments(assignmentsWithQuiz);
      setResults(resultsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'in_progress');
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-violet-600/15 via-purple-500/15 to-fuchsia-500/15 border-2 border-violet-300/50 dark:border-violet-700/50">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
              Interactive Learning
            </span>
            <h1 className="font-display text-3xl font-bold">My Quizzes</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14 mt-1">
          Study flashcards and test your knowledge with interactive quizzes.
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Completed ({completedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {pendingAssignments.length === 0 ? (
            <Card className="border-violet-100 dark:border-violet-900">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-16 h-16 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center mb-4">
                  <Brain className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Pending Quizzes</h3>
                <p className="text-muted-foreground">
                  You're all caught up! Check back later for new assignments.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingAssignments.map((assignment) => (
                <Card key={assignment.id} className="border-violet-100 dark:border-violet-900 hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={assignment.status === 'in_progress' ? 'secondary' : 'outline'}>
                        {assignment.status === 'in_progress' ? 'In Progress' : 'New'}
                      </Badge>
                      {assignment.quiz && (
                        <Badge variant="outline" className="text-xs">
                          {assignment.quiz.targetLevel === "school" ? "School" : "College"}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {assignment.quiz?.topic || "Quiz"}
                    </CardTitle>
                    <CardDescription>
                      {assignment.quiz?.subject}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {assignment.quiz && (
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          <span>{assignment.quiz.flashcards.length} flashcards</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Brain className="h-4 w-4" />
                          <span>{assignment.quiz.questions.length} questions</span>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mb-4">
                      Assigned {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                    <Button asChild className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700">
                      <Link to={`/student/quiz/${assignment.quizId}?assignment=${assignment.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        {assignment.status === 'in_progress' ? 'Continue' : 'Start Quiz'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedAssignments.length === 0 ? (
            <Card className="border-violet-100 dark:border-violet-900">
              <CardContent className="py-12 text-center">
                <div className="mx-auto w-16 h-16 bg-violet-100 dark:bg-violet-900/50 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-violet-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Completed Quizzes</h3>
                <p className="text-muted-foreground">
                  Complete a quiz to see your results here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedAssignments.map((assignment) => {
                const result = results.find(r => r.quizId === assignment.quizId);
                return (
                  <Card key={assignment.id} className="border-green-100 dark:border-green-900">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-green-500">Completed</Badge>
                        {result && (
                          <span className="text-lg font-bold text-green-600 dark:text-green-400">
                            {result.accuracy}%
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {assignment.quiz?.topic || "Quiz"}
                      </CardTitle>
                      <CardDescription>
                        {assignment.quiz?.subject}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {result && (
                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="p-2 bg-green-50 dark:bg-green-950/30 rounded">
                            <p className="text-lg font-bold text-green-600">{result.correctAnswers}</p>
                            <p className="text-xs text-muted-foreground">Correct</p>
                          </div>
                          <div className="p-2 bg-red-50 dark:bg-red-950/30 rounded">
                            <p className="text-lg font-bold text-red-600">{result.wrongAnswers}</p>
                            <p className="text-xs text-muted-foreground">Wrong</p>
                          </div>
                          <div className="p-2 bg-gray-50 dark:bg-gray-900/30 rounded">
                            <p className="text-lg font-bold text-gray-600">{result.skipped}</p>
                            <p className="text-xs text-muted-foreground">Skipped</p>
                          </div>
                        </div>
                      )}
                      <Button asChild variant="outline" className="w-full border-green-200 hover:bg-green-50 dark:border-green-800 dark:hover:bg-green-950">
                        <Link to={`/student/quiz/${assignment.quizId}/results?result=${result?.id}`}>
                          View Results
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
