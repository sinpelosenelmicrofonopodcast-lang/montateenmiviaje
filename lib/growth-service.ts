import "server-only";
import { createHash } from "node:crypto";
import {
  EmergencyContact,
  OnboardingProgress,
  ReferralCode,
  ReferralEvent,
  ReferralReward,
  TravelerPreferences,
  TravelerProfile,
  UserProfile
} from "@/lib/types";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase-admin";

function isSchemaErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("does not exist") ||
    normalized.includes("could not find the table") ||
    normalized.includes("column") ||
    normalized.includes("function")
  );
}

function parseDateOrUndefined(value: unknown) {
  if (typeof value !== "string" || !value) {
    return undefined;
  }
  return value;
}

function parseTextArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }
  return value.filter((item): item is string => typeof item === "string");
}

function parseJsonArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as Record<string, unknown>[];
  }
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function toProfile(row: Record<string, unknown> | null | undefined): UserProfile | null {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    email: typeof row.email === "string" ? row.email : "",
    role: typeof row.role === "string" ? row.role : "user",
    firstName: typeof row.first_name === "string" ? row.first_name : undefined,
    lastName: typeof row.last_name === "string" ? row.last_name : undefined,
    fullName: typeof row.full_name === "string" ? row.full_name : undefined,
    phone: typeof row.phone === "string" ? row.phone : undefined,
    country: typeof row.country === "string" ? row.country : undefined,
    city: typeof row.city === "string" ? row.city : undefined,
    stateRegion: typeof row.state_region === "string" ? row.state_region : undefined,
    dateOfBirth: parseDateOrUndefined(row.date_of_birth),
    preferredLanguage: (typeof row.preferred_language === "string" ? row.preferred_language : "es") as "es" | "en",
    avatarUrl: typeof row.avatar_url === "string" ? row.avatar_url : undefined,
    accountStatus: (typeof row.account_status === "string" ? row.account_status : "active") as UserProfile["accountStatus"],
    registrationSource: typeof row.registration_source === "string" ? row.registration_source : "organic",
    referredByUserId: typeof row.referred_by_user_id === "string" ? row.referred_by_user_id : undefined,
    referredByCode: typeof row.referred_by_code === "string" ? row.referred_by_code : undefined,
    homeAirportCode: typeof row.home_airport_code === "string" ? row.home_airport_code : undefined,
    marketingOptIn: Boolean(row.marketing_opt_in),
    profileCompleted: Boolean(row.profile_completed),
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function toTraveler(row: Record<string, unknown>): TravelerProfile {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    firstName: String(row.first_name ?? ""),
    middleName: typeof row.middle_name === "string" ? row.middle_name : undefined,
    lastName: String(row.last_name ?? ""),
    suffix: typeof row.suffix === "string" ? row.suffix : undefined,
    dateOfBirth: parseDateOrUndefined(row.date_of_birth),
    gender: typeof row.gender === "string" ? row.gender : undefined,
    relationshipToUser: typeof row.relationship_to_user === "string" ? row.relationship_to_user : undefined,
    nationality: typeof row.nationality === "string" ? row.nationality : undefined,
    passportNumber: typeof row.passport_number === "string" ? row.passport_number : undefined,
    passportIssuingCountry: typeof row.passport_issuing_country === "string" ? row.passport_issuing_country : undefined,
    passportExpirationDate: parseDateOrUndefined(row.passport_expiration_date),
    knownTravelerNumber: typeof row.known_traveler_number === "string" ? row.known_traveler_number : undefined,
    redressNumber: typeof row.redress_number === "string" ? row.redress_number : undefined,
    loyaltyPrograms: parseJsonArray(row.loyalty_programs),
    specialAssistanceNotes: typeof row.special_assistance_notes === "string" ? row.special_assistance_notes : undefined,
    mealPreferences: typeof row.meal_preferences === "string" ? row.meal_preferences : undefined,
    seatPreferences: typeof row.seat_preferences === "string" ? row.seat_preferences : undefined,
    travelerType: (typeof row.traveler_type === "string" ? row.traveler_type : "adult") as TravelerProfile["travelerType"],
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function toPreferences(row: Record<string, unknown> | null | undefined): TravelerPreferences | null {
  if (!row || typeof row.user_id !== "string") {
    return null;
  }

  return {
    id: typeof row.id === "string" ? row.id : undefined,
    userId: row.user_id,
    budgetMin: typeof row.budget_min === "number" ? row.budget_min : Number(row.budget_min ?? 0) || undefined,
    budgetMax: typeof row.budget_max === "number" ? row.budget_max : Number(row.budget_max ?? 0) || undefined,
    preferredDestinations: parseTextArray(row.preferred_destinations),
    dreamDestinations: parseTextArray(row.dream_destinations),
    preferredAirlines: parseTextArray(row.preferred_airlines),
    preferredHotelStyle: typeof row.preferred_hotel_style === "string" ? row.preferred_hotel_style : undefined,
    preferredTripTypes: parseTextArray(row.preferred_trip_types),
    preferredDepartureAirports: parseTextArray(row.preferred_departure_airports),
    typicalTripDurationDays: typeof row.typical_trip_duration_days === "number" ? row.typical_trip_duration_days : undefined,
    preferredTravelMonths: Array.isArray(row.preferred_travel_months)
      ? row.preferred_travel_months.filter((item): item is number => typeof item === "number")
      : [],
    usuallyTravelsWith: typeof row.usually_travels_with === "string" ? row.usually_travels_with : undefined,
    travelFrequencyPerYear: typeof row.travel_frequency_per_year === "number" ? row.travel_frequency_per_year : undefined,
    notes: typeof row.notes === "string" ? row.notes : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined
  };
}

function toOnboarding(row: Record<string, unknown> | null | undefined): OnboardingProgress | null {
  if (!row || typeof row.user_id !== "string") {
    return null;
  }

  return {
    id: typeof row.id === "string" ? row.id : undefined,
    userId: row.user_id,
    accountCreated: Boolean(row.account_created),
    emailVerified: Boolean(row.email_verified),
    basicProfileCompleted: Boolean(row.basic_profile_completed),
    travelerAdded: Boolean(row.traveler_added),
    preferencesCompleted: Boolean(row.preferences_completed),
    referralPromptSeen: Boolean(row.referral_prompt_seen),
    firstQuoteRequested: Boolean(row.first_quote_requested),
    onboardingCompleted: Boolean(row.onboarding_completed),
    completionPercentage: typeof row.completion_percentage === "number" ? row.completion_percentage : 0,
    currentStep: typeof row.current_step === "string" ? row.current_step : "welcome",
    lastCompletedStep: typeof row.last_completed_step === "string" ? row.last_completed_step : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined
  };
}

function toReferralCode(row: Record<string, unknown> | null | undefined): ReferralCode | null {
  if (!row || typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    userId: String(row.user_id),
    referralCode: String(row.referral_code ?? ""),
    shareSlug: String(row.share_slug ?? ""),
    status: (typeof row.status === "string" ? row.status : "active") as ReferralCode["status"],
    clicksCount: Number(row.clicks_count ?? 0),
    signupsCount: Number(row.signups_count ?? 0),
    conversionsCount: Number(row.conversions_count ?? 0),
    rewardPointsEarned: Number(row.reward_points_earned ?? 0),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

function toReferralEvent(row: Record<string, unknown>): ReferralEvent {
  return {
    id: String(row.id),
    referralCodeId: String(row.referral_code_id),
    referrerUserId: String(row.referrer_user_id),
    referredUserId: typeof row.referred_user_id === "string" ? row.referred_user_id : undefined,
    eventType: String(row.event_type),
    eventMetadata: typeof row.event_metadata === "object" && row.event_metadata !== null
      ? (row.event_metadata as Record<string, unknown>)
      : {},
    createdAt: String(row.created_at ?? "")
  };
}

function toReferralReward(row: Record<string, unknown>): ReferralReward {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    referralEventId: typeof row.referral_event_id === "string" ? row.referral_event_id : undefined,
    rewardType: String(row.reward_type),
    rewardValue: Number(row.reward_value ?? 0),
    rewardStatus: String(row.reward_status),
    description: typeof row.description === "string" ? row.description : undefined,
    issuedAt: parseDateOrUndefined(row.issued_at),
    redeemedAt: parseDateOrUndefined(row.redeemed_at),
    createdAt: String(row.created_at ?? "")
  };
}

function toEmergencyContact(row: Record<string, unknown>): EmergencyContact {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    contactName: String(row.contact_name ?? ""),
    relationship: String(row.relationship ?? ""),
    phone: String(row.phone ?? ""),
    email: typeof row.email === "string" ? row.email : undefined,
    country: typeof row.country === "string" ? row.country : undefined,
    isPrimary: Boolean(row.is_primary),
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? "")
  };
}

export interface PortalGrowthBundle {
  profile: UserProfile | null;
  preferences: TravelerPreferences | null;
  onboarding: OnboardingProgress | null;
  travelers: TravelerProfile[];
  emergencyContacts: EmergencyContact[];
  referralCode: ReferralCode | null;
  referralEvents: ReferralEvent[];
  referralRewards: ReferralReward[];
}

function emptyGrowthBundle(): PortalGrowthBundle {
  return {
    profile: null,
    preferences: null,
    onboarding: null,
    travelers: [],
    emergencyContacts: [],
    referralCode: null,
    referralEvents: [],
    referralRewards: []
  };
}

async function getProfileByAuthUserId(authUserId: string, email?: string) {
  const supabase = getSupabaseAdminClient();

  const byId = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUserId)
    .maybeSingle<Record<string, unknown>>();

  if (!byId.error && byId.data) {
    return byId.data;
  }

  if (email) {
    const byEmail = await supabase
      .from("profiles")
      .select("*")
      .eq("email", normalizeEmail(email))
      .maybeSingle<Record<string, unknown>>();

    if (!byEmail.error && byEmail.data) {
      if (String(byEmail.data.id) !== authUserId) {
        await supabase.from("profiles").upsert({
          ...byEmail.data,
          id: authUserId,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });
      }
      return { ...byEmail.data, id: authUserId };
    }
  }

  if (byId.error) {
    throw new Error(`No se pudo cargar perfil: ${byId.error.message}`);
  }

  return null;
}

