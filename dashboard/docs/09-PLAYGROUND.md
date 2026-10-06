# 09 — Playground & Scheduled Tasks

## 1. Agent Chat Playground

### Halaman Playground

`src/app/(dashboard)/playground/page.tsx`

Layout: chat interface dengan sidebar konfigurasi.

```
┌─────────────┬──────────────────────────────────────┐
│ CONFIG      │  CHAT                                 │
│             │                                       │
│ Agent:      │  ┌─────────────────────────────┐     │
│ [Joko    ▾] │  │ User: Buat kampanye IG 2mg  │     │
│             │  └─────────────────────────────┘     │
│ Model:      │                                       │
│ [GPT-4o  ▾] │  ┌─────────────────────────────┐     │
│             │  │ Joko: Saya akan menyusun... │     │
│ Session:    │  │ [Tool: Task → budi-konten]  │     │
│ [New     ▾] │  │ [Tool: Read → BOARD.md]     │     │
│             │  │ Rencana: 1. Riset...        │     │
│ [Start]     │  └─────────────────────────────┘     │
│             │                                       │
│             │  ┌─────────────────────────────┐     │
│ Tools:      │  │ > Ketik pesan...            │     │
│ ☑ task      │  └─────────────────────────────┘     │
│ ☑ read      │                                       │
│ ☑ write     │                                       │
│ ☐ bash      │                                       │
│ ☑ webfetch  │                                       │
│             │                                       │
│ MCP:        │                                       │
│ ☑ sheets    │                                       │
│ ☐ sentry    │                                       │
└─────────────┴───────────────────────────────────────┘
```

### Membuat Session Baru

```typescript
async function createSession(agentName: string, model?: string) {
  const res = await fetch("/api/opencode/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ agent: agentName, model }),
  });
  const { session } = await res.json();
  return session;
}
```

### Kirim Pesan

```typescript
async function sendMessage(sessionId: string, message: string) {
  const res = await fetch(`/api/opencode/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parts: [{ type: "text", text: message }],
    }),
  });
  const { info, parts } = await res.json();
  return { info, parts };
}
```

### Kirim Pesan Async (streaming)

```typescript
async function sendMessageAsync(sessionId: string, message: string) {
  // POST /session/:id/prompt_async → 204 No Content
  await fetch(`/api/opencode/session/${sessionId}/prompt_async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      parts: [{ type: "text", text: message }],
    }),
  });

  // Listen via SSE for response parts
  // GET /event → stream events
}
```

### Response Rendering

Setiap response part di-render berdasarkan type:

| Part Type | Render |
|---|---|
| `text` | Markdown rendered |
| `tool_call` | Collapsible block: tool name + args + result |
| `file` | File diff viewer |
| `error` | Red error block |
| `reasoning` | Italic, dimmed (untuk o1/reasoning models) |

### Tool Call Inspector

Saat agent memanggil tool (task, read, write, bash, dll), tampilkan:

```
┌─ TOOL CALL ──────────────────────────────┐
│ 🔧 task({ agent: "budi-konten", ... })    │
│                                            │
│ Args:                                      │
│ {                                          │
│   "agent": "budi-konten",                  │
│   "prompt": "Buat 5 caption IG...",        │
│   "description": "Caption IG"              │
│ }                                          │
│                                            │
│ Result: ✓ Success (2.3s)                   │
│ [Budi created session xyz789]              │
└────────────────────────────────────────────┘
```

### Session Management

- List recent sessions (dari opencode `GET /session`)
- Switch between sessions
- Fork session (branch dari message tertentu)
- Abort running session (`POST /session/:id/abort`)
- Delete session (`DELETE /session/:id`)
- View session diff (`GET /session/:id/diff`)

### Slash Commands

Support slash commands di chat input:

| Command | Fungsi |
|---|---|
| `/agent <name>` | Switch agent |
| `/model <model>` | Switch model |
| `/skill <name>` | Load skill |
| `/clear` | Clear session |
| `/compact` | Compact context |
| `/share` | Share session |

Eksekusi via `POST /session/:id/command`:
```typescript
async function executeCommand(sessionId: string, command: string, args: string) {
  const res = await fetch(`/api/opencode/session/${sessionId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, arguments: args }),
  });
  return await res.json();
}
```

## 2. Scheduled Tasks

### Konsep

Task dengan `schedule_cron` di DB akan dijalankan otomatis pada jadwal yang ditentukan.

### Scheduler Implementation

`src/lib/scheduler.ts`:

```typescript
import { db } from "@/lib/db";
import { tasks, agents, models } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import cron from "node-cron";

const scheduledJobs = new Map<number, cron.ScheduledTask>();

export async function initScheduler() {
  // Load all tasks with schedule_cron
  const scheduled = await db.select()
    .from(tasks)
    .where(sql`${tasks.schedule_cron} IS NOT NULL`);

  for (const task of scheduled) {
    if (task.schedule_cron && cron.validate(task.schedule_cron)) {
      const job = cron.schedule(task.schedule_cron, () => executeScheduledTask(task.id));
      scheduledJobs.set(task.id, job);
    }
  }

  console.log(`Scheduler initialized: ${scheduledJobs.size} jobs`);
}

async function executeScheduledTask(taskId: number) {
  // 1. Get task + agent info
  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));
  if (!task || !task.agent_id) return;

  const [agent] = await db.select().from(agents).where(eq(agents.id, task.agent_id));
  if (!agent) return;

  // 2. Create opencode session
  const session = await createSession(agent.name, agent.model_id);

  // 3. Send task as message
  const message = `Jalankan tugas: ${task.title}\n\nDeskripsi: ${task.description}\n\nOutput: ${task.output_path || "sesuai konteks"}`;
  await sendMessageAsync(session.id, message);

  // 4. Log execution
  await db.insert(logs).values({
    session_id: session.id,
    agent_id: agent.id,
    level: "info",
    message: `Scheduled task executed: ${task.title}`,
  });
}
```

### Scheduler API

`src/app/api/scheduler/route.ts`:
```typescript
// GET: list scheduled tasks + their next run time
// POST: manually trigger a scheduled task
// DELETE: pause a scheduled task
```

### Schedule UI

Di task edit form, ada field "Schedule (cron)":
- Text input untuk cron expression
- Helper text dengan contoh:
  - `0 9 * * 1` — setiap Senin jam 9 pagi
  - `0 */6 * * *` — setiap 6 jam
  - `0 0 * * *` — setiap hari tengah malam
- Preview: "Next run: 2024-10-07 09:00"
- Toggle: enable/disable schedule

### Dependencies

```bash
npm install node-cron
npm install -D @types/node-cron
```

## 3. Batch Execution

### Batch Page

`src/app/(dashboard)/playground/batch/page.tsx`

Jalankan multiple agent sekaligus:

1. Select task(s) dari task list
2. Select agent(s) untuk eksekusi
3. Mode:
   - **Sequential**: agent 1 → tunggu selesai → agent 2
   - **Parallel**: semua agent jalan bersamaan
   - **Chain**: output agent 1 → input agent 2

4. Start → monitor progress di real-time
5. Results aggregated per agent

### Batch API

`src/app/api/batch/route.ts`:
```typescript
// POST: start batch execution
// body: { task_ids: number[], agent_ids: number[], mode: "sequential" | "parallel" | "chain" }
//   - create sessions per agent
//   - execute in specified mode
//   - return batch_id for tracking

// GET /api/batch/[id]: get batch status
```
