import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

export default function EditParentProfile() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile?.uid) {
      setFullName(userProfile.fullName || "");
      loadProfile();
    }
  }, [userProfile?.uid]);

  const loadProfile = async () => {
    if (!userProfile?.uid) return;
    try {
      const snap = await getDoc(doc(db, "users", userProfile.uid));
      if (snap.exists()) {
        const data = snap.data();
        setPhone(data.phone || "");
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.uid) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", userProfile.uid), {
        fullName,
        phone,
      });
      toast({ title: "Profile updated successfully!" });
      navigate("/parent/dashboard");
    } catch (error) {
      toast({ title: "Failed to update profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="parent">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
        <Card>
          <CardHeader>
            <CardTitle>Your Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={userProfile?.email || ""} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 8900" />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
