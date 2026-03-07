"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingProgress, UserProfile } from "@/lib/types";

interface PortalOnboardingFlowProps {
  initialProfile: UserProfile | null;
  initialOnboarding: OnboardingProgress | null;
  initialReferralCode?: string;
}

export function PortalOnboardingFlow({ initialProfile, initialOnboarding, initialReferralCode }: PortalOnboardingFlowProps) {
  const router = useRouter();
  const [onboarding, setOnboarding] = useState(initialOnboarding);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: initialProfile?.firstName ?? "",
    lastName: initialProfile?.lastName ?? "",
    country: initialProfile?.country ?? "",
    city: initialProfile?.city ?? "",
    stateRegion: initialProfile?.stateRegion ?? "",
    dateOfBirth: initialProfile?.dateOfBirth ?? "",
    phone: initialProfile?.phone ?? "",
    homeAirportCode: initialProfile?.homeAirportCode ?? "",
    preferredLanguage: initialProfile?.preferredLanguage ?? "es",
    marketingOptIn: initialProfile?.marketingOptIn ?? false
  });

  const [preferencesForm, setPreferencesForm] = useState({
    budgetMin: "",
    budgetMax: "",
    preferredDestinations: "",
    preferredTripTypes: "",
    travelFrequencyPerYear: "",
    usuallyTravelsWith: ""
  });

  const [travelerForm, setTravelerForm] = useState({
    firstName: initialProfile?.firstName ?? "",
    lastName: initialProfile?.lastName ?? "",
    dateOfBirth: initialProfile?.dateOfBirth ?? "",
    travelerType: "adult"
  });

  const [referralCode, setReferralCode] = useState(initialReferralCode ?? "");

  const currentStep = useMemo(() => onboarding?.currentStep ?? "basic_profile_completed", [onboarding?.currentStep]);

  async function reloadOnboarding() {
    const response = await fetch("/api/portal/onboarding", { cache: "no-store" });
    const payload = (await response.json()) as { onboarding?: OnboardingProgress; message?: string };
    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudo refrescar onboarding");
    }
    setOnboarding(payload.onboarding ?? null);
    return payload.onboarding ?? null;
  }

  async function markStep(step: string) {
    const response = await fetch("/api/portal/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step })
    });
    const payload = (await response.json()) as { message?: string; onboarding?: OnboardingProgress };
    if (!response.ok) {
      throw new Error(payload.message ?? "No se pudo actualizar onboarding");
    }
    setOnboarding(payload.onboarding ?? null);
  }

  async function submitBasicProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
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

      await markStep("basic_profile_completed");
      setMessage("Perfil básico completado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function submitPreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/portal/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budgetMin: preferencesForm.budgetMin ? Number(preferencesForm.budgetMin) : undefined,
          budgetMax: preferencesForm.budgetMax ? Number(preferencesForm.budgetMax) : undefined,
          preferredDestinations: preferencesForm.preferredDestinations
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          preferredTripTypes: preferencesForm.preferredTripTypes
            .split("\n")
            .map((value) => value.trim())
            .filter(Boolean),
          travelFrequencyPerYear: preferencesForm.travelFrequencyPerYear
            ? Number(preferencesForm.travelFrequencyPerYear)
            : undefined,
          usuallyTravelsWith: preferencesForm.usuallyTravelsWith || undefined
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar preferencias");
      }

      await markStep("preferences_completed");
      setMessage("Preferencias completadas.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function submitTraveler(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/portal/travelers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...travelerForm,
          relationshipToUser: "self",
          isDefault: true
        })
      });
      const payload = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar viajero");
      }

      await markStep("traveler_added");
      setMessage("Primer viajero agregado.");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  async function finishOnboarding() {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (referralCode.trim()) {
        const applyReferral = await fetch("/api/portal/referrals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: referralCode.trim().toUpperCase() })
        });
        const applyPayload = (await applyReferral.json()) as { message?: string };
        if (!applyReferral.ok) {
          throw new Error(applyPayload.message ?? "No se pudo aplicar código de referido");
        }
      }

      await markStep("referral_prompt_seen");
      await markStep("onboarding_completed");
      await reloadOnboarding();
      router.push("/portal");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  const stepOrder = [
    "basic_profile_completed",
    "preferences_completed",
    "traveler_added",
    "referral_prompt_seen"
  ];

  const activeIndex = Math.max(stepOrder.indexOf(currentStep), 0);

  return (
    <main className="container section">
      <header className="page-header">
        <p className="chip">Onboarding</p>
        <h1>Activa tu cuenta de viajero</h1>
        <p className="section-subtitle">Completa estos pasos para reservar más rápido y recibir propuestas personalizadas.</p>
      </header>

      <section className="card" style={{ marginBottom: "16px" }}>
        <p className="muted">Progreso: <strong>{onboarding?.completionPercentage ?? 0}%</strong></p>
        <div className="table-wrap">
          <table>
            <tbody>
              <tr><td>1. Perfil básico</td><td>{activeIndex >= 0 ? "Listo / En curso" : "Pendiente"}</td></tr>
              <tr><td>2. Preferencias de viaje</td><td>{activeIndex >= 1 ? "Listo / En curso" : "Pendiente"}</td></tr>
              <tr><td>3. Primer viajero</td><td>{activeIndex >= 2 ? "Listo / En curso" : "Pendiente"}</td></tr>
              <tr><td>4. Referidos y activación</td><td>{activeIndex >= 3 ? "Listo / En curso" : "Pendiente"}</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <form className="card request-grid" onSubmit={submitBasicProfile}>
        <h3 className="request-full">Paso 1: Perfil básico</h3>
        <label>Nombre<input value={profileForm.firstName} onChange={(event) => setProfileForm({ ...profileForm, firstName: event.target.value })} required /></label>
        <label>Apellido<input value={profileForm.lastName} onChange={(event) => setProfileForm({ ...profileForm, lastName: event.target.value })} required /></label>
        <label>País<input value={profileForm.country} onChange={(event) => setProfileForm({ ...profileForm, country: event.target.value })} required /></label>
        <label>Ciudad<input value={profileForm.city} onChange={(event) => setProfileForm({ ...profileForm, city: event.target.value })} /></label>
        <label>Estado / Región<input value={profileForm.stateRegion} onChange={(event) => setProfileForm({ ...profileForm, stateRegion: event.target.value })} /></label>
        <label>Fecha de nacimiento<input type="date" value={profileForm.dateOfBirth} onChange={(event) => setProfileForm({ ...profileForm, dateOfBirth: event.target.value })} /></label>
        <label>Aeropuerto base<input value={profileForm.homeAirportCode} onChange={(event) => setProfileForm({ ...profileForm, homeAirportCode: event.target.value.toUpperCase() })} /></label>
        <label>Idioma
          <select value={profileForm.preferredLanguage} onChange={(event) => setProfileForm({ ...profileForm, preferredLanguage: event.target.value as "es" | "en" })}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading}>Guardar paso 1</button>
        </div>
      </form>

      <form className="card request-grid" onSubmit={submitPreferences}>
        <h3 className="request-full">Paso 2: Preferencias de viaje</h3>
        <label>Presupuesto mínimo<input type="number" value={preferencesForm.budgetMin} onChange={(event) => setPreferencesForm({ ...preferencesForm, budgetMin: event.target.value })} /></label>
        <label>Presupuesto máximo<input type="number" value={preferencesForm.budgetMax} onChange={(event) => setPreferencesForm({ ...preferencesForm, budgetMax: event.target.value })} /></label>
        <label className="request-full">Destinos favoritos (1 por línea)
          <textarea rows={3} value={preferencesForm.preferredDestinations} onChange={(event) => setPreferencesForm({ ...preferencesForm, preferredDestinations: event.target.value })} />
        </label>
        <label className="request-full">Tipos de viaje (1 por línea)
          <textarea rows={3} value={preferencesForm.preferredTripTypes} onChange={(event) => setPreferencesForm({ ...preferencesForm, preferredTripTypes: event.target.value })} />
        </label>
        <label>Frecuencia de viaje/año<input type="number" min={0} value={preferencesForm.travelFrequencyPerYear} onChange={(event) => setPreferencesForm({ ...preferencesForm, travelFrequencyPerYear: event.target.value })} /></label>
        <label>Suelo viajar con<input value={preferencesForm.usuallyTravelsWith} onChange={(event) => setPreferencesForm({ ...preferencesForm, usuallyTravelsWith: event.target.value })} /></label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading}>Guardar paso 2</button>
        </div>
      </form>

      <form className="card request-grid" onSubmit={submitTraveler}>
        <h3 className="request-full">Paso 3: Agrega tu primer viajero</h3>
        <label>Nombre<input value={travelerForm.firstName} onChange={(event) => setTravelerForm({ ...travelerForm, firstName: event.target.value })} required /></label>
        <label>Apellido<input value={travelerForm.lastName} onChange={(event) => setTravelerForm({ ...travelerForm, lastName: event.target.value })} required /></label>
        <label>Fecha de nacimiento<input type="date" value={travelerForm.dateOfBirth} onChange={(event) => setTravelerForm({ ...travelerForm, dateOfBirth: event.target.value })} /></label>
        <label>Tipo
          <select value={travelerForm.travelerType} onChange={(event) => setTravelerForm({ ...travelerForm, travelerType: event.target.value })}>
            <option value="adult">Adulto</option>
            <option value="child">Niño</option>
            <option value="infant">Infante</option>
          </select>
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="submit" disabled={loading}>Guardar paso 3</button>
        </div>
      </form>

      <section className="card request-grid">
        <h3 className="request-full">Paso 4: Invita y gana</h3>
        <label className="request-full">
          Código de referido (opcional)
          <input value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} placeholder="MONTATE-AB12" />
        </label>
        <div className="button-row request-full">
          <button className="button-dark" type="button" onClick={finishOnboarding} disabled={loading}>
            {loading ? "Finalizando..." : "Finalizar onboarding"}
          </button>
        </div>
      </section>

      {message ? <p className="success">{message}</p> : null}
      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