export async function upsertRegistrationProfileService(input: {
  authUserId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  country?: string;
  referralCode?: string;
  registrationSource?: string;
}) {
  if (!hasSupabaseConfig()) {
    return { referralApplied: false };
  }

  const supabase = getSupabaseAdminClient();
  const payload: Record<string, unknown> = {
    id: input.authUserId,
    email: normalizeEmail(input.email),
    role: "user",
    first_name: input.firstName?.trim() || null,
    last_name: input.lastName?.trim() || null,
    full_name: input.fullName?.trim() || null,
    phone: input.phone?.trim() || null,
    country: input.country?.trim() || null,
    registration_source: input.registrationSource?.trim() || "portal_signup"
  };

  const saveProfile = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (saveProfile.error && !isSchemaErrorMessage(saveProfile.error.message)) {
    throw new Error(`No se pudo sincronizar perfil de registro: ${saveProfile.error.message}`);
  }

  let referralApplied = false;
  if (input.referralCode?.trim()) {
    const applyReferral = await supabase.rpc("apply_referral_code_to_profile", {
      p_user_id: input.authUserId,
      p_referral_code: input.referralCode.trim().toUpperCase()
    });

    if (!applyReferral.error) {
      referralApplied = Boolean(applyReferral.data);
    }
  }

  await supabase.rpc("mark_onboarding_step", {
    p_user_id: input.authUserId,
    p_step: "account_created"
  });

  await supabase.rpc("log_user_activity", {
    p_user_id: input.authUserId,
    p_activity_type: "signup_completed",
    p_entity_type: "auth",
    p_entity_id: input.authUserId,
    p_metadata: {
      source: input.registrationSource ?? "portal_signup",
      referral_code: input.referralCode ?? null
    }
  });

  return {
    referralApplied
  };
}

