# OpenViktor Admin Dashboard — Design System & Page Spec

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Vercel / CDN   │     │  Serverless API   │     │   Bot Service    │
│  (static SPA)   │────▶│  Gateway (thin)   │────▶│  (Bun + Prisma)  │
│  React + Vite   │     │  /api/* proxy     │     │  dashboard-api   │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

**Critical constraints:**
- The web dashboard NEVER connects to the database directly
- All data flows through the bot service's dashboard API (`dashboard-api.ts`)
- A thin serverless API gateway (Vercel API routes / Next.js route handlers) proxies requests to the bot service
- The SPA is a static build, deployable to Vercel / any CDN
- Auth: API key or Slack OAuth token passed through the gateway

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 6 |
| Routing | react-router-dom v6 |
| Data fetching | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts v2 |
| Icons | lucide-react |
| Utilities | clsx + tailwind-merge, date-fns |
| Testing | Vitest + Testing Library |

## Design Tokens

### Colors

Primary palette (Indigo):
```
primary-50:  #eef2ff    primary-500: #6366f1
primary-100: #e0e7ff    primary-600: #4f46e5
primary-200: #c7d2fe    primary-700: #4338ca
primary-300: #a5b4fc    primary-800: #3730a3
primary-400: #818cf8    primary-900: #312e81
```

Semantic colors (via Tailwind defaults):
- Success: `emerald-100/800` (bg/text)
- Warning: `amber-100/800`
- Error: `red-100/800`
- Info: `blue-100/800`
- Neutral: `slate-100/600`

### Typography

- Font: `Inter, ui-sans-serif, system-ui, -apple-system, sans-serif`
- Page title: `text-2xl font-bold text-slate-900`
- Card title: `text-sm font-semibold text-slate-900`
- Section label: `text-xs font-semibold text-slate-500`
- Body: `text-sm text-slate-600`
- Muted: `text-xs text-slate-400`
- Mono (IDs, code): `font-mono text-xs text-slate-500`

### Spacing & Layout

- Sidebar: fixed `w-60`, white bg, border-right
- Main content: `bg-slate-50 p-6`
- Page sections: `space-y-6`
- Grid gaps: `gap-4`
- Card padding: `p-5`
- Card border: `rounded-xl border border-slate-200 shadow-sm`

## Component Library

### Card
Container with white bg, rounded corners, subtle shadow.
- `Card` — wrapper: `rounded-xl border border-slate-200 bg-white p-5 shadow-sm`
- `CardHeader` — title + optional action slot

### StatCard
Metric display with icon, label, value, optional sub-value.
Colors: `primary`, `emerald`, `amber`, `red` — icon bg uses `{color}-50`, icon uses `{color}-600`.

### Badge
Inline status pill: `rounded-full px-2 py-0.5 text-xs font-medium`.
Status mappings:
- COMPLETED → `bg-emerald-100 text-emerald-800`
- RUNNING → `bg-blue-100 text-blue-800`
- QUEUED → `bg-amber-100 text-amber-800`
- FAILED → `bg-red-100 text-red-800`
- CANCELLED → `bg-slate-100 text-slate-800`

### EmptyState
Centered `Inbox` icon + message for zero-data states.

### Loading Skeleton
Animated pulse placeholders matching card dimensions: `animate-pulse rounded-xl border border-slate-200 bg-white`.

### AppLayout
Sidebar + content shell. Sidebar nav items use `NavLink` with active state: `bg-primary-50 text-primary-700`.

### Tables
Minimal style — no full borders. Header: `border-b border-slate-100 text-xs font-medium text-slate-500`. Rows: `border-b border-slate-50`, hover: `hover:bg-slate-50`. Clickable rows use `cursor-pointer`.

## Utility Functions

| Function | Purpose |
|----------|---------|
| `cn(...inputs)` | Merge Tailwind classes (clsx + twMerge) |
| `formatCost(cents)` | Cents → `$X.XX` |
| `formatDuration(ms)` | ms → human readable (`1.2s`, `3.4m`) |
| `formatTokens(n)` | Token count → `1.2k`, `3.45M` |
| `statusColor(status)` | AgentRun status → badge class |
| `threadStatusColor(status)` | Thread status → badge class |

---

## Pages

### Pages that can be implemented now (bot API exists or is straightforward to add)

#### 1. Usage (`/usage`)
**Bot API:** `GET /api/usage` — already implemented
**Shows:** Monthly cost stats, daily cost chart (one-off vs scheduled), top threads by cost, token breakdown.

#### 2. Settings — General (`/settings`)
**Bot API:** `GET /api/settings`, `PUT /api/settings/model` — already implemented
**Shows:** Default model selector, workspace settings JSON view.

#### 3. Settings — Team (`/settings/team`)
**Bot API:** `GET /api/team` — already implemented
**Shows:** Team name, seat count, member list (display name, Slack ID, initials).

#### 4. Integrations (`/integrations`)
**Bot API:** `GET /api/integrations`, `POST /api/integrations/connect`, `POST /api/integrations/disconnect` — already implemented
**Shows:** Connected apps grid, tool counts per integration, connect/disconnect flows.

#### 5. Scheduled Tasks / Cron Jobs (`/tasks`)
**Bot API:** `GET /api/tasks` — already implemented
**Shows:** Cron job list with name, schedule, description, enabled/disabled toggle, type badge.

#### 6. Health / Status (`/`)
**Bot API:** `GET /api/health` — already implemented (public, no auth)
**Shows:** System status (healthy/degraded), deployment mode, connected workspaces count, DB status.

### Pages requiring new bot API endpoints

#### 7. Overview Dashboard (`/overview`)
**Needs:** `GET /api/overview` — aggregate stats (total runs, cost, success rate, active threads), runs by day, runs by trigger, cost by model, recent runs.
**Data source:** `AgentRun` + `Thread` tables. Similar to existing `/api/usage` but broader.

#### 8. Agent Runs (`/runs`, `/runs/:id`)
**Needs:** `GET /api/runs?page=&limit=&status=&triggerType=&model=` (paginated list), `GET /api/runs/:id` (detail with messages + tool calls).
**Data source:** `AgentRun` + `Message` + `ToolCall` tables.

#### 9. Threads (`/threads`)
**Needs:** `GET /api/threads?page=&limit=&status=` (paginated list).
**Data source:** `Thread` table with run count.

#### 10. Tools (`/tools`)
**Needs:** `GET /api/tools/stats` — aggregated tool call statistics (total calls, success/fail counts, avg duration, last used).
**Data source:** `ToolCall` table.

#### 11. Knowledge (`/knowledge`)
**Needs:** `GET /api/learnings?page=&limit=&search=` and `GET /api/skills?page=&limit=`.
**Data source:** `Learning` + `Skill` tables.
