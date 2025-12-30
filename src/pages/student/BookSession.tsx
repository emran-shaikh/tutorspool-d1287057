import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTutorProfile, getTutorAvailability, createSession, TutorProfile, AvailabilitySlot } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BookSession() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { toast } = useToast();
  
  const [tutor, setTutor] = useState<TutorProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!tutorId) return;
      setLoading(true);
      setError(null);
      try {
        const [tutorData, slots] = await Promise.all([
          getTutorProfile(tutorId),
          getTutorAvailability(tutorId)
        ]);
        setTutor(tutorData);
        setAvailability(slots);
      } catch (error) {
        console.error('Error loading tutor for booking', error);
        setError('We could not load this tutor right now. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tutorId]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor || !userProfile || !selectedDate || !selectedTime || !selectedSubject) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const sessionStartIso = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();

      await createSession({
        studentId: userProfile.uid,
        studentName: userProfile.fullName,
        studentEmail: userProfile.email,
        tutorId: tutor.uid,
        tutorName: tutor.fullName,
        tutorEmail: tutor.email,
        subject: selectedSubject,
        date: selectedDate,
        time: selectedTime,
        status: 'pending',
        message,
        createdAt: new Date().toISOString()
      });

      // Fire-and-forget booking + reminder + tutor emails
      try {
        await supabase.functions.invoke('send-email', {
          body: {
            type: 'session_booking',
            to: userProfile.email,
            studentName: userProfile.fullName,
            tutorName: tutor.fullName,
            date: selectedDate,
            time: selectedTime,
          },
        });

        await supabase.functions.invoke('send-email', {
          body: {
            type: 'session_reminder',
            to: userProfile.email,
            studentName: userProfile.fullName,
            tutorName: tutor.fullName,
            date: selectedDate,
            time: selectedTime,
            sessionStartIso,
          },
        });

        if (tutor.email) {
          await supabase.functions.invoke('send-email', {
            body: {
              type: 'tutor_session_booking',
              to: tutor.email,
              studentName: userProfile.fullName,
              tutorName: tutor.fullName,
              date: selectedDate,
              time: selectedTime,
            },
          });
        }
      } catch (err) {
        console.error('Failed to trigger session emails:', err);
      }
      
      toast({ title: "Success", description: "Session request sent to tutor!" });
      navigate('/student/sessions');
    } catch (error) {
      toast({ title: "Error", description: "Failed to book session", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout role="student">
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  if (!tutor) {
    return (
      <DashboardLayout role="student">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Tutor not found</p>
            <Button asChild className="mt-4">
              <Link to="/student/tutors">Browse Tutors</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div className="mb-6">
        <Link to="/student/tutors" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Tutors
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Book a Session</h1>
        <p className="text-muted-foreground">Schedule a session with {tutor.fullName}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Tutor Info
            </CardTitle>
          </CardHeader>
          <CardContent>
            <h3 className="font-semibold text-lg">{tutor.fullName}</h3>
            <p className="text-sm text-muted-foreground mb-3">{tutor.experience}</p>
            <p className="text-sm mb-4">{tutor.bio}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {tutor.subjects.map((subject) => (
                <span key={subject} className="text-xs bg-muted px-2 py-1 rounded">
                  {subject}
                </span>
              ))}
            </div>
            <p className="font-semibold text-primary">${tutor.hourlyRate}/hour</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Session
            </CardTitle>
            <CardDescription>Choose your preferred date and time</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input
                    id="time"
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-card-foreground shadow-lg z-50">
                    {tutor.subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Tell the tutor what you'd like to learn..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
              </div>

              {availability.length > 0 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Tutor's Availability
                  </p>
                  <div className="text-sm text-muted-foreground space-y-1">
                    {availability.map((slot) => (
                      <p key={slot.id}>
                        {dayNames[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending Request..." : "Request Session"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
