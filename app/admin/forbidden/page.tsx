import Link from "next/link";

export default function AdminForbiddenPage() {
  return (
    <main className="container section">
      <section className="card admin-auth-card">
        <h1>Acceso denegado</h1>
        <p className="muted">
          Tu sesión está activa pero no tienes rol de admin para entrar al dashboard.
        </p>
        <div className="button-row">
          <Link className="button-dark" href="/admin/login">
            Iniciar con otro usuario
          </Link>
          <Link className="button-outline" href="/">
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
