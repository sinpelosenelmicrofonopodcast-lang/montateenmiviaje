export default function PortalSoportePage() {
  return (
    <main className="container section">
      <header className="page-header">
        <h1>Soporte privado</h1>
      </header>
      <section className="card">
        <p className="muted">Chat concierge y canal prioritario pre-viaje.</p>
        <label>
          Mensaje
          <textarea rows={5} placeholder="Hola equipo, necesito apoyo con..." />
        </label>
        <button className="button-dark" type="button">Enviar mensaje</button>
      </section>
    </main>
  );
}
