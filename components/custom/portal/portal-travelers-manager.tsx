"use client";

import { useState } from "react";
import { TravelerProfile } from "@/lib/types";

interface PortalTravelersManagerProps {
  initialTravelers: TravelerProfile[];
}

const DEFAULT_FORM = {
  firstName: "",
  middleName: "",
  lastName: "",
  dateOfBirth: "",
  travelerType: "adult" as TravelerProfile["travelerType"],
  relationshipToUser: "self",
  nationality: "",
  passportNumber: "",
  passportIssuingCountry: "",
  passportExpirationDate: "",
  knownTravelerNumber: "",
  redressNumber: "",
  specialAssistanceNotes: "",
  mealPreferences: "",
  seatPreferences: "",
  isDefault: false
};

export function PortalTravelersManager({ initialTravelers }: PortalTravelersManagerProps) {
  const [travelers, setTravelers] = useState(initialTravelers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function reload() {
    const response = await fetch("/api/portal/travelers", { cache: "no-store" });
    const payload = (await response.json()) as { travelers?: TravelerProfile[]; message?: string };
    if (!response.ok || !payload.travelers) {
      throw new Error(payload.message ?? "No se pudieron cargar viajeros");
    }
    setTravelers(payload.travelers);
  }

  function resetForm() {
    setForm(DEFAULT_FORM);
    setEditingId(null);
  }

  function startEdit(traveler: TravelerProfile) {
    setEditingId(traveler.id);
    setForm({
      firstName: traveler.firstName,
      middleName: traveler.middleName ?? "",
      lastName: traveler.lastName,
      dateOfBirth: traveler.dateOfBirth ?? "",
      travelerType: traveler.travelerType,
      relationshipToUser: traveler.relationshipToUser ?? "",
      nationality: traveler.nationality ?? "",
      passportNumber: traveler.passportNumber ?? "",
      passportIssuingCountry: traveler.passportIssuingCountry ?? "",
      passportExpirationDate: traveler.passportExpirationDate ?? "",
      knownTravelerNumber: traveler.knownTravelerNumber ?? "",
      redressNumber: traveler.redressNumber ?? "",
      specialAssistanceNotes: traveler.specialAssistanceNotes ?? "",
      mealPreferences: traveler.mealPreferences ?? "",
      seatPreferences: traveler.seatPreferences ?? "",
      isDefault: traveler.isDefault
    });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(editingId ? `/api/portal/travelers/${editingId}` : "/api/portal/travelers", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar viajero");
      }

      await reload();
      setMessage(editingId ? "Viajero actualizado." : "Viajero guardado.");
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function remove(travelerId: string) {
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/portal/travelers/${travelerId}`, { method: "DELETE" });
    const payload = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(payload.message ?? "No se pudo eliminar viajero");
      return;
    }

    await reload();
    setMessage("Viajero eliminado.");
    if (editingId === travelerId) {
      resetForm();
    }
  }

  return (
    <div className="stack-grid">
      <form className="card request-grid" onSubmit={save}>
        <h3 className="request-full">{editingId ? "Editar viajero" : "Agregar viajero"}</h3>
        <label>
          Nombre legal
          <input value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} required />
        </label>
        <label>
          Segundo nombre
          <input value={form.middleName} onChange={(event) => setForm({ ...form, middleName: event.target.value })} />
        </label>
        <label>
          Apellido legal
          <input value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} required />
        </label>
        <label>
          Fecha de nacimiento
          <input type="date" value={form.dateOfBirth} onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })} />
        </label>
        <label>
          Tipo de viajero
          <select value={form.travelerType} onChange={(event) => setForm({ ...form, travelerType: event.target.value as TravelerProfile["travelerType"] })}>
            <option value="adult">Adulto</option>
            <option value="child">Niño</option>
            <option value="infant">Infante</option>
          </select>
        </label>
        <label>
          Relación
          <input value={form.relationshipToUser} onChange={(event) => setForm({ ...form, relationshipToUser: event.target.value })} />
        </label>
        <label>
          Nacionalidad
          <input value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} />
        </label>
        <label>
          Pasaporte
          <input value={form.passportNumber} onChange={(event) => setForm({ ...form, passportNumber: event.target.value })} />
        </label>
        <label>
          País emisión
          <input value={form.passportIssuingCountry} onChange={(event) => setForm({ ...form, passportIssuingCountry: event.target.value })} />
        </label>
        <label>
          Expira pasaporte
          <input
            type="date"
            value={form.passportExpirationDate}
            onChange={(event) => setForm({ ...form, passportExpirationDate: event.target.value })}
          />
        </label>
        <label>
          Número viajero frecuente
          <input value={form.knownTravelerNumber} onChange={(event) => setForm({ ...form, knownTravelerNumber: event.target.value })} />
        </label>
        <label>
          Redress
          <input value={form.redressNumber} onChange={(event) => setForm({ ...form, redressNumber: event.target.value })} />
        </label>
        <label>
          Meal preferences
          <input value={form.mealPreferences} onChange={(event) => setForm({ ...form, mealPreferences: event.target.value })} />
        </label>
        <label>
          Seat preferences
          <input value={form.seatPreferences} onChange={(event) => setForm({ ...form, seatPreferences: event.target.value })} />
        </label>
        <label className="request-full">
          Asistencia especial / notas
          <textarea
            rows={3}
            value={form.specialAssistanceNotes}
            onChange={(event) => setForm({ ...form, specialAssistanceNotes: event.target.value })}
          />
        </label>
        <label>
          Viajero principal
          <select value={form.isDefault ? "yes" : "no"} onChange={(event) => setForm({ ...form, isDefault: event.target.value === "yes" })}>
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading}>
            {loading ? "Guardando..." : editingId ? "Actualizar" : "Guardar"}
          </button>
          {editingId ? (
            <button className="button-outline" type="button" onClick={resetForm}>
              Cancelar
            </button>
          ) : null}
        </div>
        {message ? <p className="success request-full">{message}</p> : null}
        {error ? <p className="error request-full">{error}</p> : null}
      </form>

      <section className="stack-grid">
        {travelers.length === 0 ? (
          <article className="card">
            <h3>Aún no tienes viajeros guardados</h3>
            <p className="muted">Agrega tu primer perfil para reservar más rápido como Expedia.</p>
          </article>
        ) : (
          travelers.map((traveler) => {
            const passportExpiringSoon = traveler.passportExpirationDate
              ? new Date(traveler.passportExpirationDate).getTime() - Date.now() < 1000 * 60 * 60 * 24 * 180
              : false;

            return (
              <article key={traveler.id} className="card">
                <p className="chip">{traveler.travelerType.toUpperCase()}</p>
                <h3>{traveler.firstName} {traveler.lastName}</h3>
                <p className="muted">{traveler.relationshipToUser ?? "Sin relación"}</p>
                {traveler.passportNumber ? <p>Pasaporte: {traveler.passportNumber}</p> : null}
                {traveler.passportExpirationDate ? <p>Expira: {traveler.passportExpirationDate}</p> : null}
                {passportExpiringSoon ? <p className="error">Atención: este pasaporte expira pronto.</p> : null}
                <div className="button-row">
                  <button className="button-outline" type="button" onClick={() => startEdit(traveler)}>
                    Editar
                  </button>
                  <button className="button-outline" type="button" onClick={() => remove(traveler.id)}>
                    Eliminar
                  </button>
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
