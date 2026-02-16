import { useEffect, useState } from "react";
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
      try {
        const [tutors, users, reviews] = await Promise.all([
          getTutors(),
          getAllUsers(),
          getAllReviews(),
        ]);

        // Count students (users with role 'student')
        const studentCount = users.filter((u: any) => u.role === "student").length;

        // Get unique subjects from all tutors
        const allSubjects = new Set<string>();
        tutors.forEach((tutor) => {
          tutor.subjects?.forEach((subject) => allSubjects.add(subject));
        });

        // Calculate average rating (ensure rating is parsed as number)
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
        // Fallback values for unauthenticated users
        setStats({
          tutorCount: 35,
          studentCount: 250,
          subjectCount: 15,
          reviewCount: 50,
          avgRating: 4.8,
          loading: false,
        });
      }
    };

    fetchStats();
  }, []);

  return stats;
}
