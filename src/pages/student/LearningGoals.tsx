import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Target, Plus, Trash2, Edit2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getStudentGoals, createLearningGoal, updateLearningGoal, deleteLearningGoal, LearningGoal } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { awardXP } from "@/lib/gamification";
import { showXPNotification, showBadgeNotification } from "@/components/gamification/XPNotification";

export default function LearningGoals() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchGoals();
  }, [userProfile]);

  const fetchGoals = async () => {
    if (!userProfile?.uid) return;
    const data = await getStudentGoals(userProfile.uid);
    setGoals(data);
    setLoading(false);
  };

  const resetForm = () => {
    setTitle("");
    setSubject("");
    setProgress(0);
    setEditingGoal(null);
  };

  const handleOpenDialog = (goal?: LearningGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setTitle(goal.title);
      setSubject(goal.subject);
      setProgress(goal.progress);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid || !title || !subject) return;

    try {
      if (editingGoal?.id) {
        await updateLearningGoal(editingGoal.id, { title, subject, progress });
        toast({ title: "Goal updated!" });
      } else {
        await createLearningGoal({
          studentId: userProfile.uid,
          title,
          subject,
          progress: 0,
          createdAt: new Date().toISOString()
        });
        toast({ title: "Goal created!" });
      }
      setDialogOpen(false);
      resetForm();
      fetchGoals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save goal", variant: "destructive" });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteLearningGoal(goalId);
      toast({ title: "Goal deleted" });
      fetchGoals();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete goal", variant: "destructive" });
    }
  };

  const handleProgressUpdate = async (goal: LearningGoal, newProgress: number) => {
    if (!goal.id || !userProfile?.uid) return;
    try {
      await updateLearningGoal(goal.id, { progress: newProgress });
      // Award XP when goal reaches 100%
      if (newProgress === 100 && goal.progress < 100) {
        try {
          const result = await awardXP(userProfile.uid, 'goal_achieved', 100, `Goal achieved: ${goal.title}`, { goalsCompleted: 1 });
          showXPNotification(100, `Goal achieved: ${goal.title}`);
          result.badgesEarned.forEach(b => showBadgeNotification(b));
        } catch (e) {
          console.error('Gamification error:', e);
        }
      }
      fetchGoals();
    } catch (error) {
      console.error('Failed to update progress');
    }
  };

  return (
    <DashboardLayout role="student">
      {/* Student Learning Goals Header - Blue/Cyan Theme */}
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-sky-500/15 border-2 border-blue-300/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/5">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <Link to="/student/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl font-bold mb-2">Learning Goals</h1>
            <p className="text-muted-foreground">Track your progress and achieve your learning objectives</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                <Plus className="h-4 w-4 mr-2" /> Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>{editingGoal ? "Edit Goal" : "Add New Goal"}</DialogTitle>
                  <DialogDescription>
                    {editingGoal ? "Update your learning goal" : "Set a new learning objective to track"}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Master Calculus"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="e.g., Mathematics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                    />
                  </div>
                  {editingGoal && (
                    <div className="space-y-2">
                      <Label htmlFor="progress">Progress ({progress}%)</Label>
                      <Input
                        id="progress"
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => setProgress(Number(e.target.value))}
                        className="cursor-pointer"
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingGoal ? "Update" : "Create"} Goal
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : goals.length === 0 ? (
        <Card className="border-blue-100 dark:border-blue-900">
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-blue-400 mb-4" />
            <p className="text-muted-foreground mb-4">No learning goals yet</p>
            <Button onClick={() => handleOpenDialog()} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
              <Plus className="h-4 w-4 mr-2" /> Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {goals.map((goal) => (
            <Card key={goal.id} className="h-full border-blue-100 dark:border-blue-900">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription>{goal.subject}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(goal)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => goal.id && handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span className="font-medium">{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="flex gap-2 mt-4">
                    {[25, 50, 75, 100].map((val) => (
                      <Button
                        key={val}
                        variant={goal.progress >= val ? "default" : "outline"}
                        size="sm"
                        className="flex-1"
                        onClick={() => handleProgressUpdate(goal, val)}
                      >
                        {val}%
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
