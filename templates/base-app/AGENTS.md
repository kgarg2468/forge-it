# AGENTS.md — Building on the ForgeIt base template

You (a coding agent) are extending this starter app into a specific internal tool
(e.g. a refund dashboard, an ops console). The skeleton already compiles, runs,
and proves the data + action clients work. **Build on top of it — don't rewrite the
plumbing.**

Stack: **Vite 5 + React 18 + TypeScript (strict) + Tailwind CSS v3 + react-router-dom + lucide-react.**

---

## Golden rules

1. **Reuse the primitives.** Use the components in `src/components` (Layout, Card,
   DataTable, MetricCards, StatusBadge, FilterBar, Button, Modal, Spinner,
   EmptyState, ErrorState, ConfirmActionModal). Don't reinvent buttons/tables.
2. **All data goes through `insforge`** (`src/lib/insforge.ts`). Never hardcode
   table names — use entity names and let the client add the `t_<slug>_` prefix.
3. **All integration actions go through `runAction`** (`src/lib/actions.ts`).
   The browser never holds API keys.
4. **High-risk actions MUST go through `ConfirmActionModal`** (which calls
   `runAction`). Demo-safe mode is the default; respect it — never force `live: true`
   in a way that bypasses `isDemoSafe`.
5. **Add pages under `src/pages`** and **register routes + nav in `src/App.tsx`**.
6. Keep it TypeScript-strict clean. No `any` where avoidable; the config has
   `noUnusedLocals`/`noUnusedParameters` on.
7. Only edit files inside this template directory.

---

## Configuration & environment (`src/lib/config.ts`)

The app reads Vite env vars (must be prefixed `VITE_`). See `.env.example`.

| Env var               | Meaning                                                        |
| --------------------- | ------------------------------------------------------------- |
| `VITE_INSFORGE_URL`   | InsForge project base URL (e.g. `https://xxx.insforge.app`)    |
| `VITE_INSFORGE_KEY`   | InsForge anon/project key (sent as Bearer + `apikey`)         |
| `VITE_FORGEIT_API_URL`| ForgeIt backend base URL (proxies Composio actions)          |
| `VITE_TOOL_ID`        | ForgeIt tool id (used in the actions endpoint)               |
| `VITE_TOOL_SLUG`      | Tool slug → table prefix `t_<slug>_<entity>`                  |
| `VITE_TOOL_NAME`      | Display name shown in the UI                                  |
| `VITE_DEMO_SAFE`      | `true` → high-risk actions simulated (default)               |

```ts
import { config, isDemoSafe, hasInsforge, hasForgeitApi, snake } from "./lib/config";

config.toolName;   // string
config.toolSlug;   // snake-cased slug
isDemoSafe;        // boolean
hasInsforge;       // true when URL + key are set
```

Everything has safe fallbacks, so the app renders even before env is wired.

---

## Data client — `src/lib/insforge.ts`

```ts
import { insforge } from "./lib/insforge";
import type { Row } from "./lib/insforge";
```

Tables are named `t_<slug>_<entity>`. Pass the bare entity; the client prefixes it.
`insforge.t("refund")` → `"t_<slug>_refund"`.

Queries use **PostgREST** syntax in the `query` map:
filters `col=eq.val` (also `gt.`, `lt.`, `ilike.`, `in.(a,b)`), `order=col.desc`,
`limit=n`, `select=col1,col2`.

### API

```ts
// List rows. query values are PostgREST operator strings.
insforge.list<T = Row>(entity: string, query?: Record<string, string>): Promise<T[]>

// Get one row by id (or null).
insforge.get<T = Row>(entity: string, id: string | number): Promise<T | null>

// Insert one or many rows (body always sent as an array). Returns created rows.
insforge.insert<T = Row>(entity: string, rows: Row | Row[]): Promise<T[]>

// Patch a row by id. Returns the updated row (or null).
insforge.update<T = Row>(entity: string, id: string | number, patch: Row): Promise<T | null>

// Delete a row by id.
insforge.remove(entity: string, id: string | number): Promise<void>

// Resolve the full table name.
insforge.t(entity: string): string
```

Errors throw `InsforgeError` (has `.status` and `.body`) with a readable message —
catch them and render `<ErrorState message={...} onRetry={...} />`.

### Example

```ts
const pending = await insforge.list("refund", {
  status: "eq.pending",
  order: "created_at.desc",
  limit: "50",
});

const one = await insforge.get("refund", id);
await insforge.update("refund", id, { status: "approved" });
const [created] = await insforge.insert("refund", { amount: 25, status: "pending" });
```

