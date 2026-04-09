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
import { getTutorProfile, createTutorProfile, TutorProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const DEGREE_LEVELS = [
  "High School Diploma", "Associate Degree", "Bachelor's Degree",
  "Master's Degree", "Doctorate (PhD)", "Professional Degree", "Other"
];

export default function AdminEditTutor() {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [qualifications, setQualifications] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [majorSubjects, setMajorSubjects] = useState<string[]>([]);
  const [teachingStyle, setTeachingStyle] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  useEffect(() => {
    if (uid) fetchData();
  }, [uid]);

  const fetchData = async () => {
    if (!uid) return;
    try {
      // Fetch user doc and tutor profile in parallel
      const [userDoc, profile] = await Promise.all([
        getDoc(doc(db, 'users', uid)),
        getTutorProfile(uid)
      ]);

      if (userDoc.exists()) {
        const u = userDoc.data();
        setUserName(u.fullName || "");
        setUserEmail(u.email || "");
      }

      if (profile) {
        setFullName(profile.fullName);
        setEmail(profile.email);
        setBio(profile.bio || "");
        setExperience(profile.experience || "");
        setHourlyRate(profile.hourlyRate || 0);
        setSubjects(profile.subjects || []);
        setIsApproved(profile.isApproved);
        setQualifications(profile.qualifications || "");
        setDegreeLevel(profile.degreeLevel || "");
        setMajorSubjects(profile.majorSubjects || []);
        setTeachingStyle(profile.teachingStyle || "");
        setCreatedAt(profile.createdAt || "");
      } else {
        // Use data from users collection
        setFullName(userDoc.data()?.fullName || "");
        setEmail(userDoc.data()?.email || "");
        setCreatedAt(userDoc.data()?.createdAt || new Date().toISOString());
      }
    } catch (error) {
      console.error("Error fetching tutor data:", error);
      toast({ title: "Error", description: "Failed to load tutor data", variant: "destructive" });
    }
    setLoading(false);
  };

  const addSubject = () => {
    if (newSubject.trim() && !subjects.includes(newSubject.trim())) {
      setSubjects([...subjects, newSubject.trim()]);
      setNewSubject("");
    }
  };

  const removeSubject = (subject: string) => {
    setSubjects(subjects.filter(s => s !== subject));
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const profileData: TutorProfile = {
        uid,
        fullName,
        email,
        bio,
        experience,
        hourlyRate,
        subjects,
        isApproved,
        createdAt: createdAt || new Date().toISOString(),
        qualifications,
        degreeLevel,
        majorSubjects,
        teachingStyle
      };

      await createTutorProfile(profileData);

      // Also update users collection name/email if changed
      try {
        await updateDoc(doc(db, 'users', uid), { fullName, email });
      } catch (e) {
        console.warn("Could not update users doc:", e);
      }

      toast({ title: "Tutor updated!", description: `${fullName}'s profile has been saved.` });
      navigate('/admin/users');
    } catch (error) {
      console.error("Error saving tutor:", error);
      toast({ title: "Error", description: "Failed to save tutor profile", variant: "destructive" });
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
        <h1 className="font-display text-3xl font-bold mb-2">Edit Tutor Profile</h1>
        <p className="text-muted-foreground">Admin editing for: {userName || fullName}</p>
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
                Tutor Information
              </CardTitle>
              <CardDescription>Edit all tutor profile fields</CardDescription>
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

              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Tutor bio..." />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Experience</Label>
                  <Input value={experience} onChange={(e) => setExperience(e.target.value)} placeholder="e.g., 5 years" />
                </div>
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                </div>
              </div>

              {/* Subjects */}
              <div className="space-y-2">
                <Label>Subjects</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {subjects.map((subject) => (
                    <Badge key={subject} variant="secondary" className="gap-1">
                      {subject}
                      <button onClick={() => removeSubject(subject)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a subject..."
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubject())}
                  />
                  <Button type="button" variant="outline" onClick={addSubject}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Additional fields */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Degree Level</Label>
                  <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                    <SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>
                      {DEGREE_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Qualifications</Label>
                  <Input value={qualifications} onChange={(e) => setQualifications(e.target.value)} placeholder="e.g., PhD in Math" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Teaching Style</Label>
                <Textarea value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)} rows={2} placeholder="Teaching methodology..." />
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
                    <p className="text-sm font-medium">Approval Status</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {isApproved ? "Tutor is visible to students" : "Tutor is hidden from students"}
                    </p>
                  </div>
                  <Switch checked={isApproved} onCheckedChange={setIsApproved} />
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
