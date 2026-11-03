import "server-only";
import { createSign, randomUUID } from "node:crypto";
import type { Trip, TripCategory, TripPackage } from "@/lib/types";

// Server-side Google Sheets REST client. Never send service-account credentials to the browser.
// The service account must be granted Editor permission on this one spreadsheet.
const DEFAULT_SHEET_ID = "1BqfMqyvbDc_GboCrP6EIxXyfoUuHfQLS5xHTmdihRqs";
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";
type GoogleCell = string | number | boolean | null;
type SheetsValues = { values?: GoogleCell[][] };
type AccessToken = { access_token: string; expires_in?: number };
type QuoteInput = {
  customerName: string; customerEmail: string; destination: string;
  startDate: string; endDate: string; travelers: number; budget: number;
  motive: string; expectations: string;
};
let cached: { token: string; expiresAt: number } | null = null;

function config() {
  const email = process.env.HGM_GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const key = process.env.HGM_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  const sheetId = process.env.HGM_GOOGLE_SHEET_ID?.trim() || DEFAULT_SHEET_ID;
  if (!email || !key) throw new Error("HGM_GOOGLE_CREDENTIALS_MISSING");
  if (!/^[a-zA-Z0-9_-]{20,}$/.test(sheetId)) throw new Error("HGM_GOOGLE_INVALID_SHEET");
  return { email, key, sheetId };
}

export function hgmGoogleReady() {
  return Boolean((process.env.HGM_GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.HGM_GOOGLE_PRIVATE_KEY) ||
    (process.env.HGM_GOOGLE_APPS_SCRIPT_URL && process.env.HGM_GOOGLE_API_TOKEN));
}

function useScriptBridge() {
  return !process.env.HGM_GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.HGM_GOOGLE_PRIVATE_KEY;
}

async function bridge<T>(action: string, input: Record<string, unknown> = {}): Promise<T> {
  const endpoint = new URL(process.env.HGM_GOOGLE_APPS_SCRIPT_URL || "https://invalid.local");
  if (endpoint.protocol !== "https:" || endpoint.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname)) throw new Error("HGM_GOOGLE_INVALID_ENDPOINT");
  const response = await fetch(endpoint, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, action, token: process.env.HGM_GOOGLE_API_TOKEN }),
    cache: "no-store", signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`HGM_GOOGLE_BRIDGE_HTTP_${response.status}`);
  const result = await response.json();
  if (result.ok !== true) throw new Error("HGM_GOOGLE_BRIDGE_REJECTED");
  return result as T;
}

function b64url(data: string) {
  return Buffer.from(data, "utf8").toString("base64url");
}

async function token() {
  if (cached && Date.now() < cached.expiresAt) return cached.token;
  const { email, key } = config();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    iss: email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion
    }),
    cache: "no-store", signal: AbortSignal.timeout(12000)
  });
  if (!response.ok) throw new Error(`HGM_GOOGLE_AUTH_HTTP_${response.status}`);
  const result = await response.json() as AccessToken;
  if (!result.access_token) throw new Error("HGM_GOOGLE_AUTH_EMPTY");
  cached = { token: result.access_token, expiresAt: Date.now() + Math.max(30, (result.expires_in || 3600) - 120) * 1000 };
  return cached.token;
}

async function sheetsRequest<T>(range: string, append?: GoogleCell[]): Promise<T> {
  const { sheetId } = config();
  const base = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(sheetId)}/values/${encodeURIComponent(range)}`;
  const url = append ? `${base}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS` : base;
  const accessToken = await token();
  const response = await fetch(url, {
    method: append ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(append ? { "Content-Type": "application/json" } : {})
    },
    ...(append ? { body: JSON.stringify({ majorDimension: "ROWS", values: [append] }) } : {}),
    cache: "no-store", signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) {
    // Do not include Google response bodies in user-visible errors; they can include details.
    throw new Error(`HGM_GOOGLE_SHEETS_HTTP_${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function rows(tab: "VIAJES" | "PAQUETES" | "BLOG") {
  if (useScriptBridge()) {
    const action = { VIAJES: "listTrips", PAQUETES: "listPackages", BLOG: "listPosts" }[tab];
    const result = await bridge<{ rows: Record<string, GoogleCell>[] }>(action);
    if (!Array.isArray(result.rows)) throw new Error("HGM_GOOGLE_SCHEMA_MISMATCH");
    return result.rows.map(row => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value ?? ""])));
  }
  const result = await sheetsRequest<SheetsValues>(`'${tab}'!A1:Z5000`);
  const [heading, ...data] = result.values || [];
  if (!heading?.length) throw new Error(`HGM_GOOGLE_EMPTY_HEADER_${tab}`);
  const names = heading.map(String);
  return data.filter(row => row.some(c => c !== null && c !== "")).map(row =>
    Object.fromEntries(names.map((name, i) => [name, row[i] ?? ""])) as Record<string, GoogleCell>
  );
}
function str(v: unknown) { return v === undefined || v === null ? "" : String(v); }
function num(v: unknown) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(str);
  try { const a: unknown = JSON.parse(str(v) || "[]"); return Array.isArray(a) ? a.map(str) : []; }
  catch { return []; }
}
function featured(v: unknown) { return v === true || str(v).toLowerCase() === "true"; }