export async function getPortalGrowthBundleService(authUserId: string, email?: string): Promise<PortalGrowthBundle> {
  if (!hasSupabaseConfig()) {
    return emptyGrowthBundle();
  }

  const supabase = getSupabaseAdminClient();
  const profileRow = await getProfileByAuthUserId(authUserId, email);
  const profile = toProfile(profileRow);
  if (!profile) {
    return emptyGrowthBundle();
  }

  const [preferencesRes, onboardingRes, travelersRes, contactsRes, referralCodeRes, referralEventsRes, referralRewardsRes] = await Promise.all([
    supabase.from("app_traveler_preferences").select("*").eq("user_id", authUserId).maybeSingle<Record<string, unknown>>(),
    supabase.from("app_onboarding_progress").select("*").eq("user_id", authUserId).maybeSingle<Record<string, unknown>>(),
    supabase.from("app_traveler_profiles").select("*").eq("user_id", authUserId).order("is_default", { ascending: false }).order("created_at", { ascending: true }),
    supabase.from("app_emergency_contacts").select("*").eq("user_id", authUserId).order("is_primary", { ascending: false }).order("created_at", { ascending: true }),
    supabase.from("app_referral_codes").select("*").eq("user_id", authUserId).maybeSingle<Record<string, unknown>>(),
    supabase.from("app_referral_events").select("*").or(`referrer_user_id.eq.${authUserId},referred_user_id.eq.${authUserId}`).order("created_at", { ascending: false }).limit(100),
    supabase.from("app_referral_rewards").select("*").eq("user_id", authUserId).order("created_at", { ascending: false })
  ]);

  if (preferencesRes.error && !isSchemaErrorMessage(preferencesRes.error.message)) {
    throw new Error(`No se pudieron cargar preferencias: ${preferencesRes.error.message}`);
  }
  if (onboardingRes.error && !isSchemaErrorMessage(onboardingRes.error.message)) {
    throw new Error(`No se pudo cargar onboarding: ${onboardingRes.error.message}`);
  }
  if (travelersRes.error && !isSchemaErrorMessage(travelersRes.error.message)) {
    throw new Error(`No se pudieron cargar viajeros: ${travelersRes.error.message}`);
  }
  if (contactsRes.error && !isSchemaErrorMessage(contactsRes.error.message)) {
    throw new Error(`No se pudieron cargar contactos de emergencia: ${contactsRes.error.message}`);
  }
  if (referralCodeRes.error && !isSchemaErrorMessage(referralCodeRes.error.message)) {
    throw new Error(`No se pudo cargar código de referido: ${referralCodeRes.error.message}`);
  }
  if (referralEventsRes.error && !isSchemaErrorMessage(referralEventsRes.error.message)) {
    throw new Error(`No se pudieron cargar eventos de referido: ${referralEventsRes.error.message}`);
  }
  if (referralRewardsRes.error && !isSchemaErrorMessage(referralRewardsRes.error.message)) {
    throw new Error(`No se pudieron cargar rewards de referido: ${referralRewardsRes.error.message}`);
  }

  return {
    profile,
    preferences: toPreferences(preferencesRes.data ?? null),
    onboarding: toOnboarding(onboardingRes.data ?? null),
    travelers: (travelersRes.data ?? []).map((row) => toTraveler(row as Record<string, unknown>)),
    emergencyContacts: (contactsRes.data ?? []).map((row) => toEmergencyContact(row as Record<string, unknown>)),
    referralCode: toReferralCode(referralCodeRes.data ?? null),
    referralEvents: (referralEventsRes.data ?? []).map((row) => toReferralEvent(row as Record<string, unknown>)),
    referralRewards: (referralRewardsRes.data ?? []).map((row) => toReferralReward(row as Record<string, unknown>))
  };
}

