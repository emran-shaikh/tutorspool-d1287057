import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  ArrowRight, 
  BookOpen, 
  Brain, 
  Lightbulb, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCcw,
  Send
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getQuizById, 
  updateQuizAssignment,
  saveQuizResult,
  Quiz, 
  Flashcard,
  QuizQuestion
} from "@/lib/firestore";

type Phase = "flashcards" | "quiz" | "results";

interface Answer {
  questionId: string;
  selectedAnswer: string | null;
}

export default function TakeQuiz() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get("assignment");
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("flashcards");
  const [currentFlashcardIndex, setCurrentFlashcardIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
    }
  }, [quizId]);

  const fetchQuiz = async () => {
    if (!quizId) return;
    setLoading(true);
    try {
      const quizData = await getQuizById(quizId);
      setQuiz(quizData);
      if (quizData) {
        setAnswers(quizData.questions.map(q => ({ questionId: q.id, selectedAnswer: null })));
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
      toast.error("Failed to load quiz");
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async () => {
    setPhase("quiz");
    setStartTime(new Date());
    if (assignmentId) {
      try {
        await updateQuizAssignment(assignmentId, { 
          status: "in_progress",
          startedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating assignment:", error);
      }
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => 
      prev.map(a => 
        a.questionId === questionId ? { ...a, selectedAnswer: answer } : a
      )
    );
  };

  const submitQuiz = async () => {
    if (!quiz || !userProfile || !startTime) return;
    setSubmitting(true);

    try {
      const endTime = new Date();
      const timeTaken = Math.round((endTime.getTime() - startTime.getTime()) / 1000);

      // Calculate results
      const answersWithCorrectness = answers.map(a => {
        const question = quiz.questions.find(q => q.id === a.questionId);
        const isCorrect = a.selectedAnswer === question?.correctAnswer;
        return { ...a, isCorrect };
      });

      const correctAnswers = answersWithCorrectness.filter(a => a.isCorrect).length;
      const wrongAnswers = answersWithCorrectness.filter(a => a.selectedAnswer && !a.isCorrect).length;
      const skipped = answersWithCorrectness.filter(a => !a.selectedAnswer).length;
      const accuracy = Math.round((correctAnswers / quiz.questions.length) * 100);

      const resultId = await saveQuizResult({
        quizId: quiz.id!,
        studentId: userProfile.uid,
        studentName: userProfile.fullName,
        assignmentId: assignmentId || "",
        totalQuestions: quiz.questions.length,
        correctAnswers,
        wrongAnswers,
        skipped,
        accuracy,
        answers: answersWithCorrectness,
        completedAt: endTime.toISOString(),
        timeTaken
      });

      if (assignmentId) {
        await updateQuizAssignment(assignmentId, {
          status: "completed",
          completedAt: endTime.toISOString()
        });
      }

      navigate(`/student/quiz/${quizId}/results?result=${resultId}`);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      toast.error("Failed to submit quiz");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quiz) {
    return (
      <DashboardLayout role="student">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Quiz not found</p>
            <Button variant="outline" onClick={() => navigate("/student/quizzes")} className="mt-4">
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const currentFlashcard = quiz.flashcards[currentFlashcardIndex];
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const answeredCount = answers.filter(a => a.selectedAnswer !== null).length;

  return (
    <DashboardLayout role="student">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate("/student/quizzes")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{quiz.topic}</h1>
            <p className="text-muted-foreground">{quiz.subject}</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-1">
            {phase === "flashcards" ? (
              <>📚 Study Mode</>
            ) : (
              <>🧠 Quiz Mode</>
            )}
          </Badge>
        </div>
      </div>

      {/* Flashcards Phase */}
      {phase === "flashcards" && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Flashcard {currentFlashcardIndex + 1} of {quiz.flashcards.length}
            </p>
            <Progress value={((currentFlashcardIndex + 1) / quiz.flashcards.length) * 100} className="w-32" />
          </div>

          {/* Flashcard */}
          <div 
            className="relative min-h-[400px] cursor-pointer perspective-1000"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <Card 
              className={`absolute inset-0 border-2 border-violet-200 dark:border-violet-800 transition-all duration-500 transform-style-preserve-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* Front of card */}
              <div 
                className="absolute inset-0 backface-hidden"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center mb-2">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl text-violet-700 dark:text-violet-300">
                    {currentFlashcard.conceptTitle}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <p className="text-lg">{currentFlashcard.explanation}</p>
                  {currentFlashcard.formula && (
                    <div className="p-3 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-1">Formula</p>
                      <code className="text-lg font-mono text-violet-600 dark:text-violet-400">
                        {currentFlashcard.formula}
                      </code>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground pt-4">
                    Click to see example & hint →
                  </p>
                </CardContent>
              </div>

              {/* Back of card */}
              <div 
                className="absolute inset-0 backface-hidden bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 rounded-lg"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <CardContent className="p-6 space-y-4 h-full flex flex-col justify-center">
                  <div>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                      🌍 Real-life Example
                    </p>
                    <p className="text-lg">{currentFlashcard.realLifeExample}</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                    <p className="font-medium text-amber-600 dark:text-amber-400 mb-2">
                      💡 Hint to Remember
                    </p>
                    <p>{currentFlashcard.hint}</p>
                  </div>
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    ← Click to flip back
                  </p>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => {
                setCurrentFlashcardIndex(prev => prev - 1);
                setIsFlipped(false);
              }}
              disabled={currentFlashcardIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentFlashcardIndex === quiz.flashcards.length - 1 ? (
              <Button 
                onClick={startQuiz}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
              >
                Start Quiz
                <Brain className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button 
                onClick={() => {
                  setCurrentFlashcardIndex(prev => prev + 1);
                  setIsFlipped(false);
                }}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Quiz Phase */}
      {phase === "quiz" && currentQuestion && (
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {answeredCount}/{quiz.questions.length} answered
              </span>
              <Progress value={(answeredCount / quiz.questions.length) * 100} className="w-24" />
            </div>
          </div>

          <Card className="border-violet-200 dark:border-violet-800">
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="capitalize">{currentQuestion.type}</Badge>
                <Badge 
                  variant="outline"
                  className={
                    currentQuestion.difficulty === 'easy' ? 'border-green-300 text-green-600' :
                    currentQuestion.difficulty === 'medium' ? 'border-amber-300 text-amber-600' :
                    'border-red-300 text-red-600'
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>
              <CardTitle className="text-lg leading-relaxed">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentQuestion.options ? (
                <RadioGroup 
                  value={currentAnswer?.selectedAnswer || ""} 
                  onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
                >
                  <div className="space-y-3">
                    {currentQuestion.options.map((option, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                          currentAnswer?.selectedAnswer === option
                            ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/30'
                            : 'border-gray-200 dark:border-gray-800 hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <Textarea
                  placeholder="Type your answer here..."
                  value={currentAnswer?.selectedAnswer || ""}
                  onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
                  className="min-h-[120px]"
                />
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6">
            <Button 
              variant="outline" 
              onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
              disabled={currentQuestionIndex === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            
            {currentQuestionIndex === quiz.questions.length - 1 ? (
              <Button 
                onClick={submitQuiz}
                disabled={submitting}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Submit Quiz
              </Button>
            ) : (
              <Button 
                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
              >
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Question Navigator */}
          <div className="mt-8 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium mb-3">Question Navigator</p>
            <div className="flex flex-wrap gap-2">
              {quiz.questions.map((q, index) => {
                const answer = answers.find(a => a.questionId === q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-violet-500 text-white'
                        : answer?.selectedAnswer
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-800 text-muted-foreground'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