export async function listGoogleTrips(options?: { publishedOnly?: boolean; featuredOnly?: boolean }): Promise<Trip[]> {
  const [trips, packages] = await Promise.all([rows("VIAJES"), rows("PAQUETES")]);
  return trips.filter(r =>
    (!options?.publishedOnly || str(r.estado_publicacion) === "published") &&
    (!options?.featuredOnly || featured(r.destacado))
  ).map(r => {
    const matching: TripPackage[] = packages.filter(p => str(p.trip_id) === str(r.trip_id)).map(p => ({
      id: str(p.package_id),
      roomType: str(p.tipo_habitacion) === "single" ? "single" : str(p.tipo_habitacion) === "triple" ? "triple" : "doble",
      pricePerPerson: num(p.precio_persona_usd),
      deposit: num(p.deposito_usd),
      paymentPlan: str(p.plan_pagos)
    }));
    return {
      id: str(r.trip_id), slug: str(r.slug), title: str(r.titulo),
      destination: str(r.destino), category: str(r.categoria) as TripCategory,
      startDate: str(r.fecha_inicio), endDate: str(r.fecha_fin),
      availableSpots: num(r.cupos_disponibles), totalSpots: num(r.cupos_totales),
      heroImage: str(r.imagen_portada), summary: str(r.descripcion),
      priceFrom: num(r.precio_desde_usd) || undefined,
      includes: arr(r.incluye_json), excludes: arr(r.excluye_json),
      policies: arr(r.politicas_json), requirements: [],
      itinerary: [], packages: matching, addons: [],
      publishStatus: str(r.estado_publicacion) as Trip["publishStatus"],
      featured: featured(r.destacado)
    };
  });
}

function required(v: unknown, max: number) {
  if (typeof v !== "string" || !v.trim() || v.length > max) throw new Error("HGM_GOOGLE_BAD_INPUT");
  return v.trim();
}

export async function createGoogleQuote(input: QuoteInput) {
  const name = required(input.customerName, 160);
  const email = required(input.customerEmail, 320).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("HGM_GOOGLE_BAD_INPUT");
  const destination = required(input.destination, 200);
  const start = required(input.startDate, 30);
  const end = required(input.endDate, 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end < start)
    throw new Error("HGM_GOOGLE_BAD_INPUT");
  if (!Number.isInteger(input.travelers) || input.travelers < 1 || input.travelers > 20 ||
      !Number.isFinite(input.budget) || input.budget <= 0) throw new Error("HGM_GOOGLE_BAD_INPUT");
  const motive = required(input.motive, 300);
  const expectations = required(input.expectations, 4000);
  const id = randomUUID(), now = new Date().toISOString();
  if (useScriptBridge()) {
    const result = await bridge<{ requestId: string }>("createQuote", { quote: {
      ...input, customerName: name, customerEmail: email, destination,
      startDate: start, endDate: end, motive, expectations
    } });
    if (!result.requestId) throw new Error("HGM_GOOGLE_SCHEMA_MISMATCH");
    return result.requestId;
  }
  await sheetsRequest<unknown>("'COTIZACIONES'!A:N", [
    id, now, name, email, destination, start, end, input.travelers,
    input.budget, motive, expectations, "submitted", "", now
  ]);
  return id;
}

export async function googleHealth() {
  if (useScriptBridge()) {
    await Promise.all([rows("VIAJES"), rows("PAQUETES")]);
    return { ok: true, provider: "google-apps-script", sheet: "VIAJES" };
  }
  const r = await sheetsRequest<SheetsValues>("'VIAJES'!A1:B1");
  if (r.values?.[0]?.[0] !== "trip_id") throw new Error("HGM_GOOGLE_SCHEMA_MISMATCH");
  return { ok: true, provider: "google-sheets-api", sheet: "VIAJES" };
}
