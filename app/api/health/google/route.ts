import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const url = new URL(process.env.HGM_GOOGLE_APPS_SCRIPT_URL || "https://invalid.local");
    if (url.protocol !== "https:" || url.hostname !== "script.google.com" || !process.env.HGM_GOOGLE_API_TOKEN) throw new Error("CONFIG");
    const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "listTrips", token: process.env.HGM_GOOGLE_API_TOKEN, publishedOnly: true }), cache: "no-store", signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error("HTTP");
    const result = await response.json();
    if (result.ok !== true || !Array.isArray(result.rows)) throw new Error("REJECTED");
    return NextResponse.json({ ok: true, connected: true, provider: "google" });
  } catch {
    return NextResponse.json({ ok: false, connected: false }, { status: 503 });
  }
}
