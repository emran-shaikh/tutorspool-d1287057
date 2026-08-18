import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, DollarSign, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Course,
  CourseEnrollment,
  DEFAULT_COMMISSION_RATE,
  getAllCourses,
  getAllEnrollments,
  splitRevenue,
  updateCourse,
  updateEnrollment,
} from "@/lib/courses";

export default function ManageCourses() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<CourseEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [c, e] = await Promise.all([getAllCourses(), getAllEnrollments()]);
    setCourses(c);
    setEnrollments(e);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activate = async (enr: CourseEnrollment) => {
    if (!enr.id) return;
    const course = courses.find(c => c.id === enr.courseId);
    const amount = Number(amounts[enr.id] ?? enr.priceUsd);
    const rate = course?.commissionRate ?? enr.commissionRate ?? DEFAULT_COMMISSION_RATE;
    const split = splitRevenue(amount, rate);
    try {
      await updateEnrollment(enr.id, {
        status: "active",
        amountPaidUsd: amount,
        paidAt: new Date().toISOString(),
        activatedBy: user?.uid,
        ...split,
      });
      if (course?.id) {
        await updateCourse(course.id, {
          enrolledCount: (course.enrolledCount || 0) + 1,
          salesTotalUsd: Math.round(((course.salesTotalUsd || 0) + amount) * 100) / 100,
        });
      }
      toast({ title: "Access granted", description: `${enr.studentName} can now start the course.` });
      load();
    } catch (e: any) {
      toast({ title: "Could not activate", description: e?.message, variant: "destructive" });
    }
  };

  const cancel = async (enr: CourseEnrollment) => {
    if (!enr.id) return;
    await updateEnrollment(enr.id, { status: "cancelled" });
    toast({ title: "Request cancelled" });
    load();
  };

  const markPayout = async (enr: CourseEnrollment) => {
    if (!enr.id) return;
    await updateEnrollment(enr.id, { payoutPaid: !enr.payoutPaid });
    load();
  };

  const setCommission = async (course: Course, value: string) => {
    if (!course.id) return;
    await updateCourse(course.id, { commissionRate: Number(value) });
    toast({ title: "Commission updated" });
    load();
  };

  const pending = enrollments.filter(e => e.status === "pending");
  const active = enrollments.filter(e => e.status === "active");
  const revenue = active.reduce((s, e) => s + (e.amountPaidUsd ?? 0), 0);
  const commission = active.reduce((s, e) => s + (e.commissionUsd ?? 0), 0);

  return (
    <DashboardLayout role="admin">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold">Courses</h1>
        <p className="text-muted-foreground mt-1">
          Confirm course payments, unlock access and track platform commission.
        </p>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Courses", value: courses.length, icon: BookOpen },
          { label: "Paid enrollments", value: active.length, icon: Users },
          { label: "Gross revenue", value: `$${revenue.toFixed(2)}`, icon: DollarSign },
          { label: "Platform commission", value: `$${commission.toFixed(2)}`, icon: DollarSign },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
              <s.icon className="h-6 w-6 text-purple-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="requests">
        <TabsList>
          <TabsTrigger value="requests">Requests ({pending.length})</TabsTrigger>
          <TabsTrigger value="sales">Sales ({active.length})</TabsTrigger>
          <TabsTrigger value="catalog">Catalog ({courses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase requests</CardTitle>
              <CardDescription>Confirm the amount received, then grant access.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground py-6 text-center">Loading…</p>
              ) : pending.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">No pending requests.</p>
              ) : (
                pending.map(e => (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-medium">{e.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.courseTitle} · {e.tutorName} · listed ${e.priceUsd}
                      </p>
                      {e.studentEmail && (
                        <p className="text-xs text-muted-foreground">{e.studentEmail}</p>
                      )}
                    </div>
                    <Input
                      type="number"
                      className="w-28"
                      aria-label="Amount received in USD"
                      value={amounts[e.id!] ?? String(e.priceUsd)}
                      onChange={ev => setAmounts({ ...amounts, [e.id!]: ev.target.value })}
                    />
                    <Button size="sm" onClick={() => activate(e)}>Grant access</Button>
                    <Button size="sm" variant="ghost" onClick={() => cancel(e)}>Cancel</Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Paid enrollments</CardTitle>
              <CardDescription>Tutor payouts and platform share per sale.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {active.length === 0 ? (
                <p className="text-muted-foreground py-6 text-center">No sales yet.</p>
              ) : (
                active.map(e => (
                  <div key={e.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border">
                    <div className="flex-1 min-w-[220px]">
                      <p className="font-medium">{e.courseTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {e.studentName} → {e.tutorName}
                      </p>
                    </div>
                    <div className="text-sm text-right">
                      <p>Paid ${Number(e.amountPaidUsd ?? 0).toFixed(2)}</p>
                      <p className="text-muted-foreground">
                        Tutor ${Number(e.tutorEarningsUsd ?? 0).toFixed(2)} · Platform $
                        {Number(e.commissionUsd ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant={e.payoutPaid ? "secondary" : "outline"}
                      onClick={() => markPayout(e)}
                    >
                      {e.payoutPaid ? "Payout sent" : "Mark payout sent"}
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>All courses</CardTitle>
              <CardDescription>Adjust the platform commission per course.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {courses.map(c => (
                <div key={c.id} className="flex flex-wrap items-center gap-3 p-3 rounded-lg border">
                  <div className="flex-1 min-w-[220px]">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.tutorName} · ${c.priceUsd} · {c.enrolledCount} enrolled
                    </p>
                  </div>
                  <Badge variant={c.status === "published" ? "default" : "secondary"} className="capitalize">
                    {c.status}
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      className="w-20"
                      aria-label={`Commission rate for ${c.title}`}
                      defaultValue={c.commissionRate ?? DEFAULT_COMMISSION_RATE}
                      onBlur={ev => setCommission(c, ev.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">% fee</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
