import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents, models } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { AgentSkills, AgentMcp } from "@/components/agents/agent-assignments";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(agents).where(eq(agents.id, Number(id)));
  const agent = rows[0];
  if (!agent) notFound();

  let model = null;
  if (agent.model_id) {
    const m = await db.select().from(models).where(eq(models.id, agent.model_id));
    model = m[0] ?? null;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={agent.display_name}
        description={agent.name}
        action={
          <Button
            variant="outline"
            className="gap-2"
            render={
              <Link href={`/agents/${agent.id}/edit`}>
                <Pencil className="w-4 h-4" /> Edit
              </Link>
            }
          />
        }
      />
      <Card>
        <CardHeader><CardTitle>Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>{agent.description}</p>
          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary">{agent.mode}</Badge>
            {model && <Badge variant="outline">{model.provider}/{model.model_id}</Badge>}
            <Badge variant={agent.is_active ? "default" : "destructive"}>
              {agent.is_active ? "active" : "inactive"}
            </Badge>
            {agent.hidden && <Badge variant="secondary">hidden</Badge>}
          </div>
          <p className="text-muted-foreground">
            temperature {agent.temperature} · steps {agent.steps ?? "unlimited"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>System Prompt</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {agent.prompt || "(kosong)"}
          </pre>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Permissions</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {JSON.stringify(
              { ...JSON.parse(agent.permissions || "{}"), task: JSON.parse(agent.task_permissions || "{}") },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
      <AgentSkills agentId={agent.id} />
      <AgentMcp agentId={agent.id} />
    </div>
  );
}
