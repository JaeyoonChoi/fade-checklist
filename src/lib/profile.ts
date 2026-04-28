import { getSupabase } from "./supabase";

export type Person = {
  name?: string;
  age?: string;
  notes?: string;
};

export type UserProfile = {
  id?: string;
  user_id: string;
  current_age_bracket: string | null;
  expected_death_bracket: string | null;
  real_estate_bracket: string | null;
  financial_assets: string | null;
  life_insurance_bracket: string | null;
  marital_status: string | null;
  spouse: Person | null;
  children: Person[];
  grandchildren: Person[];
  other_notes: string | null;
};

export const AGE_BRACKETS = [
  "30대 이하",
  "40대",
  "50대",
  "60대",
  "70대",
  "80대",
  "90대 이상",
];

export const DEATH_AGE_BRACKETS = [
  "60대 이전",
  "60대",
  "70대",
  "80대",
  "90대",
  "100세 이상",
];

export const REAL_ESTATE_BRACKETS = [
  "없음",
  "1억 미만",
  "1~3억",
  "3~5억",
  "5~10억",
  "10~30억",
  "30억 이상",
];

export const INSURANCE_BRACKETS = [
  "없음",
  "1억 미만",
  "1~3억",
  "3~5억",
  "5억 이상",
];

export const MARITAL_STATUSES = ["미혼", "기혼", "사별", "이혼"];

export function emptyProfile(userId: string): UserProfile {
  return {
    user_id: userId,
    current_age_bracket: null,
    expected_death_bracket: null,
    real_estate_bracket: null,
    financial_assets: "",
    life_insurance_bracket: null,
    marital_status: null,
    spouse: null,
    children: [],
    grandchildren: [],
    other_notes: "",
  };
}

async function requireUserId(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("로그인이 필요합니다.");
  return data.user.id;
}

export async function fetchProfile(): Promise<UserProfile | null> {
  const sb = getSupabase();
  const userId = await requireUserId();
  const { data, error } = await sb
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    ...data,
    children: data.children ?? [],
    grandchildren: data.grandchildren ?? [],
  } as UserProfile;
}

export async function getCurrentUserId(): Promise<string> {
  return requireUserId();
}

export async function saveProfile(profile: UserProfile) {
  const sb = getSupabase();
  const payload = {
    user_id: profile.user_id,
    current_age_bracket: profile.current_age_bracket,
    expected_death_bracket: profile.expected_death_bracket,
    real_estate_bracket: profile.real_estate_bracket,
    financial_assets: profile.financial_assets ?? "",
    life_insurance_bracket: profile.life_insurance_bracket,
    marital_status: profile.marital_status,
    spouse: profile.spouse,
    children: profile.children,
    grandchildren: profile.grandchildren,
    other_notes: profile.other_notes ?? "",
    updated_at: new Date().toISOString(),
  };
  const { error } = await sb
    .from("user_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) throw error;
}
