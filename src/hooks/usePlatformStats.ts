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

        // Calculate average rating
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
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
