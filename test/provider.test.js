import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import * as ProviderModule from "../lib/provider.js";
import {
  API_KEY_ENV,
  BASE_URL,
  DEFAULT_MODEL_ID,
  GLM_REASONING_EFFORTS,
  MODELS,
  PROVIDER,
  PROVIDER_ID,
  REASONING_EFFORTS,
  apply,
  inject,
  name,
} from "../lib/provider.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const agentPresetPatchContributor = Symbol.for("dsh.agent-presets.patch-contributor");
const harnessRoot = process.env.DSH_HARNESS_ROOT ?? join(root, "..", "deepseek-harness");
const harnessCordisModule = join(harnessRoot, "vendor", "cordis", "lib", "index.js");
const harnessAgentPresetsModule = join(harnessRoot, "packages", "preset", "agent-presets", "lib", "index.js");
const canRunRealCordisComposition = existsSync(harnessCordisModule) && existsSync(harnessAgentPresetsModule);

function contextWithContributor(contributor) {
  return {
    inject(deps, callback) {
      assert.deepEqual(deps, ["agentPresets"]);
      callback({
        get(serviceName) {
          assert.equal(serviceName, "agentPresets");
          return { [agentPresetPatchContributor]: contributor };
        },
      });
      return () => {};
    },
  };
}

