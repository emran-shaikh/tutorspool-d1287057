import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Calendar, Video, Clock, CheckCircle, XCircle, ExternalLink, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getTutorSessions, updateSessionStatus, Session } from "@/lib/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<Session['status'], string> = {
  pending: "bg-warning/10 text-warning border-warning/20",
  accepted: "bg-success/10 text-success border-success/20",
  declined: "bg-destructive/10 text-destructive border-destructive/20",
  completed: "bg-muted text-muted-foreground border-muted",
  cancelled: "bg-muted text-muted-foreground border-muted"
};

export default function TutorSessions() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomDialogOpen, setZoomDialogOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [zoomLink, setZoomLink] = useState("");

  useEffect(() => {
    fetchSessions();
  }, [userProfile]);

  const fetchSessions = async () => {
    if (!userProfile?.uid) return;
    const data = await getTutorSessions(userProfile.uid);
    setSessions(data);
    setLoading(false);
  };

  const handleAccept = (session: Session) => {
    setSelectedSession(session);
    setZoomLink("");
    setZoomDialogOpen(true);
  };

  const [generatingZoom, setGeneratingZoom] = useState(false);

  const generateZoomLink = async () => {
    if (!selectedSession) return;
    setGeneratingZoom(true);
    try {
      const response = await fetch(
        `https://yafjkpckhzpkrptmzcms.supabase.co/functions/v1/create-zoom-meeting`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: `${selectedSession.subject} - Tutoring Session`,
            startTime: `${selectedSession.date}T${selectedSession.time}:00`,
            duration: 60
          })
        }
      );
      const data = await response.json();
      if (data.success && data.joinUrl) {
        setZoomLink(data.joinUrl);
        toast({ title: "Zoom link generated!", description: "Meeting link has been created" });
      } else {
        throw new Error(data.error || 'Failed to generate Zoom link');
      }
    } catch (error) {
      console.error('Zoom generation error:', error);
      toast({ 
        title: "Could not auto-generate", 
        description: "Please enter a Zoom link manually", 
        variant: "destructive" 
      });
    } finally {
      setGeneratingZoom(false);
    }
  };

  const confirmAccept = async () => {
    if (!selectedSession?.id) return;
    try {
      const meetingLink = zoomLink || `https://zoom.us/j/${Date.now()}`;
      await updateSessionStatus(selectedSession.id, 'accepted', meetingLink);
      toast({ title: "Session accepted!", description: "Student has been notified" });
      setZoomDialogOpen(false);
      fetchSessions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to accept session", variant: "destructive" });
    }
  };

  const handleDecline = async (sessionId: string) => {
    try {
      await updateSessionStatus(sessionId, 'declined');
      toast({ title: "Session declined" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to decline session", variant: "destructive" });
    }
  };

  const handleComplete = async (sessionId: string) => {
    try {
      await updateSessionStatus(sessionId, 'completed');
      toast({ title: "Session marked as completed" });
      fetchSessions();
    } catch (error) {
      toast({ title: "Error", description: "Failed to complete session", variant: "destructive" });
    }
  };

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'accepted');
  const pastSessions = sessions.filter(s => ['completed', 'declined', 'cancelled'].includes(s.status));

  const SessionCard = ({ session, showActions = false }: { session: Session; showActions?: boolean }) => (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <p className="font-medium">{session.subject}</p>
          <p className="text-sm text-muted-foreground">{session.studentName}</p>
        </div>
        <Badge variant="outline" className={statusColors[session.status]}>
          {session.status}
        </Badge>
      </div>
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" /> {session.date}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" /> {session.time}
        </span>
      </div>
      {session.message && (
        <p className="text-sm text-muted-foreground italic">"{session.message}"</p>
      )}
      {showActions && session.status === 'pending' && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => handleAccept(session)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Accept
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => session.id && handleDecline(session.id)}>
            <XCircle className="h-4 w-4 mr-1" /> Decline
          </Button>
        </div>
      )}
      {session.status === 'accepted' && (
        <div className="flex gap-2">
          {session.zoomLink && (
            <Button size="sm" variant="outline" className="flex-1" asChild>
              <a href={session.zoomLink} target="_blank" rel="noopener noreferrer">
                <Video className="h-4 w-4 mr-2" /> Start Session
                <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          )}
          <Button size="sm" className="flex-1" onClick={() => session.id && handleComplete(session.id)}>
            <CheckCircle className="h-4 w-4 mr-1" /> Complete
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout role="tutor">
      <div className="mb-6">
        <Link to="/tutor/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Manage Sessions</h1>
        <p className="text-muted-foreground">Accept requests and manage your tutoring sessions</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList>
            <TabsTrigger value="pending">
              Requests ({pendingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Requests
                </CardTitle>
                <CardDescription>Review and respond to session requests</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending requests</p>
                ) : (
                  <div className="space-y-4">
                    {pendingSessions.map((session) => (
                      <SessionCard key={session.id} session={session} showActions />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-primary" />
                  Upcoming Sessions
                </CardTitle>
                <CardDescription>Sessions ready to start</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No upcoming sessions</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Past Sessions
                </CardTitle>
                <CardDescription>Your session history</CardDescription>
              </CardHeader>
              <CardContent>
                {pastSessions.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No past sessions</p>
                ) : (
                  <div className="space-y-4">
                    {pastSessions.map((session) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={zoomDialogOpen} onOpenChange={setZoomDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Session</DialogTitle>
            <DialogDescription>
              Generate a Zoom meeting link automatically or enter one manually
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zoom">Zoom Meeting Link</Label>
              <div className="flex gap-2">
                <Input
                  id="zoom"
                  placeholder="https://zoom.us/j/..."
                  value={zoomLink}
                  onChange={(e) => setZoomLink(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={generateZoomLink}
                  disabled={generatingZoom}
                >
                  {generatingZoom ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Video className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Click the button to auto-generate a Zoom link, or paste your own
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setZoomDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmAccept} disabled={!zoomLink}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Accept Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
