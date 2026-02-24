import { calculateLevel } from '@/lib/gamification';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md';
}

const levelColors: Record<number, string> = {
  1: 'from-gray-400 to-gray-500',
  2: 'from-green-400 to-emerald-500',
  3: 'from-blue-400 to-cyan-500',
  4: 'from-violet-400 to-purple-500',
  5: 'from-amber-400 to-orange-500',
  6: 'from-rose-400 to-pink-500',
  7: 'from-indigo-500 to-blue-600',
  8: 'from-yellow-400 to-amber-500',
  9: 'from-red-500 to-rose-600',
  10: 'from-yellow-300 via-amber-400 to-yellow-500',
};

export default function LevelBadge({ xp, size = 'sm' }: LevelBadgeProps) {
  const { level, title } = calculateLevel(xp);
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-10 w-10 text-sm';

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={`${dim} rounded-full bg-gradient-to-br ${levelColors[level] || levelColors[1]} flex items-center justify-center font-bold text-white shadow-md cursor-default select-none`}
        >
          {level}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="font-medium">Level {level} — {title}</p>
        <p className="text-xs text-muted-foreground">{xp} XP</p>
      </TooltipContent>
    </Tooltip>
  );
}