const expectedCompactionPatch = {
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
            model: "glm-5.3-flash",
            thresholdRatio: 0.5,
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

test("provider id and endpoint match the live API", () => {
  assert.equal(PROVIDER_ID, "knyazev-ai");
  assert.equal(PROVIDER.apiKeyEnv, "KNYAZEV_AI_API_KEY");
  assert.equal(PROVIDER.baseURL, "https://knyazevai.work/v1");
  assert.equal(PROVIDER.displayName, "KnyazevAI API");
  assert.equal(PROVIDER.api, "openai-completions");
  assert.equal(PROVIDER.compat.thinkingFormat, "openai");
  assert.equal(PROVIDER.compat.supportsReasoningEffort, true);
  assert.equal(Object.hasOwn(PROVIDER, "reasoning"), false);
});

test("legacy default reasoning export remains importable without forcing the provider", () => {
  assert.equal(Object.hasOwn(ProviderModule, "DEFAULT_REASONING"), true);
  assert.equal(ProviderModule.DEFAULT_REASONING, undefined);
});

test("model-specific reasoning controls match each API wire format", () => {
  const flash = MODELS.find((model) => model.id === "deepseek-v4-flash");
  const glm = MODELS.find((model) => model.id === "glm-5.3-flash");
  const minimax = MODELS.find((model) => model.id === "minimax-2.7");
  assert.deepEqual(flash.reasoningEfforts, REASONING_EFFORTS);
  assert.deepEqual(glm.reasoningEfforts, GLM_REASONING_EFFORTS);
  assert.equal(glm.compat, undefined);
  assert.equal(minimax.reasoningEfforts, false);
  assert.deepEqual(MODELS.map((model) => model.id), [
    "deepseek-v4-flash",
    "glm-5.3-flash",
    "minimax-2.7",
  ]);
});

test("package is a DSH bundle, not a plain dependency", () => {
  const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(manifest.name, "@knyazevai/dsh-provider");
  assert.equal(manifest.version, "0.1.1");
  assert.equal(manifest.description, "DeepSeek Harness provider bundle for the KnyazevAI API");
  assert.equal(manifest.dsh.bundle.patch, "./cordis.patch.yml");
  assert.equal(manifest.publishConfig.access, "public");
});

test("patch restates llm-pi-ai with the same catalog", () => {
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(patch, /^- id: llm-pi-ai$/m);
  assert.match(patch, /^\s+knyazev-ai:$/m);
  assert.match(patch, new RegExp(`apiKeyEnv: ${API_KEY_ENV}`));
  assert.match(patch, new RegExp(`baseURL: ${BASE_URL}`));
  assert.match(patch, /displayName: KnyazevAI API/);
  assert.match(patch, /thinkingFormat: openai/);
  assert.match(patch, /supportsReasoningEffort: true/);
  assert.doesNotMatch(patch, /^\s+reasoning:\s/m);
  for (const model of MODELS) {
    assert.match(patch, new RegExp(`id: ${model.id}`));
    assert.match(patch, new RegExp(`name: ${model.name}`));
  }
  assert.match(patch, /off: null/);
  assert.match(patch, /low: low/);
  assert.match(patch, /high: high/);
  assert.match(patch, /max: max/);
  assert.match(patch, /minimax-2\.7[\s\S]*reasoningEfforts: false/);
});

test("installing the bundle selects Flash without forcing its effort onto other models", () => {
  assert.equal(DEFAULT_MODEL_ID, "deepseek-v4-flash");
  assert.equal(MODELS[0].id, DEFAULT_MODEL_ID);
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(patch, /^- id: agent-default-model$/m);
  assert.match(patch, new RegExp(`provider: ${PROVIDER_ID}`));
  assert.match(patch, new RegExp(`model: ${DEFAULT_MODEL_ID}`));
  assert.doesNotMatch(patch, /^\s+reasoning:\s/m);
});

test("subagent tools inherit the same Knyazev route", () => {
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(patch, /^- id: tool-subagent$/m);
  assert.match(patch, /^- id: tool-subagent-fork$/m);
  assert.match(patch, /toolName: subagent\n(?:.*\n)*?\s+agentOptions:\n\s+provider: knyazev-ai\n\s+model: deepseek-v4-flash/);
  assert.match(patch, /toolName: subagent_fork\n(?:.*\n)*?\s+agentOptions:\n\s+provider: knyazev-ai\n\s+model: deepseek-v4-flash/);
});

test("compaction plugin contributes the complete group replacement to non-minimal presets", () => {
  const registrations = [];
  const contributor = {
    register(contribution) {
      registrations.push(contribution);
      return () => {};
    },
  };

  apply(contextWithContributor(contributor));

  assert.deepEqual(
    registrations,
    ["standard", "code", "cordis"].map((presetId) => ({
      presetId,
      patches: [expectedCompactionPatch],
    })),
  );
  assert.deepEqual(registrations.map(({ presetId }) => presetId), ["standard", "code", "cordis"]);
  assert.equal(registrations.some(({ presetId }) => presetId === "minimal"), false);
});

test("compaction plugin is a symbol-detected agent-presets plugin", () => {
  assert.equal(name, "knyazev-ai-compaction");
  assert.deepEqual(inject, []);

  const registrations = [];
  apply(contextWithContributor({
    register(contribution) {
      registrations.push(contribution);
      return () => {};
    },
  }));
  assert.equal(registrations.length, 3);
});

test("compaction plugin remains headless-safe when agentPresets is not composed", () => {
  const requested = [];
  assert.doesNotThrow(() => apply({
    inject(deps, callback) {
      requested.push(deps);
      return () => {};
    },
  }));
  assert.deepEqual(requested, [["agentPresets"]]);
});

test("compaction plugin registers after delayed agentPresets availability", () => {
  const active = [];
  let ownerDisposers = [];
  const contributor = {
    register(contribution) {
      active.push(contribution);
      const dispose = () => {
        const index = active.indexOf(contribution);
        if (index !== -1) active.splice(index, 1);
      };
      ownerDisposers.push(dispose);
      return dispose;
    },
  };
  let service;
  let activate;
  let deactivate = () => {};
  const ctx = {
    inject(deps, callback) {
      assert.deepEqual(deps, ["agentPresets"]);
      activate = () => {
        ownerDisposers = [];
        const childCtx = {
          get(serviceName) {
            assert.equal(serviceName, "agentPresets");
            return service;
          },
        };
        callback(childCtx);
        // AgentPresets.register() owns each returned disposer in this child
        // fiber; model that lifetime boundary in the dependency harness.
        // The production service supplies this ownership internally.
        const disposers = ownerDisposers;
        deactivate = () => {
          for (const dispose of disposers.reverse()) dispose();
        };
      };
      return () => deactivate();
    },
  };

  // The consumer is loaded before its optional provider exists.
  apply(ctx);
  assert.equal(active.length, 0);
  assert.equal(typeof activate, "function");

  service = { [agentPresetPatchContributor]: contributor };
  activate();
  assert.deepEqual(active.map(({ presetId }) => presetId), ["standard", "code", "cordis"]);
  deactivate();
  assert.equal(active.length, 0);
  activate();
  assert.deepEqual(active.map(({ presetId }) => presetId), ["standard", "code", "cordis"]);
});

test("compaction plugin follows real Cordis agentPresets lifecycle", { skip: !canRunRealCordisComposition }, async () => {
  const [{ Context }, { AgentPresets }] = await Promise.all([
    import(pathToFileURL(harnessCordisModule).href),
    import(pathToFileURL(harnessAgentPresetsModule).href),
  ]);
  const ctx = new Context();
  const consumer = ctx.plugin({ name: "consumer", apply });
  let provider;
  try {
    // Real Cordis: the consumer fiber is active while its injected child waits.
    await consumer;
    assert.equal(ctx.get("agentPresets"), undefined);

    provider = ctx.plugin({
      name: "agent-presets-test",
      apply(providerCtx) {
        new AgentPresets(providerCtx, {
          default: "standard",
          roots: [],
          includeUserRoot: false,
        });
      },
    });
    await provider;

    const waitForContributions = async (expectedCount, serviceOverride) => {
      for (let attempt = 0; attempt < 100; attempt += 1) {
        const service = serviceOverride ?? ctx.get("agentPresets");
        const counts = service === undefined
          ? []
          : [...service.patchContributions].map(([presetId, target]) => [presetId, target.contributions.length]);
        if (counts.length === 3 && counts.every(([, count]) => count === expectedCount)) return counts;
        await new Promise((resolve) => setImmediate(resolve));
      }
      throw new Error(`timed out waiting for ${expectedCount} agent preset contributions`);
    };

    const service = ctx.get("agentPresets");
    assert.ok(service);
    assert.deepEqual(await waitForContributions(1, service), [["standard", 1], ["code", 1], ["cordis", 1]]);
    await provider.dispose();
    assert.deepEqual(await waitForContributions(0, service), [["standard", 0], ["code", 0], ["cordis", 0]]);
  } finally {
    await provider?.dispose();
    await consumer.dispose();
  }
});

test("bundle inserts the deployment plugin without enabling host compaction", () => {
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(
    patch,
    /- insert:\n\s+- id: knyazev-ai-compaction\n\s+name: ['"]@knyazevai\/dsh-provider['"]/,
  );
  assert.doesNotMatch(patch, /- id: compaction-basic\n\s+disabled: false/);
  assert.doesNotMatch(patch, /- id: compaction\n\s+disabled: false/);
});


test("GLM inherits Flash context, effort, bounded compaction and provider retries", () => {
  const glm = MODELS.find(m => m.id === "glm-5.3-flash");
  assert.ok(glm);
  assert.equal(glm.contextWindow, 400000);
  assert.equal(glm.maxTokens, 40000);
  assert.deepEqual(glm.reasoningEfforts, GLM_REASONING_EFFORTS);
  assert.equal(glm.compat, undefined);
  const registrations = [];
  apply(contextWithContributor({ register(c) { registrations.push(c); } }));
  for (const registration of registrations) {
    const config = registration.patches[0].config[0].config;
    const flash = config.modelPolicies.find(p => p.model === "deepseek-v4-flash");
    const policy = config.modelPolicies.find(p => p.model === glm.id);
    assert.deepEqual(policy, { ...flash, model: glm.id });
  }
  const patch = readFileSync(join(root, "cordis.patch.yml"), "utf8");
  assert.match(patch, /retryPolicy:\s+mode: normal\s+maxRetries: 20/);
  assert.match(patch, /id: glm-5\.3-flash\s+name: GLM 5\.3 Flash\s+contextWindow: 400000\s+maxTokens: 40000\s+reasoningEfforts:\s+low: low\s+high: high\s+max: max/);
  assert.doesNotMatch(patch, /kimi-2\.6/);
});