export async function updateUserProfileService(
  authUserId: string,
  payload: Partial<{
    firstName: string;
    lastName: string;
    phone: string;
    country: string;
    city: string;
    stateRegion: string;
    dateOfBirth: string;
    preferredLanguage: "es" | "en";
    avatarUrl: string;
    homeAirportCode: string;
    marketingOptIn: boolean;
  }>
) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const updatePayload: Record<string, unknown> = {};

  if (payload.firstName !== undefined) updatePayload.first_name = payload.firstName || null;
  if (payload.lastName !== undefined) updatePayload.last_name = payload.lastName || null;
  if (payload.phone !== undefined) updatePayload.phone = payload.phone || null;
  if (payload.country !== undefined) updatePayload.country = payload.country || null;
  if (payload.city !== undefined) updatePayload.city = payload.city || null;
  if (payload.stateRegion !== undefined) updatePayload.state_region = payload.stateRegion || null;
  if (payload.dateOfBirth !== undefined) updatePayload.date_of_birth = payload.dateOfBirth || null;
  if (payload.preferredLanguage !== undefined) updatePayload.preferred_language = payload.preferredLanguage;
  if (payload.avatarUrl !== undefined) updatePayload.avatar_url = payload.avatarUrl || null;
  if (payload.homeAirportCode !== undefined) updatePayload.home_airport_code = payload.homeAirportCode || null;
  if (payload.marketingOptIn !== undefined) updatePayload.marketing_opt_in = payload.marketingOptIn;

  const update = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("id", authUserId)
    .select("*")
    .maybeSingle<Record<string, unknown>>();

  if (update.error) {
    throw new Error(`No se pudo actualizar perfil: ${update.error.message}`);
  }

  await supabase.rpc("mark_onboarding_step", {
    p_user_id: authUserId,
    p_step: "basic_profile_completed"
  });

  await supabase.rpc("log_user_activity", {
    p_user_id: authUserId,
    p_activity_type: "profile_updated",
    p_entity_type: "profile",
    p_entity_id: authUserId,
    p_metadata: updatePayload
  });

  return toProfile(update.data);
}

