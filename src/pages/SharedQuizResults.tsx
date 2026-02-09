import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { 
  Trophy, 
  CheckCircle, 
  XCircle, 
  MinusCircle,
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Loader2,
  Sparkles,
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { getQuizById, Quiz, QuizResult } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const getPerformanceMessage = (accuracy: number) => {
  if (accuracy >= 90) return { message: "Outstanding! A true master! 🏆", color: "text-yellow-300" };
  if (accuracy >= 75) return { message: "Great job! Impressive work! 🌟", color: "text-green-300" };
  if (accuracy >= 60) return { message: "Good effort! Solid performance 💪", color: "text-blue-300" };
  if (accuracy >= 40) return { message: "Making progress! Keep going 📚", color: "text-orange-300" };
  return { message: "Every attempt is a step forward 📖", color: "text-red-300" };
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

export default function SharedQuizResults() {
  const { resultId } = useParams<{ resultId: string }>();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resultId) fetchData();
  }, [resultId]);

  const fetchData = async () => {
    if (!resultId) return;
    setLoading(true);
    try {
      const resultDoc = await getDoc(doc(db, "quizResults", resultId));
      if (resultDoc.exists()) {
        const resultData = { ...resultDoc.data(), id: resultDoc.id } as QuizResult;
        setResult(resultData);
        const quizData = await getQuizById(resultData.quizId);
        setQuiz(quizData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = `${window.location.origin}/results/${resultId}`;

  const shareToTwitter = () => {
    if (!result || !quiz) return;
    const text = `🎉 I scored ${result.accuracy}% on the "${quiz.topic}" quiz on TutorsPool! ${result.correctAnswers}/${result.totalQuestions} correct. Challenge yourself →`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`, "_blank", "width=600,height=400");
  };

  const shareToFacebook = () => {
    if (!result || !quiz) return;
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`I scored ${result.accuracy}% on the "${quiz.topic}" quiz on TutorsPool!`)}`, "_blank", "width=600,height=400");
  };

  const shareToLinkedIn = () => {
    if (!result || !quiz) return;
    const text = `I just completed the "${quiz.topic}" quiz on TutorsPool and scored ${result.accuracy}%! Continuous learning is the key to success.`;
    window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Quiz Completed: ${quiz.topic}`)}&summary=${encodeURIComponent(text)}`, "_blank", "width=600,height=400");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-white/60" />
      </div>
    );
  }

  if (!quiz || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <p className="text-xl text-white/70">Results not found or have expired.</p>
          <Button asChild variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <Link to="/">Go to TutorsPool</Link>
          </Button>
        </div>
      </div>
    );
  }

  const performance = getPerformanceMessage(result.accuracy);

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950">
      {/* TutorsPool Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">TutorsPool</span>
          </Link>
          <Button asChild size="sm" className="bg-white/10 hover:bg-white/20 text-white border border-white/20">
            <Link to="/register">Join Free</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-lg">
        {/* Trophy Section */}
        <div className="text-center mb-8 pt-4">
          <div className="relative inline-block">
            <div className="absolute -inset-4 opacity-20">
              <Sparkles className="absolute top-0 left-0 h-6 w-6 text-yellow-300 animate-pulse" />
              <Sparkles className="absolute top-2 right-0 h-5 w-5 text-yellow-300 animate-pulse delay-150" />
              <Sparkles className="absolute bottom-0 left-2 h-4 w-4 text-yellow-300 animate-pulse delay-300" />
            </div>
            <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/30">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mt-6 mb-1">Quiz Complete!</h1>
          <p className={`text-lg ${performance.color}`}>{performance.message}</p>
          <p className="text-white/50 text-sm mt-2">
            {result.studentName} completed this quiz
          </p>
        </div>

        {/* Score Card */}
        <Card className="mb-6 bg-white/10 border-white/10 backdrop-blur-sm text-white">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-base text-white/60">
              {quiz.subject} · {quiz.topic}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Big Score */}
            <div className="text-center">
              <div className="text-7xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  {result.accuracy}%
                </span>
              </div>
              <p className="text-white/50 mt-1">
                {result.correctAnswers}/{result.totalQuestions} Questions Correct
              </p>
            </div>

            {/* Progress */}
            <div className="space-y-1">
              <Progress value={result.accuracy} className="h-2 bg-white/10" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-green-500/10 rounded-xl border border-green-500/20">
                <CheckCircle className="h-6 w-6 text-green-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-green-400">{result.correctAnswers}</p>
                <p className="text-xs text-white/50">Right</p>
              </div>
              <div className="text-center p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                <XCircle className="h-6 w-6 text-red-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-red-400">{result.wrongAnswers}</p>
                <p className="text-xs text-white/50">Wrong</p>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl border border-white/10">
                <MinusCircle className="h-6 w-6 text-white/40 mx-auto mb-1" />
                <p className="text-xl font-bold text-white/60">{result.skipped}</p>
                <p className="text-xs text-white/50">Skipped</p>
              </div>
            </div>

            <p className="text-center text-white/40 text-sm">
              ⏱️ Completed in {formatTime(result.timeTaken)}
            </p>
          </CardContent>
        </Card>

        {/* Share Buttons */}
        <Card className="mb-6 bg-white/10 border-white/10 backdrop-blur-sm text-white">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Share2 className="h-4 w-4" /> Share Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button size="sm" variant="outline" onClick={shareToTwitter} className="border-white/20 text-white hover:bg-white/10">
                <Twitter className="h-4 w-4 mr-1" /> Twitter
              </Button>
              <Button size="sm" variant="outline" onClick={shareToFacebook} className="border-white/20 text-white hover:bg-white/10">
                <Facebook className="h-4 w-4 mr-1" /> Facebook
              </Button>
              <Button size="sm" variant="outline" onClick={shareToLinkedIn} className="border-white/20 text-white hover:bg-white/10">
                <Linkedin className="h-4 w-4 mr-1" /> LinkedIn
              </Button>
              <Button size="sm" variant="outline" onClick={copyLink} className="border-white/20 text-white hover:bg-white/10">
                <Copy className="h-4 w-4 mr-1" /> Copy
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <Card className="bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border-white/10 backdrop-blur-sm text-white">
          <CardContent className="p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold mb-1">Want to ace your exams too?</h3>
              <p className="text-white/60 text-sm">Join TutorsPool and get access to expert tutors, interactive quizzes, and personalized learning paths.</p>
            </div>
            <Button asChild className="w-full bg-white text-violet-900 hover:bg-white/90 font-semibold">
              <Link to="/register">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Footer branding */}
        <div className="text-center mt-8 pb-8">
          <p className="text-white/30 text-xs">
            Powered by <span className="font-semibold text-white/50">TutorsPool</span> · SmartGen™ Learning
          </p>
        </div>
      </main>
    </div>
  );
}
