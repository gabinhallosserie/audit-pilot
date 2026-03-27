# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commandes

```bash
npm run dev          # Serveur de développement sur le port 8080
npm run build        # Build de production
npm run lint         # ESLint
npm run test         # Tests unitaires (Vitest, une seule passe)
npm run test:watch   # Tests en mode watch
npx playwright test  # Tests E2E
```

Pour lancer un test spécifique avec Vitest :
```bash
npx vitest run src/test/example.test.ts
```

## Variables d'environnement

Le fichier `.env` doit contenir :
```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_SUPABASE_PROJECT_ID=
```

## Architecture

Application **React 18 + TypeScript + Vite** de gestion d'audits ISO/qualité, construite sur **Supabase** (PostgreSQL + Storage + Realtime).

### Couches

| Couche | Emplacement | Rôle |
|--------|-------------|------|
| UI | `src/components/ui/` | Composants shadcn/ui (Radix UI) — ne pas modifier directement |
| Domaine | `src/components/mission/`, `src/pages/` | Logique métier et vues |
| Service | `src/lib/supabaseService.ts` | Toutes les opérations CRUD sur Supabase — seul point d'accès à la BDD |
| Auth | `src/contexts/AuthContext.tsx` | Auth **mockée** (pas Supabase Auth), 3 rôles : `auditeur`, `audite`, `admin` |
| Types | `src/data/mockData.ts` | Types TypeScript centraux et données de test |

### Routing (`src/App.tsx`)

- `/` → Login (redirige vers `/dashboard` si connecté)
- `/dashboard` → Dashboard selon le rôle (auditeur / audite / admin)
- `/missions` → Liste des missions (auditeur)
- `/mission/:id` → Détail d'une mission, avec onglets : avant-audit, ouverture, post-audit, messagerie

### Base de données

Tables principales et leurs relations :
- `audits` → `missions` (1-n) → `findings` (1-n) → `finding_attachments`, `corrective_actions`
- `missions` → `checklist_items`, `audit_plan_processes` → `process_checklist_items`
- `missions` → `opening_reports`, `opening_participants`, `signatures`, `ratings`, `notifications`, `mission_messages`
- `audit_requests` → `audit_invitations`
- `registration_accounts` (table d'inscription indépendante)

Storage : bucket `evidence` (public) pour les pièces jointes.

Realtime activé sur `mission_messages` (messagerie temps réel).

RLS permissive (tout autorisé) — POC, non production-ready.

### Patterns à respecter

- Toutes les opérations BDD passent par `src/lib/supabaseService.ts`
- État serveur géré avec **React Query** (`@tanstack/react-query`)
- Formulaires : **React Hook Form** + **Zod** pour la validation
- Notifications : `sonner` (toasts)
- Génération PDF : `jsPDF` + `jspdf-autotable` dans `src/lib/generateReport.ts`
- Alias d'import : `@/` pointe vers `src/`

### Auth mock

L'authentification est simulée dans `AuthContext.tsx` avec des utilisateurs codés en dur. La session n'est **pas persistante** au rafraîchissement. Pour tester :
- `marie.dupont@audit.io` → rôle `audite`
- `jean.martin@audit.io` → rôle `auditeur`
- `admin@audit.io` → rôle `admin`