export async function upsertTravelerPreferencesService(
  authUserId: string,
  payload: Partial<{
    budgetMin: number;
    budgetMax: number;
    preferredDestinations: string[];
    dreamDestinations: string[];
    preferredAirlines: string[];
    preferredHotelStyle: string;
    preferredTripTypes: string[];
    preferredDepartureAirports: string[];
    typicalTripDurationDays: number;
    preferredTravelMonths: number[];
    usuallyTravelsWith: string;
    travelFrequencyPerYear: number;
    notes: string;
  }>
) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const data = {
    user_id: authUserId,
    budget_min: payload.budgetMin ?? null,
    budget_max: payload.budgetMax ?? null,
    preferred_destinations: payload.preferredDestinations ?? [],
    dream_destinations: payload.dreamDestinations ?? [],
    preferred_airlines: payload.preferredAirlines ?? [],
    preferred_hotel_style: payload.preferredHotelStyle ?? null,
    preferred_trip_types: payload.preferredTripTypes ?? [],
    preferred_departure_airports: payload.preferredDepartureAirports ?? [],
    typical_trip_duration_days: payload.typicalTripDurationDays ?? null,
    preferred_travel_months: payload.preferredTravelMonths ?? [],
    usually_travels_with: payload.usuallyTravelsWith ?? null,
    travel_frequency_per_year: payload.travelFrequencyPerYear ?? null,
    notes: payload.notes ?? null,
    updated_at: new Date().toISOString()
  };

  const save = await supabase
    .from("app_traveler_preferences")
    .upsert(data, { onConflict: "user_id" })
    .select("*")
    .single<Record<string, unknown>>();

  if (save.error) {
    throw new Error(`No se pudieron guardar preferencias: ${save.error.message}`);
  }

  await supabase.rpc("mark_onboarding_step", {
    p_user_id: authUserId,
    p_step: "preferences_completed"
  });

  await supabase.rpc("log_user_activity", {
    p_user_id: authUserId,
    p_activity_type: "travel_preferences_updated",
    p_entity_type: "preferences",
    p_entity_id: String(save.data.id),
    p_metadata: {
      preferred_trip_types: data.preferred_trip_types,
      preferred_destinations: data.preferred_destinations
    }
  });

  return toPreferences(save.data);
}

