import { useCurrency } from "@/contexts/CurrencyContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PriceProps {
  /** Amount in USD (base currency). */
  usd: number;
  /** Optional suffix, e.g. "/hr". */
  suffix?: string;
  /** Show tooltip explaining approx + charged in USD. Defaults to true. */
  showApproxHint?: boolean;
  className?: string;
}

/**
 * Displays a USD-denominated price converted to the visitor's local currency.
 * Checkout is still processed in USD.
 */
export function Price({ usd, suffix, showApproxHint = true, className }: PriceProps) {
  const { format, code } = useCurrency();
  const formatted = format(usd);
  const isConverted = code !== "USD";

  const node = (
    <span className={className}>
      {formatted}
      {suffix}
    </span>
  );

  if (!isConverted || !showApproxHint) return node;

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-help underline decoration-dotted decoration-muted-foreground/40 underline-offset-2">
            {node}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          Approx. converted from USD ${usd.toLocaleString()}. Payments are processed in USD.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
