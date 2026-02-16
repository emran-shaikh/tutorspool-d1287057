import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, Mail, Calendar, RefreshCw } from "lucide-react";
import { getDemoRequests, updateDemoRequest, type DemoRequest } from "@/lib/firestore";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  contacted: "bg-blue-100 text-blue-800 border-blue-300",
  scheduled: "bg-purple-100 text-purple-800 border-purple-300",
  completed: "bg-green-100 text-green-800 border-green-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
};

export function DemoRequests() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const data = await getDemoRequests();
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleStatusChange = async (id: string, status: DemoRequest["status"]) => {
    try {
      await updateDemoRequest(id, { status });
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const formatDate = (timestamp: any) => {
    try {
      const date = timestamp?.toDate?.() || new Date(timestamp);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return "N/A"; }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Demo Requests
              {requests.filter(r => r.status === "pending").length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                  {requests.filter(r => r.status === "pending").length}
                </span>
              )}
            </CardTitle>
            <CardDescription>Manage incoming demo session bookings</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchRequests} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No demo requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{req.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm">
                        <a href={`mailto:${req.email}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Mail className="h-3 w-3" /> {req.email}
                        </a>
                        <a href={`tel:${req.phone}`} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
                          <Phone className="h-3 w-3" /> {req.phone}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(req.timestamp)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_COLORS[req.status] || ""}>
                        {req.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select value={req.status} onValueChange={(v) => handleStatusChange(req.id!, v as DemoRequest["status"])}>
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
