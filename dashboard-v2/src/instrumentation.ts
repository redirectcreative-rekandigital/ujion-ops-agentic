export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initScheduler } = await import("./lib/scheduler");
    await initScheduler();
    // Startup sync: config saja (agents/skills/opencode.json/kantor).
    // Markdown (tugas/*.md) TIDAK di-sync saat boot agar BOARD live tidak
    // tertimpa sebelum 12-MIGRATION mengimpor task ke DB.
    try {
      const { syncAll } = await import("./lib/opencode/config-sync");
      await syncAll("config");
    } catch (e) {
      console.error("[sync] startup config sync gagal:", e);
    }
  }
}
