
# Complete Gamification System for TutorsPool

## Overview
Build a comprehensive gamification system that rewards students for learning activities with XP points, levels, badges, streaks, and a leaderboard -- motivating continued engagement on the platform.

## Core Components

### 1. Firestore Data Model

**New Collection: `studentGamification`** (keyed by student UID)
- `xp` (number) -- total experience points
- `level` (number) -- current level (calculated from XP thresholds)
- `streak` (number) -- consecutive days of activity
- `lastActiveDate` (string) -- ISO date of last activity (for streak tracking)
- `longestStreak` (number) -- personal best streak
- `badges` (array of strings) -- earned badge IDs
- `sessionsCompleted` (number) -- lifetime counter
- `quizzesCompleted` (number) -- lifetime counter
- `goalsCompleted` (number) -- lifetime counter
- `totalStudyHours` (number)
- `createdAt` (string)
- `updatedAt` (string)

**New Collection: `xpTransactions`** (activity log)
- `studentId`, `type` (session_completed, quiz_completed, goal_achieved, streak_bonus, login_bonus, perfect_quiz), `xpAmount`, `description`, `createdAt`

### 2. XP Reward Rules

| Activity | XP Earned |
|---|---|
| Complete a tutoring session | +50 XP |
| Complete a quiz | +30 XP |
| Perfect quiz score (100%) | +50 XP bonus |
| Achieve a learning goal (100%) | +100 XP |
| Daily login streak bonus | +10 XP per day |
| 7-day streak bonus | +50 XP |
| 30-day streak bonus | +200 XP |

### 3. Leveling System

| Level | Title | XP Required |
|---|---|---|
| 1 | Beginner | 0 |
| 2 | Learner | 100 |
| 3 | Explorer | 300 |
| 4 | Achiever | 600 |
| 5 | Scholar | 1000 |
| 6 | Expert | 1500 |
| 7 | Master | 2500 |
| 8 | Champion | 4000 |
| 9 | Legend | 6000 |
| 10 | Grandmaster | 10000 |

### 4. Badges System

- **First Steps** -- Complete first session
- **Quiz Whiz** -- Complete 5 quizzes
- **Perfect Score** -- Get 100% on a quiz
- **Goal Getter** -- Complete first learning goal
- **Streak Starter** -- 3-day streak
- **Week Warrior** -- 7-day streak
- **Monthly Master** -- 30-day streak
- **Session Pro** -- Complete 10 sessions
- **Knowledge Seeker** -- Complete 25 quizzes
- **Dedicated Learner** -- Reach Level 5
- **Top Scholar** -- Reach Level 10

### 5. New Files to Create

**`src/lib/gamification.ts`** -- Core logic
- `initializeGamification(studentId)` -- create initial record
- `awardXP(studentId, type, amount)` -- add XP + log transaction
- `checkAndAwardBadges(studentId, stats)` -- evaluate badge criteria
- `updateStreak(studentId)` -- streak management on login
- `calculateLevel(xp)` -- derive level from XP
- `getLeaderboard(limit)` -- fetch top students by XP
- `getStudentGamification(studentId)` -- fetch profile
- `getXPHistory(studentId, limit)` -- recent transactions

**`src/pages/student/Achievements.tsx`** -- Full achievements page
- Current level with animated XP progress bar to next level
- All badges (earned shown in color, locked shown greyed out with requirements)
- XP activity history/timeline
- Current streak display with calendar heat map

**`src/components/gamification/LevelBadge.tsx`** -- Reusable level indicator
- Gradient icon with level number, shown in dashboard header

**`src/components/gamification/XPNotification.tsx`** -- Toast-style popup
- Animated "+50 XP" notification when XP is earned

**`src/components/gamification/StreakCounter.tsx`** -- Flame icon with streak count

**`src/components/gamification/Leaderboard.tsx`** -- Top 10 students widget

### 6. Integration Points

- **Student Dashboard** -- Add gamification summary card (level, XP bar, streak, recent badges), plus leaderboard widget
- **TakeQuiz.tsx** -- Award XP on quiz completion; bonus for perfect score
- **MySessions.tsx** -- Award XP when session is marked completed
- **LearningGoals.tsx** -- Award XP when goal reaches 100%
- **AuthContext / Dashboard load** -- Call `updateStreak()` on each login to maintain streak tracking
- **App.tsx** -- Add route `/student/achievements`
- **DashboardLayout.tsx** -- Show level badge + streak counter in header for students

### 7. Firestore Security Rules

```
match /studentGamification/{studentId} {
  allow read: if true;  // for leaderboard
  allow create, update: if request.auth != null && request.auth.uid == studentId;
}

match /xpTransactions/{transactionId} {
  allow read: if request.auth != null && request.auth.uid == resource.data.studentId;
  allow create: if request.auth != null;
}
```

### 8. UI Design

- Follows existing blue theme for student dashboard
- Gradient badges with gold/purple/blue tiers
- Animated progress bars for XP
- Fire emoji/icon for streaks
- Trophy icons for leaderboard positions
- Glass-morphism cards consistent with the announcement redesign

## Implementation Order

1. Create `src/lib/gamification.ts` with all Firestore CRUD and logic
2. Create UI components (LevelBadge, StreakCounter, XPNotification, Leaderboard)
3. Create the Achievements page
4. Integrate XP awarding into TakeQuiz, MySessions, LearningGoals
5. Add streak tracking on dashboard load
6. Update StudentDashboard with gamification summary card + leaderboard
7. Add route and navigation link
8. Update Firestore security rules documentation
