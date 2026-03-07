"use client";

import { useMemo, useState } from "react";
import { PackageBuilderForm } from "@/components/custom/travel/package-builder-form";
import { PdfExportDialog } from "@/components/custom/travel/pdf-export-dialog";
import { TravelFiltersBar } from "@/components/custom/travel/travel-filters-bar";
import { TravelStatusBadge } from "@/components/custom/travel/travel-status-badge";
import type { CreateTravelPackageInput, TravelPackage, TravelQuote } from "@/lib/travel/types";

interface TravelPackagesWorkspaceProps {
  initialPackages: TravelPackage[];
  initialQuotes: TravelQuote[];
}

function formatMoney(value: number) {
  return `USD ${value.toFixed(2)}`;
}

export function TravelPackagesWorkspace({ initialPackages, initialQuotes }: TravelPackagesWorkspaceProps) {
  const [packages, setPackages] = useState(initialPackages);
  const [search, setSearch] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<TravelPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return packages;
    }
    return packages.filter((item) =>
      [item.packageName, item.destination, item.status, item.visibility, item.tags.join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [packages, search]);

  async function refreshPackages() {
    const response = await fetch("/api/admin/travel/packages", { cache: "no-store" });
    const payload = (await response.json()) as { packages?: TravelPackage[]; message?: string };
    if (!response.ok || !payload.packages) {
      throw new Error(payload.message ?? "No se pudieron refrescar paquetes");
    }
    setPackages(payload.packages);
  }

  async function handleCreatePackage(input: CreateTravelPackageInput) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input)
      });
      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.message ?? "No se pudo crear paquete");
      }
      await refreshPackages();
      setMessage("Paquete guardado.");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function updatePackageStatus(pkg: TravelPackage, status: TravelPackage["status"]) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/travel/packages/${pkg.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo actualizar paquete");
      }
      await refreshPackages();
      setMessage(`Paquete ${pkg.packageName} actualizado a ${status}.`);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function handleGeneratePdf(payload: { kind: "quote" | "package" | "summary"; quoteId?: string; packageId?: string }) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/travel/exports/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = (await response.json()) as { downloadUrl?: string; message?: string };
      if (!response.ok || !result.downloadUrl) {
        throw new Error(result.message ?? "No se pudo generar PDF");
      }
      setMessage(`PDF generado. Descargar: ${result.downloadUrl}`);
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="stack-grid">
      <TravelFiltersBar
        search={search}
        onSearchChange={setSearch}
        helper="Estados package: draft/internal/ready/archived"
      />
      <PackageBuilderForm quotes={initialQuotes} onSubmit={handleCreatePackage} loading={loading} />

      <section className="card">
        <h3>Paquetes de viaje</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Package</th>
                <th>Destino</th>
                <th>Status</th>
                <th>Visibilidad</th>
                <th>Items</th>
                <th>Total items</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pkg) => {
                const total = pkg.items.reduce((sum, item) => sum + item.totalPrice, 0);
                return (
                  <tr key={pkg.id}>
                    <td>{pkg.packageName}</td>
                    <td>{pkg.destination}</td>
                    <td><TravelStatusBadge status={pkg.status} /></td>
                    <td>{pkg.visibility}</td>
                    <td>{pkg.items.length}</td>
                    <td>{formatMoney(total)}</td>
                    <td>
                      <div className="button-row">
                        <button type="button" className="button-outline" onClick={() => setSelectedPackage(pkg)}>
                          Ver
                        </button>
                        <button type="button" className="button-outline" onClick={() => updatePackageStatus(pkg, "ready")}>
                          Mark ready
                        </button>
                        <button type="button" className="button-outline" onClick={() => updatePackageStatus(pkg, "archived")}>
                          Archive
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="muted">
                    No hay paquetes para este filtro.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {selectedPackage ? (
        <section className="card">
          <div className="table-head-row">
            <div>
              <h3>{selectedPackage.packageName}</h3>
              <p className="muted">{selectedPackage.destination}</p>
            </div>
            <button type="button" className="button-outline" onClick={() => setSelectedPackage(null)}>
              Cerrar
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Título</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPackage.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.itemType}</td>
                    <td>{item.title}</td>
                    <td>{formatMoney(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PdfExportDialog packageId={selectedPackage.id} onGenerate={handleGeneratePdf} />
        </section>
      ) : null}

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
