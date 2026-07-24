import { useTranslation } from "react-i18next";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGS } from "@/i18n";

export function LanguageSwitcher({ variant = "default" }: { variant?: "default" | "mobile" }) {
  const { i18n } = useTranslation();
  const current = SUPPORTED_LANGS.find((l) => l.code === i18n.language) || SUPPORTED_LANGS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={variant === "mobile" ? "w-full justify-start gap-2" : "gap-1"}
        >
          <Globe className="h-4 w-4" />
          <span>{current.flag} {current.label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px] bg-background">
        {SUPPORTED_LANGS.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            className="cursor-pointer gap-2"
          >
            <span className="text-base">{lang.flag}</span>
            <span className="flex-1">{lang.label}</span>
            {current.code === lang.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
