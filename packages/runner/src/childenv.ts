// Build a child-process env scoped to `dir`. CRITICAL: the parent (the ForgeIt
// server, launched via pnpm in apps/server) leaks PWD / INIT_CWD pointing at the
// monorepo. OpenCode and npm read those instead of the spawn cwd, which made the
// agent root itself in apps/server and clobber it. We override PWD and strip the
// cwd-hinting vars so child tools see ONLY the sandbox dir.
export function childEnv(dir: string, extra: Record<string, string> = {}): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v === undefined) continue;
    if (k === "PWD" || k === "OLDPWD" || k === "INIT_CWD") continue;
    if (k.startsWith("npm_") || k.startsWith("PNPM_")) continue;
    out[k] = v;
  }
  out.PWD = dir;
  return { ...out, ...extra };
}
