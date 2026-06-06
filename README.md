# ForgeIt

<p align="center">
  <img src="docs/assets/brand/forgeit-wordmark.png" alt="ForgeIt" width="220">
</p>

<p align="center">
  <strong>Lovable for internal tools.</strong>
</p>

<p align="center">
  ForgeIt turns a plain-English workflow into a planned, generated, previewable internal tool with real backend tables and integration-aware automations.
</p>

<p align="center">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-React-646CFF?style=for-the-badge&logo=vite&logoColor=white">
  <img alt="MiniMax" src="https://img.shields.io/badge/MiniMax-M2.1-101014?style=for-the-badge">
  <img alt="InsForge" src="https://img.shields.io/badge/InsForge-Backend-111827?style=for-the-badge">
  <img alt="Railway" src="https://img.shields.io/badge/Railway-Deploy-0B0D0E?style=for-the-badge&logo=railway&logoColor=white">
  <img alt="Vercel" src="https://img.shields.io/badge/Vercel-Frontend-000000?style=for-the-badge&logo=vercel&logoColor=white">
</p>

## First User

<table>
  <tr>
    <td align="center" width="100%">
      <a href="https://www.pleasurepizzasc.com/pleasure-point/menus/">
        <img src="docs/assets/customers/pleasure-pizza-logo.png" alt="Pleasure Pizza" width="112">
      </a>
      <br>
      <strong>Pleasure Pizza</strong>
      <br>
      Early customer validation for ForgeIt's first operations workflow: a refund request dashboard for a real pizza shop team.
    </td>
  </tr>
</table>

## Product

ForgeIt starts where internal-tool requests usually start: a messy business workflow. It discovers the shape of the tool, drafts the plan, generates the app, provisions the backend, streams build progress, and gives the team a preview before anything goes live.

## First Workflow

| Step | Pizza shop refund workflow | ForgeIt output |
| --- | --- | --- |
| Request | "Build a refund dashboard for my pizza shop." | Normalized app intent and selected workflow type |
| Connect | Gmail, Stripe, Slack | Integration-aware build plan |
| Model | Refund requests, customers, payments, approvals | InsForge-backed tables |
| Build | Dashboard, queue, detail view, manager actions | Generated Vite app |
| Review | High-risk refund and notification actions | Demo-safe approvals and audit trail |

```mermaid
flowchart LR
  Prompt["Plain-English request"] --> Plan["MiniMax build plan"]
  Plan --> Data["InsForge tables"]
  Plan --> Build["OpenCode app generation"]
  Data --> Preview["Live preview"]
  Build --> Preview
  Preview --> Deploy["Railway deploy"]
```

## Architecture

| Layer | Stack | Role |
| --- | --- | --- |
| Control plane | Vite, React, Tailwind | Gallery, forge flow, build logs, preview, deployment review |
| API server | Fastify, Prisma, SQLite | Tool state, queues, SSE streams, action routing |
| Planning | MiniMax M2.1 | Structured build plans and change summaries |
| Generation | OpenCode, sandbox runner | Creates and builds generated internal tools |
| App backend | InsForge | Per-tool data tables for generated apps |
| Integrations | Composio | Gmail, Slack, Stripe, and other workflow actions |
| Sponsor hooks | Replicas, Cognition / Devin, Memoir, Limrun | Review, launch, and mobile QA workflows that extend the generated-tool lifecycle |
| Deployment | Railway | Public deployment target for approved tools |

```mermaid
flowchart TD
  subgraph ForgeIt["ForgeIt Control Plane"]
    Web["Web UI"]
    API["Fastify API"]
    Queue["Build Queue"]
    Runner["Sandbox Runner"]
  end

  subgraph Intelligence["Planning + Generation"]
    MiniMax["MiniMax M2.1"]
    OpenCode["OpenCode"]
  end

  subgraph Runtime["Generated Tool Runtime"]
    App["Generated Vite App"]
    InsForge["InsForge Tables"]
    Composio["Composio Actions"]
    Railway["Railway Deploy"]
  end

  subgraph SponsorLayer["Sponsor Integrations"]
    SponsorOrchestrator["Sponsor Orchestrator"]
    Replicas["Replicas Background Agent"]
    Devin["Cognition / Devin Review"]
    Memoir["Memoir Launch Packet"]
    Limrun["Limrun Mobile QA"]
    SponsorArtifacts["Artifacts + Status"]
    ReviewApproval["Review + Approval"]
    ToolLogs["Tool Logs"]
    DeployReadiness["Deploy Readiness"]
  end

  Web --> API
  API --> Queue
  Queue --> MiniMax
  Queue --> Runner
  Runner --> OpenCode
  OpenCode --> App
  MiniMax --> App
  API --> InsForge
  App --> InsForge
  App --> API
  API --> Composio
  App --> Railway
  API -->|"Tool context + build plan + preview URL + change summary"| SponsorOrchestrator
  SponsorOrchestrator --> Replicas
  SponsorOrchestrator --> Devin
  SponsorOrchestrator --> Memoir
  SponsorOrchestrator --> Limrun
  Replicas --> SponsorArtifacts
  Devin --> SponsorArtifacts
  Memoir --> SponsorArtifacts
  Limrun --> SponsorArtifacts
  SponsorArtifacts --> ReviewApproval
  SponsorArtifacts --> ToolLogs
  SponsorArtifacts --> DeployReadiness
```

## What It Proves

| Product question | ForgeIt answer |
| --- | --- |
| Can a non-technical operator describe an internal tool? | Yes, the input is a workflow prompt, not a ticket spec. |
| Can the system produce a real build plan? | Yes, pages, data models, integrations, workflows, and risks are structured before generation. |
| Can generated apps use a real backend? | Yes, generated tools are backed by InsForge tables. |
| Can high-risk actions stay safe in demo mode? | Yes, refunds, emails, and notifications are routed through reviewable action flows. |
| Can sponsor integrations extend the generated-tool lifecycle? | Yes, ForgeIt routes build plans, previews, changes, and approval context through sponsor-backed review, launch, and QA workflows. |

## Sponsor Integrations

ForgeIt is built around the hackathon sponsor stack: a user connects their company stack, describes the internal tool they need, ForgeIt creates the app, shows the plan, builds the backend, connects actions, and gives a clean review/approval flow. These integrations help each generated tool show what is connected, what was built, and what is safe to approve before anything goes live.

| Sponsor | Integrated in ForgeIt as | What we're using it for |
| --- | --- | --- |
| InsForge | Backend for generated tools | ForgeIt uses InsForge to create secure backend tables for generated tools, including records like `RefundRequests`, `Customers`, and `AuditLogs`. Generated apps can read and write against those tables during preview and deployment. |
| Replicas | Background coding-agent review | ForgeIt can hand off a generated tool or change summary to Replicas for background engineering follow-up after the first build. |
| Cognition / Devin | Engineering review session | ForgeIt can send generated plan and change context to Devin for a review focused on safety, backend usage, demo-safe actions, and missing tests. |
| Memoir | Launch packet for generated tools | ForgeIt turns each generated tool into a product and launch brief using the same context shown in the build plan, preview, and change review flow. |
| Limrun | Mobile QA workflow | ForgeIt routes approval-heavy operator workflows into mobile QA so teams can review how generated tools behave beyond the desktop preview. |

Sponsor integration runs appear in tool activity logs so reviewers can see the review, launch, and QA steps attached to each generated internal tool.

Implementation notes and verification commands live in [`docs/sponsor-integrations.md`](docs/sponsor-integrations.md). Run `pnpm check:integrations` to print redacted env presence, code evidence, and route evidence.
