/** Catalog the DSH bundle patch must keep in sync with cordis.patch.yml. */

export const PROVIDER_ID = "knyazev-ai";
export const API_KEY_ENV = "KNYAZEV_AI_API_KEY";
export const BASE_URL = "https://knyazevai.work/v1";
export const DEFAULT_MODEL_ID = "deepseek-v4-flash";
export const DEFAULT_REASONING = "high";

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
