import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Users,
  Star,
  Mail,
  Info,
  GraduationCap,
  Menu,
  X,
  LogOut,
  User,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LucideIcon } from "lucide-react";

type NavLinkItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  key: string;
  label: string;
  icon: LucideIcon;
  links: NavLinkItem[];
};

function useNavGroups(): NavGroup[] {
  const { t } = useTranslation();
  return [
    {
      key: "learn",
      label: t("nav.categories.learn"),
      icon: BookOpen,
      links: [
        { label: t("nav.subjects"), href: "/subjects", icon: BookOpen },
        { label: t("nav.findTutors"), href: "/tutors", icon: Users },
        { label: t("nav.groupClasses"), href: "/group-classes", icon: Users },
      ],
    },
    {
      key: "company",
      label: t("nav.categories.company"),
      icon: Info,
      links: [
        { label: t("nav.reviews"), href: "/reviews", icon: Star },
        { label: t("nav.blog"), href: "/blog", icon: BookOpen },
        { label: t("nav.about"), href: "/about", icon: Info },
        { label: t("nav.contact"), href: "/contact", icon: Mail },
      ],
    },
    {
      key: "teach",
      label: t("nav.categories.teach"),
      icon: GraduationCap,
      links: [
        { label: t("nav.becomeTutor"), href: "/register?role=tutor", icon: GraduationCap },
      ],
    },
  ];
}

function DesktopNavDropdown({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate: () => void;
}) {
  const navigate = useNavigate();
  const Icon = group.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="navlink"
          size="sm"
          className="gap-1"
          aria-haspopup="true"
        >
          <Icon className="h-4 w-4" />
          <span>{group.label}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[200px] bg-background"
      >
        {group.links.map((link) => {
          const LinkIcon = link.icon;
          return (
            <DropdownMenuItem
              key={link.href}
              onClick={() => {
                onNavigate();
                navigate(link.href);
              }}
              className="cursor-pointer gap-2"
            >
              <LinkIcon className="h-4 w-4" />
              {link.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userProfile, logout } = useAuth();
  const { t } = useTranslation();
  const navGroups = useNavGroups();
  const navigate = useNavigate();
  const isLoggedIn = !!user && !!userProfile;
  const dashboardHref = userProfile ? `/${userProfile.role}/dashboard` : "/";
  const firstName = userProfile?.fullName?.split(" ")[0] || "Account";

  const handleLogout = async () => {
    try {
      await logout();
      setMobileMenuOpen(false);
      navigate("/");
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="flex items-center justify-center rounded-lg">
            <img
              src="/logo.webp"
              alt="TutorsPool logo"
              className="h-8 w-auto sm:h-10"
              width={480}
              height={116}
              decoding="async"
              {...({ fetchpriority: "high" } as Record<string, string>)}
            />
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navGroups.map((group) => (
            <DesktopNavDropdown
              key={group.key}
              group={group}
              onNavigate={() => {}}
            />
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
                <Button variant="ghost" size="sm">
                  {t("common.signIn")}
                </Button>
              </Link>
              <Link to="/register" className="hidden sm:block">
                <Button variant="hero" size="sm">
                  {t("common.getStarted")}
                </Button>
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
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border/50 bg-background animate-fade-in">
          <div className="container py-4 flex flex-col gap-2">
            <Accordion type="multiple" className="w-full">
              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                return (
                  <AccordionItem key={group.key} value={group.key} className="border-b-0">
                    <AccordionTrigger className="py-3 hover:no-underline">
                      <span className="flex items-center gap-2 font-medium">
                        <GroupIcon className="h-4 w-4" />
                        {group.label}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col gap-1 pl-6">
                        {group.links.map((link) => {
                          const LinkIcon = link.icon;
                          return (
                            <Link
                              key={link.href}
                              to={link.href}
                              onClick={closeMobileMenu}
                            >
                              <Button
                                variant="ghost"
                                className="w-full justify-start gap-2"
                              >
                                <LinkIcon className="h-4 w-4" />
                                {link.label}
                              </Button>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>

            <hr className="my-2 border-border" />
            <LanguageSwitcher variant="mobile" />
            <CurrencySwitcher variant="mobile" />

            {isLoggedIn ? (
              <>
                <Link
                  to={dashboardHref}
                  onClick={closeMobileMenu}
                >
                  <Button variant="outline" className="w-full gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    {firstName} — {t("common.dashboard")}
                  </Button>
                </Link>
                <Button
                  variant="hero"
                  className="w-full gap-2"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  {t("common.logout")}
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMobileMenu}>
                  <Button variant="outline" className="w-full">
                    {t("common.signIn")}
                  </Button>
                </Link>
                <Link to="/register" onClick={closeMobileMenu}>
                  <Button variant="hero" className="w-full">
                    {t("common.getStarted")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
