import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';

interface StreakCounterProps {
  streak: number;
}

export default function StreakCounter({ streak }: StreakCounterProps) {
  if (streak <= 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 text-xs font-semibold cursor-default select-none">
          <Flame className="h-3.5 w-3.5" />
          {streak}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{streak}-day streak 🔥</p>
      </TooltipContent>
    </Tooltip>
  );
}
