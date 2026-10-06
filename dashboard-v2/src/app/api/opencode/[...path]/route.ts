import { NextRequest } from "next/server";

const OPENCODE_URL = process.env.OPENCODE_SERVER_URL || "http://localhost:4096";
const OPENCODE_PASSWORD = process.env.OPENCODE_SERVER_PASSWORD || "";

// Proxy semua request ke opencode serve (frontend direct access).
// Frontend call /api/opencode/session → proxy ke opencode:4096/session.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(request, path);
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const targetPath = "/" + pathSegments.join("/");
  const url = new URL(targetPath, OPENCODE_URL);
  url.search = request.nextUrl.search;

  const headers: Record<string, string> = {};
  if (OPENCODE_PASSWORD) {
    const creds =
      typeof Buffer !== "undefined"
        ? Buffer.from(`opencode:${OPENCODE_PASSWORD}`).toString("base64")
        : btoa(`opencode:${OPENCODE_PASSWORD}`);
    headers.Authorization = `Basic ${creds}`;
  }
  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "DELETE") {
    body = await request.arrayBuffer();
  }

  try {
    const res = await fetch(url.toString(), {
      method: request.method,
      headers,
      body,
    });
    const data = await res.arrayBuffer();
    return new Response(data, {
      status: res.status,
      headers: {
        "Content-Type": res.headers.get("content-type") || "application/json",
      },
    });
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "opencode serve tidak terjangkau",
        hint: "Jalankan opencode serve di VPS (deploy/pasang-opencode-serve.sh)",
      },
      { status: 502 }
    );
  }
}
