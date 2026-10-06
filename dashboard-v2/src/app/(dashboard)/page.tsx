import { db } from "@/lib/db";
import { agents, tasks, approvals, logs } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Users, CheckSquare, ClipboardCheck, ScrollText } from "lucide-react";

export default async function DashboardPage() {
  const [taskCount] = await db.select({ count: count() }).from(tasks);
  const [pendingApprovals] = await db.select({ count: count() }).from(approvals).where(eq(approvals.status, "pending"));
  const [logCount] = await db.select({ count: count() }).from(logs);
  const recentTasks = await db.select().from(tasks).orderBy(desc(tasks.updated_at)).limit(5);
  const activeAgents = await db.select().from(agents).where(eq(agents.is_active, true));

  const stats = [
    { label: "Active Agents", value: activeAgents.length, icon: Users },
    { label: "Total Tasks", value: taskCount.count, icon: CheckSquare },
    { label: "Pending Approvals", value: pendingApprovals.count, icon: ClipboardCheck },
    { label: "Log Entries", value: logCount.count, icon: ScrollText },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview agent & task activity" />

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          {recentTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada task. Task dibuat di 06-TASK-APPROVAL atau terisi via migrasi.
            </p>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTasks.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.task_id}</TableCell>
                    <TableCell>{t.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t.status}</Badge>
                    </TableCell>
                    <TableCell>{t.priority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Status */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Status</CardTitle>
        </CardHeader>
        <CardContent>
          {activeAgents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada agent aktif. Agent terisi via 12-MIGRATION dari .claude/agents/.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {activeAgents.map((a) => (
                <Badge key={a.id} variant="secondary" className="gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: a.color }}
                  />
                  {a.display_name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
