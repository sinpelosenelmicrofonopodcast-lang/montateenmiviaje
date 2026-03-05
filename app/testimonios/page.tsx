import { testimonials } from "@/lib/data";

export default function TestimoniosPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Social Proof</p>
        <h1>Testimonios verificados</h1>
      </header>
      <section className="trip-grid">
        {testimonials.map((testimonial) => (
          <article key={testimonial.id} className="card">
            <p className="chip">{testimonial.verified ? "Verificado" : "Pendiente"}</p>
            <h3>{testimonial.customerName}</h3>
            <p>{testimonial.quote}</p>
            <p className="muted">{testimonial.tripTitle}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
