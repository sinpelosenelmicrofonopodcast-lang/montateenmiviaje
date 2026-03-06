import { AdminTestimonialsManager } from "@/components/custom/admin-testimonials-manager";
import { listTestimonialsService } from "@/lib/catalog-service";

export const dynamic = "force-dynamic";

export default async function AdminTestimoniosPage() {
  const testimonials = await listTestimonialsService();

  return (
    <main className="container section">
      <header className="page-header">
        <h1>Testimonios verificados</h1>
      </header>
      <AdminTestimonialsManager initialTestimonials={testimonials} />
    </main>
  );
}
