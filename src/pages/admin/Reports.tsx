import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, FileSpreadsheet, Users, TrendingUp, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getAllUsers, getAllTutors, getAllSessions } from "@/lib/firestore";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      toast({ title: "No data", description: "No data available to export", variant: "destructive" });
      return;
    }
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast({ title: "Report downloaded!" });
  };

  const handleTutorReport = async () => {
    setLoading(true);
    try {
      const tutors = await getAllTutors();
      const reportData = tutors.map(t => ({
        Name: t.fullName,
        Email: t.email,
        Subjects: t.subjects?.join('; ') || '',
        Experience: t.experience,
        HourlyRate: t.hourlyRate,
        Status: t.isApproved ? 'Approved' : 'Pending'
      }));
      downloadCSV(reportData, 'tutor_performance');
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentReport = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      const students = users.filter(u => u.role === 'student');
      const reportData = students.map(s => ({
        Name: s.fullName,
        Email: s.email,
        Status: s.isActive !== false ? 'Active' : 'Suspended',
        JoinedAt: s.createdAt
      }));
      downloadCSV(reportData, 'student_activity');
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSessionReport = async () => {
    setLoading(true);
    try {
      const sessions = await getAllSessions();
      const reportData = sessions.map(s => ({
        Subject: s.subject,
        Student: s.studentName,
        Tutor: s.tutorName,
        Date: s.date,
        Time: s.time,
        Status: s.status
      }));
      downloadCSV(reportData, 'session_report');
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <Link to="/admin/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-2">Reports</h1>
        <p className="text-muted-foreground">Download platform data reports in CSV format</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Tutor Performance
            </CardTitle>
            <CardDescription>
              Export all tutor data including subjects, rates, and approval status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleTutorReport} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Student Activity
            </CardTitle>
            <CardDescription>
              Export all student data including registration and activity status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleStudentReport} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Session Report
            </CardTitle>
            <CardDescription>
              Export all sessions including dates, participants, and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSessionReport} disabled={loading} className="w-full">
              <Download className="h-4 w-4 mr-2" /> Download Report
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