export async function listTravelerProfilesService(authUserId: string) {
  if (!hasSupabaseConfig()) {
    return [] as TravelerProfile[];
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from("app_traveler_profiles")
    .select("*")
    .eq("user_id", authUserId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (result.error) {
    throw new Error(`No se pudieron listar viajeros: ${result.error.message}`);
  }

  return (result.data ?? []).map((row) => toTraveler(row as Record<string, unknown>));
}

export async function createTravelerProfileService(
  authUserId: string,
  payload: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth?: string;
    gender?: string;
    relationshipToUser?: string;
    nationality?: string;
    passportNumber?: string;
    passportIssuingCountry?: string;
    passportExpirationDate?: string;
    knownTravelerNumber?: string;
    redressNumber?: string;
    specialAssistanceNotes?: string;
    mealPreferences?: string;
    seatPreferences?: string;
    travelerType: TravelerProfile["travelerType"];
    isDefault?: boolean;
  }
) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (payload.isDefault) {
    await supabase
      .from("app_traveler_profiles")
      .update({ is_default: false })
      .eq("user_id", authUserId)
      .eq("is_default", true);
  }

  const insert = await supabase
    .from("app_traveler_profiles")
    .insert({
      user_id: authUserId,
      first_name: payload.firstName.trim(),
      middle_name: payload.middleName?.trim() || null,
      last_name: payload.lastName.trim(),
      date_of_birth: payload.dateOfBirth || null,
      gender: payload.gender || null,
      relationship_to_user: payload.relationshipToUser || null,
      nationality: payload.nationality || null,
      passport_number: payload.passportNumber || null,
      passport_issuing_country: payload.passportIssuingCountry || null,
      passport_expiration_date: payload.passportExpirationDate || null,
      known_traveler_number: payload.knownTravelerNumber || null,
      redress_number: payload.redressNumber || null,
      special_assistance_notes: payload.specialAssistanceNotes || null,
      meal_preferences: payload.mealPreferences || null,
      seat_preferences: payload.seatPreferences || null,
      traveler_type: payload.travelerType,
      is_default: Boolean(payload.isDefault),
      loyalty_programs: []
    })
    .select("*")
    .single<Record<string, unknown>>();

  if (insert.error) {
    throw new Error(`No se pudo crear viajero: ${insert.error.message}`);
  }

  await supabase.rpc("mark_onboarding_step", {
    p_user_id: authUserId,
    p_step: "traveler_added"
  });

  await supabase.rpc("log_user_activity", {
    p_user_id: authUserId,
    p_activity_type: "traveler_added",
    p_entity_type: "traveler",
    p_entity_id: String(insert.data.id),
    p_metadata: {
      traveler_type: payload.travelerType,
      relationship: payload.relationshipToUser ?? null
    }
  });

  return toTraveler(insert.data);
}

export async function updateTravelerProfileService(
  authUserId: string,
  travelerId: string,
  payload: Partial<{
    firstName: string;
    middleName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    relationshipToUser: string;
    nationality: string;
    passportNumber: string;
    passportIssuingCountry: string;
    passportExpirationDate: string;
    knownTravelerNumber: string;
    redressNumber: string;
    specialAssistanceNotes: string;
    mealPreferences: string;
    seatPreferences: string;
    travelerType: TravelerProfile["travelerType"];
    isDefault: boolean;
  }>
) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();

  if (payload.isDefault) {
    await supabase
      .from("app_traveler_profiles")
      .update({ is_default: false })
      .eq("user_id", authUserId)
      .neq("id", travelerId)
      .eq("is_default", true);
  }

  const updatePayload: Record<string, unknown> = {};
  if (payload.firstName !== undefined) updatePayload.first_name = payload.firstName || null;
  if (payload.middleName !== undefined) updatePayload.middle_name = payload.middleName || null;
  if (payload.lastName !== undefined) updatePayload.last_name = payload.lastName || null;
  if (payload.dateOfBirth !== undefined) updatePayload.date_of_birth = payload.dateOfBirth || null;
  if (payload.gender !== undefined) updatePayload.gender = payload.gender || null;
  if (payload.relationshipToUser !== undefined) updatePayload.relationship_to_user = payload.relationshipToUser || null;
  if (payload.nationality !== undefined) updatePayload.nationality = payload.nationality || null;
  if (payload.passportNumber !== undefined) updatePayload.passport_number = payload.passportNumber || null;
  if (payload.passportIssuingCountry !== undefined) updatePayload.passport_issuing_country = payload.passportIssuingCountry || null;
  if (payload.passportExpirationDate !== undefined) updatePayload.passport_expiration_date = payload.passportExpirationDate || null;
  if (payload.knownTravelerNumber !== undefined) updatePayload.known_traveler_number = payload.knownTravelerNumber || null;
  if (payload.redressNumber !== undefined) updatePayload.redress_number = payload.redressNumber || null;
  if (payload.specialAssistanceNotes !== undefined) updatePayload.special_assistance_notes = payload.specialAssistanceNotes || null;
  if (payload.mealPreferences !== undefined) updatePayload.meal_preferences = payload.mealPreferences || null;
  if (payload.seatPreferences !== undefined) updatePayload.seat_preferences = payload.seatPreferences || null;
  if (payload.travelerType !== undefined) updatePayload.traveler_type = payload.travelerType;
  if (payload.isDefault !== undefined) updatePayload.is_default = payload.isDefault;

  const update = await supabase
    .from("app_traveler_profiles")
    .update(updatePayload)
    .eq("id", travelerId)
    .eq("user_id", authUserId)
    .select("*")
    .maybeSingle<Record<string, unknown>>();

  if (update.error) {
    throw new Error(`No se pudo actualizar viajero: ${update.error.message}`);
  }

  if (!update.data) {
    return null;
  }

  await supabase.rpc("log_user_activity", {
    p_user_id: authUserId,
    p_activity_type: "traveler_updated",
    p_entity_type: "traveler",
    p_entity_id: travelerId,
    p_metadata: updatePayload
  });

  return toTraveler(update.data);
}

