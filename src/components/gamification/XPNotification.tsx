import { toast } from 'sonner';
import { BADGES } from '@/lib/gamification';
import { fireLevelUpConfetti, fireBadgeConfetti } from '@/lib/confetti';

export function showXPNotification(amount: number, description: string) {
  toast(`+${amount} XP`, {
    description,
    icon: '⚡',
    duration: 3000,
  });
}

export function showLevelUpNotification(newLevel: number, title: string) {
  fireLevelUpConfetti();
  toast.success(`🎉 Level Up!`, {
    description: `You reached Level ${newLevel} — ${title}!`,
    duration: 5000,
  });
}

export function showBadgeNotification(badgeId: string) {
  const badge = BADGES.find(b => b.id === badgeId);
  if (!badge) return;
  fireBadgeConfetti();
  toast(`${badge.icon} Badge Unlocked!`, {
    description: badge.name,
    duration: 4000,
  });
}
