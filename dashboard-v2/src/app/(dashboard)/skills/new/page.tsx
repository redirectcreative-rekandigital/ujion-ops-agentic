import { PageHeader } from "@/components/shared/page-header";
import { SkillEditor } from "@/components/skills/skill-editor";

export default function NewSkillPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Buat Skill" description="Frontmatter SKILL.md di-generate otomatis saat sync (10)" />
      <SkillEditor />
    </div>
  );
}
