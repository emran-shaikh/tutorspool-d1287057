import { toast } from 'sonner';
import { BADGES } from '@/lib/gamification';

export function showXPNotification(amount: number, description: string) {
  toast(`+${amount} XP`, {
    description,
    icon: '⚡',
    duration: 3000,
  });
}

export function showBadgeNotification(badgeId: string) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;
  toast(`${badge.icon} Badge Unlocked!`, {
    description: badge.name,
    duration: 4000,
  });
}