export async function deleteTravelerProfileService(authUserId: string, travelerId: string) {
  if (!hasSupabaseConfig()) {
    return { deleted: false };
  }

  const supabase = getSupabaseAdminClient();
  const remove = await supabase
    .from("app_traveler_profiles")
    .delete()
    .eq("id", travelerId)
    .eq("user_id", authUserId)
    .select("id")
    .maybeSingle<{ id: string }>();

  if (remove.error) {
    throw new Error(`No se pudo eliminar viajero: ${remove.error.message}`);
  }

  if (remove.data?.id) {
    await supabase.rpc("log_user_activity", {
      p_user_id: authUserId,
      p_activity_type: "traveler_deleted",
      p_entity_type: "traveler",
      p_entity_id: travelerId,
      p_metadata: {}
    });
  }

  return { deleted: Boolean(remove.data?.id) };
}

export async function getOnboardingProgressService(authUserId: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const recalc = await supabase.rpc("recalc_onboarding_progress", {
    p_user_id: authUserId
  });

  if (recalc.error && !isSchemaErrorMessage(recalc.error.message)) {
    throw new Error(`No se pudo recalcular onboarding: ${recalc.error.message}`);
  }

  const query = await supabase
    .from("app_onboarding_progress")
    .select("*")
    .eq("user_id", authUserId)
    .maybeSingle<Record<string, unknown>>();

  if (query.error) {
    throw new Error(`No se pudo cargar onboarding: ${query.error.message}`);
  }

  return toOnboarding(query.data ?? null);
}

export async function markOnboardingStepService(authUserId: string, step: string) {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("mark_onboarding_step", {
    p_user_id: authUserId,
    p_step: step
  });

  if (result.error) {
    throw new Error(`No se pudo actualizar onboarding: ${result.error.message}`);
  }

  return getOnboardingProgressService(authUserId);
}

export async function registerFirstBookingConversionService(authUserId: string, metadata?: Record<string, unknown>) {
  if (!hasSupabaseConfig()) {
    return { tracked: false, rewardIssued: false };
  }

  const supabase = getSupabaseAdminClient();
  const profile = await supabase
    .from("profiles")
    .select("referred_by_code")
    .eq("id", authUserId)
    .maybeSingle<{ referred_by_code: string | null }>();

  if (profile.error) {
    throw new Error(`No se pudo cargar perfil para conversión de referido: ${profile.error.message}`);
  }

  const referredByCode = profile.data?.referred_by_code?.trim().toUpperCase();
  if (!referredByCode) {
    await markOnboardingStepService(authUserId, "first_quote_requested");
    return { tracked: false, rewardIssued: false };
  }

  const track = await supabase.rpc("track_referral_event", {
    p_referral_code: referredByCode,
    p_event_type: "first_booking_completed",
    p_referred_user_id: authUserId,
    p_metadata: metadata ?? {}
  });

  if (track.error) {
    throw new Error(`No se pudo registrar conversión de referido: ${track.error.message}`);
  }

  const reward = await supabase.rpc("issue_referral_reward_if_eligible", {
    p_referred_user_id: authUserId
  });

  if (reward.error && !isSchemaErrorMessage(reward.error.message)) {
    throw new Error(`No se pudo emitir reward de referido: ${reward.error.message}`);
  }

  await markOnboardingStepService(authUserId, "first_quote_requested");

  return { tracked: Boolean(track.data), rewardIssued: Boolean(reward.data) };
}

