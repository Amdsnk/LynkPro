<div align="center">

# LynkPro

https://app-b5zp3rg0kzcx.appmedo.com/

**AI-powered construction management platform for the AEC industry**

Predict risks. Prevent delays. Deliver on time.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-black?logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[Features](#-features) · [Tech Stack](#-tech-stack) · [Architecture](#-architecture) · [Getting Started](#-getting-started) · [Demo Users](#-demo-users) · [API Integrations](#-api--edge-function-integrations)

</div>

---

## Overview

LynkPro is a full-stack, enterprise-grade construction management platform built for Architecture, Engineering, and Construction (AEC) firms. It unifies project operations, financial tracking, safety compliance, workforce management, procurement, IoT monitoring, and AI-powered intelligence into a single, real-time collaborative workspace.

At its core is the **AI Command Center** — a decision intelligence interface that continuously analyzes your data, surfaces critical insights (overdue payments, project risks, delays), and delivers proactive recommendations with confidence scores — before problems become crises.

> Built for [MeDo Hackathon 2026](https://devpost.com).

---

## Why LynkPro?

| Problem | LynkPro Solution |
|---------|-----------------|
| Construction projects lose **$1.6T/year** to delays & overruns | AI delay prediction & risk scoring engine |
| Stakeholders work from scattered spreadsheets & emails | Unified real-time collaborative platform |
| Overdue invoices discovered too late | Automated overdue detection with alert system |
| Field reports written manually, inconsistently | AI-generated professional narratives from field notes |
| Clients & subcontractors lack visibility | Dedicated role-based portals with granular RLS |
| Safety incidents only addressed reactively | Predictive risk heatmaps & compliance automation |

---

## Features

### 🤖 AI Command Center
- Real-time **AI Intelligence Stream** with confidence-scored insights
- **Risk scoring engine** — analyzes tasks, timelines, invoice patterns
- **Delay prediction** — statistical model using weather, material, workforce, equipment factors
- **Budget overrun forecasting** — cost variance trend analysis
- **Mitigation recommendations** — AI-generated action plans per insight
- **AI photo analysis** — automated safety hazard detection from site photos
- **Cost savings suggestions** — optimization recommendations from spend data
- Priority Intelligence: Urgent / Today / This Week auto-grouping

### 📋 Project Management
- Full project lifecycle: create, assign, track, archive
- Tasks with status tracking, due dates, priority, assignees
- **Gantt chart timelines** with drag-and-drop milestones
- **Project photo galleries** with tagging and organization
- **File management** with versioning, preview, and bulk operations
- Secure file sharing with time-limited signed URLs
- Share analytics (views, downloads, engagement tracking)
- Activity log for full audit trail

### 💰 Financial Management
- **Invoices** — create, send, track payment status, partial payments
- **Proposals** — detailed scoped proposals with line items and approval flow
- **Recurring invoices** — automated generation via daily cron job
- **Budget variance analysis** — planned vs actual with drill-down
- **Stripe integration** — secure checkout, webhook handling, payment verification
- Financial Intelligence dashboard with revenue trends and cash flow metrics
- Export to PDF and Excel

### 📊 Reports & Analytics
- **Daily field reports** with AI narrative generation (OpenAI)
- Report Center with templates and centralized management
- 5 specialized report types:
  - Materials Inventory Report
  - Equipment Utilization Report
  - Safety Incident Summary
  - Budget Variance Analysis
  - Export History
- Custom date range, project, and status filtering
- Export to PDF, CSV, Excel

### 🏗️ Materials & Procurement
- Materials inventory with stock status and consumption tracking
- Equipment fleet management with utilization metrics
- **Purchase requisitions** with multi-step approval workflow
- **Purchase orders** generated from approved requisitions
- **Vendor management** with performance scoring
- Material forecasting and demand planning
- Reorder alerts with configurable thresholds

### 👷 Workforce Management
- Subcontractor directory with skill profiles
- **Skill matrix** and gap analysis
- Task assignment and workload balancing
- **Productivity analytics** and crew performance tracking
- Time entries with billable hour tracking and approval workflow
- Worker skill matching to project requirements

### 🦺 Safety & Compliance
- Safety incident reporting and investigation tracking
- **Safety audit system** with reusable templates
- **Compliance checklists** with deadline tracking
- **Risk assessments** with weighted factor scoring (height, weather, equipment, experience, complexity)
- **Risk heatmap** — visual distribution of risk across projects
- Corrective action tracker with accountability assignments
- Compliance dashboard with regulatory deadline monitoring
- **Risk prediction dashboard** with AI-powered forecasting

### 📍 Location & IoT
- Real-time team location tracking with map visualization
- **Geofence management** — define site boundaries
- **Geofence attendance** — automated check-in/out on enter/exit
- Location history with timeline playback
- **IoT device registry** — connect field sensors
- **Equipment telemetry** — real-time operational data
- **Environmental monitoring** — temperature, humidity, air quality
- **Concrete curing monitoring** — cure time and temperature tracking

### 🏛️ BIM Integration
- BIM model viewer (3D visualization)
- BIM issue tracking linked to model elements
- Model version management

### 🔄 Change Orders
- Change order creation with scope and cost impact
- Approval workflow (pending → approved → rejected)
- Change order analytics and trend reporting

### 📜 Permits
- Permit tracking with status and expiry monitoring
- Permit calendar view for renewal planning
- Document attachment and version control

### 👥 Multi-Role Portals
- **Client Portal** — project progress, invoices, reports (view-only, scoped to assigned projects)
- **Subcontractor Portal** — task assignments, timesheets, payment status
- Portal access management — granular per-project permission configuration

### 🔐 Admin & Security
- User management, role assignment, and invitations
- Two-factor authentication (TOTP)
- Full activity log for compliance and auditing
- Firm-level data isolation via PostgreSQL RLS

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI library with concurrent features & hooks |
| **TypeScript** | 5.x | Type safety across 329 source files |
| **Vite** (rolldown) | Latest | Build tool with HMR |
| **React Router** | 7.x | Client-side routing (121 page components) |
| **Tailwind CSS** | 3.4 | Utility-first styling with semantic tokens |
| **shadcn/ui** | Latest | Accessible, composable component library |
| **Radix UI** | Latest | Headless primitive components |
| **Recharts** | 2.15 | Composable data visualization |
| **Framer Motion** | 12 | Smooth animations and transitions |
| **React Hook Form** | 7 | Performant form state management |
| **Zod** | 3 | Runtime schema validation |
| **date-fns** | 3 | Date utility library |
| **TanStack Table** | 8 | Headless table with sorting, filtering, pagination |
| **gantt-task-react** | 0.3 | Gantt chart visualization |
| **Leaflet + react-leaflet** | 1.9/5.0 | Interactive maps |
| **Lucide React** | 0.57 | Icon library (600+ icons) |
| **Sonner** | 2 | Toast notifications |
| **jsPDF + autotable** | 4/5 | PDF generation |
| **xlsx** | 0.18 | Excel export |
| **qrcode** | 1.5 | QR code generation |
| **next-themes** | 0.4 | Dark/light mode |
| **Embla Carousel** | 8 | Touch-friendly carousels |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Supabase** | Complete BaaS — PostgreSQL, Auth, Storage, Realtime, Edge Functions |
| **PostgreSQL** | Primary database with 78 migrations, 50+ tables |
| **Row-Level Security** | Database-enforced multi-tenant data isolation |
| **Supabase Realtime** | WebSocket-based live data sync across clients |
| **Supabase Auth** | Email/password authentication + TOTP 2FA |
| **Supabase Storage** | File storage for reports, documents, photos |
| **Supabase Edge Functions** | Deno-based serverless functions (14 functions) |

### External APIs

| API | Purpose |
|-----|---------|
| **Stripe** | Payment processing (checkout, webhooks, verification) |
| **OpenAI GPT-4o-mini** | AI text generation (report narratives, invoice descriptions) |
| **Resend** | Transactional email (invitations, notifications, analytics) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Client Browser                              │
│                                                                      │
│   React 18 + TypeScript + Vite                                       │
│   ┌─────────────────────────────────────────────────────────┐        │
│   │  Pages (121)  →  Components (atomic design)             │        │
│   │  Contexts (Auth, Presence, Collaboration, Simulation)   │        │
│   │  Hooks (14 custom, 8 Realtime)  →  lib/ (AI engines)   │        │
│   └──────────────────────┬──────────────────────────────────┘        │
└──────────────────────────┼───────────────────────────────────────────┘
                           │  supabase-js SDK
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        Supabase Platform                             │
│                                                                      │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────┐  ┌───────────┐   │
│  │ PostgreSQL  │  │    Auth      │  │  Storage  │  │ Realtime  │   │
│  │ 50+ tables  │  │ Email + TOTP │  │ 3 buckets │  │ WebSocket │   │
│  │ 78 migrat.  │  │              │  │           │  │ pub/sub   │   │
│  └──────┬──────┘  └──────────────┘  └───────────┘  └───────────┘   │
│         │ RLS policies                                               │
│         │ (firm + role scoped)                                       │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  Edge Functions (Deno, 14)                   │    │
│  │  create_stripe_checkout    │  verify_stripe_payment          │    │
│  │  handle_stripe_webhook     │  generate-ai-text (OpenAI)      │    │
│  │  send-email / invitation   │  send-analytics-email           │    │
│  │  share-file / download     │  send-document                  │    │
│  │  generate_recurring_invoices (cron)  │  verify_totp          │    │
│  │  setup-demo-users          │  health                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
          Stripe API    OpenAI API   Resend API
```

### Security Model

```
User Request
     │
     ▼
Supabase Auth (JWT)
     │
     ▼
Row-Level Security (PostgreSQL)
     │
     ├── has_role(uid, 'admin')     → Full firm access
     ├── has_role(uid, 'staff')     → Full firm access
     ├── has_role(uid, 'client')    → Assigned projects only
     │       └── is_project_member(uid, project_id)
     └── has_role(uid, 'subcontractor') → Assigned projects only
```

**All RLS policies use helper functions** (`has_role`, `is_project_member`, `get_user_firm_id`) with `SECURITY DEFINER` to prevent policy bypass and maintain consistent access logic.

### AI Engine Architecture

```
Raw Data (projects, invoices, tasks)
          │
          ▼
  ai-utils.ts (generateDashboardInsights)
          │
          ├── calculateProjectRisk()    → Risk score 0–100 + contributing factors
          ├── predictProjectDelay()     → Days at risk + root cause breakdown
          ├── budgetPrediction.ts       → Cost variance forecasting
          ├── riskScoring.ts            → Multi-factor weighted scoring
          ├── complianceEngine.ts       → Regulation deadline analysis
          ├── demandForecasting.ts      → Material demand curves
          ├── vendorPerformance.ts      → Vendor reliability metrics
          └── productivityCalculations.ts → Crew efficiency metrics
          │
          ▼
  Insight[] { type, title, message, confidence }
          │
          ▼
  AI Command Center (ranked, color-coded, actionable)
```

### Real-Time Data Flow

```
Database Change (INSERT / UPDATE / DELETE)
          │
          ▼
  supabase_realtime publication
          │
          ▼
  useRealtimeData hook (postgres_changes listener)
          │
          ▼
  React state update → UI re-renders instantly
          │
          └── Presence: who's online on which page
              (PresenceContext.tsx via Supabase Presence channels)
```

### Module Structure

```
src/
├── pages/                  # 121 route-level page components
│   ├── ai/                 # AI dashboards and predictions
│   ├── bim/                # BIM viewer and issue tracking
│   ├── budget/             # Budget variance analysis
│   ├── changeorders/       # Change order management
│   ├── clients/            # Client CRM
│   ├── dashboards/         # Specialized dashboards (AI, Calendar, Map, Risk)
│   ├── equipment/          # Equipment management
│   ├── invoices/           # Invoice lifecycle
│   ├── iot/                # IoT and sensor monitoring
│   ├── location/           # GPS tracking and geofencing
│   ├── materials/          # Inventory management
│   ├── payment/            # Stripe payment pages
│   ├── permits/            # Permit management
│   ├── portals/            # Client & Subcontractor portals
│   ├── procurement/        # Vendor, PO, requisition management
│   ├── projects/           # Project lifecycle
│   ├── proposals/          # Proposals and quotes
│   ├── reports/            # Report center and exports
│   ├── safety/             # Safety, compliance, risk
│   ├── time/               # Time entries
│   ├── workforce/          # Subcontractor and crew management
│   └── admin/              # User management, activity logs
│
├── components/             # Reusable components (atomic design)
│   ├── layouts/            # App shell, sidebar, header
│   ├── ui/                 # shadcn/ui base components
│   ├── auth/               # Auth dialogs (2FA, etc.)
│   ├── analytics/          # Chart components
│   ├── features/           # Feature-specific composites
│   ├── reports/            # Report-specific components
│   └── workforce/          # Workforce-specific components
│
├── contexts/               # React contexts
│   ├── AuthContext.tsx      # Auth state, role checks, 2FA
│   ├── PresenceContext.tsx  # Real-time online presence
│   ├── CollaborativeEditingContext.tsx
│   └── SimulationContext.tsx
│
├── hooks/                  # Custom hooks
│   ├── useRealtimeData.ts   # Generic real-time subscription
│   ├── useRealtimeProjects.ts
│   ├── useRealtimeInvoices.ts
│   ├── useRealtimeDashboardMetrics.ts
│   └── ...7 more real-time hooks
│
├── lib/                    # Business logic and AI engines
│   ├── ai-utils.ts          # Dashboard insight generation
│   ├── riskScoring.ts       # Multi-factor risk scoring
│   ├── delayPrediction.ts   # Statistical delay model
│   ├── budgetPrediction.ts  # Cost variance forecasting
│   ├── complianceEngine.ts  # Compliance deadline analysis
│   ├── demandForecasting.ts # Material demand curves
│   ├── vendorPerformance.ts # Vendor reliability metrics
│   ├── productivityCalculations.ts
│   ├── skillMatching.ts
│   ├── export.ts            # PDF/CSV/Excel export
│   └── ...more utilities
│
├── types/
│   └── types.ts            # 181 TypeScript interfaces
│
└── db/
    └── supabase.ts         # Configured Supabase client
```

---

## Design System

LynkPro uses a **Minimal aesthetic** — ample whitespace, clear typographic hierarchy, gentle contrast optimized for long reading sessions. The design system is defined entirely in `src/index.css` as HSL semantic tokens.

### Color Tokens

```css
/* Core palette */
--primary:    217 91% 60%   /* Blue — actions, links */
--secondary:  214 32% 91%   /* Light blue-gray */
--accent:     210 40% 96%   /* Subtle highlight */
--muted:      214 32% 95%   /* Backgrounds, disabled */

/* Semantic status */
--success:    142 76% 36%   /* Green */
--warning:    38  92% 50%   /* Amber */
--destructive: 0  84% 60%  /* Red */
--info:       217 91% 60%   /* Blue */

/* AI-specific */
--ai-primary:   262 83% 58% /* Purple — AI elements */
--ai-secondary: 270 91% 65%

/* Risk scale (6 levels) */
--risk-critical → --risk-minimal (with -light variants)
```

Every token has a paired dark-mode equivalent. All foreground/background pairs meet **WCAG AA (4.5:1 contrast)**.

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **pnpm** (`npm i -g pnpm`)
- A [Supabase](https://supabase.com) project (free tier sufficient)

### Installation

```bash
git clone https://github.com/yourusername/lynkpro.git
cd lynkpro
pnpm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Apply Database Migrations

```bash
supabase link --project-ref your-project-id
supabase db push
```

### Deploy Edge Functions

```bash
supabase functions deploy
```

For paid integrations, add secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_...
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set RESEND_API_KEY=re_...
```

### Start Dev Server

```bash
pnpm dev
# → http://localhost:5173
```

### Build for Production

```bash
pnpm build
pnpm preview
```

---

## Demo Users

> **First time setup:** navigate to `/setup-demo-users` and click **Setup Demo Users** to create all accounts in your Supabase instance.

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@lynkpro.com | demo123 | Full system access |
| **Project Manager** | pm@lynkpro.com | demo123 | All projects, financials |
| **Field Worker** | field@lynkpro.com | demo123 | Reports, time tracking |
| **Safety Officer** | safety@lynkpro.com | demo123 | Safety & compliance |
| **Client** | client@lynkpro.com | demo123 | Assigned projects only |
| **Subcontractor** | subcontractor@lynkpro.com | demo123 | Assigned projects only |

**Quick login:** `/login` → click **Show** on demo card → click **Use** → **Sign In**.

---

## API & Edge Function Integrations

| Function | Trigger | Purpose |
|----------|---------|---------|
| `create_stripe_checkout` | Client call | Creates Stripe checkout session from invoice line items |
| `verify_stripe_payment` | Client call | Verifies session & marks invoice paid |
| `handle_stripe_webhook` | Stripe → webhook | Real-time payment events (paid, failed, refunded) |
| `generate-ai-text` | Client call | GPT-4o-mini: field notes → narratives, invoice descriptions |
| `send-email` | Server | Generic transactional email via Resend |
| `send-invitation` | Server | Team member invite with magic link |
| `send-analytics-email` | Server | Scheduled project/financial summary emails |
| `share-file` | Client call | Creates time-limited signed share token |
| `download-share` | Public GET | Validates token and streams file |
| `send-document` | Client call | Emails document with secure download link |
| `generate_recurring_invoices` | Cron (daily midnight) | Auto-creates recurring invoices from templates |
| `verify_totp` | Client call | Validates TOTP 2FA code during login |
| `setup-demo-users` | Manual | Provisions all 6 demo accounts |
| `health` | Monitoring | Health check endpoint |

---

## Database

- **50+ tables** spanning all modules
- **78 incremental migrations** (fully auditable history)
- **181 TypeScript interfaces** mirroring the schema
- **Real-time publications** on key tables (projects, invoices, reports, tasks, profiles)
- **Storage buckets:** `report-photos`, `firm-logos`, `project-files`

Key schema highlights:

```sql
profiles          -- users with role (admin/staff/client)
firms             -- multi-tenant firm isolation
projects          -- core project entity
project_members   -- M:M for portal access control
invoices          -- with line_items JSONB
proposals         -- with sections and line items
reports           -- daily field reports with photos
materials         -- inventory with consumption log
equipment         -- fleet with maintenance schedule
safety_incidents  -- with investigation and actions
safety_audits     -- templated audits with findings
risk_assessments  -- weighted factor scoring
bim_models        -- with issue tracking
change_orders     -- with approval workflow
geofences         -- polygon boundaries with rules
iot_devices       -- device registry with readings
totp_secrets      -- 2FA credentials (encrypted)
file_shares       -- time-limited share tokens
activity_logs     -- immutable audit trail
```

---

## Deployment

### Vercel

```bash
pnpm dlx vercel
# Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in project settings
```

### Netlify

```bash
pnpm dlx netlify-cli deploy --prod
```

### Environment variables required in production

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Edge Function secrets (set in Supabase dashboard or CLI — never in `.env`):
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
OPENAI_API_KEY
RESEND_API_KEY
```

---

## Project Stats

| Metric | Value |
|--------|-------|
| Source files (TypeScript/TSX) | **329** |
| Page components | **121** |
| TypeScript interfaces | **181** |
| Database migrations | **78** |
| Edge Functions | **14** |
| Custom React hooks | **14** |
| AI engine modules | **10** |
| External API integrations | **3** (Stripe, OpenAI, Resend) |

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced ML models (replace statistical estimates)
- [ ] Procore / Autodesk BIM integration
- [ ] Multi-language support (i18n)
- [ ] Twilio SMS notifications
- [ ] QuickBooks / Xero accounting sync
- [ ] DocuSign contract signing
- [ ] IoT sensor SDK

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

Built with ❤️ for the AEC industry · [Report a bug](https://github.com/yourusername/lynkpro/issues) · [Request a feature](https://github.com/yourusername/lynkpro/issues)

</div>
