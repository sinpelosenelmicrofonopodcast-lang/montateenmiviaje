"use client";

import { useMemo, useState } from "react";
import type { PageSection, SitePage } from "@/lib/cms-service";

interface AdminCmsManagerProps {
  pageKey: string;
  initialPage: SitePage;
  initialSections: PageSection[];
}

function previewUrlForPage(pageKey: string) {
  switch (pageKey) {
    case "home":
      return "/";
    default:
      return `/${pageKey}`;
  }
}

function orderedSections(sections: PageSection[]) {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function AdminCmsManager({ pageKey, initialPage, initialSections }: AdminCmsManagerProps) {
  const [page, setPage] = useState(initialPage);
  const [sections, setSections] = useState(orderedSections(initialSections));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [previewTick, setPreviewTick] = useState(0);

  const previewUrl = useMemo(
    () => `${previewUrlForPage(pageKey)}${previewUrlForPage(pageKey).includes("?") ? "&" : "?"}preview=${previewTick}`,
    [pageKey, previewTick]
  );

  async function refreshBundle() {
    const response = await fetch(`/api/admin/cms/pages/${pageKey}`, { cache: "no-store" });
    const payload = (await response.json()) as {
      page?: SitePage;
      sections?: PageSection[];
      message?: string;
    };

    if (!response.ok || !payload.page) {
      throw new Error(payload.message ?? "No se pudo refrescar el CMS");
    }

    setPage(payload.page);
    setSections(orderedSections(payload.sections ?? []));
  }

  async function handlePageSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        label: String(formData.get("label") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        heroBadge: String(formData.get("heroBadge") ?? ""),
        heroTitle: String(formData.get("heroTitle") ?? ""),
        heroSubtitle: String(formData.get("heroSubtitle") ?? ""),
        heroImage: String(formData.get("heroImage") ?? ""),
        seoTitle: String(formData.get("seoTitle") ?? ""),
        seoDescription: String(formData.get("seoDescription") ?? ""),
        seoOgImage: String(formData.get("seoOgImage") ?? ""),
        status: String(formData.get("status") ?? "published")
      };

      const response = await fetch(`/api/admin/cms/pages/${pageKey}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { page?: SitePage; message?: string };
      if (!response.ok || !result.page) {
        throw new Error(result.message ?? "No se pudo guardar página");
      }

      setPage(result.page);
      setMessage("Página CMS actualizada.");
      setPreviewTick((value) => value + 1);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const contentRaw = String(formData.get("content") ?? "{}");
      const payload = {
        sectionKey: String(formData.get("sectionKey") ?? ""),
        sectionType: String(formData.get("sectionType") ?? ""),
        title: String(formData.get("title") ?? ""),
        subtitle: String(formData.get("subtitle") ?? ""),
        badge: String(formData.get("badge") ?? ""),
        imageUrl: String(formData.get("imageUrl") ?? ""),
        ctaLabel: String(formData.get("ctaLabel") ?? ""),
        ctaHref: String(formData.get("ctaHref") ?? ""),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
        isActive: String(formData.get("isActive") ?? "yes") === "yes",
        status: String(formData.get("status") ?? "published"),
        content: contentRaw.trim() ? JSON.parse(contentRaw) : {}
      };

      const response = await fetch(`/api/admin/cms/pages/${pageKey}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo crear la sección");
      }

      await refreshBundle();
      event.currentTarget.reset();
      setMessage("Sección creada.");
      setPreviewTick((value) => value + 1);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSection(event: React.FormEvent<HTMLFormElement>, sectionId: string) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData(event.currentTarget);
      const contentRaw = String(formData.get("content") ?? "{}");
      const payload = {
        sectionKey: String(formData.get("sectionKey") ?? ""),
        sectionType: String(formData.get("sectionType") ?? ""),
        title: String(formData.get("title") ?? ""),
        subtitle: String(formData.get("subtitle") ?? ""),
        badge: String(formData.get("badge") ?? ""),
        imageUrl: String(formData.get("imageUrl") ?? ""),
        ctaLabel: String(formData.get("ctaLabel") ?? ""),
        ctaHref: String(formData.get("ctaHref") ?? ""),
        sortOrder: Number(formData.get("sortOrder") ?? 0),
        isActive: String(formData.get("isActive") ?? "yes") === "yes",
        status: String(formData.get("status") ?? "published"),
        content: contentRaw.trim() ? JSON.parse(contentRaw) : {}
      };

      const response = await fetch(`/api/admin/cms/sections/${sectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo actualizar sección");
      }

      await refreshBundle();
      setMessage("Sección actualizada.");
      setPreviewTick((value) => value + 1);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSection(sectionId: string) {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/cms/sections/${sectionId}`, {
        method: "DELETE"
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo eliminar sección");
      }

      await refreshBundle();
      setMessage("Sección eliminada.");
      setPreviewTick((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function moveSection(sectionId: string, direction: "up" | "down") {
    const current = orderedSections(sections);
    const currentIndex = current.findIndex((section) => section.id === sectionId);
    if (currentIndex < 0) {
      return;
    }

    const nextIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (nextIndex < 0 || nextIndex >= current.length) {
      return;
    }

    const copy = [...current];
    const [moved] = copy.splice(currentIndex, 1);
    copy.splice(nextIndex, 0, moved);

    try {
      setLoading(true);
      const response = await fetch(`/api/admin/cms/pages/${pageKey}/sections/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionIds: copy.map((item) => item.id) })
      });

      const result = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo reordenar");
      }

      await refreshBundle();
      setPreviewTick((value) => value + 1);
      setMessage("Orden de secciones actualizado.");
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-cms-shell">
      <section className="stack-grid">
        <form className="card" onSubmit={handlePageSave}>
          <h2>Configuración de página</h2>
          <div className="request-grid">
            <label>
              Label interno
              <input name="label" defaultValue={page.label} required />
            </label>
            <label>
              Slug
              <input name="slug" defaultValue={page.slug} required />
            </label>
            <label>
              Hero badge
              <input name="heroBadge" defaultValue={page.heroBadge ?? ""} />
            </label>
            <label>
              Hero título
              <input name="heroTitle" defaultValue={page.heroTitle ?? ""} />
            </label>
            <label className="request-full">
              Hero subtítulo
              <textarea name="heroSubtitle" rows={3} defaultValue={page.heroSubtitle ?? ""} />
            </label>
            <label>
              Hero imagen URL
              <input name="heroImage" defaultValue={page.heroImage ?? ""} />
            </label>
            <label>
              Estado
              <select name="status" defaultValue={page.status}>
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </label>
            <label>
              SEO title
              <input name="seoTitle" defaultValue={page.seoTitle ?? ""} />
            </label>
            <label className="request-full">
              SEO description
              <textarea name="seoDescription" rows={2} defaultValue={page.seoDescription ?? ""} />
            </label>
            <label className="request-full">
              SEO OG image
              <input name="seoOgImage" defaultValue={page.seoOgImage ?? ""} />
            </label>
          </div>
          <div className="button-row">
            <button className="button-dark" disabled={loading} type="submit">
              Guardar página
            </button>
            <button
              className="button-outline"
              disabled={loading}
              type="button"
              onClick={() => setPreviewTick((value) => value + 1)}
            >
              Refrescar preview
            </button>
          </div>
        </form>

        <form className="card" onSubmit={handleCreateSection}>
          <h2>Nueva sección</h2>
          <div className="request-grid">
            <label>
              sectionKey
              <input name="sectionKey" placeholder="home_faq_2" required />
            </label>
            <label>
              sectionType
              <input name="sectionType" placeholder="faq" required />
            </label>
            <label>
              Título
              <input name="title" />
            </label>
            <label>
              Subtítulo
              <input name="subtitle" />
            </label>
            <label>
              Badge
              <input name="badge" />
            </label>
            <label>
              Imagen URL
              <input name="imageUrl" />
            </label>
            <label>
              CTA label
              <input name="ctaLabel" />
            </label>
            <label>
              CTA href
              <input name="ctaHref" placeholder="/viajes" />
            </label>
            <label>
              sortOrder
              <input type="number" name="sortOrder" defaultValue={sections.length * 10 + 10} />
            </label>
            <label>
              isActive
              <select name="isActive" defaultValue="yes">
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </label>
            <label>
              Status
              <select name="status" defaultValue="published">
                <option value="published">published</option>
                <option value="draft">draft</option>
              </select>
            </label>
            <label className="request-full">
              content JSON
              <textarea name="content" rows={5} defaultValue="{}" />
            </label>
          </div>
          <button className="button-dark" disabled={loading} type="submit">
            Crear sección
          </button>
        </form>

        <section className="stack-grid">
          {orderedSections(sections).map((section) => (
            <form key={section.id} className="card" onSubmit={(event) => void handleUpdateSection(event, section.id)}>
              <div className="table-head-row">
                <div>
                  <p className="chip">{section.sectionType}</p>
                  <h3>{section.sectionKey}</h3>
                </div>
                <div className="button-row">
                  <button type="button" className="button-outline" onClick={() => void moveSection(section.id, "up")}>↑</button>
                  <button type="button" className="button-outline" onClick={() => void moveSection(section.id, "down")}>↓</button>
                  <button type="button" className="button-outline" onClick={() => void deleteSection(section.id)}>Eliminar</button>
                </div>
              </div>

              <div className="request-grid">
                <label>
                  sectionKey
                  <input name="sectionKey" defaultValue={section.sectionKey} required />
                </label>
                <label>
                  sectionType
                  <input name="sectionType" defaultValue={section.sectionType} required />
                </label>
                <label>
                  title
                  <input name="title" defaultValue={section.title ?? ""} />
                </label>
                <label>
                  subtitle
                  <input name="subtitle" defaultValue={section.subtitle ?? ""} />
                </label>
                <label>
                  badge
                  <input name="badge" defaultValue={section.badge ?? ""} />
                </label>
                <label>
                  imageUrl
                  <input name="imageUrl" defaultValue={section.imageUrl ?? ""} />
                </label>
                <label>
                  ctaLabel
                  <input name="ctaLabel" defaultValue={section.ctaLabel ?? ""} />
                </label>
                <label>
                  ctaHref
                  <input name="ctaHref" defaultValue={section.ctaHref ?? ""} />
                </label>
                <label>
                  sortOrder
                  <input type="number" name="sortOrder" defaultValue={section.sortOrder} />
                </label>
                <label>
                  isActive
                  <select name="isActive" defaultValue={section.isActive ? "yes" : "no"}>
                    <option value="yes">yes</option>
                    <option value="no">no</option>
                  </select>
                </label>
                <label>
                  status
                  <select name="status" defaultValue={section.status}>
                    <option value="published">published</option>
                    <option value="draft">draft</option>
                  </select>
                </label>
                <label className="request-full">
                  content JSON
                  <textarea name="content" rows={5} defaultValue={JSON.stringify(section.content, null, 2)} />
                </label>
              </div>

              <button className="button-dark" disabled={loading} type="submit">
                Guardar sección
              </button>
            </form>
          ))}
        </section>

        {message ? <p className="success">{message}</p> : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <aside className="card admin-cms-preview">
        <div className="table-head-row">
          <div>
            <p className="chip">Live Preview</p>
            <h3>{page.label}</h3>
          </div>
          <button className="button-outline" type="button" onClick={() => setPreviewTick((value) => value + 1)}>
            Reload
          </button>
        </div>

        <iframe key={previewUrl} title={`Preview ${pageKey}`} src={previewUrl} className="admin-preview-frame" />
      </aside>
    </div>
  );
}
