import Link from "next/link";
import { formatMoney } from "@/lib/format";
import {
  getDashboardSnapshotService,
  listAutomationRunsService,
  listBookingsService,
  listPaymentsService
} from "@/lib/runtime-service";

export const dynamic = "force-dynamic";

const modules = [
  { title: "Viajes", href: "/admin/viajes", helper: "Builder, publicación y brochure" },
  { title: "Ofertas", href: "/admin/ofertas", helper: "Códigos y promociones activas" },
  { title: "Solicitudes", href: "/admin/solicitudes", helper: "Paquetes a medida por cliente" },
  { title: "Sorteos", href: "/admin/sorteos", helper: "Gratis o pago por entrada" },
  { title: "Reservas", href: "/admin/reservas", helper: "Pipeline comercial completo" },
  { title: "Pagos", href: "/admin/pagos", helper: "Depósitos y balances PayPal" },
  { title: "CRM", href: "/admin/crm", helper: "Clientes, notas y preferencias" },
  { title: "Testimonios", href: "/admin/testimonios", helper: "Moderación verificada" },
  { title: "Galería", href: "/admin/galeria", helper: "Álbumes y media destacados" },
  { title: "Documentos", href: "/admin/documentos", helper: "Brochures y archivos" },
  { title: "Automatizaciones", href: "/admin/automatizaciones", helper: "Flujos email y WhatsApp" },
  { title: "Configuración", href: "/admin/configuracion", helper: "Roles e integraciones" }
];

export default async function AdminOverviewPage() {
  const [snapshot, bookings, payments, runs] = await Promise.all([
    getDashboardSnapshotService(),
    listBookingsService(),
    listPaymentsService(),
    listAutomationRunsService()
  ]);

  const cards = [
    { title: "Ingresos cobrados", value: formatMoney(snapshot.totalRevenue) },
    { title: "Pendiente por cobrar", value: formatMoney(snapshot.pendingAmount) },
    { title: "Reservas activas", value: String(bookings.length) },
    { title: "Pagos registrados", value: String(payments.length) },
    { title: "Conversión a pago", value: `${snapshot.conversionRate.toFixed(1)}%` },
    { title: "Automatizaciones en cola", value: String(runs.length) }
  ];

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Dashboard</p>
        <h1>Panel administrativo integral</h1>
        <p className="section-subtitle">Operación, ventas, pagos y automatización desde un único lugar.</p>
      </header>

      <section className="kpi-grid">
        {cards.map((card) => (
          <article key={card.title} className="admin-card">
            <p className="kpi-title">{card.title}</p>
            <h3 className="kpi-value">{card.value}</h3>
          </article>
        ))}
      </section>

      <section className="admin-grid section">
        {modules.map((module) => (
          <article key={module.title} className="admin-card">
            <h3>{module.title}</h3>
            <p className="muted">{module.helper}</p>
            <Link className="button-outline" href={module.href}>
              Abrir módulo
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
