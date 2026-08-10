import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, Check, X, Pause, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  getAllGroupPackages,
  getAllGroupSubscriptions,
  updateGroupPackage,
  deleteGroupPackage,
  updateGroupSubscription,
  deleteGroupSubscription,
  formatSchedule,
  GroupPackage,
  GroupSubscription,
} from "@/lib/groupClasses";

const pkgStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  paused: "bg-slate-100 text-slate-700",
  archived: "bg-slate-100 text-slate-500",
};

const subStatusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  active: "bg-emerald-100 text-emerald-800",
  expired: "bg-slate-100 text-slate-600",
  cancelled: "bg-red-100 text-red-800",
};

const monthFromNow = () => {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split("T")[0];
};

export default function ManageGroupClasses() {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [packages, setPackages] = useState<GroupPackage[]>([]);
  const [subs, setSubs] = useState<GroupSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  const [rejectTarget, setRejectTarget] = useState<GroupPackage | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const [activateTarget, setActivateTarget] = useState<GroupSubscription | null>(null);
  const [paidThrough, setPaidThrough] = useState(monthFromNow());
  const [working, setWorking] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [pkgs, s] = await Promise.all([getAllGroupPackages(), getAllGroupSubscriptions()]);
    setPackages(pkgs);
    setSubs(s);
    setLoading(false);
  };

  const pendingPackages = useMemo(() => packages.filter(p => p.status === "pending"), [packages]);
  const otherPackages = useMemo(() => packages.filter(p => p.status !== "pending"), [packages]);

  const setPackageStatus = async (pkg: GroupPackage, status: GroupPackage["status"], note?: string) => {
    try {
      await updateGroupPackage(pkg.id!, { status, ...(note !== undefined ? { rejectionNote: note } : {}) });
      toast({ title: `Package ${status}` });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message, variant: "destructive" });
    }
  };

  const removePackage = async (pkg: GroupPackage) => {
    try {
      await deleteGroupPackage(pkg.id!);
      toast({ title: "Package deleted" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const activateSubscription = async () => {
    if (!activateTarget) return;
    setWorking(true);
    try {
      await updateGroupSubscription(activateTarget.id!, {
        status: "active",
        paidThrough,
        activatedBy: userProfile?.uid,
      });
      if (activateTarget.status !== "active") {
        const pkg = packages.find(p => p.id === activateTarget.packageId);
        if (pkg) {
          await updateGroupPackage(pkg.id!, { enrolledCount: (pkg.enrolledCount || 0) + 1 });
        }
      }
      toast({ title: "Subscription activated" });
      setActivateTarget(null);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Could not activate", description: e?.message, variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const cancelSubscription = async (sub: GroupSubscription) => {
    try {
      await updateGroupSubscription(sub.id!, { status: "cancelled" });
      if (sub.status === "active") {
        const pkg = packages.find(p => p.id === sub.packageId);
        if (pkg) {
          await updateGroupPackage(pkg.id!, { enrolledCount: Math.max(0, (pkg.enrolledCount || 0) - 1) });
        }
      }
      toast({ title: "Subscription cancelled" });
      fetchAll();
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  const removeSubscription = async (sub: GroupSubscription) => {
    try {
      await deleteGroupSubscription(sub.id!);
      toast({ title: "Request removed" });
      fetchAll();
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="admin">
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      </DashboardLayout>
    );
  }

  const renderPackage = (pkg: GroupPackage) => (
    <div key={pkg.id} className="p-4 border rounded-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{pkg.title}</p>
            <Badge className={`${pkgStatusStyles[pkg.status]} border-0 capitalize`}>{pkg.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {pkg.tutorName} · {pkg.subject} · {pkg.level} · ${pkg.priceUsd}/month ·{" "}
            {pkg.enrolledCount || 0}/{pkg.seatLimit} enrolled
          </p>
          <p className="text-sm text-muted-foreground">{formatSchedule(pkg.schedule)}</p>
          {pkg.description && <p className="text-sm mt-2">{pkg.description}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {pkg.status !== "approved" && (
            <Button size="sm" onClick={() => setPackageStatus(pkg, "approved", "")}>
              <Check className="h-4 w-4 mr-1" /> Approve
            </Button>
          )}
          {pkg.status === "pending" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setRejectTarget(pkg); setRejectNote(""); }}
            >
              <X className="h-4 w-4 mr-1" /> Reject
            </Button>
          )}
          {pkg.status === "approved" && (
            <Button size="sm" variant="outline" onClick={() => setPackageStatus(pkg, "paused")}>
              <Pause className="h-4 w-4 mr-1" /> Pause
            </Button>
          )}
          {pkg.status === "paused" && (
            <Button size="sm" variant="outline" onClick={() => setPackageStatus(pkg, "approved")}>
              <Play className="h-4 w-4 mr-1" /> Resume
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => removePackage(pkg)} aria-label="Delete package">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2">
          <Users className="h-7 w-7 text-purple-600" /> Group Classes
        </h1>
        <p className="text-muted-foreground">
          Approve tutor packages and activate student subscriptions once payment is confirmed.
        </p>
      </div>

      <Tabs defaultValue="packages">
        <TabsList>
          <TabsTrigger value="packages">Packages ({packages.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions ({subs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="packages" className="mt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending approval ({pendingPackages.length})</CardTitle>
              <CardDescription>Tutor-proposed packages waiting for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingPackages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing waiting for review.</p>
              ) : (
                pendingPackages.map(renderPackage)
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>All other packages ({otherPackages.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {otherPackages.length === 0 ? (
                <p className="text-sm text-muted-foreground">No packages yet.</p>
              ) : (
                otherPackages.map(renderPackage)
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Student subscriptions</CardTitle>
              <CardDescription>
                Mark a request active after payment is confirmed over WhatsApp or bank transfer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {subs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subscription requests yet.</p>
              ) : (
                subs.map(s => (
                  <div key={s.id} className="p-4 border rounded-lg flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{s.studentName}</p>
                        <Badge className={`${subStatusStyles[s.status]} border-0 capitalize`}>{s.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {s.packageTitle} · tutor {s.tutorName || "—"} · {s.studentEmail || "no email"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Requested {new Date(s.createdAt).toLocaleDateString()}
                        {s.paidThrough ? ` · paid through ${new Date(s.paidThrough).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => { setActivateTarget(s); setPaidThrough(monthFromNow()); }}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        {s.status === "active" ? "Renew" : "Activate"}
                      </Button>
                      {s.status !== "cancelled" && (
                        <Button size="sm" variant="outline" onClick={() => cancelSubscription(s)}>
                          Cancel
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => removeSubscription(s)} aria-label="Delete request">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectTarget} onOpenChange={o => !o && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject group class</DialogTitle>
            <DialogDescription>The tutor sees this note on their dashboard.</DialogDescription>
          </DialogHeader>
          <div>
            <Label>Reason</Label>
            <Input value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="e.g. Price too high for this level" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (rejectTarget) await setPackageStatus(rejectTarget, "rejected", rejectNote.trim());
                setRejectTarget(null);
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activateTarget} onOpenChange={o => !o && setActivateTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activate subscription</DialogTitle>
            <DialogDescription>
              Confirms {activateTarget?.studentName}'s seat in {activateTarget?.packageTitle}.
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>Paid through</Label>
            <Input type="date" value={paidThrough} onChange={e => setPaidThrough(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActivateTarget(null)}>Cancel</Button>
            <Button onClick={activateSubscription} disabled={working}>
              {working ? "Saving…" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
