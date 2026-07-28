import { DollarSign, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/contexts/CurrencyContext";

export function CurrencySwitcher({ variant = "default" }: { variant?: "default" | "mobile" }) {
  const { code, setCurrency } = useCurrency();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={variant === "mobile" ? "w-full justify-start gap-2" : "gap-1"}
        >
          <DollarSign className="h-4 w-4" />
          <span>{code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] max-h-[320px] overflow-y-auto bg-background">
        {SUPPORTED_CURRENCIES.map((c) => (
          <DropdownMenuItem
            key={c.code}
            onClick={() => setCurrency(c.code)}
            className="cursor-pointer gap-2"
          >
            <span className="text-base">{c.flag}</span>
            <span className="flex-1">{c.code} — {c.label}</span>
            {code === c.code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
