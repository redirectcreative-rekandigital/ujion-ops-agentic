# 01 — Project Setup

## Inisialisasi Project

Buat Next.js 15 project di dalam direktori `dashboard/` (replace file lama).

```bash
# Backup dashboard lama
mv dashboard/dashboard-old server.mjs index.html uji.mjs contoh/  # (atau hapus)

# Init Next.js 15
cd dashboard/
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Jawab prompt:
# - TypeScript: Yes
# - ESLint: Yes
# - Tailwind CSS: Yes
# - src/ directory: Yes
# - App Router: Yes
# - Import alias: @/*
```

## Dependencies

```bash
# UI Components
npx shadcn@latest init
npx shadcn@latest add button card input label table dialog dropdown-menu \
  select textarea badge avatar separator tabs sheet sidebar tooltip \
  toast form checkbox switch command popover scroll-area skeleton

# Database
npm install drizzle-orm better-sqlite3
npm install -D drizzle-kit @types/better-sqlite3

# Auth & Crypto
npm install jose          # JWT signing
npm install bcryptjs      # (optional, untuk PIN hashing)
npm install -D @types/bcryptjs

# HTTP Client (ke opencode serve)
npm install ky            # atau gunakan fetch native

# SSE Client (untuk log streaming)
npm install eventsource-parser

# State Management
npm install zustand       # UI state
npm install @tanstack/react-query  # server state

# Utilities
npm install zod           # validation
npm install date-fns      # date formatting
npm install lucide-react  # icons (sudah include shadcn)
npm install sonner        # toast notifications
npm install next-themes   # dark mode

# Markdown (untuk skill editor & preview)
npm install react-markdown remark-gfm rehype-highlight

# Code highlighting
npm install prismjs

# Drizzle migration
npm install -D drizzle-kit
```

## Struktur Direktori

```
dashboard/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # root layout (auth check + theme)
│   │   ├── page.tsx                # dashboard utama (/)
│   │   ├── login/
│   │   │   └── page.tsx            # PIN login page
│   │   ├── tasks/
│   │   │   ├── page.tsx            # task list + Kanban
│   │   │   └── [id]/
│   │   │       └── page.tsx        # task detail
│   │   ├── approvals/
│   │   │   └── page.tsx            # approval queue
│   │   ├── agents/
│   │   │   ├── page.tsx            # agent list
│   │   │   ├── new/
│   │   │   │   └── page.tsx        # create agent
│   │   │   └── [id]/
│   │   │       ├── page.tsx        # agent detail (view)
│   │   │       └── edit/
│   │   │           └── page.tsx    # edit agent
│   │   ├── skills/
│   │   │   ├── page.tsx            # skill list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # skill editor + preview
│   │   ├── mcp/
│   │   │   └── page.tsx            # MCP manager
│   │   ├── keys/
│   │   │   └── page.tsx            # API key vault
│   │   ├── models/
│   │   │   └── page.tsx            # model registry
│   │   ├── logs/
│   │   │   └── page.tsx            # log viewer
│   │   ├── kantor/
│   │   │   └── page.tsx            # kantor & avatar customization
│   │   ├── playground/
│   │   │   └── page.tsx            # agent chat interface
│   │   ├── settings/
│   │   │   └── page.tsx            # settings (PIN change, theme, export)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login/route.ts      # POST: validate PIN
│   │       │   └── logout/route.ts     # POST: clear session
│   │       ├── agents/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # GET, PUT, DELETE
│   │       ├── tasks/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # GET, PUT, DELETE
│   │       ├── approvals/
│   │       │   ├── route.ts            # GET list
│   │       │   └── [id]/route.ts       # PUT approve/reject
│   │       ├── skills/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # GET, PUT, DELETE
│   │       ├── mcp/
│   │       │   ├── route.ts            # GET list, POST create
│   │       │   └── [id]/route.ts       # GET, PUT, DELETE
│   │       ├── keys/
│   │       │   ├── route.ts            # GET list (masked), POST add
│   │       │   └── [id]/route.ts       # DELETE
│   │       ├── models/
│   │       │   ├── route.ts            # GET list
│   │       │   └── [id]/route.ts       # PUT update
│   │       ├── logs/
│   │       │   └── route.ts            # GET list with filters
│   │       ├── kantor/
│   │       │   └── route.ts            # GET, PUT
│   │       ├── sync/
│   │       │   └── route.ts            # POST: trigger DB → .opencode/ sync
│   │       └── opencode/
│   │           └── [...path]/route.ts  # proxy to opencode serve API
│   ├── components/
│   │   ├── ui/                         # shadcn components
│   │   ├── layout/
│   │   │   ├── app-sidebar.tsx         # sidebar navigation
│   │   │   ├── app-header.tsx          # header (user info, logout)
│   │   │   └── app-footer.tsx          # footer
│   │   ├── auth/
│   │   │   └── pin-login.tsx           # PIN input form
│   │   ├── agents/
│   │   │   ├── agent-form.tsx          # create/edit form
│   │   │   ├── agent-card.tsx          # agent card display
│   │   │   ├── model-select.tsx        # model dropdown
│   │   │   ├── avatar-picker.tsx       # avatar selection
│   │   │   └── permission-editor.tsx   # permission matrix
│   │   ├── tasks/
│   │   │   ├── task-board.tsx          # Kanban board
│   │   │   ├── task-card.tsx           # task card
│   │   │   ├── task-form.tsx           # create/edit form
│   │   │   └── approval-queue.tsx      # approval list
│   │   ├── skills/
│   │   │   ├── skill-editor.tsx        # markdown editor
│   │   │   └── skill-preview.tsx       # markdown preview
│   │   ├── mcp/
│   │   │   ├── mcp-form.tsx            # add MCP server
│   │   │   └── mcp-card.tsx            # MCP status card
│   │   ├── logs/
│   │   │   ├── log-table.tsx           # log table
│   │   │   └── activity-feed.tsx       # real-time feed
│   │   ├── playground/
│   │   │   ├── chat-interface.tsx      # chat UI
│   │   │   └── tool-call-viewer.tsx    # tool call inspector
│   │   └── shared/
│   │       ├── page-header.tsx         # reusable page header
│   │       ├── empty-state.tsx         # empty state component
│   │       └── confirm-dialog.tsx      # confirm dialog
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle schema (all tables)
│   │   │   ├── index.ts               # DB connection
│   │   │   └── migrations/            # generated migrations
│   │   ├── opencode/
│   │   │   ├── client.ts              # HTTP client ke opencode:4096
│   │   │   ├── config-sync.ts         # DB → .opencode/ file generation
│   │   │   ├── agent-gen.ts           # generate agent .md files
│   │   │   ├── skill-gen.ts           # generate skill .md files
│   │   │   ├── mcp-gen.ts             # generate opencode.json mcp section
│   │   │   └── markdown-sync.ts       # DB → tugas/marketing .md files
│   │   ├── auth/
│   │   │   ├── session.ts             # JWT create/verify
│   │   │   └── middleware.ts          # route protection
│   │   ├── crypto.ts                  # AES-256-GCM encrypt/decrypt
│   │   ├── utils.ts                   # cn() helper (shadcn)
│   │   └── constants.ts               # app constants
│   ├── hooks/
│   │   ├── use-agents.ts              # fetch/mutate agents
│   │   ├── use-tasks.ts               # fetch/mutate tasks
│   │   ├── use-skills.ts              # fetch/mutate skills
│   │   ├── use-mcp.ts                 # fetch/mutate MCP
│   │   ├── use-logs.ts                # fetch logs + SSE
│   │   └── use-opencode.ts            # opencode API hooks
│   ├── stores/
│   │   ├── auth-store.ts              # auth state (zustand)
│   │   └── ui-store.ts                # UI state (sidebar, theme)
│   └── types/
│       └── index.ts                   # TypeScript types
├── data/
│   └── .gitkeep                       # SQLite akan dibuat di sini
├── public/
│   └── avatars/                       # preset avatar images
├── .env.local                         # env vars (gitignored)
├── .env.example                       # env template (committed)
├── drizzle.config.ts                  # Drizzle config
├── Dockerfile                         # Docker build
├── next.config.ts
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

## Environment Variables

Buat `.env.example` (committed ke repo):

```env
# Dashboard Auth
DASHBOARD_PIN=245100
JWT_SECRET=change-this-to-a-random-64-char-string

