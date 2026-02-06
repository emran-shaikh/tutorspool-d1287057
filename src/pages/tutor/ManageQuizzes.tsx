import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Brain, BookOpen, Users, Loader2, FileQuestion } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getTutorQuizzes, getQuizAssignments, Quiz, QuizAssignment } from "@/lib/firestore";

export default function ManageQuizzes() {
  const { userProfile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.uid) {
      fetchQuizzes();
    }
  }, [userProfile]);

  const fetchQuizzes = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      const quizzesData = await getTutorQuizzes(userProfile.uid);
      setQuizzes(quizzesData);

      // Fetch assignment counts for each quiz (include tutorId for security rules)
      const counts: Record<string, number> = {};
      for (const quiz of quizzesData) {
        if (quiz.id) {
          const assignments = await getQuizAssignments(quiz.id, userProfile.uid);
          counts[quiz.id] = assignments.length;
        }
      }
      setAssignmentCounts(counts);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="tutor">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="tutor">
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-600/15 via-violet-500/15 to-fuchsia-500/15 border-2 border-purple-300/50 dark:border-purple-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Quiz Management
              </span>
              <h1 className="font-display text-3xl font-bold">My Quizzes</h1>
            </div>
          </div>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700">
            <Link to="/tutor/quizzes/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Link>
          </Button>
        </div>
      </div>

      {quizzes.length === 0 ? (
        <Card className="border-purple-100 dark:border-purple-900">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mb-4">
              <FileQuestion className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Quizzes Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first AI-powered quiz to engage your students.
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-600 to-violet-600">
              <Link to="/tutor/quizzes/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Quiz
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((quiz) => (
            <Link key={quiz.id} to={`/tutor/quizzes/${quiz.id}`}>
              <Card className="h-full border-purple-100 dark:border-purple-900 hover:shadow-lg hover:shadow-purple-500/10 transition-all cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                      {quiz.isPublished ? "Published" : "Draft"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {quiz.targetLevel === "school" ? "School" : "College"}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {quiz.topic}
                  </CardTitle>
                  <CardDescription>{quiz.subject}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{quiz.flashcards.length} flashcards</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Brain className="h-4 w-4" />
                      <span>{quiz.questions.length} questions</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 text-sm">
                    <Users className="h-4 w-4 text-purple-500" />
                    <span className="text-purple-600 dark:text-purple-400">
                      {assignmentCounts[quiz.id || ""] || 0} students assigned
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Created {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
