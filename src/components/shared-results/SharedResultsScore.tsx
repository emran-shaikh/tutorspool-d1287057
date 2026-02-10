import { Trophy, CheckCircle, XCircle, MinusCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Quiz, QuizResult } from "@/lib/firestore";

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

interface Props {
  quiz: Quiz;
  result: QuizResult;
}

export default function SharedResultsScore({ quiz, result }: Props) {
  const performance = getPerformanceMessage(result.accuracy);

  return (
    <>
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

          <div className="space-y-1">
            <Progress value={result.accuracy} className="h-2 bg-white/10" />
          </div>

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
    </>
  );
}
