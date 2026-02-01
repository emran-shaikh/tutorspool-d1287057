import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, User, Save, X, Plus, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PhotoUpload } from "@/components/PhotoUpload";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentProfile } from "@/lib/firestore";

const GRADE_LEVELS = [
  "Elementary School",
  "Middle School",
  "High School",
  "Undergraduate",
  "Graduate",
  "Professional",
  "Other"
];

const POPULAR_SUBJECTS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "History",
  "Computer Science",
  "Economics",
  "Languages",
  "Music",
  "Arts"
];

export default function EditStudentProfile() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  
  const [photoURL, setPhotoURL] = useState<string>("");
  const [currentlyStudying, setCurrentlyStudying] = useState("");
  const [gradeLevel, setGradeLevel] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [preferredSubjects, setPreferredSubjects] = useState<string[]>([]);
  const [newInterest, setNewInterest] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userProfile]);

  const fetchProfile = async () => {
    if (!userProfile?.uid) return;
    try {
      const docRef = doc(db, 'studentProfiles', userProfile.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as StudentProfile;
        setProfile(data);
        setPhotoURL(data.photoURL || "");
        setCurrentlyStudying(data.currentlyStudying || "");
        setGradeLevel(data.gradeLevel || "");
        setLearningGoals(data.learningGoals || "");
        setInterests(data.interests || []);
        setPreferredSubjects(data.preferredSubjects || []);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
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
    if (preferredSubjects.includes(subject)) {
      setPreferredSubjects(preferredSubjects.filter(s => s !== subject));
    } else {
      setPreferredSubjects([...preferredSubjects, subject]);
    }
  };

  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    
    try {
      const profileData: StudentProfile = {
        uid: userProfile.uid,
        fullName: userProfile.fullName,
        email: userProfile.email,
        photoURL: photoURL || undefined,
        createdAt: profile?.createdAt || new Date().toISOString(),
        currentlyStudying,
        gradeLevel,
        learningGoals,
        interests,
        preferredSubjects
      };

      await setDoc(doc(db, 'studentProfiles', userProfile.uid), profileData, { merge: true });
      
      toast({ title: "Profile saved!", description: "Your profile has been updated" });
      navigate('/student/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="student">
      {/* Student Profile Header - Blue/Cyan Theme */}
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-blue-600/15 via-cyan-500/15 to-sky-500/15 border-2 border-blue-300/50 dark:border-blue-700/50 shadow-lg shadow-blue-500/5">
        <Link to="/student/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Tell us about yourself to get personalized recommendations</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-blue-500 to-cyan-500">
                  <User className="h-4 w-4 text-white" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription>All fields are optional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload */}
              <div className="flex justify-center pb-4 border-b border-border">
                <PhotoUpload
                  currentPhotoURL={photoURL}
                  fullName={userProfile?.fullName || ""}
                  onPhotoChange={setPhotoURL}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studying">Currently Studying</Label>
                  <Input
                    id="studying"
                    placeholder="e.g., Computer Science, Pre-Med"
                    value={currentlyStudying}
                    onChange={(e) => setCurrentlyStudying(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grade">Grade/Level</Label>
                  <Select value={gradeLevel} onValueChange={setGradeLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your level" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goals">Learning Goals & Objectives</Label>
                <Textarea
                  id="goals"
                  placeholder="What do you want to achieve? What are your academic or career goals?"
                  value={learningGoals}
                  onChange={(e) => setLearningGoals(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Subjects You Want to Learn</Label>
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

              <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg shadow-blue-500/25">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-cyan-500 to-blue-500">
                  <GraduationCap className="h-4 w-4 text-white" />
                </div>
                Your Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                <p className="text-sm font-medium mb-1">Name</p>
                <p className="text-sm text-muted-foreground">{userProfile?.fullName}</p>
              </div>
              <div className="p-4 rounded-lg bg-blue-50/50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium mb-1 text-blue-600 dark:text-blue-400">Tip</p>
                <p className="text-xs text-muted-foreground">
                  Complete your profile to get better tutor recommendations based on your goals.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}