import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// ---------------------------------------------------------------------------
// MiniMax client — OpenAI-compatible Chat Completions over raw fetch.
// We use raw fetch (not an SDK) so we can: strip <think> reasoning blocks,
// drive structured output via a single forced tool call, and control retries.
// sk-cp- international keys MUST hit api.minimax.io (wrong host = 401).
// ---------------------------------------------------------------------------

export interface MiniMaxConfig {
  apiKey: string;
  baseUrl: string; // e.g. https://api.minimax.io/v1
  planModel: string; // e.g. MiniMax-M2.1 or MiniMax-M3
  codeModel: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_call_id?: string;
}

interface ToolDef {
  type: "function";
  function: { name: string; description?: string; parameters: unknown };
}

interface RawChoice {
  finish_reason?: string;
  message?: {
    role: string;
    content?: string | null;
    tool_calls?: Array<{
      id?: string;
      type?: string;
      function?: { name?: string; arguments?: string };
    }>;
  };
}

interface RawResponse {
  choices?: RawChoice[];
  base_resp?: { status_code?: number; status_msg?: string };
  usage?: { total_tokens?: number };
}

export class MiniMaxError extends Error {}

/** Remove <think>...</think> reasoning blocks MiniMax M-series may emit. */
export function stripThink(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "") // unclosed think (truncated)
    .trim();
}

/** Pull the first JSON object/array out of a (possibly fenced) string. */
export function extractJson(text: string): string | null {
  const cleaned = stripThink(text);
  // ```json ... ``` fence
  const fence = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : cleaned;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  // Walk to the matching closing bracket.
  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  return null;
}

export class MiniMaxClient {
  constructor(private cfg: MiniMaxConfig) {}

  get isConfigured(): boolean {
    return Boolean(this.cfg.apiKey);
  }

  private async raw(body: Record<string, unknown>): Promise<RawResponse> {
    const res = await fetch(`${this.cfg.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.cfg.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new MiniMaxError(`MiniMax HTTP ${res.status}: ${txt.slice(0, 400)}`);
    }
    const json = (await res.json()) as RawResponse;
    if (json.base_resp && json.base_resp.status_code && json.base_resp.status_code !== 0) {
      throw new MiniMaxError(
        `MiniMax error ${json.base_resp.status_code}: ${json.base_resp.status_msg ?? ""}`,
      );
    }
    return json;
  }

  /** Plain text completion (reasoning stripped). */
  async chatText(
    messages: ChatMessage[],
    opts: { model?: string; maxTokens?: number; temperature?: number } = {},
  ): Promise<string> {
    const json = await this.raw({
      model: opts.model ?? this.cfg.planModel,
      messages,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.6,
    });
    return stripThink(json.choices?.[0]?.message?.content ?? "");
  }

  /**
   * Structured generation. Forces a single tool ("emit") whose parameters are
   * the JSON schema of `schema`, then validates with zod and repairs once.
   * Falls back to parsing JSON from message content if no tool call is returned.
   */
  async generateObject<TSchema extends z.ZodTypeAny>(args: {
    schema: TSchema;
    system: string;
    prompt: string;
    schemaName?: string;
    schemaDescription?: string;
    model?: string;
    maxTokens?: number;
  }): Promise<z.output<TSchema>> {
    const name = args.schemaName ?? "emit";
    const jsonSchema = zodToJsonSchema(args.schema, { target: "openApi3" });
    const tool: ToolDef = {
      type: "function",
      function: {
        name,
        description: args.schemaDescription ?? "Emit the requested structured object.",
        parameters: jsonSchema,
      },
    };
    const model = args.model ?? this.cfg.planModel;
    const maxTokens = args.maxTokens ?? 8000;

    const messages: ChatMessage[] = [
      {
        role: "system",
        content:
          args.system +
          `\n\nYou MUST respond by calling the function "${name}" with a single argument object that strictly matches its JSON schema. Do not include any prose. Use snake_case for field names where the schema implies it.`,
      },
      { role: "user", content: args.prompt },
    ];

    const tryParse = (raw: string): unknown => {
      const js = extractJson(raw);
      if (!js) throw new MiniMaxError("No JSON found in model output");
      return JSON.parse(js);
    };

    const callOnce = async (msgs: ChatMessage[]): Promise<unknown> => {
      const json = await this.raw({
        model,
        messages: msgs,
        max_tokens: maxTokens,
        temperature: 0.3,
        tools: [tool],
        tool_choice: "auto",
      });
      const choice = json.choices?.[0];
      const argStr = choice?.message?.tool_calls?.[0]?.function?.arguments;
      if (argStr) return JSON.parse(argStr);
      // Fallback: model answered in content instead of a tool call.
      const content = choice?.message?.content ?? "";
      return tryParse(content);
    };

    // Attempt 1
    let lastErr: unknown;
    try {
      const obj = await callOnce(messages);
      return args.schema.parse(obj);
    } catch (err) {
      lastErr = err;
    }

    // Repair round: tell the model what was wrong and ask again.
    const repairMessages: ChatMessage[] = [
      ...messages,
      {
        role: "user",
        content: `Your previous output was invalid (${String(
          lastErr,
        )}). Respond again by calling "${name}" with a corrected object that strictly matches the schema. Output only the tool call.`,
      },
    ];
    const obj = await callOnce(repairMessages);
    return args.schema.parse(obj);
  }
}
