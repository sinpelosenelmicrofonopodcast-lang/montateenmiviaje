import { AdminTestimonialsManager } from "@/components/custom/admin-testimonials-manager";
import Link from "next/link";
import { requireAdminServerAccess } from "@/lib/admin-guard";
import { listTestimonialsService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminTestimoniosPage() {
  await requireAdminServerAccess();
  const testimonials = await listTestimonialsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Testimonios verificados</h1>
        <div className="button-row">
          <Link href="/testimonios" target="_blank" className="button-outline">
            Preview público
          </Link>
        </div>
      </header>
      <AdminTestimonialsManager initialTestimonials={testimonials} />
    </main>
  );
}
