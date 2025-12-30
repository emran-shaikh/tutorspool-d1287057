import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Star, Mail, Info, GraduationCap, Globe, Menu, X, FileText } from "lucide-react";
import { useState } from "react";

const navLinks = [
  { label: "Subjects", href: "/subjects", icon: BookOpen },
  { label: "Find Tutors", href: "/tutors", icon: Users },
  { label: "Reviews", href: "/reviews", icon: Star },
  { label: "Blog", href: "/blog", icon: FileText },
  { label: "About", href: "/about", icon: Info },
  { label: "Contact", href: "/contact", icon: Mail },
  { label: "Become a Tutor", href: "/register?role=tutor", icon: GraduationCap },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center rounded-lg">
            <img src="/logo.png" alt="TutorsPool logo" className="h-8 w-auto sm:h-10" />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link key={link.href} to={link.href}>
              <Button variant="navlink" size="sm">
                {link.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="sm" className="hidden sm:flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>Global</span>
          </Button>
          
          <Link to="/login" className="hidden sm:block">
            <Button variant="ghost" size="sm">Sign In</Button>
          </Link>
          
          <Link to="/register" className="hidden sm:block">
            <Button variant="hero" size="sm">Get Started</Button>
          </Link>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background animate-fade-in">
          <nav className="container py-4 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="ghost" className="w-full justify-start gap-2">
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Button>
              </Link>
            ))}
            <hr className="my-2 border-border" />
            <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">Sign In</Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
