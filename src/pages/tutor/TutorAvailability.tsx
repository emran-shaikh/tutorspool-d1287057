import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Clock, Plus, Trash2, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTutorAvailability, setTutorAvailability, deleteAvailabilitySlot, AvailabilitySlot } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TutorAvailability() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAvailability();
  }, [userProfile]);

  const fetchAvailability = async () => {
    if (!userProfile?.uid) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getTutorAvailability(userProfile.uid);
      setSlots(data.length > 0 ? data : [createEmptySlot()]);
    } catch (error) {
      console.error('Error loading availability', error);
      setError('We could not load your availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const createEmptySlot = (): AvailabilitySlot => ({
    tutorId: userProfile?.uid || '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00'
  });

  const addSlot = () => {
    setSlots([...slots, createEmptySlot()]);
  };

  const removeSlot = async (index: number) => {
    const slot = slots[index];
    if (slot.id) {
      try {
        await deleteAvailabilitySlot(slot.id);
        toast({ title: "Slot removed" });
      } catch (error) {
        toast({ title: "Error", description: "Failed to remove slot", variant: "destructive" });
        return;
      }
    }
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string | number) => {
    const updated = [...slots];
    updated[index] = { ...updated[index], [field]: value };
    setSlots(updated);
  };

  const handleSave = async () => {
    if (!userProfile?.uid) return;
    setSaving(true);
    try {
      const slotsWithTutorId = slots.map(s => ({ ...s, tutorId: userProfile.uid }));
      await setTutorAvailability(slotsWithTutorId);
      toast({ title: "Availability saved!" });
      fetchAvailability();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save availability", variant: "destructive" });
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
        <h1 className="font-display text-3xl font-bold mb-2">Manage Availability</h1>
        <p className="text-muted-foreground">Set your weekly availability for tutoring sessions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchAvailability}>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Weekly Schedule
            </CardTitle>
            <CardDescription>Define when students can book sessions with you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {slots.map((slot, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select
                    value={String(slot.dayOfWeek)}
                    onValueChange={(val) => updateSlot(index, 'dayOfWeek', Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card text-card-foreground shadow-lg z-50">
                      {dayNames.map((day, i) => (
                        <SelectItem key={i} value={String(i)}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive"
                    onClick={() => removeSlot(index)}
                    disabled={slots.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap gap-4 pt-4">
              <Button variant="outline" onClick={addSlot}>
                <Plus className="h-4 w-4 mr-2" /> Add Time Slot
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" /> {saving ? "Saving..." : "Save Availability"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}

