import Link from "next/link";
import type { Metadata } from "next";
export const metadata:Metadata={title:"Solicitud recibida | Móntate en Mi Viaje",robots:{index:false,follow:false}};
export default async function Receipt({params}:{params:Promise<{id:string}>}) {
 const {id}=await params;
 if(!/^[0-9a-f-]{36}$/i.test(id))return <main className="container section"><h1>Solicitud no encontrada</h1><Link href="/cotizacion">Solicitar cotización</Link></main>;
 return <main className="container section"><article className="card" style={{maxWidth:720,margin:"40px auto",padding:42}}><p className="chip">Solicitud recibida</p><h1>Gracias por compartir tu idea de viaje.</h1><p>Hemos registrado tu solicitud para revisión. El equipo podrá evaluar las opciones disponibles y preparar una propuesta.</p><p>Referencia: {id}</p><p>Guarda esta referencia para consultas. Este mensaje no confirma una reserva ni un pago.</p><Link className="button-dark" href="/contacto">Contactar al equipo</Link></article></main>;
}