import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Flame, Zap, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Leaderboard from '@/components/gamification/Leaderboard';
import { useAuth } from '@/contexts/AuthContext';
import {
  getStudentGamification,
  getXPHistory,
  calculateLevel,
  BADGES,
  LEVELS,
  type StudentGamification as GamificationData,
  type XPTransaction,
} from '@/lib/gamification';

const tierColors: Record<string, string> = {
  bronze: 'from-amber-600 to-orange-700',
  silver: 'from-gray-400 to-slate-500',
  gold: 'from-yellow-400 to-amber-500',
};

export default function Achievements() {
  const { userProfile } = useAuth();
  const [data, setData] = useState<GamificationData | null>(null);
  const [history, setHistory] = useState<XPTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.uid) return;
    try {
      const [g, h] = await Promise.all([
        getStudentGamification(userProfile.uid),
        getXPHistory(userProfile.uid, 20),
      ]);
      setData(g);
      setHistory(h);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userProfile]);

  // Refetch when page regains focus (e.g. after completing a quiz)
  useEffect(() => {
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchData();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [userProfile?.uid]);

  if (loading) {
    return (
      <DashboardLayout role="student">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </DashboardLayout>
    );
  }

  const lvl = calculateLevel(data?.xp ?? 0);
  const xp = data?.xp ?? 0;
  const earnedBadges = data?.badges ?? [];

  return (
    <DashboardLayout role="student">
      {/* Header */}
      <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-400/15 to-orange-500/15 border-2 border-amber-300/50 dark:border-amber-700/50 shadow-lg shadow-amber-500/5">
        <Link to="/student/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="font-display text-3xl font-bold mb-1">Achievements</h1>
        <p className="text-muted-foreground">Track your XP, badges, and streaks</p>
      </div>

      {/* Level + XP Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <Card className="md:col-span-2 border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" /> Level {lvl.level} — {lvl.title}
            </CardTitle>
            <CardDescription>{xp} / {lvl.nextLevelXp} XP</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={lvl.progress} className="h-3 mb-4" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                { label: 'Total XP', value: xp, icon: '⚡' },
                { label: 'Streak', value: `${data?.streak ?? 0}d`, icon: '🔥' },
                { label: 'Sessions', value: data?.sessionsCompleted ?? 0, icon: '🎓' },
                { label: 'Quizzes', value: data?.quizzesCompleted ?? 0, icon: '🧠' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xl font-bold">{s.icon} {s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="border-orange-100 dark:border-orange-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="h-5 w-5 text-orange-500" /> Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-orange-500">{data?.streak ?? 0}</p>
            <p className="text-sm text-muted-foreground mt-1">days</p>
            <p className="text-xs text-muted-foreground mt-3">Best: {data?.longestStreak ?? 0} days</p>
          </CardContent>
        </Card>
      </div>

      {/* Badges */}
      <Card className="mb-6 border-purple-100 dark:border-purple-900">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-500" /> Badges ({earnedBadges.length}/{BADGES.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {BADGES.map(badge => {
              const unlocked = earnedBadges.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-xl text-center transition-all ${
                    unlocked
                      ? 'bg-gradient-to-br from-white to-muted dark:from-muted dark:to-muted/50 shadow-md'
                      : 'bg-muted/30 opacity-50 grayscale'
                  }`}
                >
                  <span className="text-3xl">{badge.icon}</span>
                  <p className="text-xs font-semibold mt-2">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{badge.description}</p>
                  {unlocked && (
                    <Badge variant="outline" className={`mt-2 text-[10px] border-none bg-gradient-to-r ${tierColors[badge.tier]} text-white`}>
                      {badge.tier}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* XP History */}
        <Card className="border-blue-100 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <History className="h-4 w-4" /> XP History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {history.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                    <div>
                      <p className="font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">+{tx.xpAmount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Leaderboard />
      </div>
    </DashboardLayout>
  );
}
