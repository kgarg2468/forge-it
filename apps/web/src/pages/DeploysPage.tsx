import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Rocket, ExternalLink, AlertCircle } from "lucide-react";
import { useTools, useMe } from "@/lib/queries";
import { EmptyState } from "@/components/EmptyState";
import { GridSkeleton } from "@/components/Skeleton";
import { Breadcrumb } from "@/components/Breadcrumb";
import { StatusBadge } from "@/components/StatusBadge";
import { LinkButton } from "@/components/Button";

export function DeploysPage() {
  const { data: tools, isLoading, isError, refetch } = useTools();
  const { data: me } = useMe();

  const deployed = (tools ?? []).filter(
    (t) => t.status === "live" || Boolean(t.productionUrl) || Boolean(t.previewUrl),
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: me?.workspace.name ?? "Workspace", to: "/tools" },
          { label: "Deploys" },
        ]}
      />

      <div className="mt-4">
        <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Deployments</h1>
        <p className="mt-2 max-w-lg text-[15px] text-ink-muted">
          Live internal tools and their preview deployments on Railway.
        </p>
      </div>

      <div className="mt-8">
        {isLoading && <GridSkeleton count={3} />}

        {isError && (
          <EmptyState
            icon={AlertCircle}
            title="Couldn’t load deployments"
            description="The ForgeIt backend didn’t respond. Make sure it’s running on port 8787."
            action={
              <button
                onClick={() => refetch()}
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream-50 transition hover:bg-ink-soft"
              >
                Retry
              </button>
            }
          />
        )}

        {!isLoading && !isError && deployed.length === 0 && (
          <EmptyState
            icon={Rocket}
            title="No deployments yet"
            description="Forge a tool and deploy it to see it live here."
            action={<LinkButton to="/forge">Forge a tool</LinkButton>}
          />
        )}

        {!isLoading && deployed.length > 0 && (
          <motion.div layout className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deployed.map((tool, i) => {
              const url = tool.productionUrl || tool.previewUrl || "";
              return (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-2xl border border-line bg-white p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/tools/${tool.id}`} className="font-medium text-ink hover:underline">
                      {tool.name}
                    </Link>
                    <StatusBadge status={tool.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-ink-muted">{tool.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-ink-muted">{tool.department ?? "—"}</span>
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-50 px-3.5 py-1.5 text-sm font-medium text-ink transition hover:bg-cream-200/60"
                      >
                        Open <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-xs text-ink-muted">no URL</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}
