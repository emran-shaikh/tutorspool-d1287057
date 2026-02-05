import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, BookOpen, Brain, Users, Send, Trash2, CheckCircle, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getQuizById, 
  publishQuiz, 
  deleteQuiz, 
  getAllStudents, 
  createQuizAssignment,
  getQuizAssignments,
  Quiz, 
  StudentProfile,
  QuizAssignment
} from "@/lib/firestore";

export default function QuizDetail() {
  const { quizId } = useParams<{ quizId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [assignments, setAssignments] = useState<QuizAssignment[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetchData();
    }
  }, [quizId]);

  const fetchData = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const [quizData, studentsData, assignmentsData] = await Promise.all([
        getQuizById(quizId),
        getAllStudents(),
        getQuizAssignments(quizId)
      ]);
      setQuiz(quizData);
      setStudents(studentsData);
      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!quizId) return;
    setPublishing(true);
    try {
      await publishQuiz(quizId);
      setQuiz(prev => prev ? { ...prev, isPublished: true, publishedAt: new Date().toISOString() } : null);
      toast.success("Quiz published successfully!");
    } catch (error) {
      console.error("Error publishing quiz:", error);
      toast.error("Failed to publish quiz");
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!quizId) return;
    try {
      await deleteQuiz(quizId);
      toast.success("Quiz deleted");
      navigate("/tutor/quizzes");
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  const handleAssign = async () => {
    if (!quizId || !quiz || selectedStudents.length === 0) return;
    setAssigning(true);
    try {
      const assignedStudentIds = assignments.map(a => a.studentId);
      const newStudents = selectedStudents.filter(id => !assignedStudentIds.includes(id));

      for (const studentId of newStudents) {
        const student = students.find(s => s.uid === studentId);
        if (!student) continue;

        await createQuizAssignment({
          quizId,
          studentId,
          studentName: student.fullName,
          studentEmail: student.email,
          assignedAt: new Date().toISOString(),
          status: "pending"
        });

        // Send email notification
        try {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-quiz-assignment`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
              },
              body: JSON.stringify({
                studentEmail: student.email,
                studentName: student.fullName,
                tutorName: quiz.tutorName,
                subject: quiz.subject,
                topic: quiz.topic,
                quizId
              }),
            }
          );
        } catch (emailError) {
          console.error("Failed to send notification email:", emailError);
        }
      }

      toast.success(`Quiz assigned to ${newStudents.length} student(s)`);
      setSelectedStudents([]);
      fetchData();
    } catch (error) {
      console.error("Error assigning quiz:", error);
      toast.error("Failed to assign quiz");
    } finally {
      setAssigning(false);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
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

  if (!quiz) {
    return (
      <DashboardLayout role="tutor">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Quiz not found</p>
            <Button variant="outline" onClick={() => navigate("/tutor/quizzes")} className="mt-4">
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const assignedStudentIds = assignments.map(a => a.studentId);

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/tutor/quizzes")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
        </Button>

        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Badge variant={quiz.isPublished ? "default" : "secondary"}>
                {quiz.isPublished ? "Published" : "Draft"}
              </Badge>
              <Badge variant="outline">{quiz.targetLevel === "school" ? "School Level" : "College Level"}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{quiz.subject}: {quiz.topic}</h1>
            <p className="text-muted-foreground">
              Created on {new Date(quiz.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div className="flex gap-2">
            {!quiz.isPublished && (
              <Button 
                onClick={handlePublish} 
                disabled={publishing}
                className="bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                Publish Quiz
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Quiz?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the quiz and all student assignments. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <Tabs defaultValue="flashcards" className="space-y-4">
        <TabsList>
          <TabsTrigger value="flashcards" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Flashcards ({quiz.flashcards.length})
          </TabsTrigger>
          <TabsTrigger value="questions" className="gap-2">
            <Brain className="h-4 w-4" />
            Questions ({quiz.questions.length})
          </TabsTrigger>
          <TabsTrigger value="assign" className="gap-2">
            <Users className="h-4 w-4" />
            Assign Students
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flashcards">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quiz.flashcards.map((flashcard, index) => (
              <Card key={index} className="border-purple-100 dark:border-purple-900">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    {flashcard.conceptTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Explanation</p>
                    <p>{flashcard.explanation}</p>
                  </div>
                  {flashcard.formula && (
                    <div>
                      <p className="font-medium text-muted-foreground mb-1">Formula</p>
                      <code className="bg-purple-50 dark:bg-purple-950/50 px-2 py-1 rounded text-purple-600 dark:text-purple-400">
                        {flashcard.formula}
                      </code>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-muted-foreground mb-1">Real-life Example</p>
                    <p className="text-emerald-700 dark:text-emerald-400">{flashcard.realLifeExample}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-800">
                    <p className="font-medium text-amber-700 dark:text-amber-400 text-xs mb-1">💡 Hint</p>
                    <p className="text-amber-800 dark:text-amber-300">{flashcard.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="questions">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Questions</CardTitle>
              <CardDescription>
                {quiz.questions.filter(q => q.type === 'mcq').length} MCQs, 
                {quiz.questions.filter(q => q.type === 'conceptual').length} Conceptual, 
                {quiz.questions.filter(q => q.type === 'numerical').length} Numerical
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {quiz.questions.map((question, index) => (
                    <div 
                      key={question.id} 
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-muted-foreground">{index + 1}.</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs capitalize">{question.type}</Badge>
                            <Badge 
                              variant="outline" 
                              className={
                                question.difficulty === 'easy' ? 'border-green-300 text-green-600' :
                                question.difficulty === 'medium' ? 'border-amber-300 text-amber-600' :
                                'border-red-300 text-red-600'
                              }
                            >
                              {question.difficulty}
                            </Badge>
                          </div>
                          <p className="font-medium mb-2">{question.question}</p>
                          {question.options && (
                            <div className="space-y-1 mb-2">
                              {question.options.map((opt, i) => (
                                <p 
                                  key={i} 
                                  className={`text-sm pl-4 ${opt === question.correctAnswer ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}
                                >
                                  {opt === question.correctAnswer && "✓ "}{opt}
                                </p>
                              ))}
                            </div>
                          )}
                          {!question.options && (
                            <p className="text-sm text-green-600 mb-2">
                              <span className="font-medium">Answer:</span> {question.correctAnswer}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium">Explanation:</span> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assign">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Students
                </CardTitle>
                <CardDescription>
                  Choose students to assign this quiz to
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No students available</p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {students.map(student => {
                        const isAssigned = assignedStudentIds.includes(student.uid);
                        return (
                          <div 
                            key={student.uid}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                              isAssigned 
                                ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                                : 'hover:bg-muted/50'
                            }`}
                          >
                            <Checkbox
                              checked={selectedStudents.includes(student.uid) || isAssigned}
                              disabled={isAssigned}
                              onCheckedChange={() => toggleStudent(student.uid)}
                            />
                            <div className="flex-1">
                              <p className="font-medium">{student.fullName}</p>
                              <p className="text-sm text-muted-foreground">{student.email}</p>
                            </div>
                            {isAssigned && (
                              <Badge variant="secondary" className="text-green-600">
                                Assigned
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
                <Button 
                  onClick={handleAssign}
                  disabled={selectedStudents.length === 0 || assigning || !quiz.isPublished}
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-violet-600"
                >
                  {assigning ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Assign to {selectedStudents.length} Student(s)
                </Button>
                {!quiz.isPublished && (
                  <p className="text-xs text-amber-600 text-center mt-2">
                    Publish the quiz first before assigning
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assignment Status</CardTitle>
                <CardDescription>
                  {assignments.length} student(s) assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No students assigned yet
                  </p>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {assignments.map(assignment => (
                        <div 
                          key={assignment.id}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <p className="font-medium">{assignment.studentName}</p>
                            <p className="text-sm text-muted-foreground">{assignment.studentEmail}</p>
                          </div>
                          <Badge
                            variant={
                              assignment.status === 'completed' ? 'default' :
                              assignment.status === 'in_progress' ? 'secondary' :
                              'outline'
                            }
                          >
                            {assignment.status === 'completed' ? 'Completed' :
                             assignment.status === 'in_progress' ? 'In Progress' :
                             'Pending'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