---

## Actions client — `src/lib/actions.ts`

Runs Composio actions through the ForgeIt backend (POSTs to
`${VITE_FORGEIT_API_URL}/api/tools/${VITE_TOOL_ID}/actions/execute`). The browser
never holds the Composio key.

```ts
import { runAction } from "./lib/actions";
import type { ActionResult } from "./lib/actions";

runAction<T = unknown>(
  slug: string,
  args: Record<string, unknown>,
  opts?: { live?: boolean }
): Promise<ActionResult<T>>

interface ActionResult<T = unknown> {
  ok: boolean;
  simulated: boolean;   // true if it was a dry-run
  data?: T;
  error?: string;
}
```

Behavior:

- In **demo-safe mode**, `live` is forced to `false` (actions are simulated).
- If the backend is unconfigured or unreachable, returns a **simulated success**
  so the UI keeps working.

**For any high-risk action (sending email, issuing a refund, deleting, posting to
Slack, etc.) drive it through `ConfirmActionModal` rather than calling `runAction`
directly.** Direct `runAction` calls are fine for low-risk reads/no-ops.

---

## UI primitives — `src/components`

Import from the barrel: `import { Card, DataTable, Button } from "./components";`

| Component            | Use it for                                                            |
| -------------------- | -------------------------------------------------------------------- |
| `Layout`             | Page shell: sidebar nav + topbar + auto demo-safe banner.            |
| `MetricCards`        | Row of stat cards (`label`, `value`, optional `delta`, `icon`).      |
| `DataTable<T>`       | Tables: `columns` config + `rows` + `rowActions` + `empty`.          |
| `StatusBadge`        | Colored status pill; color inferred from the string (or set `tone`). |
| `FilterBar`          | Search input + select filters + trailing controls.                  |
| `Button`             | Variants: `primary` / `secondary` / `ghost` / `danger`; `loading`.   |
| `Card`               | White rounded card with optional `title` / `description` / `actions`.|
| `Modal`              | Generic dialog with footer slot.                                     |
| `Spinner` / `LoadingBlock` | Inline / centered loading.                                    |
| `EmptyState`         | Friendly empty placeholder with optional `action`.                  |
| `ErrorState`         | Error placeholder with optional `onRetry`.                           |
| `ConfirmActionModal` | The "test/run action" dialog — shows what runs, then calls `runAction`. |

### DataTable example

```tsx
import { DataTable, StatusBadge, Button } from "../components";
import type { Column } from "../components";

type Refund = { id: string; customer: string; amount: number; status: string };

const columns: Column<Refund>[] = [
  { key: "customer", header: "Customer" },
  { key: "amount", header: "Amount", align: "right",
    render: (r) => `$${r.amount.toFixed(2)}` },
  { key: "status", header: "Status",
    render: (r) => <StatusBadge status={r.status} /> },
];

<DataTable
  columns={columns}
  rows={refunds}
  rowKey={(r) => r.id}
  rowActions={(r) => <Button size="sm" variant="secondary" onClick={() => approve(r)}>Approve</Button>}
  loading={loading}
/>
```

### ConfirmActionModal example (high-risk)

```tsx
<ConfirmActionModal
  open={open}
  onClose={() => setOpen(false)}
  slug="GMAIL_SEND_EMAIL"
  args={{ to: refund.email, subject: "Your refund", body: "..." }}
  title="Send refund confirmation"
  description="This emails the customer that their refund was approved."
  onSuccess={(res) => { /* refresh list, toast, etc. */ }}
/>
```

---

## Adding a page

1. Create `src/pages/Refunds.tsx` (default export a component).
2. Register it in `src/App.tsx`:
   ```tsx
   import Refunds from "./pages/Refunds";
   // inside <Routes>:
   <Route path="/refunds" element={<Refunds />} />
   // and add a NavItem to `nav` so it appears in the sidebar.
   ```
3. Compose with the primitives; load via `insforge`, mutate via `runAction`.

---

## Scripts

- `npm run dev` — local dev server (host 0.0.0.0).
- `npm run build` — production build to `dist/`.
- `npm run start` / `npm run preview` — serve the build on `0.0.0.0:$PORT`
  (Railway-ready; `nixpacks.toml` / `railway.json` already configured).

Do **not** run installs/builds yourself unless asked — the orchestrator handles deps.
