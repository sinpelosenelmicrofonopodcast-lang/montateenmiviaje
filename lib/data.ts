import {
  AutomationRule,
  GalleryAlbum,
  GalleryMedia,
  Testimonial,
  Trip,
  TripPackage
} from "@/lib/types";

export const trips: Trip[] = [
  {
    id: "trip-1",
    slug: "dubai-signature",
    title: "Dubai Signature Week",
    destination: "Dubai, UAE",
    category: "Luxury",
    startDate: "2026-06-12",
    endDate: "2026-06-19",
    availableSpots: 8,
    totalSpots: 20,
    heroImage:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    summary:
      "Experiencia premium de 7 noches con yate privado, safari VIP y hoteles 5 estrellas.",
    includes: [
      "Hospedaje 5 estrellas",
      "Transfers aeropuerto-hotel",
      "Tour desierto premium",
      "Cena de bienvenida",
      "Asistencia concierge"
    ],
    excludes: ["Vuelos internacionales", "Seguro de viaje", "Gastos personales"],
    policies: [
      "Depósito no reembolsable",
      "Cambio de nombre con 30 días de anticipación",
      "Pagos tardíos generan recargo"
    ],
    requirements: ["Pasaporte vigente", "Visa según nacionalidad"],
    itinerary: [
      {
        dayNumber: 1,
        title: "Llegada y recepción",
        description: "Check-in privado, welcome kit y cena editorial nocturna.",
        mapPin: "DXB"
      },
      {
        dayNumber: 2,
        title: "City Icons",
        description: "Burj Khalifa, Dubai Frame y sesión fotográfica premium.",
        mapPin: "Downtown Dubai"
      },
      {
        dayNumber: 3,
        title: "Safari Platinum",
        description: "Experiencia privada en desierto con show y cena gourmet.",
        mapPin: "Dubai Desert"
      },
      {
        dayNumber: 4,
        title: "Yacht Day",
        description: "Navegación en marina con brunch y DJ set privado.",
        mapPin: "Dubai Marina"
      }
    ],
    packages: [
      {
        id: "pkg-dxb-double",
        roomType: "doble",
        pricePerPerson: 2890,
        deposit: 500,
        paymentPlan: "Depósito + 3 cuotas quincenales"
      },
      {
        id: "pkg-dxb-single",
        roomType: "single",
        pricePerPerson: 3490,
        deposit: 700,
        paymentPlan: "Depósito + 3 cuotas quincenales"
      },
      {
        id: "pkg-dxb-triple",
        roomType: "triple",
        pricePerPerson: 2590,
        deposit: 450,
        paymentPlan: "Depósito + 3 cuotas quincenales"
      }
    ],
    addons: [
      { id: "addon-heli", name: "Helicopter Tour", price: 320 },
      { id: "addon-burj-dinner", name: "Burj Al Arab Dinner", price: 240 }
    ],
    hotels: ["Address Sky View", "Atlantis The Royal"]
  },
  {
    id: "trip-2",
    slug: "capadocia-luxury-escape",
    title: "Capadocia Luxury Escape",
    destination: "Cappadocia, Turkey",
    category: "Romantic",
    startDate: "2026-09-04",
    endDate: "2026-09-10",
    availableSpots: 5,
    totalSpots: 16,
    heroImage:
      "https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1400&q=80",
    summary:
      "Globos al amanecer, cave hotel de diseño y experiencias gourmet en grupo reducido.",
    includes: [
      "Cave hotel boutique",
      "Hot air balloon",
      "Tours privados",
      "Fotógrafo local",
      "Desayunos y 3 cenas"
    ],
    excludes: ["Vuelos", "Seguro", "Gastos personales"],
    policies: [
      "Depósito bloquea cupo",
      "Saldo final 21 días antes del viaje",
      "No show aplica 100%"
    ],
    requirements: ["Pasaporte vigente", "Mínimo 18 años"],
    itinerary: [
      {
        dayNumber: 1,
        title: "Llegada a Göreme",
        description: "Check-in en cave suites y sunset gathering.",
        mapPin: "Göreme"
      },
      {
        dayNumber: 2,
        title: "Balloon Dawn",
        description: "Vuelo en globo al amanecer y brunch panorámico.",
        mapPin: "Uchisar Valley"
      }
    ],
    packages: [
      {
        id: "pkg-cpp-double",
        roomType: "doble",
        pricePerPerson: 2390,
        deposit: 450,
        paymentPlan: "Depósito + 2 cuotas mensuales"
      },
      {
        id: "pkg-cpp-single",
        roomType: "single",
        pricePerPerson: 2890,
        deposit: 600,
        paymentPlan: "Depósito + 2 cuotas mensuales"
      }
    ],
    addons: [{ id: "addon-atv", name: "Private ATV Sunset", price: 95 }],
    hotels: ["Argos in Cappadocia", "Museum Hotel"]
  }
];

