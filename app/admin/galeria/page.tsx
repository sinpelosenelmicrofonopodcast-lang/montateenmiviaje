import { AdminGalleryManager } from "@/components/custom/admin-gallery-manager";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listGalleryBundlesService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminGaleriaPage() {
  await requireAdminServerAccess();
  const bundles = await listGalleryBundlesService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Galería premium</h1>
      </header>
      <AdminGalleryManager initialBundles={bundles} />
    </main>
  );
}
