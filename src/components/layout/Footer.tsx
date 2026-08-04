import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram, Phone, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

const socialLinks = [
  { icon: Facebook, href: "https://www.facebook.com/tutorspoolglobal", label: "Facebook" },
  { icon: Twitter, href: "https://x.com/tutorspool", label: "X (Twitter)" },
  { icon: Linkedin, href: "https://www.linkedin.com/company/tutorspool", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com/tutors_pool", label: "Instagram" },
];


export function Footer() {
  const { t } = useTranslation();

  const footerLinks = {
    platform: [
      { label: t("footer.findTutors"), href: "/tutors" },
      { label: t("footer.becomeTutor"), href: "/register?role=tutor" },
      { label: t("footer.subjects"), href: "/subjects" },
      { label: t("footer.reviews"), href: "/reviews" },
    ],
    company: [
      { label: t("footer.about"), href: "/about" },
      { label: t("footer.contact"), href: "/contact" },
      { label: t("footer.careers"), href: "/careers" },
      { label: t("footer.blog"), href: "/blog" },
    ],
    support: [
      { label: t("footer.help"), href: "/help" },
      { label: t("footer.terms"), href: "/terms" },
      { label: t("footer.privacy"), href: "/privacy" },
      { label: t("footer.disclaimer"), href: "/disclaimer" },
      { label: t("footer.faq"), href: "/faq" },
    ],
  };

  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center rounded-lg">
                <img src="/logo.png" alt="TutorsPool Logo" className="h-12 w-auto" />
              </div>
            </Link>
            <p className="text-secondary-foreground/70 text-sm mb-4">{t("footer.tagline")}</p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-foreground/10 hover:bg-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t("footer.platform")}</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t("footer.company")}</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-secondary-foreground/70 hover:text-primary transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <hr className="my-8 border-secondary-foreground/10" />

        <address className="not-italic text-sm text-secondary-foreground/70 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
          <span className="font-medium text-secondary-foreground">TutorsPool</span>
          <a href="tel:+923453284284" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Phone className="h-4 w-4" /> +92 345 3284284
          </a>
          <a href="mailto:support@tutorspool.com" className="flex items-center gap-2 hover:text-primary transition-colors">
            <Mail className="h-4 w-4" /> support@tutorspool.com
          </a>
        </address>


        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/60">
          <p>© {new Date().getFullYear()} TutorsPool. {t("footer.rights")}</p>
          <p>{t("footer.madeWith")}</p>
        </div>
      </div>
    </footer>
  );
}
