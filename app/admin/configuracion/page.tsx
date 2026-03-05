export default function AdminConfiguracionPage() {
  return (
    <main className="container section">
      <header className="page-header">
        <h1>Configuración</h1>
        <p className="section-subtitle">Roles, permisos, branding e integraciones.</p>
      </header>

      <section className="stack-grid">
        <article className="card">
          <h3>Roles</h3>
          <ul>
            <li>Admin: control total</li>
            <li>Manager: viajes, reservas, pagos y CRM</li>
            <li>Support: atención cliente y documentos</li>
            <li>Editor: contenido web, galería, testimonios</li>
          </ul>
        </article>

        <article className="card">
          <h3>Integraciones</h3>
          <ul>
            <li>PayPal Checkout: activo</li>
            <li>WhatsApp Cloud API: pendiente conectar</li>
            <li>Email transaccional (Resend/SendGrid): pendiente conectar</li>
            <li>Supabase Auth/Storage: schema listo para conectar</li>
          </ul>
        </article>
      </section>
    </main>
  );
}