export async function getReferralDashboardService(authUserId: string) {
  const bundle = await getPortalGrowthBundleService(authUserId);
  const referralCode = bundle.referralCode;
  const code = referralCode?.referralCode ?? "";

  const fingerprint = createHash("sha256").update(`${authUserId}:${code}`).digest("hex").slice(0, 10);

  return {
    referralCode,
    events: bundle.referralEvents,
    rewards: bundle.referralRewards,
    fingerprint
  };
}

export async function applyReferralCodeForUserService(authUserId: string, referralCode: string) {
  if (!hasSupabaseConfig() || referralCode.trim().length < 2) {
    return { applied: false };
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("apply_referral_code_to_profile", {
    p_user_id: authUserId,
    p_referral_code: referralCode.trim().toUpperCase()
  });

  if (result.error) {
    throw new Error(`No se pudo aplicar código de referido: ${result.error.message}`);
  }

  await supabase.rpc("mark_onboarding_step", {
    p_user_id: authUserId,
    p_step: "referral_prompt_seen"
  });

  await supabase.rpc("log_user_activity", {
    p_user_id: authUserId,
    p_activity_type: "referral_applied",
    p_entity_type: "referral_code",
    p_entity_id: referralCode.trim().toUpperCase(),
    p_metadata: {}
  });

  return { applied: Boolean(result.data) };
}

export async function trackReferralLinkClickService(referralCode: string, metadata?: Record<string, unknown>) {
  if (!hasSupabaseConfig() || referralCode.trim().length < 2) {
    return { tracked: false };
  }

  const supabase = getSupabaseAdminClient();
  const result = await supabase.rpc("track_referral_event", {
    p_referral_code: referralCode.trim().toUpperCase(),
    p_event_type: "link_clicked",
    p_metadata: metadata ?? {}
  });

  if (result.error && !isSchemaErrorMessage(result.error.message)) {
    throw new Error(`No se pudo registrar click de referido: ${result.error.message}`);
  }

  return { tracked: Boolean(result.data) };
}

export async function getAdminGrowthSnapshotService() {
  if (!hasSupabaseConfig()) {
    return {
      funnel: null,
      referrals: [],
      profiles: []
    };
  }

  const supabase = getSupabaseAdminClient();

  const [funnelRes, referralsRes, profilesRes] = await Promise.all([
    supabase.from("app_onboarding_funnel_v").select("*").maybeSingle<Record<string, unknown>>(),
    supabase.from("app_referral_performance_v").select("*").order("conversions_count", { ascending: false }).limit(25),
    supabase.from("app_profile_completion_v").select("*").order("completion_percentage", { ascending: true }).limit(200)
  ]);

  if (funnelRes.error && !isSchemaErrorMessage(funnelRes.error.message)) {
    throw new Error(`No se pudo cargar funnel de onboarding: ${funnelRes.error.message}`);
  }
  if (referralsRes.error && !isSchemaErrorMessage(referralsRes.error.message)) {
    throw new Error(`No se pudo cargar leaderboard de referidos: ${referralsRes.error.message}`);
  }
  if (profilesRes.error && !isSchemaErrorMessage(profilesRes.error.message)) {
    throw new Error(`No se pudo cargar salud de perfiles: ${profilesRes.error.message}`);
  }

  return {
    funnel: funnelRes.data ?? null,
    referrals: referralsRes.data ?? [],
    profiles: profilesRes.data ?? []
  };
}
