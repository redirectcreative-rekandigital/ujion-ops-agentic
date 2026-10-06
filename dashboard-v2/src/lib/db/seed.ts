import { db } from "./index";
import { agents, skills, models, kantorConfig, settings } from "./schema";

async function seed() {
  // Default models
  const defaultModels = [
    { provider: "openai", model_id: "gpt-4o", display_name: "GPT-4o", context_window: 128000, is_default: true },
    { provider: "openai", model_id: "gpt-4o-mini", display_name: "GPT-4o Mini", context_window: 128000 },
    { provider: "openai", model_id: "o1", display_name: "o1", context_window: 200000 },
    { provider: "openai", model_id: "o3-mini", display_name: "o3-mini", context_window: 200000 },
    { provider: "deepseek", model_id: "deepseek-chat", display_name: "DeepSeek Chat", context_window: 64000 },
    { provider: "deepseek", model_id: "deepseek-reasoner", display_name: "DeepSeek Reasoner", context_window: 64000 },
    { provider: "qwen", model_id: "qwen-max", display_name: "Qwen Max", context_window: 32000 },
    { provider: "qwen", model_id: "qwen-plus", display_name: "Qwen Plus", context_window: 131072 },
    { provider: "mistral", model_id: "mistral-large", display_name: "Mistral Large", context_window: 128000 },
    { provider: "mistral", model_id: "mistral-small", display_name: "Mistral Small", context_window: 32000 },
    { provider: "groq", model_id: "llama-3.3-70b", display_name: "Llama 3.3 70B (Groq)", context_window: 128000 },
    { provider: "groq", model_id: "llama-3.1-8b", display_name: "Llama 3.1 8B (Groq)", context_window: 128000 },
    { provider: "together", model_id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", display_name: "Llama 3.3 70B (Together)", context_window: 128000 },
  ];

  for (const model of defaultModels) {
    await db.insert(models).values(model).onConflictDoNothing();
  }

  // Default kantor config
  const kantorDefaults = [
    { key: "title", value: JSON.stringify("Ujion TKA") },
    { key: "names", value: JSON.stringify({ ketua: "Joko", team: ["Budi", "Sari", "Agus", "Rina"] }) },
    { key: "autostart", value: JSON.stringify(false) },
    { key: "theme", value: JSON.stringify("default") },
  ];

  for (const config of kantorDefaults) {
    await db.insert(kantorConfig).values(config).onConflictDoNothing();
  }

  // Default settings
  await db
    .insert(settings)
    .values([
      { key: "pin", value: process.env.DASHBOARD_PIN || "245100" },
      { key: "theme", value: "dark" },
      { key: "default_model", value: "1" },
    ])
    .onConflictDoNothing();

  // Hindari unused-import error saat seed awal (agents/skills diisi via 12-MIGRATION)
  void agents;
  void skills;

  console.log("Seed complete");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