# Encryption Master Key (untuk API key vault)
# Generate: openssl rand -hex 32
MASTER_KEY=change-this-to-a-random-64-char-string

# opencode Serve
OPENCODE_SERVER_URL=http://localhost:4096
OPENCODE_SERVER_PASSWORD=your-opencode-password

# Workspace Paths (relative to project root atau absolute)
WORKSPACE_PATH=../
UJION_OPS_PATH=../
UJION_TKA_APPS_PATH=../../ujion-tka-apps

# Database
DB_PATH=./data/ujion.db

# Provider API Keys (opsional, bisa juga di-set via dashboard UI)
# OPENAI_API_KEY=
# DEEPSEEK_API_KEY=
# QWEN_API_KEY=
# MISTRAL_API_KEY=
# GROQ_API_KEY=
# TOGETHER_API_KEY=
```

Buat `.env.local` (NOT committed, di VPS set via Coolify environment):

```env
DASHBOARD_PIN=245100
JWT_SECRET=<random-64-chars>
MASTER_KEY=<random-64-chars>
OPENCODE_SERVER_URL=http://opencode:4096
OPENCODE_SERVER_PASSWORD=<your-password>
WORKSPACE_PATH=/workspace
UJION_OPS_PATH=/workspace/ujion-ops
UJION_TKA_APPS_PATH=/workspace/ujion-tka-apps
DB_PATH=/data/ujion.db
```

## next.config.ts

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",  // penting untuk Docker
  serverExternalPackages: ["better-sqlite3"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
```

## tsconfig.json (tambahan)

Pastikan `paths` include:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Verifikasi Setup

```bash
# Jalankan dev server
npm run dev

# Buka http://localhost:3000
# Pastikan halaman Next.js default muncul tanpa error

# Test shadcn
# Pastikan komponen shadcn bisa di-import dan render

# Test SQLite
npx drizzle-kit generate
npx drizzle-kit push
```
