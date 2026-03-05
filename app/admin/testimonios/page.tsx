import { testimonials } from "@/lib/data";

export default function AdminTestimoniosPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <h1>Testimonios verificados</h1>
      </header>

      <section className="stack-grid">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "Pendiente"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
            <div className="button-row">
              <button className="button-dark" type="button">Aprobar</button>
              <button className="button-outline" type="button">Ocultar</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
