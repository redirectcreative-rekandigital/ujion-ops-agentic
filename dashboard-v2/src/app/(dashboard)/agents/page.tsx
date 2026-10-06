import Link from "next/link";
import { db } from "@/lib/db";
import { agents, models } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AgentCard } from "@/components/agents/agent-card";
import { Plus } from "lucide-react";

export default async function AgentsPage() {
  const rows = await db
    .select({
      agent: agents,
      model_provider: models.provider,
      model_name: models.model_id,
      model_display: models.display_name,
    })
    .from(agents)
    .leftJoin(models, eq(agents.model_id, models.id));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agents"
        description={`${rows.length} agent terdaftar`}
        action={
          <Button
            className="gap-2"
            render={
              <Link href="/agents/new">
                <Plus className="w-4 h-4" /> Tambah agent
              </Link>
            }
          />
        }
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada agent. Tambah manual atau impor via 12-MIGRATION dari .claude/agents/.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((item) => (
            <AgentCard key={item.agent.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
