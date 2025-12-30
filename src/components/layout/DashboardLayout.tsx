import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, LogOut, User } from "lucide-react";
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
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="flex items-center justify-center rounded-lg">
              <img src="/logo.png" alt="TutorsPool dashboard logo" className="h-9 w-auto sm:h-10" />
            </div>
            {/* <span className="font-display text-lg font-bold">
              <span className="text-secondary">Tutors</span>
              <span className="text-primary">Pool</span>
            </span> */}
            {role === 'admin' && (
              <Badge variant="secondary" className="ml-1 sm:ml-2 whitespace-nowrap">Admin</Badge>
            )}
          </Link>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2 min-w-0">
            <span className="truncate text-sm text-muted-foreground max-w-full sm:max-w-xs text-right">
              Welcome, {userProfile?.fullName || getRoleLabel()}
            </span>
            {(role === 'student' || role === 'tutor') && (
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/${role}/profile`}>
                  <User className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="whitespace-nowrap">
              <LogOut className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