export const testimonials: Testimonial[] = [
  {
    id: "t1",
    customerName: "Laura M.",
    tripTitle: "Dubai Signature Week",
    quote:
      "Todo fue impecable: logística, hoteles y atención. Realmente se siente concierge premium.",
    rating: 5,
    verified: true
  },
  {
    id: "t2",
    customerName: "Carlos R.",
    tripTitle: "Capadocia Luxury Escape",
    quote:
      "La experiencia fue editorial de principio a fin, con detalles que superaron expectativas.",
    rating: 5,
    verified: true
  }
];

export const galleryAlbums: GalleryAlbum[] = [
  {
    id: "alb-dxb",
    tripSlug: "dubai-signature",
    title: "Dubai Signature Highlights",
    coverImage:
      "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80",
    featured: true
  },
  {
    id: "alb-cpp",
    tripSlug: "capadocia-luxury-escape",
    title: "Capadocia Golden Hour",
    coverImage:
      "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1400&q=80",
    featured: true
  }
];

export const galleryMedia: GalleryMedia[] = [
  {
    id: "m1",
    albumId: "alb-dxb",
    type: "photo",
    url: "https://images.unsplash.com/photo-1526498460520-4c246339dccb?auto=format&fit=crop&w=1400&q=80",
    caption: "Skyline dinner in Dubai"
  },
  {
    id: "m2",
    albumId: "alb-dxb",
    type: "video",
    url: "https://www.youtube.com/embed/k3M5QAJM6uY",
    caption: "Yacht day highlights"
  },
  {
    id: "m3",
    albumId: "alb-cpp",
    type: "photo",
    url: "https://images.unsplash.com/photo-1500835556837-99ac94a94552?auto=format&fit=crop&w=1400&q=80",
    caption: "Balloons at sunrise"
  }
];

export const automationRules: AutomationRule[] = [
  {
    id: "auto-bienvenida",
    name: "Bienvenida post-reserva",
    triggerEvent: "booking.created",
    channel: "email",
    active: true
  },
  {
    id: "auto-balance",
    name: "Recordatorio de balance",
    triggerEvent: "payment.due_soon",
    channel: "whatsapp",
    active: true
  },
  {
    id: "auto-checklist",
    name: "Checklist pre-viaje",
    triggerEvent: "trip.upcoming",
    channel: "email",
    active: true
  },
  {
    id: "auto-testimonio",
    name: "Solicitud de testimonio",
    triggerEvent: "trip.completed",
    channel: "whatsapp",
    active: true
  }
];

export const checklistTemplate = [
  "Pasaporte vigente (mínimo 6 meses)",
  "Seguro de viaje internacional",
  "Waiver firmado",
  "Pago final completado",
  "Formulario de preferencias enviado"
];

export function getTripBySlug(slug: string) {
  return trips.find((trip) => trip.slug === slug);
}

export function getPackageByRoom(packages: TripPackage[], roomType: TripPackage["roomType"]) {
  return packages.find((pkg) => pkg.roomType === roomType);
}
