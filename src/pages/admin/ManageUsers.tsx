import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, UserCheck, Ban, CheckCircle, Eye, X } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUsers, getAllTutors, approveTutor, updateUserStatus, TutorProfile, createAdminNotification } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserData {
  uid: string;
  email: string;
  fullName: string;
  role: string;
  isActive?: boolean;
  createdAt: string;
}

export default function ManageUsers() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<TutorProfile | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [usersData, tutorsData] = await Promise.all([
      getAllUsers(),
      getAllTutors()
    ]);
    setUsers(usersData);
    setTutors(tutorsData);
    setLoading(false);
  };

  const handleApprove = async (tutorId: string) => {
    const tutor = tutors.find(t => t.uid === tutorId);
    try {
      await approveTutor(tutorId);
      
      // Send approval notification to tutor
      if (tutor?.email) {
        supabase.functions.invoke("send-email", {
          body: { 
            type: "tutor_approved", 
            to: tutor.email, 
            tutorName: tutor.fullName 
          }
        }).catch(console.error);
      }
      
      // Create in-app notification
      createAdminNotification({
        type: "tutor_approved",
        title: "Tutor Approved",
        message: `${tutor?.fullName || "A tutor"} has been approved and can now accept students`,
        metadata: { tutorId, userName: tutor?.fullName, userEmail: tutor?.email }
      }).catch(console.error);
      
      toast({ title: "Tutor approved!", description: "They can now accept students and have been notified via email." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve tutor", variant: "destructive" });
    }
  };

  const handleSuspend = async (userId: string, suspend: boolean) => {
    try {
      await updateUserStatus(userId, !suspend);
      toast({ title: suspend ? "User suspended" : "User restored" });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update user", variant: "destructive" });
    }
  };

  const students = users.filter(u => u.role === 'student');
  const tutorUsers = users.filter(u => u.role === 'tutor');
  const pendingTutors = tutors.filter(t => !t.isApproved);
  const approvedTutors = tutors.filter(t => t.isApproved);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Manage Users</h1>
        <p className="text-muted-foreground">Approve tutors and manage all platform users</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-start gap-2 sm:gap-3">
            <TabsTrigger
              value="pending"
              className="flex-1 min-w-[140px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Pending Tutors ({pendingTutors.length})
            </TabsTrigger>
            <TabsTrigger
              value="tutors"
              className="flex-1 min-w-[140px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Approved Tutors ({approvedTutors.length})
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="flex-1 min-w-[140px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Students ({students.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-warning" />
                  Pending Tutor Approvals
                </CardTitle>
                <CardDescription>Review and approve new tutor registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingTutors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No pending approvals</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTutors.map((tutor) => (
                      <div key={tutor.uid} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tutor.fullName}</p>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tutor.subjects?.map((subject) => (
                              <Badge key={subject} variant="outline" className="text-xs">{subject}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tutor.experience} experience</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleApprove(tutor.uid)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setSelectedTutor(tutor)}>
                            <Eye className="h-4 w-4 mr-1" /> Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tutors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-success" />
                  Approved Tutors
                </CardTitle>
                <CardDescription>Active tutors on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedTutors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No approved tutors yet</p>
                ) : (
                  <div className="space-y-4">
                    {approvedTutors.map((tutor) => (
                      <div key={tutor.uid} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{tutor.fullName}</p>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tutor.subjects?.map((subject) => (
                              <Badge key={subject} variant="outline" className="text-xs">{subject}</Badge>
                            ))}
                          </div>
                        </div>
                        <Badge variant="default" className="bg-success">Active</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Students
                </CardTitle>
                <CardDescription>Registered students on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                {students.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No students registered</p>
                ) : (
                  <div className="space-y-4">
                    {students.map((student) => (
                      <div key={student.uid} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.fullName}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={student.isActive !== false ? "default" : "secondary"}>
                            {student.isActive !== false ? "Active" : "Suspended"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSuspend(student.uid, student.isActive !== false)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Tutor Review Dialog */}
      <Dialog open={!!selectedTutor} onOpenChange={(open) => !open && setSelectedTutor(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Tutor Application</DialogTitle>
            <DialogDescription>Review the tutor's profile before approving</DialogDescription>
          </DialogHeader>
          {selectedTutor && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-medium">{selectedTutor.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedTutor.email}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {selectedTutor.subjects?.map((subject) => (
                    <Badge key={subject} variant="outline">{subject}</Badge>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Experience</p>
                  <p className="font-medium">{selectedTutor.experience || "Not specified"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                  <p className="font-medium">${selectedTutor.hourlyRate || "Not set"}/hr</p>
                </div>
              </div>
              
              {selectedTutor.bio && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Bio</p>
                  <p className="text-sm">{selectedTutor.bio}</p>
                </div>
              )}
              
              
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    handleApprove(selectedTutor.uid);
                    setSelectedTutor(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve Tutor
                </Button>
                <Button variant="outline" onClick={() => setSelectedTutor(null)}>
                  <X className="h-4 w-4 mr-1" /> Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
