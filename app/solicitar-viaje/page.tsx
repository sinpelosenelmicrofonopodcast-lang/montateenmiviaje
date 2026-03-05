import { CustomRequestForm } from "@/components/custom/request-form";

export default function SolicitarViajePage() {
  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Viaje a medida</p>
        <h1>Solicita tu paquete personalizado</h1>
        <p className="section-subtitle">
          Cuéntanos destino, fechas, presupuesto, motivo, cantidad de personas y expectativas.
        </p>
      </header>

      <CustomRequestForm />
    </main>
  );
}
