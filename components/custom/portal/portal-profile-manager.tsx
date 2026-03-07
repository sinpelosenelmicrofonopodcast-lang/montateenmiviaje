"use client";

import { useState } from "react";
import { OnboardingProgress, TravelerPreferences, UserProfile } from "@/lib/types";

interface PortalProfileManagerProps {
  initialProfile: UserProfile | null;
  initialPreferences: TravelerPreferences | null;
  initialOnboarding: OnboardingProgress | null;
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinLines(value: string[] | undefined) {
  return (value ?? []).join("\n");
}

export function PortalProfileManager({ initialProfile, initialPreferences, initialOnboarding }: PortalProfileManagerProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [profileForm, setProfileForm] = useState({
    firstName: initialProfile?.firstName ?? "",
    lastName: initialProfile?.lastName ?? "",
    phone: initialProfile?.phone ?? "",
    country: initialProfile?.country ?? "",
    city: initialProfile?.city ?? "",
    stateRegion: initialProfile?.stateRegion ?? "",
    dateOfBirth: initialProfile?.dateOfBirth ?? "",
    preferredLanguage: initialProfile?.preferredLanguage ?? "es",
    homeAirportCode: initialProfile?.homeAirportCode ?? "",
    marketingOptIn: initialProfile?.marketingOptIn ?? false
  });

  const [preferencesForm, setPreferencesForm] = useState({
    budgetMin: initialPreferences?.budgetMin ? String(initialPreferences.budgetMin) : "",
    budgetMax: initialPreferences?.budgetMax ? String(initialPreferences.budgetMax) : "",
    preferredDestinations: joinLines(initialPreferences?.preferredDestinations),
    dreamDestinations: joinLines(initialPreferences?.dreamDestinations),
    preferredTripTypes: joinLines(initialPreferences?.preferredTripTypes),
    preferredDepartureAirports: joinLines(initialPreferences?.preferredDepartureAirports),
    preferredAirlines: joinLines(initialPreferences?.preferredAirlines),
    preferredHotelStyle: initialPreferences?.preferredHotelStyle ?? "",
    typicalTripDurationDays: initialPreferences?.typicalTripDurationDays ? String(initialPreferences.typicalTripDurationDays) : "",
    preferredTravelMonths: (initialPreferences?.preferredTravelMonths ?? []).join(","),
    usuallyTravelsWith: initialPreferences?.usuallyTravelsWith ?? "",
    travelFrequencyPerYear: initialPreferences?.travelFrequencyPerYear ? String(initialPreferences.travelFrequencyPerYear) : "",
    notes: initialPreferences?.notes ?? ""
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refreshBundle() {
    const response = await fetch("/api/portal/profile", { cache: "no-store" });
    const payload = (await response.json()) as {
      message?: string;
      profile?: UserProfile | null;
      onboarding?: OnboardingProgress | null;
    };

    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudo refrescar perfil");
    }

    setProfile(payload.profile ?? null);
    setOnboarding(payload.onboarding ?? null);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoadingProfile(true);

    try {
      const response = await fetch("/api/portal/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm)
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar perfil");
      }

      await refreshBundle();
      setMessage("Perfil actualizado correctamente.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoadingProfile(false);
    }
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setLoadingPreferences(true);

    try {
      const response = await fetch("/api/portal/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMin: preferencesForm.budgetMin ? Number(preferencesForm.budgetMin) : undefined,
          budgetMax: preferencesForm.budgetMax ? Number(preferencesForm.budgetMax) : undefined,
          preferredDestinations: splitLines(preferencesForm.preferredDestinations),
          dreamDestinations: splitLines(preferencesForm.dreamDestinations),
          preferredTripTypes: splitLines(preferencesForm.preferredTripTypes),
          preferredDepartureAirports: splitLines(preferencesForm.preferredDepartureAirports),
          preferredAirlines: splitLines(preferencesForm.preferredAirlines),
          preferredHotelStyle: preferencesForm.preferredHotelStyle || undefined,
          typicalTripDurationDays: preferencesForm.typicalTripDurationDays
            ? Number(preferencesForm.typicalTripDurationDays)
            : undefined,
          preferredTravelMonths: preferencesForm.preferredTravelMonths
            ? preferencesForm.preferredTravelMonths
                .split(",")
                .map((item) => Number(item.trim()))
                .filter((value) => Number.isFinite(value) && value >= 1 && value <= 12)
            : undefined,
          usuallyTravelsWith: preferencesForm.usuallyTravelsWith || undefined,
          travelFrequencyPerYear: preferencesForm.travelFrequencyPerYear
            ? Number(preferencesForm.travelFrequencyPerYear)
            : undefined,
          notes: preferencesForm.notes || undefined
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar preferencias");
      }

      await refreshBundle();
      setMessage("Preferencias guardadas.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Error inesperado");
    } finally {
      setLoadingPreferences(false);
    }
  }

  return (
    <div className="stack-grid">
      <section className="card">
        <h3>Estado de perfil</h3>
        <p className="muted">
          Completado: <strong>{onboarding?.completionPercentage ?? 0}%</strong>
          {" · "}
          Paso actual: <strong>{onboarding?.currentStep ?? "welcome"}</strong>
        </p>
        <p className="muted">Email: {profile?.email ?? "-"}</p>
      </section>

      <form className="card request-grid" onSubmit={saveProfile}>
        <h3 className="request-full">Perfil básico</h3>
        <label>
          Nombre
          <input value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} />
        </label>
        <label>
          Apellido
          <input value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} />
        </label>
        <label>
          Teléfono
          <input value={profileForm.phone} onChange={(event) => setProfileForm({ ...profileForm, phone: event.target.value })} />
        </label>
        <label>
          País
          <input value={profileForm.country} onChange={(event) => setProfileForm({ ...profileForm, country: event.target.value })} />
        </label>
        <label>
          Ciudad
          <input value={profileForm.city} onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })} />
        </label>
        <label>
          Estado / Región
          <input value={profileForm.stateRegion} onChange={(event) => setProfileForm({ ...profileForm, stateRegion: event.target.value })} />
        </label>
        <label>
          Fecha de nacimiento
          <input
            type="date"
            value={profileForm.dateOfBirth}
            onChange={(event) => setProfileForm({ ...profileForm, dateOfBirth: event.target.value })}
          />
        </label>
        <label>
          Aeropuerto principal
          <input
            value={profileForm.homeAirportCode}
            onChange={(event) => setProfileForm({ ...profileForm, homeAirportCode: event.target.value.toUpperCase() })}
            placeholder="SJU"
          />
        </label>
        <label>
          Idioma preferido
          <select
            value={profileForm.preferredLanguage}
            onChange={(event) => setProfileForm({ ...profileForm, preferredLanguage: event.target.value as "es" | "en" })}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <label>
          Marketing
          <select
            value={profileForm.marketingOptIn ? "yes" : "no"}
            onChange={(event) => setProfileForm({ ...profileForm, marketingOptIn: event.target.value === "yes" })}
          >
            <option value="yes">Acepto ofertas</option>
            <option value="no">No por ahora</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loadingProfile}>
            {loadingProfile ? "Guardando..." : "Guardar perfil"}
          </button>
        </div>
      </form>

      <form className="card request-grid" onSubmit={savePreferences}>
        <h3 className="request-full">Preferencias de viaje</h3>
        <label>
          Presupuesto mínimo
          <input
            type="number"
            min={0}
            value={preferencesForm.budgetMin}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, budgetMin: event.target.value })}
          />
        </label>
        <label>
          Presupuesto máximo
          <input
            type="number"
            min={0}
            value={preferencesForm.budgetMax}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, budgetMax: event.target.value })}
          />
        </label>
        <label className="request-full">
          Destinos favoritos (uno por línea)
          <textarea
            rows={3}
            value={preferencesForm.preferredDestinations}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, preferredDestinations: event.target.value })}
          />
        </label>
        <label className="request-full">
          Destinos soñados (uno por línea)
          <textarea
            rows={3}
            value={preferencesForm.dreamDestinations}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, dreamDestinations: event.target.value })}
          />
        </label>
        <label className="request-full">
          Tipos de viaje (uno por línea)
          <textarea
            rows={3}
            value={preferencesForm.preferredTripTypes}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, preferredTripTypes: event.target.value })}
          />
        </label>
        <label>
          Frecuencia de viajes al año
          <input
            type="number"
            min={0}
            value={preferencesForm.travelFrequencyPerYear}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, travelFrequencyPerYear: event.target.value })}
          />
        </label>
        <label>
          Suelo viajar con
          <input
            value={preferencesForm.usuallyTravelsWith}
            onChange={(event) => setPreferencesForm({ ...preferencesForm, usuallyTravelsWith: event.target.value })}
            placeholder="pareja / familia / amigos"
          />
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loadingPreferences}>
            {loadingPreferences ? "Guardando..." : "Guardar preferencias"}
          </button>
        </div>
      </form>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </div>
  );
}
