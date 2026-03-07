import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

const DEFAULT_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "public-assets";
const MAX_FILE_BYTES = 12 * 1024 * 1024;

function sanitizeSegment(value: string) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-");
  return normalized.replace(/^-|-$/g, "") || "trip";
}

function extensionFromName(name: string) {
  const parts = name.toLowerCase().split(".");
  if (parts.length < 2) return "jpg";
  const ext = parts.at(-1) || "jpg";
  if (!/^[a-z0-9]+$/.test(ext)) return "jpg";
  return ext;
}

async function ensureBucketExists() {
  const supabase = getSupabaseAdminClient();
  const buckets = await supabase.storage.listBuckets();

  if (buckets.error) {
    throw new Error(`No se pudieron listar buckets: ${buckets.error.message}`);
  }

  const exists = (buckets.data ?? []).some((bucket) => bucket.name === DEFAULT_BUCKET);
  if (exists) {
    return;
  }

  const created = await supabase.storage.createBucket(DEFAULT_BUCKET, {
    public: true,
    fileSizeLimit: `${MAX_FILE_BYTES}`
  });

  if (created.error && !created.error.message.toLowerCase().includes("already exists")) {
    throw new Error(`No se pudo crear bucket de media: ${created.error.message}`);
  }
}

export async function POST(request: Request) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json({ message: "Supabase no está configurado" }, { status: 500 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const slug = String(formData.get("slug") ?? "trip");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "Archivo inválido" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ message: "Solo se permiten imágenes" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ message: "La imagen excede el límite permitido (12MB)" }, { status: 400 });
    }

    await ensureBucketExists();

    const safeSlug = sanitizeSegment(slug);
    const ext = extensionFromName(file.name);
    const filePath = `trips/${safeSlug}/${Date.now()}-${randomUUID()}.${ext}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const supabase = getSupabaseAdminClient();
    const upload = await supabase.storage.from(DEFAULT_BUCKET).upload(filePath, bytes, {
      contentType: file.type,
      upsert: false
    });

    if (upload.error) {
      return NextResponse.json({ message: `No se pudo subir imagen: ${upload.error.message}` }, { status: 500 });
    }

    const publicUrlData = supabase.storage.from(DEFAULT_BUCKET).getPublicUrl(filePath);
    const publicUrl = publicUrlData.data.publicUrl;

    if (!publicUrl) {
      return NextResponse.json({ message: "No se pudo obtener URL pública" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      url: publicUrl,
      path: filePath,
      bucket: DEFAULT_BUCKET
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error interno";
    return NextResponse.json({ message }, { status: 500 });
  }
}
