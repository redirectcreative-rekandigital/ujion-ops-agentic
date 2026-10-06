import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/shared/page-header";
import { SkillEditor } from "@/components/skills/skill-editor";

export default async function EditSkillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rows = await db.select().from(skills).where(eq(skills.id, Number(id)));
  const skill = rows[0];
  if (!skill) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${skill.name}`} description={skill.description} />
      <SkillEditor
        initial={{
          id: skill.id,
          name: skill.name,
          description: skill.description,
          content: skill.content,
          license: skill.license || "",
          compatibility: skill.compatibility || "opencode",
          metadata: skill.metadata || "{}",
        }}
      />
    </div>
  );
}
