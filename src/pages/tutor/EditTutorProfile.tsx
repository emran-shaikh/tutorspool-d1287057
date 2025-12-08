import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Save, X, Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PhotoUpload } from "@/components/PhotoUpload";
import { getTutorProfile, createTutorProfile, TutorProfile } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function EditTutorProfile() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [photoURL, setPhotoURL] = useState<string>("");

  useEffect(() => {
    fetchProfile();
  }, [userProfile]);

  const fetchProfile = async () => {
    if (!userProfile?.uid) return;
    const data = await getTutorProfile(userProfile.uid);
    if (data) {
      setProfile(data);
      setBio(data.bio || "");
      setExperience(data.experience || "");
      setHourlyRate(data.hourlyRate || 0);
      setSubjects(data.subjects || []);
      setPhotoURL(data.photoURL || "");
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
    if (!userProfile?.uid) return;
    setSaving(true);
    
    try {
      const profileData: TutorProfile = {
        uid: userProfile.uid,
        fullName: userProfile.fullName,
        email: userProfile.email,
        bio,
        experience,
        hourlyRate,
        subjects,
        photoURL: photoURL || undefined,
        isApproved: profile?.isApproved || false,
        createdAt: profile?.createdAt || new Date().toISOString()
      };

      // Always use createTutorProfile which uses setDoc (creates or overwrites)
      await createTutorProfile(profileData);
      
      toast({ title: "Profile saved!", description: "Your tutor profile has been updated" });
      navigate('/tutor/dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6">
        <Link to="/tutor/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Edit Profile</h1>
        <p className="text-muted-foreground">Update your tutor profile to attract more students</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Information
              </CardTitle>
              <CardDescription>This information will be visible to students</CardDescription>
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

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell students about yourself, your teaching style, and qualifications..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="experience">Experience</Label>
                  <Input
                    id="experience"
                    placeholder="e.g., 5 years"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rate">Hourly Rate ($)</Label>
                  <Input
                    id="rate"
                    type="number"
                    min="0"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>

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

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Approval Status</p>
                <Badge variant={profile?.isApproved ? "default" : "secondary"}>
                  {profile?.isApproved ? "Approved" : "Pending Approval"}
                </Badge>
                {!profile?.isApproved && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your profile is pending admin approval. Students won't see you until approved.
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Display Name</p>
                <p className="text-sm text-muted-foreground">{userProfile?.fullName}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Email</p>
                <p className="text-sm text-muted-foreground">{userProfile?.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
