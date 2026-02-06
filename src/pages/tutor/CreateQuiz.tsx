import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Sparkles, BookOpen, Brain, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createQuiz, Quiz, Flashcard, QuizQuestion } from "@/lib/firestore";
import { supabase } from "@/integrations/supabase/client";

const SUBJECTS = [
  "Physics",
  "Chemistry", 
  "Biology",
  "Mathematics",
  "Computer Science",
  "Economics",
  "Accounting",
  "Business Studies",
  "English Literature",
  "History",
  "Geography",
  "Psychology"
];

export default function CreateQuiz() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [targetLevel, setTargetLevel] = useState<"school" | "college">("school");
  const [numFlashcards, setNumFlashcards] = useState(10);
  const [numQuestions, setNumQuestions] = useState(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<{
    flashcards: Flashcard[];
    questions: QuizQuestion[];
  } | null>(null);

  const handleGenerate = async () => {
    if (!subject || !topic) {
      toast.error("Please select a subject and enter a topic");
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-quiz`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            subject,
            topic,
            targetLevel,
            numFlashcards,
            numQuestions,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setGeneratedContent({
        flashcards: data.flashcards,
        questions: data.questions,
      });
      toast.success("Quiz generated successfully!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      toast.error(error instanceof Error ? error.message : "Failed to generate quiz");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveQuiz = async () => {
    if (!generatedContent || !userProfile) return;

    try {
      const quizData: Omit<Quiz, "id"> = {
        tutorId: userProfile.uid,
        tutorName: userProfile.fullName,
        subject,
        topic,
        targetLevel,
        flashcards: generatedContent.flashcards,
        questions: generatedContent.questions,
        isPublished: false,
        createdAt: new Date().toISOString(),
      };

      const quizId = await createQuiz(quizData);
      toast.success("Quiz saved successfully!");
      navigate(`/tutor/quizzes/${quizId}`);
    } catch (error) {
      console.error("Error saving quiz:", error);
      toast.error("Failed to save quiz");
    }
  };

  return (
    <DashboardLayout role="tutor">
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-600/15 via-violet-500/15 to-fuchsia-500/15 border-2 border-purple-300/50 dark:border-purple-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              AI Quiz Generator
            </span>
            <h1 className="font-display text-3xl font-bold">Create Interactive Quiz</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14">
          Generate AI-powered flashcards and quiz questions for your students.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card className="border-purple-100 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-purple-500" />
              Quiz Settings
            </CardTitle>
            <CardDescription>
              Enter the subject and topic to generate educational content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Velocity, Photosynthesis, Quadratic Equations"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Target Level</Label>
              <Select value={targetLevel} onValueChange={(v) => setTargetLevel(v as "school" | "college")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School (O/A Level)</SelectItem>
                  <SelectItem value="college">College/University</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numFlashcards">Number of Flashcards</Label>
                <Select value={numFlashcards.toString()} onValueChange={(v) => setNumFlashcards(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 flashcards</SelectItem>
                    <SelectItem value="10">10 flashcards</SelectItem>
                    <SelectItem value="15">15 flashcards</SelectItem>
                    <SelectItem value="20">20 flashcards</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numQuestions">Number of Questions</Label>
                <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 questions</SelectItem>
                    <SelectItem value="25">25 questions</SelectItem>
                    <SelectItem value="50">50 questions</SelectItem>
                    <SelectItem value="75">75 questions</SelectItem>
                    <SelectItem value="100">100 questions</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !subject || !topic}
              className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating with AI...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Quiz
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card className="border-purple-100 dark:border-purple-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              Generated Content Preview
            </CardTitle>
            <CardDescription>
              Review the AI-generated content before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-purple-500 animate-bounce" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  AI is creating your quiz content...
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take 30-60 seconds
                </p>
              </div>
            ) : generatedContent ? (
              <div className="space-y-4">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Flashcards</span>
                    <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">
                      {generatedContent.flashcards.length}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Visual learning cards with hints
                  </p>
                </div>

                <div className="p-4 bg-violet-50 dark:bg-violet-950/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Quiz Questions</span>
                    <span className="text-sm text-violet-600 dark:text-violet-400 font-semibold">
                      {generatedContent.questions.length}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">
                      {generatedContent.questions.filter(q => q.type === 'mcq').length} MCQs
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">
                      {generatedContent.questions.filter(q => q.type === 'conceptual').length} Conceptual
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">
                      {generatedContent.questions.filter(q => q.type === 'numerical').length} Numerical
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-2">Sample Flashcard</h4>
                  <div className="p-3 border rounded-lg bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
                    <p className="font-semibold text-purple-700 dark:text-purple-300">
                      {generatedContent.flashcards[0]?.conceptTitle}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {generatedContent.flashcards[0]?.explanation}
                    </p>
                  </div>
                </div>

                <Button
                  onClick={handleSaveQuiz}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  Save Quiz & Continue
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-full mb-4">
                  <Brain className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter a subject and topic, then click "Generate Quiz" to create
                  AI-powered educational content.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
