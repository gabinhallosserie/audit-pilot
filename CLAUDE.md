# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AUDIT.IO** — An audit management SaaS platform (POC Phase 1) for managing ISO audits. Three user roles: `audite` (auditee), `auditeur` (auditor), and `admin`.

## Commands

```bash
npm run dev          # Start dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # ESLint
npm run test         # Vitest (unit tests)
npm run test:watch   # Vitest in watch mode
npm run preview      # Preview production build
npx playwright test  # E2E tests
```

Run a single test file:
```bash
npx vitest run src/path/to/file.test.ts
```

## Architecture

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase + TanStack Query

**Path alias:** `@/` maps to `./src/`

### Routing & Auth

- `App.tsx` defines all routes with React Router v6
- `AuthContext` (`src/contexts/AuthContext.tsx`) holds authenticated user state; mock login uses hardcoded email list (password ignored)
- Routes are role-gated: `/dashboard` redirects based on `user.role` to `DashboardAdmin`, `DashboardAudite`, or `DashboardAuditeur`
- `MissionPage` (`/mission/:id`) is the core feature page — it contains tabbed views for the full audit lifecycle

### Mission Lifecycle Tabs (MissionPage)

| Tab | Component | Purpose |
|-----|-----------|---------|
| Avant Audit | `AvantAuditTab` | Pre-audit planning, processes, checklists |
| Ouverture | `OuvertureTab` | Opening report, participants, agenda |
| Post Audit | `PostAuditTab` | Findings, non-conformities, corrective actions |
| Messagerie | `MessagerieTab` / `ChatPanel` | Real-time chat between auditor & auditee |

### Data Layer

- **Supabase client:** `src/integrations/supabase/client.ts` (env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`)
- **Generated DB types:** `src/integrations/supabase/types.ts`
- **Service layer:** `src/lib/supabaseService.ts` — all Supabase API calls go here
- **React Query** wraps all data fetching; mutations invalidate relevant query keys
- **Mock/type data:** `src/data/mockData.ts` — core TypeScript interfaces and demo data

### UI Components

- `src/components/ui/` — 49 shadcn/ui components (Radix UI primitives + Tailwind). Do not modify these directly; regenerate with `npx shadcn-ui add <component>`.
- `AppLayout.tsx` — main shell with collapsible sidebar (`AppSidebar`), header, footer
- Finding types: `"conformite"`, `"ecart_mineur"`, `"ecart_majeur"`, `"opportunite"`

### Styling

- CSS custom properties in `src/index.css` define the color system (navy, teal, success, warning)
- Dark mode via `class` strategy (next-themes)
- Custom fonts: Inter (body), Space Grotesk (headings)
- Tailwind config extends with sidebar-specific color tokens

### Key Features & Their Location

| Feature | Location |
|---------|----------|
| PDF report export | `src/lib/generateReport.ts` (jsPDF + autotable) |
| Digital signatures | `src/components/mission/SignatureCanvas.tsx` |
| File evidence upload | `src/components/mission/FindingAttachments.tsx` (Supabase `evidence` bucket) |
| Notifications | `src/components/NotificationCenter.tsx` |
| Toast notifications | Sonner (`useToast` hook or `toast()` from sonner) |

## TypeScript Config

TypeScript is configured with `strict: false` and `noImplicitAny: false`. Avoid tightening this without broad impact analysis.

## Testing

- Unit tests: Vitest + jsdom + Testing Library (`src/test/setup.ts` configures globals)
- E2E: Playwright (`playwright.config.ts`)
- Test files follow pattern: `src/**/*.{test,spec}.{ts,tsx}`
