import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, BookOpen, Brain, Lightbulb, Pencil } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { createQuiz, Quiz, Flashcard, QuizQuestion } from "@/lib/firestore";
import FlashcardEditor from "@/components/quiz/FlashcardEditor";
import QuestionEditor from "@/components/quiz/QuestionEditor";

const SUBJECTS = [
  "Physics", "Chemistry", "Biology", "Mathematics", "Computer Science",
  "Economics", "Accounting", "Business Studies", "English Literature",
  "History", "Geography", "Psychology"
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
          body: JSON.stringify({ subject, topic, targetLevel, numFlashcards, numQuestions }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const data = await response.json();
      setGeneratedContent({ flashcards: data.flashcards, questions: data.questions });
      toast.success("Content generated! Review and edit before saving.");
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
      {/* Header */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-purple-600/15 via-violet-500/15 to-fuchsia-500/15 border-2 border-purple-300/50 dark:border-purple-700/50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 shadow-lg shadow-purple-500/30">
            <Brain className="h-7 w-7 text-white" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              SmartGen™ by TutorsPool
            </span>
            <h1 className="font-display text-3xl font-bold">Create Interactive Quiz</h1>
          </div>
        </div>
        <p className="text-muted-foreground ml-14">
          Generate smart flashcards and quiz questions, then review and customize before saving.
        </p>
      </div>

      {/* Settings + Generate */}
      <Card className="border-purple-100 dark:border-purple-900 mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-purple-500" />
            Quiz Settings
          </CardTitle>
          <CardDescription>Configure your quiz, then generate content with SmartGen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Topic</Label>
              <Input
                placeholder="e.g., Velocity, Photosynthesis"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Target Level</Label>
              <Select value={targetLevel} onValueChange={(v) => setTargetLevel(v as "school" | "college")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="school">School (O/A Level)</SelectItem>
                  <SelectItem value="college">College/University</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Flashcards</Label>
              <Select value={numFlashcards.toString()} onValueChange={(v) => setNumFlashcards(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 flashcards</SelectItem>
                  <SelectItem value="10">10 flashcards</SelectItem>
                  <SelectItem value="15">15 flashcards</SelectItem>
                  <SelectItem value="20">20 flashcards</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Number of Questions</Label>
              <Select value={numQuestions.toString()} onValueChange={(v) => setNumQuestions(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 questions</SelectItem>
                  <SelectItem value="25">25 questions</SelectItem>
                  <SelectItem value="50">50 questions</SelectItem>
                  <SelectItem value="75">75 questions</SelectItem>
                  <SelectItem value="100">100 questions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !subject || !topic}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700"
              >
                {isGenerating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> Generate with SmartGen</>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content - Editable */}
      {isGenerating && (
        <Card className="border-purple-100 dark:border-purple-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-purple-500 animate-bounce" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">SmartGen is creating your quiz content...</p>
              <p className="text-xs text-muted-foreground">This may take 30-60 seconds</p>
            </div>
          </CardContent>
        </Card>
      )}

      {generatedContent && !isGenerating && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-purple-500" />
              <h2 className="text-lg font-semibold">Review & Edit Content</h2>
              <span className="text-xs text-muted-foreground">(hover over items to edit or remove)</span>
            </div>
            <Button
              onClick={handleSaveQuiz}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Save Quiz & Continue
            </Button>
          </div>

          <Tabs defaultValue="flashcards" className="space-y-4">
            <TabsList>
              <TabsTrigger value="flashcards" className="gap-2">
                <BookOpen className="h-4 w-4" />
                Flashcards ({generatedContent.flashcards.length})
              </TabsTrigger>
              <TabsTrigger value="questions" className="gap-2">
                <Brain className="h-4 w-4" />
                Questions ({generatedContent.questions.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="flashcards">
              <FlashcardEditor
                flashcards={generatedContent.flashcards}
                onChange={(flashcards) => setGeneratedContent(prev => prev ? { ...prev, flashcards } : null)}
              />
            </TabsContent>

            <TabsContent value="questions">
              <Card>
                <CardHeader>
                  <CardTitle>Quiz Questions</CardTitle>
                  <CardDescription>
                    {generatedContent.questions.filter(q => q.type === "mcq").length} MCQs,{" "}
                    {generatedContent.questions.filter(q => q.type === "conceptual").length} Conceptual,{" "}
                    {generatedContent.questions.filter(q => q.type === "numerical").length} Numerical
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuestionEditor
                    questions={generatedContent.questions}
                    onChange={(questions) => setGeneratedContent(prev => prev ? { ...prev, questions } : null)}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveQuiz}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              Save Quiz & Continue
            </Button>
          </div>
        </>
      )}

      {!generatedContent && !isGenerating && (
        <Card className="border-purple-100 dark:border-purple-900">
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-full mb-4">
                <Brain className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a subject and topic, then click "Generate with SmartGen" to create educational content.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
