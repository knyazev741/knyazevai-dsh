import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  API_KEY_ENV,
  BASE_URL,
  DEFAULT_REASONING,
  MODELS,
  PROVIDER,
  PROVIDER_ID,
  REASONING_EFFORTS,
} from "../lib/provider.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("provider id and endpoint match the live API", () => {
  assert.equal(PROVIDER_ID, "knyazev-ai");
  assert.equal(PROVIDER.apiKeyEnv, "KNYAZEV_AI_API_KEY");
  assert.equal(PROVIDER.baseURL, "https://knyazevai.work/v1");
  assert.equal(PROVIDER.api, "openai-completions");
  assert.equal(PROVIDER.compat.thinkingFormat, "qwen");
  assert.equal(PROVIDER.compat.supportsReasoningEffort, false);
  assert.equal(PROVIDER.reasoning, "high");
});

test("Flash and Kimi expose off/high/max; MiniMax does not", () => {
  const flash = MODELS.find((model) => model.id === "deepseek-v4-flash");
  const kimi = MODELS.find((model) => model.id === "kimi-2.6");
  const minimax = MODELS.find((model) => model.id === "minimax-2.7");
  assert.deepEqual(flash.reasoningEfforts, { off: null, high: "high", max: "max" });
  assert.deepEqual(kimi.reasoningEfforts, REASONING_EFFORTS);
  assert.equal(minimax.reasoningEfforts, undefined);
  assert.equal(DEFAULT_REASONING, "high");
});

test("package is a DSH bundle, not a plain dependency", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(manifest.name, "@knyazevai/dsh");
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(manifest.publishConfig.access, "public");
});

test("patch restates llm-pi-ai with the same catalog", () => {
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(patch, /^- id: llm-pi-ai$/m);
  assert.match(patch, /^\s+knyazev-ai:$/m);
  assert.match(patch, new RegExp(`apiKeyEnv: ${API_KEY_ENV}`));
  assert.match(patch, new RegExp(`baseURL: ${BASE_URL}`));
  assert.match(patch, /thinkingFormat: qwen/);
  assert.match(patch, /supportsReasoningEffort: false/);
  assert.match(patch, /reasoning: high/);
  for (const model of MODELS) {
    assert.match(patch, new RegExp(`id: ${model.id}`));
    assert.match(patch, new RegExp(`name: ${model.name}`));
  }
  assert.match(patch, /off: null/);
  assert.match(patch, /high: high/);
  assert.match(patch, /max: max/);
  assert.doesNotMatch(patch, /minimax-2\.7[\s\S]*reasoningEfforts/);
});
