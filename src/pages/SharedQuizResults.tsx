import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { getQuizById, Quiz, QuizResult } from "@/lib/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import SharedResultsHeader from "@/components/shared-results/SharedResultsHeader";
import SharedResultsScore from "@/components/shared-results/SharedResultsScore";
import SharedResultsShare from "@/components/shared-results/SharedResultsShare";
import SharedResultsCTA from "@/components/shared-results/SharedResultsCTA";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const ogImageUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/og-quiz-result?resultId=${resultId}`;

  const ogTitle = result && quiz
    ? `${result.studentName} scored ${result.accuracy}% on ${quiz.topic} | TutorsPool`
    : "Quiz Results | TutorsPool";

  const ogDescription = result && quiz
    ? `${result.correctAnswers}/${result.totalQuestions} correct on the "${quiz.topic}" quiz in ${quiz.subject}. Challenge yourself on TutorsPool!`
    : "Check out this quiz result on TutorsPool – Transform Your Learning Journey.";

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

  return (
    <>
      <Helmet>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImageUrl} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/svg+xml" />
        <meta property="og:site_name" content="TutorsPool" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@tutorspool" />
        <meta name="twitter:title" content={ogTitle} />
        <meta name="twitter:description" content={ogDescription} />
        <meta name="twitter:image" content={ogImageUrl} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-950">
        <SharedResultsHeader />
        <main className="container mx-auto px-4 py-8 max-w-lg">
          <SharedResultsScore quiz={quiz} result={result} />
          <SharedResultsShare
            quiz={quiz}
            result={result}
            shareUrl={shareUrl}
          />
          <SharedResultsCTA quizId={quiz.id} quizTopic={quiz.topic} />
          <div className="text-center mt-8 pb-8">
            <p className="text-white/30 text-xs">
              Powered by <span className="font-semibold text-white/50">TutorsPool</span> · SmartGen™ Learning
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
