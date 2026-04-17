import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Loader2 } from "lucide-react";

export interface ParentNotificationPreferences {
  quiz_completed: { inApp: boolean; email: boolean };
  session_booked: { inApp: boolean; email: boolean };
  session_status: { inApp: boolean; email: boolean };
  milestone: { inApp: boolean; email: boolean };
}

export const DEFAULT_PREFS: ParentNotificationPreferences = {
  quiz_completed: { inApp: true, email: true },
  session_booked: { inApp: true, email: true },
  session_status: { inApp: true, email: true },
  milestone: { inApp: true, email: true },
};

const PREF_LABELS: { key: keyof ParentNotificationPreferences; title: string; description: string }[] = [
  { key: "quiz_completed", title: "Quiz Alerts", description: "When your child completes a quiz with their score." },
  { key: "session_booked", title: "Session Bookings", description: "When your child books a new tutoring session." },
  { key: "session_status", title: "Session Updates", description: "When sessions are accepted, declined, completed, or cancelled." },
  { key: "milestone", title: "Milestones", description: "Achievements like level-ups, streaks, and badges earned." },
];

export default function NotificationPreferences() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [prefs, setPrefs] = useState<ParentNotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!userProfile?.uid) return;
      try {
        const snap = await getDoc(doc(db, "parentNotificationPrefs", userProfile.uid));
        if (snap.exists()) {
          setPrefs({ ...DEFAULT_PREFS, ...(snap.data() as ParentNotificationPreferences) });
        }
      } catch (e) {
        console.error("Failed to load preferences:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userProfile?.uid]);

  const updatePref = (key: keyof ParentNotificationPreferences, channel: "inApp" | "email", value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: { ...prev[key], [channel]: value } }));
  };

  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "parentNotificationPrefs", userProfile.uid), prefs);
      toast({ title: "Preferences saved", description: "Your notification settings have been updated." });
    } catch (e) {
      console.error(e);
      toast({ title: "Save failed", description: "Could not update preferences.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground">Choose which alerts you receive about your child's learning.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Notification Types</CardTitle>
                <CardDescription>Toggle in-app and email delivery for each category.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {PREF_LABELS.map(({ key, title, description }) => (
                  <div key={key} className="border-b last:border-b-0 pb-5 last:pb-0">
                    <div className="mb-3">
                      <h3 className="font-semibold">{title}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <Label htmlFor={`${key}-inapp`} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                          <Bell className="h-4 w-4 text-muted-foreground" />
                          In-app
                        </Label>
                        <Switch
                          id={`${key}-inapp`}
                          checked={prefs[key].inApp}
                          onCheckedChange={(v) => updatePref(key, "inApp", v)}
                        />
                      </div>
                      <div className="flex items-center justify-between sm:justify-start gap-3">
                        <Label htmlFor={`${key}-email`} className="flex items-center gap-2 text-sm font-normal cursor-pointer">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          Email
                        </Label>
                        <Switch
                          id={`${key}-email`}
                          checked={prefs[key].email}
                          onCheckedChange={(v) => updatePref(key, "email", v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Preferences
              </Button>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
