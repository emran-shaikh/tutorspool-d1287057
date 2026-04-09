import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, X, Plus, User, ShieldCheck } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { StudentProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const GRADE_LEVELS = [
  "Elementary School", "Middle School", "High School",
  "Undergraduate", "Graduate", "Professional", "Other"
];

const POPULAR_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "History", "Computer Science", "Economics", "Languages", "Music", "Arts"
];

export default function AdminEditStudent() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentlyStudying, setCurrentlyStudying] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (uid) fetchData();
  }, [uid]);

  const fetchData = async () => {
    if (!uid) return;
    try {
      const [userDoc, profileDoc] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getDoc(doc(db, 'studentProfiles', uid))
      ]);

      if (userDoc.exists()) {
        const u = userDoc.data();
        setFullName(u.fullName || "");
        setEmail(u.email || "");
        setIsActive(u.isActive !== false);
        setCreatedAt(u.createdAt || "");
      }

      if (profileDoc.exists()) {
        const p = profileDoc.data() as StudentProfile;
        setFullName(p.fullName || fullName);
        setEmail(p.email || email);
        setCurrentlyStudying(p.currentlyStudying || "");
        setGradeLevel(p.gradeLevel || "");
        setLearningGoals(p.learningGoals || "");
        setInterests(p.interests || []);
        setPreferredSubjects(p.preferredSubjects || []);
        setCreatedAt(p.createdAt || createdAt);
      }
    } catch (error) {
      console.error("Error fetching student data:", error);
      toast({ title: "Error", description: "Failed to load student data", variant: "destructive" });
    }
    setLoading(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !interests.includes(newInterest.trim())) {
      setInterests([...interests, newInterest.trim()]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest));
  };

  const toggleSubject = (subject: string) => {
    setPreferredSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      // Update student profile
      const profileData: StudentProfile = {
        uid,
        fullName,
        email,
        createdAt: createdAt || new Date().toISOString(),
        currentlyStudying,
        gradeLevel,
        learningGoals,
        interests,
        preferredSubjects
      };

      await setDoc(doc(db, 'studentProfiles', uid), profileData, { merge: true });

      // Update users collection
      try {
        await updateDoc(doc(db, 'users', uid), { fullName, email, isActive });
      } catch (e) {
        console.warn("Could not update users doc:", e);
      }

      toast({ title: "Student updated!", description: `${fullName}'s profile has been saved.` });
      navigate('/admin/users');
    } catch (error) {
      console.error("Error saving student:", error);
      toast({ title: "Error", description: "Failed to save student profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-purple-600/15 via-violet-500/15 to-indigo-500/15 border-2 border-purple-300/50 dark:border-purple-700/50 shadow-lg shadow-purple-500/5">
        <Link to="/admin/users" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Manage Users
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Edit Student Profile</h1>
        <p className="text-muted-foreground">Admin editing for: {fullName}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-purple-100 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-purple-500 to-violet-500">
                  <User className="h-4 w-4 text-white" />
                </div>
                Student Information
              </CardTitle>
              <CardDescription>Edit all student profile fields</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Currently Studying</Label>
                  <Input value={currentlyStudying} onChange={(e) => setCurrentlyStudying(e.target.value)} placeholder="e.g., Computer Science" />
                </div>
                <div className="space-y-2">
                  <Label>Grade/Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Learning Goals</Label>
                <Textarea value={learningGoals} onChange={(e) => setLearningGoals(e.target.value)} rows={3} placeholder="Student's goals..." />
              </div>

              {/* Preferred Subjects */}
              <div className="space-y-2">
                <Label>Preferred Subjects</Label>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SUBJECTS.map((subject) => (
                    <Badge
                      key={subject}
                      variant={preferredSubjects.includes(subject) ? "default" : "outline"}
                      className="cursor-pointer transition-colors"
                      onClick={() => toggleSubject(subject)}
                    >
                      {subject}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Interests */}
              <div className="space-y-2">
                <Label>Interests & Hobbies</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {interests.map((interest) => (
                    <Badge key={interest} variant="secondary" className="gap-1">
                      {interest}
                      <button onClick={() => removeInterest(interest)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an interest..."
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addInterest())}
                  />
                  <Button type="button" variant="outline" onClick={addInterest}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/25">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Sidebar */}
          <Card className="border-purple-100 dark:border-purple-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-violet-500 to-purple-500">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                Admin Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-purple-50/50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Account Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isActive ? "Student can access platform" : "Student is suspended"}
                    </p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-1">UID</p>
                <p className="text-xs text-muted-foreground font-mono break-all">{uid}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-1">Registered</p>
                <p className="text-xs text-muted-foreground">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : "Unknown"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
