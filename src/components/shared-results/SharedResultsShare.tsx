import { Share2, Twitter, Facebook, Linkedin, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Quiz, QuizResult } from "@/lib/firestore";

interface Props {
  quiz: Quiz;
  result: QuizResult;
  shareUrl: string;
}

export default function SharedResultsShare({ quiz, result, shareUrl }: Props) {
  const shareToTwitter = () => {
    const text = `🎉 I scored ${result.accuracy}% on the "${quiz.topic}" quiz on TutorsPool! ${result.correctAnswers}/${result.totalQuestions} correct. Challenge yourself →`;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`I scored ${result.accuracy}% on the "${quiz.topic}" quiz on TutorsPool!`)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const shareToLinkedIn = () => {
    const text = `I just completed the "${quiz.topic}" quiz on TutorsPool and scored ${result.accuracy}%! Continuous learning is the key to success.`;
    window.open(
      `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(`Quiz Completed: ${quiz.topic}`)}&summary=${encodeURIComponent(text)}`,
      "_blank",
      "width=600,height=400"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
  };

  return (
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
  );
}
