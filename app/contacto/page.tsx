export default function ContactoPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Contacto</p>
        <h1>Hablemos de tu próximo viaje grupal</h1>
      </header>

      <section className="card">
        <form>
          <label>
            Nombre
            <input placeholder="Tu nombre" />
          </label>
          <label>
            Correo
            <input type="email" placeholder="tu@email.com" />
          </label>
          <label>
            Mensaje
            <textarea rows={5} placeholder="Quiero información sobre..." />
          </label>
          <button className="button-dark" type="submit">
            Enviar
          </button>
        </form>
      </section>
    </main>
  );
}
