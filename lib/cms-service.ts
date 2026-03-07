import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

export type CmsPublishStatus = "draft" | "published";

export interface SitePage {
  id: string;
  pageKey: string;
  label: string;
  slug: string;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  status: CmsPublishStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PageSection {
  id: string;
  pageId: string;
  sectionKey: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  content: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  status: CmsPublishStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SiteSetting {
  id: string;
  settingGroup: string;
  settingKey: string;
  value: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface AppSitePageRow {
  id: string;
  page_key: string;
  label: string;
  slug: string;
  hero_badge: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image: string | null;
  status: CmsPublishStatus;
  seo_title: string | null;
  seo_description: string | null;
  seo_og_image: string | null;
  created_at: string;
  updated_at: string;
}

interface AppPageSectionRow {
  id: string;
  page_id: string;
  section_key: string;
  section_type: string;
  title: string | null;
  subtitle: string | null;
  badge: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
  content_json: Record<string, unknown> | null;
  sort_order: number;
  is_active: boolean;
  status: CmsPublishStatus;
  created_at: string;
  updated_at: string;
}

interface AppSiteSettingRow {
  id: string;
  setting_group: string;
  setting_key: string;
  value_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface GetPageBundleOptions {
  includeDraftSections?: boolean;
  includeDraftPage?: boolean;
}

export interface UpdateSitePageInput {
  label?: string;
  slug?: string;
  heroBadge?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: string;
  status?: CmsPublishStatus;
  seoTitle?: string;
  seoDescription?: string;
  seoOgImage?: string;
}

export interface CreatePageSectionInput {
  sectionKey: string;
  sectionType: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  content?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
  status?: CmsPublishStatus;
}

export interface UpdatePageSectionInput {
  sectionKey?: string;
  sectionType?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  content?: Record<string, unknown>;
  sortOrder?: number;
  isActive?: boolean;
  status?: CmsPublishStatus;
}

export interface UpsertSiteSettingInput {
  settingGroup: string;
  value: Record<string, unknown>;
}

export interface CmsPageBundle {
  page: SitePage | null;
  sections: PageSection[];
}

function mapPage(row: AppSitePageRow): SitePage {
  return {
    id: row.id,
    pageKey: row.page_key,
    label: row.label,
    slug: row.slug,
    heroBadge: row.hero_badge ?? undefined,
    heroTitle: row.hero_title ?? undefined,
    heroSubtitle: row.hero_subtitle ?? undefined,
    heroImage: row.hero_image ?? undefined,
    status: row.status,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    seoOgImage: row.seo_og_image ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSection(row: AppPageSectionRow): PageSection {
  return {
    id: row.id,
    pageId: row.page_id,
    sectionKey: row.section_key,
    sectionType: row.section_type,
    title: row.title ?? undefined,
    subtitle: row.subtitle ?? undefined,
    badge: row.badge ?? undefined,
    imageUrl: row.image_url ?? undefined,
    ctaLabel: row.cta_label ?? undefined,
    ctaHref: row.cta_href ?? undefined,
    content: row.content_json ?? {},
    sortOrder: row.sort_order,
    isActive: row.is_active,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapSetting(row: AppSiteSettingRow): SiteSetting {
  return {
    id: row.id,
    settingGroup: row.setting_group,
    settingKey: row.setting_key,
    value: row.value_json ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function normalizeSlug(slug?: string) {
  if (!slug) return undefined;
  const trimmed = slug.trim();
  if (!trimmed) return undefined;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function ensureConfigured() {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase no está configurado");
  }
}

function isMissingCmsTableError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;

  const code = String(error.code ?? "").toUpperCase();
  const message = String(error.message ?? "").toLowerCase();

  if (code === "42P01" || code === "PGRST205") {
    return true;
  }

  if (message.includes("could not find the table") || message.includes("relation") && message.includes("does not exist")) {
    return (
      message.includes("app_site_settings") ||
      message.includes("app_site_pages") ||
      message.includes("app_page_sections") ||
      message.includes("app_media_assets")
    );
  }

  return false;
}

function isTransientSupabaseReadError(error: { code?: string; message?: string } | null | undefined) {
  if (!error) return false;
  const message = String(error.message ?? "").toLowerCase();
  return message.includes("fetch failed") || message.includes("network") || message.includes("econnrefused");
}

export async function listSitePagesService(options?: { publishedOnly?: boolean }) {
  if (!hasSupabaseConfig()) {
    return [] as SitePage[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_site_pages")
    .select("*")
    .order("page_key", { ascending: true });

  if (options?.publishedOnly) {
    query = query.eq("status", "published");
  }

  const { data, error } = await query.returns<AppSitePageRow[]>();

  if (error) {
    if (isMissingCmsTableError(error) || isTransientSupabaseReadError(error)) {
      return [] as SitePage[];
    }
    throw new Error(`No se pudieron cargar páginas CMS: ${error.message}`);
  }

  return (data ?? []).map(mapPage);
}

export async function getSitePageService(pageKey: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_site_pages")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle<AppSitePageRow>();

  if (error) {
    if (isMissingCmsTableError(error) || isTransientSupabaseReadError(error)) {
      return null;
    }
    throw new Error(`No se pudo cargar la página CMS: ${error.message}`);
  }

  return data ? mapPage(data) : null;
}

export async function getCmsPageBundleService(
  pageKey: string,
  options?: GetPageBundleOptions
): Promise<CmsPageBundle> {
  if (!hasSupabaseConfig()) {
    return { page: null, sections: [] };
  }

  const supabase = getSupabaseAdminClient();
  const pageRes = await supabase
    .from("app_site_pages")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle<AppSitePageRow>();

  if (pageRes.error) {
    if (isMissingCmsTableError(pageRes.error) || isTransientSupabaseReadError(pageRes.error)) {
      return { page: null, sections: [] };
    }
    throw new Error(`No se pudo cargar página CMS: ${pageRes.error.message}`);
  }

  if (!pageRes.data) {
    return { page: null, sections: [] };
  }

  const page = mapPage(pageRes.data);

  if (!options?.includeDraftPage && page.status !== "published") {
    return { page: null, sections: [] };
  }

  let sectionsQuery = supabase
    .from("app_page_sections")
    .select("*")
    .eq("page_id", page.id)
    .order("sort_order", { ascending: true });

  if (!options?.includeDraftSections) {
    sectionsQuery = sectionsQuery.eq("status", "published").eq("is_active", true);
  }

  const sectionsRes = await sectionsQuery.returns<AppPageSectionRow[]>();
  if (sectionsRes.error) {
    if (isMissingCmsTableError(sectionsRes.error) || isTransientSupabaseReadError(sectionsRes.error)) {
      return { page, sections: [] };
    }
    throw new Error(`No se pudieron cargar secciones CMS: ${sectionsRes.error.message}`);
  }

  return {
    page,
    sections: (sectionsRes.data ?? []).map(mapSection)
  };
}

export async function upsertSitePageService(pageKey: string, input: UpdateSitePageInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const payload = {
    page_key: pageKey,
    label: input.label?.trim() || pageKey,
    slug: normalizeSlug(input.slug) || `/${pageKey === "home" ? "" : pageKey}`,
    hero_badge: input.heroBadge?.trim() || null,
    hero_title: input.heroTitle?.trim() || null,
    hero_subtitle: input.heroSubtitle?.trim() || null,
    hero_image: input.heroImage?.trim() || null,
    status: input.status ?? "published",
    seo_title: input.seoTitle?.trim() || null,
    seo_description: input.seoDescription?.trim() || null,
    seo_og_image: input.seoOgImage?.trim() || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("app_site_pages")
    .upsert(payload, { onConflict: "page_key" })
    .select("*")
    .single<AppSitePageRow>();

  if (error || !data) {
    throw new Error(`No se pudo guardar página CMS: ${error?.message ?? "sin datos"}`);
  }

  return mapPage(data);
}

async function getPageIdOrThrow(pageKey: string) {
  const supabase = getSupabaseAdminClient();
  const page = await supabase
    .from("app_site_pages")
    .select("id")
    .eq("page_key", pageKey)
    .maybeSingle<{ id: string }>();

  if (page.error) {
    throw new Error(`No se pudo consultar página CMS: ${page.error.message}`);
  }

  if (!page.data?.id) {
    throw new Error("Página CMS no encontrada");
  }

  return page.data.id;
}

export async function createPageSectionService(pageKey: string, input: CreatePageSectionInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const pageId = await getPageIdOrThrow(pageKey);

  const { data, error } = await supabase
    .from("app_page_sections")
    .insert({
      page_id: pageId,
      section_key: input.sectionKey.trim(),
      section_type: input.sectionType.trim(),
      title: input.title?.trim() || null,
      subtitle: input.subtitle?.trim() || null,
      badge: input.badge?.trim() || null,
      image_url: input.imageUrl?.trim() || null,
      cta_label: input.ctaLabel?.trim() || null,
      cta_href: input.ctaHref?.trim() || null,
      content_json: input.content ?? {},
      sort_order: input.sortOrder ?? 0,
      is_active: input.isActive ?? true,
      status: input.status ?? "published"
    })
    .select("*")
    .single<AppPageSectionRow>();

  if (error || !data) {
    throw new Error(`No se pudo crear sección CMS: ${error?.message ?? "sin datos"}`);
  }

  return mapSection(data);
}

export async function updatePageSectionService(sectionId: string, input: UpdatePageSectionInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString()
  };

  if (typeof input.sectionKey === "string") payload.section_key = input.sectionKey.trim();
  if (typeof input.sectionType === "string") payload.section_type = input.sectionType.trim();
  if (typeof input.title === "string") payload.title = input.title.trim() || null;
  if (typeof input.subtitle === "string") payload.subtitle = input.subtitle.trim() || null;
  if (typeof input.badge === "string") payload.badge = input.badge.trim() || null;
  if (typeof input.imageUrl === "string") payload.image_url = input.imageUrl.trim() || null;
  if (typeof input.ctaLabel === "string") payload.cta_label = input.ctaLabel.trim() || null;
  if (typeof input.ctaHref === "string") payload.cta_href = input.ctaHref.trim() || null;
  if (typeof input.sortOrder === "number") payload.sort_order = input.sortOrder;
  if (typeof input.isActive === "boolean") payload.is_active = input.isActive;
  if (typeof input.status === "string") payload.status = input.status;
  if (input.content) payload.content_json = input.content;

  const { data, error } = await supabase
    .from("app_page_sections")
    .update(payload)
    .eq("id", sectionId)
    .select("*")
    .single<AppPageSectionRow>();

  if (error || !data) {
    throw new Error(`No se pudo actualizar sección CMS: ${error?.message ?? "sin datos"}`);
  }

  return mapSection(data);
}

export async function deletePageSectionService(sectionId: string) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("app_page_sections").delete().eq("id", sectionId);
  if (error) {
    throw new Error(`No se pudo eliminar sección CMS: ${error.message}`);
  }

  return { ok: true };
}

export async function reorderPageSectionsService(pageKey: string, sectionIds: string[]) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();
  const pageId = await getPageIdOrThrow(pageKey);

  for (let index = 0; index < sectionIds.length; index += 1) {
    const sectionId = sectionIds[index];
    const updateResult = await supabase
      .from("app_page_sections")
      .update({ sort_order: (index + 1) * 10, updated_at: new Date().toISOString() })
      .eq("id", sectionId)
      .eq("page_id", pageId);

    if (updateResult.error) {
      throw new Error(`No se pudo reordenar secciones CMS: ${updateResult.error.message}`);
    }
  }

  return { ok: true };
}

export async function listSiteSettingsService(options?: { settingGroup?: string }) {
  if (!hasSupabaseConfig()) {
    return [] as SiteSetting[];
  }

  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from("app_site_settings")
    .select("*")
    .order("setting_group", { ascending: true })
    .order("setting_key", { ascending: true });

  if (options?.settingGroup) {
    query = query.eq("setting_group", options.settingGroup);
  }

  const { data, error } = await query.returns<AppSiteSettingRow[]>();
  if (error) {
    if (isMissingCmsTableError(error) || isTransientSupabaseReadError(error)) {
      return [] as SiteSetting[];
    }
    throw new Error(`No se pudieron cargar settings: ${error.message}`);
  }

  return (data ?? []).map(mapSetting);
}

export async function getSiteSettingService(settingKey: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("app_site_settings")
    .select("*")
    .eq("setting_key", settingKey)
    .maybeSingle<AppSiteSettingRow>();

  if (error) {
    if (isMissingCmsTableError(error) || isTransientSupabaseReadError(error)) {
      return null;
    }
    throw new Error(`No se pudo cargar setting ${settingKey}: ${error.message}`);
  }

  return data ? mapSetting(data) : null;
}

export async function upsertSiteSettingService(settingKey: string, input: UpsertSiteSettingInput) {
  ensureConfigured();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from("app_site_settings")
    .upsert(
      {
        setting_key: settingKey,
        setting_group: input.settingGroup,
        value_json: input.value,
        updated_at: new Date().toISOString()
      },
      { onConflict: "setting_key" }
    )
    .select("*")
    .single<AppSiteSettingRow>();

  if (error || !data) {
    throw new Error(`No se pudo guardar setting ${settingKey}: ${error?.message ?? "sin datos"}`);
  }

  return mapSetting(data);
}
