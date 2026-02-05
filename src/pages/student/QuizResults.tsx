import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Trophy, 
  Target, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Loader2,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { getQuizById, Quiz, QuizResult } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function QuizResults() {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const resultId = searchParams.get("result");
  const navigate = useNavigate();
  const { userProfile } = useAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (quizId && resultId) {
      fetchData();
    }
  }, [quizId, resultId]);

  const fetchData = async () => {
    if (!quizId || !resultId) return;
    setLoading(true);
    try {
      const [quizData, resultDoc] = await Promise.all([
        getQuizById(quizId),
        getDoc(doc(db, "quizResults", resultId))
      ]);
      
      setQuiz(quizData);
      if (resultDoc.exists()) {
        setResult({ ...resultDoc.data(), id: resultDoc.id } as QuizResult);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
  };

  const shareToTwitter = () => {
    if (!result || !quiz) return;
    const text = `🎉 I scored ${result.accuracy}% on the ${quiz.topic} quiz! ${result.correctAnswers}/${result.totalQuestions} correct answers. Try it on TutorsPool!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToFacebook = () => {
    if (!result || !quiz) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(`I scored ${result.accuracy}% on the ${quiz.topic} quiz!`)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const shareToLinkedIn = () => {
    if (!result || !quiz) return;
    const text = `I just completed the ${quiz.topic} quiz on TutorsPool and scored ${result.accuracy}%! Continuous learning is the key to success.`;
    const url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.origin)}&title=${encodeURIComponent(`Quiz Completed: ${quiz.topic}`)}&summary=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const copyResults = () => {
    if (!result || !quiz) return;
    const text = `🎉 Quiz Complete!\n📚 ${quiz.subject}: ${quiz.topic}\n✅ Score: ${result.correctAnswers}/${result.totalQuestions}\n📊 Accuracy: ${result.accuracy}%\n\nLearn more at TutorsPool!`;
    navigator.clipboard.writeText(text);
    toast.success("Results copied to clipboard!");
  };

  const getPerformanceMessage = (accuracy: number) => {
    if (accuracy >= 90) return { message: "Outstanding! You're a master! 🏆", color: "text-yellow-500" };
    if (accuracy >= 75) return { message: "Great job! Keep it up! 🌟", color: "text-green-500" };
    if (accuracy >= 60) return { message: "Good effort! Room for improvement 💪", color: "text-blue-500" };
    if (accuracy >= 40) return { message: "Keep practicing! You'll get there 📚", color: "text-orange-500" };
    return { message: "Don't give up! Review the flashcards 📖", color: "text-red-500" };
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
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

  if (!quiz || !result) {
    return (
      <DashboardLayout role="student">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Results not found</p>
            <Button variant="outline" onClick={() => navigate("/student/quizzes")} className="mt-4">
              Back to Quizzes
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const performance = getPerformanceMessage(result.accuracy);

  return (
    <DashboardLayout role="student">
      <Button variant="ghost" onClick={() => navigate("/student/quizzes")} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Quizzes
      </Button>

      <div className="max-w-2xl mx-auto">
        {/* Success Banner */}
        <Card className="mb-6 overflow-hidden border-0 bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white">
          <CardContent className="p-8 text-center relative">
            <div className="absolute top-0 left-0 right-0 bottom-0 opacity-10">
              <Sparkles className="absolute top-4 left-8 h-8 w-8 animate-pulse" />
              <Sparkles className="absolute top-12 right-12 h-6 w-6 animate-pulse delay-100" />
              <Sparkles className="absolute bottom-8 left-16 h-5 w-5 animate-pulse delay-200" />
              <Sparkles className="absolute bottom-4 right-8 h-7 w-7 animate-pulse delay-300" />
            </div>
            <div className="relative z-10">
              <div className="mx-auto w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-yellow-300" />
              </div>
              <h1 className="text-3xl font-bold mb-2">You did it! Quiz complete.</h1>
              <p className={`text-xl ${performance.color.replace('text-', 'text-white/')}`}>
                {performance.message}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Score Card */}
        <Card className="mb-6 border-violet-200 dark:border-violet-800">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-lg text-muted-foreground">
              {quiz.subject}: {quiz.topic}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Main Score */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  {result.correctAnswers}
                </span>
                <span className="text-muted-foreground text-3xl">/{result.totalQuestions}</span>
              </div>
              <p className="text-muted-foreground">Questions Correct</p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Accuracy</span>
                <span className="font-bold text-violet-600">{result.accuracy}%</span>
              </div>
              <Progress value={result.accuracy} className="h-3" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{result.correctAnswers}</p>
                <p className="text-sm text-muted-foreground">Right</p>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950/30 rounded-xl">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{result.wrongAnswers}</p>
                <p className="text-sm text-muted-foreground">Wrong</p>
              </div>
              <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl">
                <MinusCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-600">{result.skipped}</p>
                <p className="text-sm text-muted-foreground">Skipped</p>
              </div>
            </div>

            {/* Time Taken */}
            <div className="text-center pt-2 text-muted-foreground">
              ⏱️ Completed in {formatTime(result.timeTaken)}
            </div>
          </CardContent>
        </Card>

        {/* Social Sharing */}
        <Card className="mb-6 border-violet-200 dark:border-violet-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Share2 className="h-5 w-5" />
              Share Your Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button 
                variant="outline" 
                onClick={shareToTwitter}
                className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
              >
                <Twitter className="h-4 w-4 text-blue-400" />
                Twitter
              </Button>
              <Button 
                variant="outline" 
                onClick={shareToFacebook}
                className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                Facebook
              </Button>
              <Button 
                variant="outline" 
                onClick={shareToLinkedIn}
                className="flex items-center gap-2 border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                LinkedIn
              </Button>
              <Button 
                variant="outline" 
                onClick={copyResults}
                className="flex items-center gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            className="flex-1"
            asChild
          >
            <Link to="/student/quizzes">
              View All Quizzes
            </Link>
          </Button>
          <Button 
            className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            asChild
          >
            <Link to="/student/tutors">
              Book a Tutor
            </Link>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
