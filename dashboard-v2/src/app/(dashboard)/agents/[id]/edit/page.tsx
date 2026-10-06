import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { AgentForm } from "@/components/agents/agent-form";

export default async function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(agents).where(eq(agents.id, Number(id)));
  const agent = rows[0];
  if (!agent) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${agent.display_name}`} description={agent.name} />
      <AgentForm
        initial={{
          id: agent.id,
          name: agent.name,
          display_name: agent.display_name,
          description: agent.description,
          mode: agent.mode as "primary" | "subagent" | "all",
          model_id: agent.model_id,
          prompt: agent.prompt,
          permissions: agent.permissions,
          color: agent.color,
          avatar_url: agent.avatar_url || "",
          avatar_3d: agent.avatar_3d || "",
          temperature: agent.temperature ?? 0.3,
          steps: agent.steps ? String(agent.steps) : "",
          hidden: !!agent.hidden,
          is_active: !!agent.is_active,
        }}
      />
    </div>
  );
}
