import Link from "next/link";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listSitePagesService } from "@/lib/cms-service";

export const dynamic = "force-dynamic";

export default async function AdminCmsPage() {
  await requireAdminServerAccess();
  const pages = await listSitePagesService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Content Manager (CMS)</h1>
        <p className="section-subtitle">
          Control total del contenido público: home, viajes, ofertas, sorteos, testimonios, galería, about, contacto y FAQ.
        </p>
      </header>

      <section className="admin-grid">
        {pages.map((page) => (
          <article key={page.id} className="admin-card">
            <p className="chip">{page.status}</p>
            <h3>{page.label}</h3>
            <p className="muted">{page.slug}</p>
            <div className="button-row">
              <Link className="button-dark" href={`/admin/cms/${page.pageKey}`}>
                Editar contenido
              </Link>
              <Link className="button-outline" href={page.slug} target="_blank">
                Ver página
              </Link>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
