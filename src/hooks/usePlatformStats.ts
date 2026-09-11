import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getTutors, getAllUsers, getAllReviews } from "@/lib/firestore";

export interface PlatformStats {
  tutorCount: number;
  studentCount: number;
  subjectCount: number;
  reviewCount: number;
  avgRating: number;
  loading: boolean;
}

export function usePlatformStats(): PlatformStats {
  const [stats, setStats] = useState<PlatformStats>({
    tutorCount: 0,
    studentCount: 0,
    subjectCount: 0,
    reviewCount: 0,
    avgRating: 0,
    loading: true,
  });

  useEffect(() => {
    const fetchStats = async () => {
      // 1) Preferred: public backend counter — real counts for every visitor,
      //    signed in or not, on desktop and mobile.
      try {
        const { data, error } = await supabase.functions.invoke("platform-stats");
        if (!error && data && typeof data.studentCount === "number") {
          setStats({
            tutorCount: data.tutorCount ?? 0,
            studentCount: data.studentCount ?? 0,
            subjectCount: data.subjectCount ?? 0,
            reviewCount: data.reviewCount ?? 0,
            avgRating: data.avgRating ?? 0,
            loading: false,
          });
          return;
        }
      } catch {
        // fall through to client-side reads
      }

      // 2) Fallback: direct client reads (works for authenticated users)
      try {
        const [tutors, users, reviews] = await Promise.all([
          getTutors(),
          getAllUsers(),
          getAllReviews(),
        ]);

        const studentCount = users.filter((u: any) => u.role === "student").length;

        const allSubjects = new Set<string>();
        tutors.forEach((tutor) => {
          tutor.subjects?.forEach((subject) => allSubjects.add(subject));
        });

        const validReviews = reviews.filter((r) => r.rating != null && !isNaN(Number(r.rating)));
        const avgRating =
          validReviews.length > 0
            ? validReviews.reduce((sum, r) => sum + Number(r.rating), 0) / validReviews.length
            : 0;

        setStats({
          tutorCount: tutors.length,
          studentCount,
          subjectCount: allSubjects.size,
          reviewCount: reviews.length,
          avgRating: Math.round(avgRating * 10) / 10,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching platform stats:", error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return stats;
}
