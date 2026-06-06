import { Sparkles } from "lucide-react";
import { Card, EmptyState } from "../components";
import { config, hasInsforge } from "../lib/config";

// Generic starter home. ForgeIt's coding agent replaces this with the tool's
// real dashboard (metrics + filters + data table bound to InsForge).
export default function Home() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-100 bg-white shadow-card p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink-900">
          {config.toolName}
        </h1>
        <p className="mt-2 max-w-2xl text-gray-500">
          This tool is being forged. ForgeIt will generate the dashboard, data, and
          actions here based on your prompt.
        </p>
      </div>

      <Card>
        <EmptyState
          icon={<Sparkles className="h-6 w-6" />}
          title={hasInsforge ? "Ready to build" : "Backend not connected yet"}
          description={
            hasInsforge
              ? "Your pages and data will appear here once ForgeIt finishes building."
              : "Set VITE_INSFORGE_URL and VITE_INSFORGE_KEY to connect the backend."
          }
        />
      </Card>
    </div>
  );
}
