import { createParser } from "eventsource-parser";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

function encodeBase64(s: string): string {
  if (typeof Buffer !== "undefined") return Buffer.from(s).toString("base64");
  return btoa(s);
}

function authHeader(): Record<string, string> {
  if (!OPENCODE_PASSWORD) return {};
  return { Authorization: `Basic ${encodeBase64(`opencode:${OPENCODE_PASSWORD}`)}` };
}

async function opencodeFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${OPENCODE_URL}${path}`, {
    ...options,
    headers: { ...authHeader(), ...options.headers },
  });
  if (!res.ok) {
    throw new Error(`opencode API error: ${res.status} ${res.statusText}`);
  }
  return res;
}

export async function getHealth() {
  const res = await opencodeFetch("/global/health");
  return res.json();
}

export async function listSessions() {
  const res = await opencodeFetch("/session");
  return res.json();
}

export async function getSessionMessages(id: string) {
  const res = await opencodeFetch(`/session/${id}/message`);
  return res.json();
}

export async function createSession(data: { parentID?: string; title?: string }) {
  const res = await opencodeFetch("/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSession(id: string) {
  await opencodeFetch(`/session/${id}`, { method: "DELETE" });
}

export async function sendMessage(id: string, body: unknown) {
  const res = await opencodeFetch(`/session/${id}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function sendMessageAsync(id: string, body: unknown) {
  await opencodeFetch(`/session/${id}/prompt_async`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function abortSession(id: string) {
  await opencodeFetch(`/session/${id}/abort`, { method: "POST" });
}

export async function getSessionDiff(id: string) {
  const res = await opencodeFetch(`/session/${id}/diff`);
  return res.json();
}

export async function executeCommand(sessionId: string, command: string, args: string) {
  const res = await opencodeFetch(`/session/${sessionId}/command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ command, arguments: args }),
  });
  return res.json();
}

// === Session detail & todo ===
export async function getSession(id: string) {
  const res = await opencodeFetch(`/session/${id}`);
  return res.json();
}

export async function getSessionTodo(id: string) {
  const res = await opencodeFetch(`/session/${id}/todo`);
  return res.json();
}

// === Config ===
export async function getConfig() {
  const res = await opencodeFetch("/config");
  return res.json();
}

export async function patchConfig(patch: unknown) {
  const res = await opencodeFetch("/config", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return res.json();
}

// === Agents ===
export async function listAgents() {
  const res = await opencodeFetch("/agent");
  return res.json();
}

// === MCP ===
export async function getMcpStatus() {
  const res = await opencodeFetch("/mcp");
  return res.json();
}

export async function addMcpServer(name: string, config: unknown) {
  const res = await opencodeFetch("/mcp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, config }),
  });
  return res.json();
}

// === Providers ===
export async function listProviders() {
  const res = await opencodeFetch("/provider");
  return res.json();
}

export async function setProviderAuth(providerId: string, credentials: unknown) {
  await opencodeFetch(`/auth/${providerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

// === Commands ===
export async function listCommands() {
  const res = await opencodeFetch("/command");
  return res.json();
}

// Terima event real-time dari opencode serve (SSE stream).
// Setiap event diteruskan ke callback onEvent untuk diproses.
export async function getEvents(
  onEvent: (event: string, data: Record<string, unknown>) => void,
  signal?: AbortSignal
): Promise<void> {
  const res = await fetch(`${OPENCODE_URL}/event`, {
    headers: { ...authHeader() },
    signal,
  });

  if (!res.body) throw new Error("Tidak ada body respons");

  const parser = createParser({
    onEvent: (event) => {
      try {
        const data = JSON.parse(event.data);
        onEvent(typeof data.type === "string" ? data.type : "event", data);
      } catch {
        onEvent("raw", { text: event.data });
      }
    },
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    parser.feed(decoder.decode(value, { stream: true }));
  }
}
