import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowRight, BookOpen, PlayCircle, Users, Sparkles } from "lucide-react";
import { Price } from "@/components/Price";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedCourses, Course } from "@/lib/courses";
import Autoplay from "embla-carousel-autoplay";

export function FeaturedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<any>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await getPublishedCourses();
      if (active) {
        setCourses(data.slice(0, 10));
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (loading) {
    return (
      <section className="py-20 bg-muted/20">
        <div className="container">
          <div className="text-center mb-14">
            <Skeleton className="h-8 w-44 mx-auto mb-4 rounded-full" />
            <Skeleton className="h-10 w-96 max-w-full mx-auto mb-4" />
            <Skeleton className="h-5 w-[28rem] max-w-full mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-[var(--shadow-card)]">
                <Skeleton className="h-44 w-full rounded-none" />
                <div className="p-5">
                  <div className="flex gap-2 mb-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/3 mb-3" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-4" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) return null;

  return (
    <section className="py-20 bg-gradient-to-b from-background via-primary/5 to-background">
      <div className="container">
        <div className="text-center mb-14">
          <Badge variant="outline" className="mb-4 px-4 py-1.5 text-sm border-primary/30 text-primary">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Self-Paced Courses
          </Badge>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Learn at Your Own Pace with{" "}
            <span className="text-primary">Expert Courses</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Video lessons, structured notes and downloadable materials — built by the same verified
            tutors who teach live on TutorsPool.
          </p>
        </div>

        <div className="relative px-2 sm:px-10">
          <Carousel
            opts={{
              align: "start",
              loop: courses.length > 3,
            }}
            plugins={[
              Autoplay({
                delay: 4500,
                stopOnInteraction: true,
                stopOnMouseEnter: true,
              }),
            ]}
            setApi={setApi}
            className="w-full"
          >
            <CarouselContent className="-ml-5">
              {courses.map((c) => (
                <CarouselItem
                  key={c.id}
                  className="pl-5 basis-full sm:basis-1/2 lg:basis-1/3"
                >
                  <Link to={`/courses/${c.id}`} className="block h-full">
                    <Card className="flex flex-col overflow-hidden h-full hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 group">
                      <div className="relative h-44 w-full overflow-hidden">
                        {c.coverImageUrl ? (
                          <img
                            src={c.coverImageUrl}
                            alt={`${c.title} course cover`}
                            loading="lazy"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <PlayCircle className="h-12 w-12 text-primary/60" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-background/90 text-foreground border-0 shadow-md">
                            <Price usd={c.priceUsd} />
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5 flex flex-col flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="secondary" className="text-xs">{c.subject}</Badge>
                          <Badge variant="outline" className="text-xs">{c.level}</Badge>
                        </div>
                        <h3 className="font-display text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {c.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">by {c.tutorName}</p>
                        {c.shortDescription && (
                          <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                            {c.shortDescription}
                          </p>
                        )}
                        {c.enrolledCount > 0 && (
                          <p className="mt-3 text-sm text-muted-foreground flex items-center gap-1.5">
                            <Users className="h-4 w-4" /> {c.enrolledCount} enrolled
                          </p>
                        )}
                        <div className="mt-auto pt-4">
                          <span className="inline-flex items-center text-sm font-semibold text-primary">
                            View course
                            <ArrowRight className="h-4 w-4 ml-1 rtl:rotate-180 transition-transform group-hover:translate-x-1" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex -left-4 lg:-left-6 h-10 w-10 shadow-lg" />
            <CarouselNext className="hidden sm:flex -right-4 lg:-right-6 h-10 w-10 shadow-lg" />
          </Carousel>

          {/* Dot indicators */}
          {count > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              {Array.from({ length: count }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => api?.scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    current === i + 1
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Link to="/courses">
            <Button size="lg" className="px-8 shadow-lg shadow-primary/20">
              <BookOpen className="h-5 w-5 mr-2" />
              Browse All Courses
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
