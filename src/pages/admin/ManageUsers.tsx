import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, UserCheck, Ban, CheckCircle, Eye, X, Trash2, ShieldAlert, Pencil, Mail, AlertCircle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUsers, getAllTutors, approveTutor, updateUserStatus, deleteUser, TutorProfile, createAdminNotification } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

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
  const [userToDelete, setUserToDelete] = useState<{ uid: string; name: string; role: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notifyTutor, setNotifyTutor] = useState<TutorProfile | null>(null);
  const [notifyMessage, setNotifyMessage] = useState("");
  const [isNotifying, setIsNotifying] = useState(false);

  const getMissingFields = (t: TutorProfile): string[] => {
    const missing: string[] = [];
    if (!t.bio?.trim()) missing.push("Bio");
    if (!t.experience?.trim()) missing.push("Experience");
    if (!t.hourlyRate || t.hourlyRate <= 0) missing.push("Hourly Rate");
    if (!t.subjects || t.subjects.length === 0) missing.push("Subjects you teach");
    if (!t.photoURL) missing.push("Profile Photo");
    if (!t.qualifications?.trim()) missing.push("Qualifications");
    if (!t.degreeLevel?.trim()) missing.push("Degree Level");
    if (!t.majorSubjects || t.majorSubjects.length === 0) missing.push("Major / Specialization Subjects");
    if (!t.teachingStyle?.trim()) missing.push("Teaching Style");
    return missing;
  };

  const openNotify = (t: TutorProfile) => {
    const missing = getMissingFields(t);
    setNotifyMessage(
      `Hi ${t.fullName},\n\nWe noticed your tutor profile is missing some important details. Please log in and complete the following so our team can review and approve your application:\n\n${missing.map(m => `• ${m}`).join("\n")}\n\nA complete profile gets approved much faster and helps students trust your expertise.\n\nThanks,\nTutorsPool Team`
    );
    setNotifyTutor(t);
  };

  const handleSendNotification = async () => {
    if (!notifyTutor?.email) return;
    setIsNotifying(true);
    try {
      const missing = getMissingFields(notifyTutor);
      const { error } = await supabase.functions.invoke("send-email", {
        body: {
          type: "tutor_profile_incomplete",
          to: notifyTutor.email,
          tutorName: notifyTutor.fullName,
          missingFields: missing,
          customMessage: notifyMessage,
        },
      });
      if (error) throw error;
      toast({ title: "Notification sent", description: `Email sent to ${notifyTutor.email}` });
      setNotifyTutor(null);
      setNotifyMessage("");
    } catch (e) {
      console.error("Failed to send notification", e);
      toast({ title: "Error", description: "Failed to send notification email.", variant: "destructive" });
    } finally {
      setIsNotifying(false);
    }
  };

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

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    const deletedUid = userToDelete.uid;
    const deletedName = userToDelete.name;
    
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.uid, userToDelete.role);
      
      // Optimistically remove from local state immediately
      setUsers(prev => prev.filter(u => u.uid !== deletedUid));
      setTutors(prev => prev.filter(t => t.uid !== deletedUid));
      
      toast({ 
        title: "User deleted", 
        description: `${deletedName} has been permanently removed from the platform.` 
      });
      setUserToDelete(null);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete user. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const students = users.filter(u => u.role === 'student');
  const tutorUsers = users.filter(u => u.role === 'tutor');
  const adminUsers = users.filter(u => u.role === 'admin');
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
              className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Pending ({pendingTutors.length})
            </TabsTrigger>
            <TabsTrigger
              value="tutors"
              className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Tutors ({approvedTutors.length})
            </TabsTrigger>
            <TabsTrigger
              value="students"
              className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger
              value="admins"
              className="flex-1 min-w-[120px] sm:flex-none sm:min-w-0 text-xs sm:text-sm"
            >
              Admins ({adminUsers.length})
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
                    {pendingTutors.map((tutor) => {
                      const missing = getMissingFields(tutor);
                      const isIncomplete = missing.length > 0;
                      return (
                      <div key={tutor.uid} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{tutor.fullName}</p>
                            {isIncomplete && (
                              <Badge variant="outline" className="border-orange-400 text-orange-600 dark:text-orange-400 gap-1 text-[10px]">
                                <AlertCircle className="h-3 w-3" /> Profile incomplete ({missing.length})
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{tutor.email}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {tutor.subjects?.map((subject) => (
                              <Badge key={subject} variant="outline" className="text-xs">{subject}</Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{tutor.experience || "No experience set"}</p>
                          {isIncomplete && (
                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                              Missing: {missing.slice(0, 4).join(", ")}{missing.length > 4 ? `, +${missing.length - 4} more` : ""}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" onClick={() => handleApprove(tutor.uid)}>
                            <CheckCircle className="h-4 w-4 mr-1" /> Approve
                          </Button>
                          {isIncomplete && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-orange-400 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                              onClick={() => openNotify(tutor)}
                            >
                              <Mail className="h-4 w-4 mr-1" /> Notify to complete
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => setSelectedTutor(tutor)}>
                            <Eye className="h-4 w-4 mr-1" /> Review
                          </Button>
                          <Button size="sm" variant="outline" asChild>
                            <Link to={`/admin/users/tutor/${tutor.uid}`}>
                              <Pencil className="h-4 w-4 mr-1" /> Edit
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => setUserToDelete({ uid: tutor.uid, name: tutor.fullName, role: 'tutor' })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      );
                    })}
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
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-success">Active</Badge>
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/admin/users/tutor/${tutor.uid}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete({ uid: tutor.uid, name: tutor.fullName, role: 'tutor' })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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
                          <Button size="sm" variant="ghost" asChild>
                            <Link to={`/admin/users/student/${student.uid}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSuspend(student.uid, student.isActive !== false)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete({ uid: student.uid, name: student.fullName, role: 'student' })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-purple-600" />
                  Administrators
                </CardTitle>
                <CardDescription>Platform administrators with full access</CardDescription>
              </CardHeader>
              <CardContent>
                {adminUsers.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No administrators found</p>
                ) : (
                  <div className="space-y-4">
                    {adminUsers.map((admin) => (
                      <div key={admin.uid} className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{admin.fullName}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default" className="bg-purple-600">Admin</Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setUserToDelete({ uid: admin.uid, name: admin.fullName, role: 'admin' })}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Delete User Permanently
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Are you sure you want to delete <strong>{userToDelete?.name}</strong>? 
                This action cannot be undone.
              </p>
              <p className="text-destructive font-medium">
                This will permanently remove:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>User account and profile</li>
                {userToDelete?.role === 'tutor' && <li>All availability slots</li>}
                {userToDelete?.role === 'student' && <li>All learning goals</li>}
                <li>Associated data and records</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Notify Tutor Dialog */}
      <Dialog open={!!notifyTutor} onOpenChange={(open) => { if (!open) { setNotifyTutor(null); setNotifyMessage(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-orange-500" />
              Notify Tutor to Complete Profile
            </DialogTitle>
            <DialogDescription>
              An email will be sent to <strong>{notifyTutor?.email}</strong> with the missing fields and your message.
            </DialogDescription>
          </DialogHeader>
          {notifyTutor && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-1">Missing fields detected:</p>
                <div className="flex flex-wrap gap-1">
                  {getMissingFields(notifyTutor).map((m) => (
                    <Badge key={m} variant="outline" className="text-xs border-orange-300 text-orange-700 dark:text-orange-300">{m}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Message</p>
                <Textarea
                  rows={10}
                  value={notifyMessage}
                  onChange={(e) => setNotifyMessage(e.target.value)}
                  placeholder="Write a friendly message asking them to complete their profile..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNotifyTutor(null)} disabled={isNotifying}>
                  Cancel
                </Button>
                <Button onClick={handleSendNotification} disabled={isNotifying || !notifyMessage.trim()}>
                  <Mail className="h-4 w-4 mr-2" />
                  {isNotifying ? "Sending..." : "Send Email"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
