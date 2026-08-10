import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Star, Mail, Info, GraduationCap, Menu, X, FileText, User, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

function useNavLinks() {
  const { t } = useTranslation();
  return [
    { label: t("nav.subjects"), href: "/subjects", icon: BookOpen },
    { label: t("nav.findTutors"), href: "/tutors", icon: Users },
    { label: "Group Classes", href: "/group-classes", icon: Users },
    { label: t("nav.reviews"), href: "/reviews", icon: Star },
    { label: t("nav.blog"), href: "/blog", icon: FileText },
    { label: t("nav.about"), href: "/about", icon: Info },
    { label: t("nav.contact"), href: "/contact", icon: Mail },
    { label: t("nav.becomeTutor"), href: "/register?role=tutor", icon: GraduationCap },
  ];
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const { t } = useTranslation();
  const navLinks = useNavLinks();
  const navigate = useNavigate();
  const isLoggedIn = !!user && !!userProfile;
  const dashboardHref = userProfile ? `/${userProfile.role}/dashboard` : '/';
  const firstName = userProfile?.fullName?.split(' ')[0] || 'Account';

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center rounded-lg">
            <img src="/logo.webp" alt="TutorsPool logo" className="h-8 w-auto sm:h-10" width={480} height={116} decoding="async" {...({ fetchpriority: "high" } as Record<string, string>)} />
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
          <div className="hidden sm:flex items-center">
            <CurrencySwitcher />
            <LanguageSwitcher />
          </div>

          {isLoggedIn ? (
            <>
              <Link to={dashboardHref} className="hidden sm:block">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="max-w-[120px] truncate">{firstName}</span>
                </Button>
              </Link>
              <Button
                variant="hero"
                size="sm"
                className="hidden sm:flex gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                {t("common.logout")}
              </Button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm">{t("common.signIn")}</Button>
              </Link>
              <Link to="/register" className="hidden sm:block">
                <Button variant="hero" size="sm">{t("common.getStarted")}</Button>
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden min-h-11 min-w-11"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
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
            <LanguageSwitcher variant="mobile" />
            <CurrencySwitcher variant="mobile" />
            {isLoggedIn ? (
              <>
                <Link to={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {firstName} — {t("common.dashboard")}
                  </Button>
                </Link>
                <Button variant="hero" className="w-full gap-2" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">{t("common.signIn")}</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="hero" className="w-full">{t("common.getStarted")}</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
