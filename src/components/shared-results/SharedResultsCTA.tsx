import { Link } from "react-router-dom";
import { GraduationCap, ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SharedResultsCTAProps {
  quizId?: string;
  quizTopic?: string;
}

export default function SharedResultsCTA({ quizId, quizTopic }: SharedResultsCTAProps) {
  return (
    <div className="space-y-4">
      {quizId && (
        <Card className="bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 border-white/10 backdrop-blur-sm text-white">
          <CardContent className="p-6 text-center space-y-3">
            <PlayCircle className="h-8 w-8 text-fuchsia-300 mx-auto" />
            <div>
              <h3 className="text-lg font-bold mb-1">Think you can do better?</h3>
              <p className="text-white/60 text-sm">
                Challenge yourself with the{quizTopic ? ` "${quizTopic}"` : ""} quiz and see how you score!
              </p>
            </div>
            <Button asChild className="w-full bg-gradient-to-r from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600 text-white font-semibold">
              <Link to={`/register?redirect=/student/quiz/${quizId}`}>
                Try This Quiz <PlayCircle className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
      <Card className="bg-gradient-to-r from-violet-600/30 to-fuchsia-600/30 border-white/10 backdrop-blur-sm text-white">
        <CardContent className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-fuchsia-500 rounded-full flex items-center justify-center mx-auto">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold mb-1">Want to ace your exams too?</h3>
            <p className="text-white/60 text-sm">
              Join TutorsPool and get access to expert tutors, interactive quizzes, and personalized learning paths.
            </p>
          </div>
          <Button asChild className="w-full bg-white text-violet-900 hover:bg-white/90 font-semibold">
            <Link to="/register">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
