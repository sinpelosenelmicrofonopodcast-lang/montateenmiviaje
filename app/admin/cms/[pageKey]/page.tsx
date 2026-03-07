import { notFound } from "next/navigation";
import { AdminCmsManager } from "@/components/custom/admin-cms-manager";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { getCmsPageBundleService } from "@/lib/cms-service";

interface AdminCmsDetailPageProps {
  params: Promise<{ pageKey: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminCmsDetailPage({ params }: AdminCmsDetailPageProps) {
  await requireAdminServerAccess();
  const { pageKey } = await params;
  const bundle = await getCmsPageBundleService(pageKey, {
    includeDraftPage: true,
    includeDraftSections: true
  });

  if (!bundle.page) {
    notFound();
  }

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">CMS · {bundle.page.pageKey}</p>
        <h1>{bundle.page.label}</h1>
        <p className="section-subtitle">Edita contenido, orden, activación y SEO de esta página pública.</p>
      </header>

      <AdminCmsManager pageKey={pageKey} initialPage={bundle.page} initialSections={bundle.sections} />
    </main>
  );
}
