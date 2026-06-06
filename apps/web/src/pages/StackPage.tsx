import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plug, Check, Info, Settings2, Unplug } from "lucide-react";
import { api } from "@/lib/api";
import { useApps, useHealth, qk } from "@/lib/queries";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AppIcon } from "@/components/AppIcon";
import { Button } from "@/components/Button";
import { GridSkeleton } from "@/components/Skeleton";
import { toast } from "@/lib/store";
import { cx } from "@/lib/utils";
import type { AppCatalogItem } from "@/types";

export function StackPage() {
  const { data: apps, isLoading } = useApps();
  const { data: health } = useHealth();
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();

  // Handle OAuth callback success toast: ?connected=<provider>
  useEffect(() => {
    const connected = params.get("connected");
    if (connected) {
      toast.success("Connected", `${connected} is now linked to your workspace.`);
      qc.invalidateQueries({ queryKey: qk.apps });
      const next = new URLSearchParams(params);
      next.delete("connected");
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const composioOff = health?.services.composio === false;

  const connect = useMutation({
    mutationFn: (provider: string) => api.connectApp(provider),
    onSuccess: (res, provider) => {
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
        return;
      }
      qc.invalidateQueries({ queryKey: qk.apps });
      toast.success(
        res.simulated ? "Connected (simulated)" : "Connected",
        res.simulated ? `${provider} linked in demo mode.` : `${provider} is now connected.`,
      );
    },
    onError: (e: Error) => toast.error("Couldn’t connect", e.message),
  });

  const disconnect = useMutation({
    mutationFn: (connectionId: string) => api.disconnectApp(connectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.apps });
      toast.info("Disconnected");
    },
    onError: (e: Error) => toast.error("Couldn’t disconnect", e.message),
  });

  const catalog = apps?.catalog ?? [];
  const connectedCount = catalog.filter((a) => a.connected).length;

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", to: "/" }, { label: "Stack" }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl font-medium tracking-tight text-ink">Connected stack</h1>
          <p className="mt-2 max-w-lg text-[15px] text-ink-muted">
            The apps ForgeIt can read from and act on when building your tools.
          </p>
        </div>
        <span className="rounded-full border border-line bg-cream-50 px-3.5 py-2 text-sm text-ink-muted shadow-soft">
          {connectedCount} of {catalog.length} connected
        </span>
      </div>

      {composioOff && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
        >
          <Info size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-900">Connections are simulated</p>
            <p className="mt-0.5 text-[13px] text-amber-800/80">
              Add <code className="rounded bg-amber-100 px-1 py-0.5 font-mono text-[12px]">COMPOSIO_API_KEY</code> to
              the backend to enable real OAuth connections. You can still connect apps in demo mode.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-7">
        {isLoading ? (
          <GridSkeleton count={9} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.map((app, i) => (
              <StackCard
                key={app.provider}
                app={app}
                index={i}
                connecting={connect.isPending && connect.variables === app.provider}
                disconnecting={disconnect.isPending && disconnect.variables === app.connectionId}
                onConnect={() => connect.mutate(app.provider)}
                onDisconnect={() => app.connectionId && disconnect.mutate(app.connectionId)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StackCard({
  app,
  index,
  connecting,
  disconnecting,
  onConnect,
  onDisconnect,
}: {
  app: AppCatalogItem;
  index: number;
  connecting: boolean;
  disconnecting: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.3) }}
      className={cx(
        "flex flex-col rounded-3xl border bg-cream-50 p-5 shadow-card transition",
        app.connected ? "border-sage-500/30" : "border-line",
      )}
    >
      <div className="flex items-start justify-between">
        <AppIcon provider={app.provider} accent={app.accent} size="lg" />
        {app.connected && (
          <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2.5 py-1 text-[11px] font-medium text-sage-600">
            <Check size={12} strokeWidth={3} /> connected
          </span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg text-ink">{app.label}</h3>
      <p className="mt-1.5 flex-1 text-[13px] leading-relaxed text-ink-muted">{app.blurb}</p>

      <div className="mt-5 flex gap-2">
        {app.connected ? (
          <>
            <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Settings2 size={14} />}>
              Manage
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={onDisconnect}
              loading={disconnecting}
              leftIcon={!disconnecting ? <Unplug size={14} /> : undefined}
            >
              Disconnect
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            className="flex-1"
            onClick={onConnect}
            loading={connecting}
            leftIcon={!connecting ? <Plug size={14} /> : undefined}
          >
            Connect
          </Button>
        )}
      </div>
    </motion.div>
  );
}
