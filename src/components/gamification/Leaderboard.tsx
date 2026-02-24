import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { getLeaderboard, calculateLevel, type StudentGamification } from '@/lib/gamification';
import { Skeleton } from '@/components/ui/skeleton';

type LeaderEntry = StudentGamification & { id: string; fullName?: string };

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLeaderboard(10).then(setEntries).catch(console.error).finally(() => setLoading(false));
  }, []);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card className="border-amber-100 dark:border-amber-900">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="p-1.5 rounded-md bg-gradient-to-br from-amber-400 to-yellow-500">
            <Trophy className="h-4 w-4 text-white" />
          </div>
          Leaderboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No students yet</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const lvl = calculateLevel(entry.xp);
              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between p-2 rounded-lg text-sm ${
                    idx < 3 ? 'bg-amber-50/50 dark:bg-amber-950/20' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 text-center font-bold">
                      {idx < 3 ? medals[idx] : idx + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{entry.fullName || 'Student'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Lv.{lvl.level}</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">{entry.xp} XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
