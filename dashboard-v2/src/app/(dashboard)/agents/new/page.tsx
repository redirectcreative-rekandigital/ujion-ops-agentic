import { PageHeader } from "@/components/shared/page-header";
import { AgentForm } from "@/components/agents/agent-form";

export default function NewAgentPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Tambah Agent" description="Buat agent baru" />
      <AgentForm />
    </div>
  );
}
