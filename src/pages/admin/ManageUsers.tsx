import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Users, UserCheck, Ban, CheckCircle, Eye } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUsers, getAllTutors, approveTutor, updateUserStatus, TutorProfile } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

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
    try {
      await approveTutor(tutorId);
      toast({ title: "Tutor approved!", description: "They can now accept students" });
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
                          <Button size="sm" variant="outline">
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
    </DashboardLayout>
  );
}
