"use client";

import { useEffect, useState } from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface Model {
  id: number;
  provider: string;
  model_id: string;
  display_name: string;
  context_window: number | null;
}

export function ModelSelect({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number | null) => void;
}) {
  const [models, setModels] = useState<Model[]>([]);

  useEffect(() => {
    fetch("/api/models").then(async (r) => {
      if (r.ok) setModels(await r.json());
    });
  }, []);

  const byProvider = models.reduce<Record<string, Model[]>>((acc, m) => {
    (acc[m.provider] ||= []).push(m);
    return acc;
  }, {});

  return (
    <Select
      value={value ? String(value) : "none"}
      onValueChange={(v) => onChange(v === "none" ? null : Number(v))}
    >
      <SelectTrigger>
        <SelectValue placeholder="Pilih model" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Tanpa model (default global)</SelectItem>
        {Object.entries(byProvider).map(([provider, list]) => (
          <div key={provider}>
            <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">
              {provider}
            </p>
            {list.map((m) => (
              <SelectItem key={m.id} value={String(m.id)}>
                {m.display_name}
                {m.context_window ? ` · ${(m.context_window / 1000).toFixed(0)}k` : ""}
              </SelectItem>
            ))}
          </div>
        ))}
      </SelectContent>
    </Select>
  );
}
