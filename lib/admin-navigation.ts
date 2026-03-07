export interface AdminNavItem {
  href: string;
  label: string;
  helper?: string;
}

export interface AdminNavGroup {
  key: string;
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    key: "overview",
    title: "General",
    items: [{ href: "/admin", label: "Overview", helper: "Resumen global del negocio" }]
  },
  {
    key: "operations",
    title: "Operaciones",
    items: [
      { href: "/admin/viajes", label: "Viajes", helper: "Builder y publicación de viajes" },
      { href: "/admin/reservas", label: "Reservas", helper: "Pipeline y estados de reserva" },
      { href: "/admin/solicitudes", label: "Solicitudes", helper: "Viajes personalizados" },
      { href: "/admin/documentos", label: "Documentos", helper: "PDFs y archivos internos" },
      { href: "/admin/travel", label: "Travel Desk", helper: "Vuelos, hoteles y cotizaciones" }
    ]
  },
  {
    key: "sales",
    title: "Ventas y Pagos",
    items: [
      { href: "/admin/pagos", label: "Pagos", helper: "Cobros y balances" },
      { href: "/admin/ofertas", label: "Ofertas", helper: "Promociones y campañas" },
      { href: "/admin/sorteos", label: "Sorteos", helper: "Rifas, números y draw" }
    ]
  },
  {
    key: "content",
    title: "Contenido",
    items: [
      { href: "/admin/cms", label: "CMS", helper: "Control de contenido público" },
      { href: "/admin/testimonios", label: "Testimonios", helper: "Moderación de reviews" },
      { href: "/admin/galeria", label: "Galería", helper: "Álbumes y media" }
    ]
  },
  {
    key: "people",
    title: "Usuarios",
    items: [
      { href: "/admin/crm", label: "CRM", helper: "Clientes y seguimiento" },
      { href: "/admin/users", label: "Usuarios y Roles", helper: "Perfiles y permisos" },
      { href: "/admin/growth", label: "Growth", helper: "Onboarding y referidos" }
    ]
  },
  {
    key: "settings",
    title: "Configuración",
    items: [
      { href: "/admin/automatizaciones", label: "Automatizaciones", helper: "Reglas y ejecuciones" },
      { href: "/admin/configuracion", label: "Configuración", helper: "Integraciones y branding" },
      { href: "/admin/settings", label: "Seguridad", helper: "Políticas y controles de acceso" }
    ]
  }
];

export function flattenAdminNav() {
  return ADMIN_NAV_GROUPS.flatMap((group) => group.items);
}

export function resolveAdminBreadcrumb(pathname: string) {
  const items = flattenAdminNav();
  const match = items.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  return {
    root: { href: "/admin", label: "Admin" },
    current: match ?? null
  };
}
