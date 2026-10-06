import Link from "next/link";
import { db } from "@/lib/db";
import { skills } from "@/lib/db/schema";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default async function SkillsPage() {
  const rows = await db.select().from(skills);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Skills"
        description={`${rows.length} skill terdaftar`}
        action={
          <Button
            className="gap-2"
            render={
              <Link href="/skills/new">
                <Plus className="w-4 h-4" /> Buat skill
              </Link>
            }
          />
        }
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada skill. Buat manual atau impor via 12-MIGRATION dari .claude/skills/.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => {
            let isCommand = false;
            try {
              isCommand =
                ((JSON.parse(s.metadata || "{}") as Record<string, unknown>).command === true);
            } catch {
              isCommand = false;
            }
            return (
            <Card key={s.id}>
              <CardHeader className="space-y-0 pb-2">
                <CardTitle className="text-base font-mono">{s.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                <div className="flex gap-1">
                  <Badge variant="secondary">{s.compatibility}</Badge>
                  {isCommand && <Badge variant="outline">command</Badge>}
                  <Badge variant={s.is_active ? "default" : "destructive"}>
                    {s.is_active ? "active" : "inactive"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" render={<Link href={`/skills/${s.id}`}>Edit</Link>} />
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
