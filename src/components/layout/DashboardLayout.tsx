import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'student' | 'tutor' | 'admin';
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getRoleLabel = () => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'tutor': return 'Tutor';
      default: return 'Student';
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b border-border sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center rounded-lg">
              <img src="/logo.png" alt="TutorsPool Logo" className="h-12 w-auto" />
            </div>
            {/* <span className="font-display text-lg font-bold">
              <span className="text-secondary">Tutors</span>
              <span className="text-primary">Pool</span>
            </span> */}
            {role === 'admin' && (
              <Badge variant="secondary" className="ml-2">Admin</Badge>
            )}
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {userProfile?.fullName || getRoleLabel()}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {children}
      </main>
    </div>
  );
}
