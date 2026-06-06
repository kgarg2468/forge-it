export interface RunnerConfig {
  /** Absolute path to templates/base-app (seed source). */
  templateDir: string;
  /** Absolute path to generated/ (per-tool sandboxes live here). */
  generatedRoot: string;
  /** OpenCode binary name or path (default "opencode"). */
  opencodeBin: string;
  /** Coding model id, e.g. "MiniMax-M2.1". */
  codeModel: string;
  /** MiniMax base URL + key, injected into opencode.json + child env. */
  minimaxBaseUrl: string;
  minimaxApiKey: string;
  /** Package manager for the generated app (default "npm"). */
  packageManager: string;
  /** Base port for preview servers. */
  previewPortBase: number;
}
