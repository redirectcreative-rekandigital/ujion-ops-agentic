"use client";

import { Fragment } from "react";
import { Checkbox } from "@/components/ui/checkbox";

export const PERMISSION_TOOLS = [
  "edit", "bash", "read", "glob", "grep",
  "todowrite", "task", "skill", "webfetch", "websearch",
] as const;

export type PermValue = "allow" | "ask" | "deny";
export type PermMap = Record<string, PermValue | Record<string, string>>;

// ---- Permission matrix ----
export function PermissionEditor({
  value,
  onChange,
  subagents,
}: {
  value: PermMap;
  onChange: (v: PermMap) => void;
  subagents: string[];
}) {
  function set(tool: string, v: PermValue) {
    onChange({ ...value, [tool]: v });
  }

  const taskVal = value.task;
  const taskMode: PermValue = typeof taskVal === "string" ? taskVal : taskVal ? "allow" : "deny";
  const taskAllows: Record<string, string> =
    typeof taskVal === "object" && taskVal !== null ? { ...(taskVal as Record<string, string>) } : { "*": "deny" };

  function toggleSubagent(name: string, checked: boolean) {
    const next = { ...taskAllows };
    if (checked) next[name] = "allow";
    else delete next[name];
    if (!next["*"]) next["*"] = "deny";
    onChange({ ...value, task: next });
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[1fr_repeat(3,52px)] gap-1 items-center text-sm">
        <span className="font-medium">Tool</span>
        {(["allow", "ask", "deny"] as PermValue[]).map((m) => (
          <span key={m} className="text-center text-xs text-muted-foreground capitalize">{m}</span>
        ))}
        {PERMISSION_TOOLS.filter((t) => t !== "task").map((tool) => (
          <Fragment key={tool}>
            <span className="font-mono text-xs">{tool}</span>
            {(["allow", "ask", "deny"] as PermValue[]).map((m) => (
              <input
                key={m}
                type="radio"
                name={`perm-${tool}`}
                className="mx-auto"
                checked={(value[tool] as PermValue | undefined) === m || (!value[tool] && m === "deny")}
                onChange={() => set(tool, m)}
              />
            ))}
          </Fragment>
        ))}
        <span className="font-mono text-xs">task</span>
        {(["allow", "ask", "deny"] as PermValue[]).map((m) => (
          <input
            key={m}
            type="radio"
            name="perm-task"
            className="mx-auto"
            checked={taskMode === m}
            onChange={() => {
              if (m === "deny") {
                const next = { ...value };
                delete next.task;
                onChange(next);
              } else {
                onChange({ ...value, task: { "*": "deny" } });
              }
            }}
          />
        ))}
      </div>
      {taskMode !== "deny" && (
        <div className="rounded-md border p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Subagent yang boleh dipanggil:</p>
          {subagents.map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={taskAllows[s] === "allow"}
                onCheckedChange={(c) => toggleSubagent(s, c === true)}
              />
              <span className="font-mono text-xs">{s}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
