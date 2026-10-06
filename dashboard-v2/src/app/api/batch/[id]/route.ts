import { NextRequest, NextResponse } from "next/server";
import { getBatch } from "../route";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const batch = getBatch(id);
  if (!batch) return NextResponse.json({ error: "batch tidak ditemukan" }, { status: 404 });
  return NextResponse.json(batch);
}
