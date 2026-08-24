/** Catalog the DSH bundle patch must keep in sync with cordis.patch.yml. */

export const PROVIDER_ID = "knyazev-ai";
export const API_KEY_ENV = "KNYAZEV_AI_API_KEY";
export const BASE_URL = "https://knyazevai.work/v1";
export const DEFAULT_MODEL_ID = "deepseek-v4-flash";
export const DEFAULT_REASONING = "max";

/** Cordis plugin name for the per-agent-preset compaction overlay. */
export const name = "knyazev-ai-compaction";

/** No required services: headless profiles do not compose Agent Presets. */
export const inject = [];

const AGENT_PRESET_PATCH_CONTRIBUTOR = Symbol.for("dsh.agent-presets.patch-contributor");

const COMPACTION_PATCH = {
  id: "compaction",
  config: [
    {
      id: "compaction-basic",
      name: "@deepseek-ai/dsh-compaction-basic",
      config: {
        maxSummarizationInputTokens: 0,
        compactionRetries: 2,
        maxOverflowRetries: 2,
        modelPolicies: [
          {
            provider: "knyazev-ai",
            model: "deepseek-v4-flash",
            thresholdRatio: 0.5,
            maxSummarizationInputTokens: 131072,
          },
          {
            provider: "knyazev-ai",
            model: "kimi-2.6",
            maxSummarizationInputTokens: 131072,
          },
          {
            provider: "knyazev-ai",
            model: "minimax-2.7",
            maxSummarizationInputTokens: 131072,
          },
        ],
      },
    },
    {
      id: "command-compact",
      name: "@deepseek-ai/dsh-command-compact",
    },
    {
      id: "tool-result-pruner",
      name: "@deepseek-ai/dsh-compaction-tool-result-pruner",
      config: {
        thresholdChars: 8192,
        headChars: 4096,
        tailChars: 1024,
      },
    },
  ],
};

const COMPACTION_PRESET_IDS = ["standard", "code", "cordis"];

/**
 * Contribute the compaction group to the shipped presets that own it.
 *
 * The contributor face is optional so the provider remains loadable on older
 * Harness builds; those builds simply retain their stored preset composition.
 */
export function apply(ctx) {
  ctx.inject(["agentPresets"], (childCtx) => {
    const agentPresets = typeof childCtx.get === "function" ? childCtx.get("agentPresets") : childCtx.agentPresets;
    const contributor = agentPresets?.[AGENT_PRESET_PATCH_CONTRIBUTOR];
    if (contributor === undefined || typeof contributor.register !== "function") return;

    for (const presetId of COMPACTION_PRESET_IDS) {
      contributor.register({ presetId, patches: [COMPACTION_PATCH] });
    }
  });
}

export const REASONING_EFFORTS = Object.freeze({
  off: null,
  high: "high",
  max: "max",
});

export const MODELS = Object.freeze([
  Object.freeze({
    id: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    contextWindow: 400000,
    maxTokens: 40000,
    reasoningEfforts: REASONING_EFFORTS,
  }),
  Object.freeze({
    id: "kimi-2.6",
    name: "Kimi 2.6",
    contextWindow: 262144,
    maxTokens: 40000,
    reasoningEfforts: REASONING_EFFORTS,
  }),
  Object.freeze({
    id: "minimax-2.7",
    name: "MiniMax 2.7",
    contextWindow: 204800,
    maxTokens: 40000,
  }),
]);

export const PROVIDER = Object.freeze({
  displayName: "Knyazev AI",
  apiKeyEnv: API_KEY_ENV,
  api: "openai-completions",
  baseURL: BASE_URL,
  compat: Object.freeze({
    thinkingFormat: "qwen",
    supportsReasoningEffort: false,
  }),
  reasoning: DEFAULT_REASONING,
  models: MODELS,
});
