import "./env.js"; // load repo-root .env (sets DATABASE_URL) before Prisma init
import { prisma, toJson } from "./db.js";

// Seeds the demo workspace + a few gallery tool cards so the home isn't empty.
// The live demo creates a NEW tool end-to-end; these are breadth/decoration.

const SAMPLE_TOOLS = [
  {
    name: "Refund Request Dashboard",
    slug: "refund-request-dashboard",
    description: "Review refund requests, match Stripe payments, approve with manager rules.",
    status: "live",
    department: "Finance",
    ownerName: "Finance",
    tags: ["refunds", "stripe", "finance"],
    apps: ["gmail", "stripe", "slack"],
    productionUrl: "https://refund-dashboard.up.railway.app",
  },
  {
    name: "Lead Review Queue",
    slug: "lead-review-queue",
    description: "Find inbound leads, enrich them, assign owners, track follow-ups.",
    status: "draft",
    department: "Sales",
    ownerName: "Sales",
    tags: ["leads", "sales", "crm"],
    apps: ["hubspot", "gmail", "slack"],
  },
  {
    name: "Support Escalation Board",
    slug: "support-escalation-board",
    description: "Turn angry tickets into Linear tasks and escalation alerts.",
    status: "review_needed",
    department: "Support",
    ownerName: "Support",
    tags: ["support", "linear", "tickets"],
    apps: ["linear", "slack"],
  },
  {
    name: "Invoice Approval Tool",
    slug: "invoice-approval-tool",
    description: "Extract invoices, route approval, track payment status.",
    status: "live",
    department: "Finance",
    ownerName: "Finance",
    tags: ["invoices", "approval", "finance"],
    apps: ["gmail", "sheets", "slack"],
    productionUrl: "https://invoice-approval.up.railway.app",
  },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@forgeit.dev" },
    update: {},
    create: { name: "Demo User", email: "demo@forgeit.dev" },
  });
  const ws = await prisma.workspace.upsert({
    where: { slug: "demo" },
    update: {},
    create: { name: "Pizza Shop HQ", slug: "demo", ownerId: user.id, primaryTeam: "Founder / Admin" },
  });
  await prisma.workspaceMember.upsert({
    where: { id: `${ws.id}-${user.id}` },
    update: {},
    create: { id: `${ws.id}-${user.id}`, workspaceId: ws.id, userId: user.id, role: "owner" },
  });

  for (const t of SAMPLE_TOOLS) {
    const existing = await prisma.internalTool.findFirst({ where: { workspaceId: ws.id, slug: t.slug } });
    if (existing) continue;
    const tool = await prisma.internalTool.create({
      data: {
        workspaceId: ws.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        status: t.status,
        department: t.department,
        ownerName: t.ownerName,
        tags: toJson(t.tags),
        productionUrl: (t as any).productionUrl,
      },
    });
    await prisma.buildPrompt.create({
      data: { toolId: tool.id, rawPrompt: t.description, selectedApps: toJson(t.apps), department: t.department },
    });
  }

  console.log("Seeded demo workspace + sample tools.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
