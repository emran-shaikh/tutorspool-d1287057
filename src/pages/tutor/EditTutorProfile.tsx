import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Save, X, Plus, GraduationCap, Pencil, Check } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { PhotoUpload } from "@/components/PhotoUpload";
import { getTutorProfile, createTutorProfile, TutorProfile } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const DEGREE_LEVELS = [
  "High School Diploma",
  "Associate Degree",
  "Bachelor's Degree",
  "Master's Degree",
  "Doctorate (PhD)",
  "Professional Degree",
  "Other"
];

const POPULAR_SUBJECTS = [
  "Mathematics", "Physics", "Chemistry", "Biology", "English",
  "History", "Computer Science", "Economics", "Languages", "Music", "Arts"
];

type EditableField = 'bio' | 'experience' | 'hourlyRate' | 'subjects' | 'photo' | 'qualifications' | 'degreeLevel' | 'majorSubjects' | 'teachingStyle' | null;

export default function EditTutorProfile() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const isIncompleteRedirect = location.state?.incomplete === true;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TutorProfile | null>(null);
  const [editingField, setEditingField] = useState<EditableField>(null);
  const [isNewProfile, setIsNewProfile] = useState(false);

  // Show toast if redirected due to incomplete profile
  useEffect(() => {
    if (isIncompleteRedirect) {
      toast({
        title: "Complete Your Profile",
        description: "Your account has been approved! Please fill in your profile details to start accepting students.",
        duration: 8000,
      });
    }
  }, [isIncompleteRedirect]);

  // Edit state
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [hourlyRate, setHourlyRate] = useState(0);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [qualifications, setQualifications] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [majorSubjects, setMajorSubjects] = useState<string[]>([]);
  const [teachingStyle, setTeachingStyle] = useState("");

  useEffect(() => {
    fetchProfile();
  }, [userProfile]);

  const fetchProfile = async () => {
    if (!userProfile?.uid) return;
    const data = await getTutorProfile(userProfile.uid);
    if (data) {
      setProfile(data);
      loadFromProfile(data);
      setIsNewProfile(false);
    } else {
      setIsNewProfile(true);
    }
    setLoading(false);
  };

  const loadFromProfile = (data: TutorProfile) => {
    setBio(data.bio || "");
    setExperience(data.experience || "");
    setHourlyRate(data.hourlyRate || 0);
    setSubjects(data.subjects || []);
    setPhotoURL(data.photoURL || "");
    setQualifications(data.qualifications || "");
    setDegreeLevel(data.degreeLevel || "");
    setMajorSubjects(data.majorSubjects || []);
    setTeachingStyle(data.teachingStyle || "");
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

  const toggleMajorSubject = (subject: string) => {
    setMajorSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const cancelEdit = () => {
    if (profile) loadFromProfile(profile);
    setEditingField(null);
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
        createdAt: profile?.createdAt || new Date().toISOString(),
        qualifications,
        degreeLevel,
        majorSubjects,
        teachingStyle
      };

      await createTutorProfile(profileData);
      setProfile(profileData);
      setEditingField(null);
      setIsNewProfile(false);
      toast({ title: "Profile saved!", description: "Your tutor profile has been updated" });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({ title: "Error", description: "Failed to save profile. Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const FieldHeader = ({ label, field, children }: { label: string; field: EditableField; children?: React.ReactNode }) => (
    <div className="flex items-center justify-between mb-1">
      <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
      {!isNewProfile && editingField !== field && (
        <button onClick={() => setEditingField(field)} className="p-1 rounded-md hover:bg-accent transition-colors">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
      {editingField === field && (
        <div className="flex gap-1">
          <button onClick={cancelEdit} className="p-1 rounded-md hover:bg-destructive/10 transition-colors">
            <X className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>
      )}
      {children}
    </div>
  );

  const DisplayValue = ({ value, placeholder }: { value?: string; placeholder: string }) => (
    <p className={`text-sm ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}>
      {value || placeholder}
    </p>
  );

  // New profile = show full edit form
  const isEditing = (field: EditableField) => isNewProfile || editingField === field;

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-emerald-600/15 via-green-500/15 to-teal-500/15 border-2 border-emerald-300/50 dark:border-emerald-700/50 shadow-lg shadow-emerald-500/5">
        <Link to="/tutor/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">
          {isNewProfile ? "Complete Your Profile" : "My Profile"}
        </h1>
        <p className="text-muted-foreground">
          {isNewProfile ? "Fill in your details to get started" : "Click the pencil icon on any field to edit"}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-emerald-100 dark:border-emerald-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gradient-to-br from-emerald-500 to-green-500">
                  <User className="h-4 w-4 text-white" />
                </div>
                Profile Information
              </CardTitle>
              <CardDescription>
                {isNewProfile ? "All fields are optional — save anytime" : "Your profile is visible to students"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo */}
              <div className="flex justify-center pb-4 border-b border-border">
                {isEditing('photo') ? (
                  <PhotoUpload
                    currentPhotoURL={photoURL}
                    fullName={userProfile?.fullName || ""}
                    onPhotoChange={setPhotoURL}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 relative">
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                      <AvatarImage src={photoURL} alt={userProfile?.fullName} />
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                        {getInitials(userProfile?.fullName || "")}
                      </AvatarFallback>
                    </Avatar>
                    <button
                      onClick={() => setEditingField('photo')}
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-accent hover:bg-accent/80 shadow-md transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div>
                <FieldHeader label="Bio" field="bio" />
                {isEditing('bio') ? (
                  <Textarea
                    placeholder="Tell students about yourself and your teaching style..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                  />
                ) : (
                  <DisplayValue value={bio} placeholder="No bio added yet" />
                )}
              </div>

              {/* Experience & Rate */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <FieldHeader label="Experience" field="experience" />
                  {isEditing('experience') ? (
                    <Input placeholder="e.g., 5 years" value={experience} onChange={(e) => setExperience(e.target.value)} />
                  ) : (
                    <DisplayValue value={experience} placeholder="Not specified" />
                  )}
                </div>
                <div>
                  <FieldHeader label="Hourly Rate ($)" field="hourlyRate" />
                  {isEditing('hourlyRate') ? (
                    <Input type="number" min="0" value={hourlyRate} onChange={(e) => setHourlyRate(Number(e.target.value))} />
                  ) : (
                    <DisplayValue value={hourlyRate ? `$${hourlyRate}/hr` : undefined} placeholder="Not set" />
                  )}
                </div>
              </div>

              {/* Subjects */}
              <div>
                <FieldHeader label="Subjects You Teach" field="subjects" />
                {isEditing('subjects') ? (
                  <>
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
                  </>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {subjects.length > 0 ? (
                      subjects.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No subjects added</p>
                    )}
                  </div>
                )}
              </div>

              {/* Optional Fields */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <div className="p-1 rounded-md bg-gradient-to-br from-green-500 to-teal-500">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  Additional Information
                </h3>

                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <FieldHeader label="Degree Level" field="degreeLevel" />
                      {isEditing('degreeLevel') ? (
                        <Select value={degreeLevel} onValueChange={setDegreeLevel}>
                          <SelectTrigger><SelectValue placeholder="Select degree level" /></SelectTrigger>
                          <SelectContent>
                            {DEGREE_LEVELS.map((level) => (
                              <SelectItem key={level} value={level}>{level}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <DisplayValue value={degreeLevel} placeholder="Not specified" />
                      )}
                    </div>
                    <div>
                      <FieldHeader label="Qualifications" field="qualifications" />
                      {isEditing('qualifications') ? (
                        <Input placeholder="e.g., Certified Teacher, PhD in Math" value={qualifications} onChange={(e) => setQualifications(e.target.value)} />
                      ) : (
                        <DisplayValue value={qualifications} placeholder="Not specified" />
                      )}
                    </div>
                  </div>

                  <div>
                    <FieldHeader label="Major/Specialization Subjects" field="majorSubjects" />
                    {isEditing('majorSubjects') ? (
                      <div className="flex flex-wrap gap-2">
                        {POPULAR_SUBJECTS.map((subject) => (
                          <Badge
                            key={subject}
                            variant={majorSubjects.includes(subject) ? "default" : "outline"}
                            className="cursor-pointer transition-colors"
                            onClick={() => toggleMajorSubject(subject)}
                          >
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {majorSubjects.length > 0 ? (
                          majorSubjects.map((s) => <Badge key={s} variant="outline">{s}</Badge>)
                        ) : (
                          <p className="text-sm text-muted-foreground italic">None selected</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <FieldHeader label="Teaching Style" field="teachingStyle" />
                    {isEditing('teachingStyle') ? (
                      <Textarea placeholder="Describe your teaching methodology..." value={teachingStyle} onChange={(e) => setTeachingStyle(e.target.value)} rows={2} />
                    ) : (
                      <DisplayValue value={teachingStyle} placeholder="Not described" />
                    )}
                  </div>
                </div>
              </div>

              {/* Save button - show when any field is being edited or new profile */}
              {(isNewProfile || editingField !== null) && (
                <Button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/25">
                  <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Profile"}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <Card className="border-emerald-100 dark:border-emerald-900">
            <CardHeader>
              <CardTitle>Profile Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <p className="text-sm font-medium mb-1">Approval Status</p>
                <Badge variant={profile?.isApproved ? "default" : "secondary"} className={profile?.isApproved ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white border-0" : ""}>
                  {profile?.isApproved ? "Approved" : "Pending Approval"}
                </Badge>
                {!profile?.isApproved && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Your profile is pending admin approval. Students won't see you until approved.
                  </p>
                )}
              </div>
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
                <p className="text-sm font-medium mb-1">Display Name</p>
                <p className="text-sm text-muted-foreground">{userProfile?.fullName}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
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
