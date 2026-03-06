import { AdminGalleryManager } from "@/components/custom/admin-gallery-manager";
import { listGalleryBundlesService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminGaleriaPage() {
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
