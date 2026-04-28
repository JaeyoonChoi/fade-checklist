import { getSupabase } from "./supabase";

export type Phase =
  | "immediate"
  | "week"
  | "month"
  | "quarter"
  | "halfyear"
  | "year";

export const PHASES: { key: Phase; label: string; hint: string }[] = [
  { key: "immediate", label: "즉시",       hint: "사망 직후" },
  { key: "week",      label: "7일 이내",   hint: "1주 이내" },
  { key: "month",     label: "1개월 이내", hint: "30일 이내" },
  { key: "quarter",   label: "3개월 이내", hint: "한정승인 기한" },
  { key: "halfyear",  label: "6개월 이내", hint: "상속세 신고" },
  { key: "year",      label: "1년 이내",   hint: "장기 정리" },
];

export const PHASE_LABEL: Record<Phase, string> = Object.fromEntries(
  PHASES.map((p) => [p.key, p.label])
) as Record<Phase, string>;

const PHASE_ORDER: Record<Phase, number> = Object.fromEntries(
  PHASES.map((p, i) => [p.key, i])
) as Record<Phase, number>;

export function phaseRank(phase: string): number {
  return PHASE_ORDER[phase as Phase] ?? 99;
}

export type ChecklistItem = {
  id: string;
  checklist_id: string;
  category: string;
  phase: Phase;
  title: string;
  description: string;
  completed: boolean;
  sort_order: number;
  link_url: string | null;
};

export type Checklist = {
  id: string;
  user_id: string;
  title: string;
  items: ChecklistItem[];
};

async function requireUserId(): Promise<string> {
  const sb = getSupabase();
  const { data, error } = await sb.auth.getUser();
  if (error) throw error;
  if (!data.user) throw new Error("로그인이 필요합니다.");
  return data.user.id;
}

export async function ensureChecklist(): Promise<Checklist> {
  const sb = getSupabase();
  const userId = await requireUserId();

  const { data: existing, error: fetchErr } = await sb
    .from("checklists")
    .select("id, user_id, title")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (fetchErr) throw fetchErr;

  if (existing) {
    const items = await fetchItems(existing.id);
    return { ...existing, items };
  }

  const { data: seeded, error: seedErr } = await sb.rpc(
    "seed_default_checklist",
    { p_user_id: userId }
  );
  if (seedErr) throw seedErr;

  const checklistId = seeded as string;
  const { data: row, error: rowErr } = await sb
    .from("checklists")
    .select("id, user_id, title")
    .eq("id", checklistId)
    .single();
  if (rowErr) throw rowErr;

  const items = await fetchItems(checklistId);
  return { ...row, items };
}

async function fetchItems(checklistId: string): Promise<ChecklistItem[]> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("checklist_items")
    .select("id, checklist_id, category, phase, title, description, completed, sort_order, link_url")
    .eq("checklist_id", checklistId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ChecklistItem[];
}

export async function toggleItem(itemId: string, completed: boolean) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("checklist_items")
    .update({ completed })
    .eq("id", itemId)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error(
      "체크 상태가 저장되지 않았습니다 (RLS 또는 항목 ID 불일치). 마이그레이션 004/005가 적용되었는지 확인해주세요."
    );
  }
}

export async function addItem(input: {
  checklist_id: string;
  category: string;
  phase?: Phase;
  title: string;
  description?: string;
  sort_order?: number;
  link_url?: string | null;
}) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("checklist_items")
    .insert({
      checklist_id: input.checklist_id,
      category: input.category,
      phase: input.phase ?? "month",
      title: input.title,
      description: input.description ?? "",
      sort_order: input.sort_order ?? 999,
      link_url: input.link_url ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChecklistItem;
}

export async function removeItem(itemId: string) {
  const sb = getSupabase();
  const { error } = await sb.from("checklist_items").delete().eq("id", itemId);
  if (error) throw error;
}

export async function updateItem(
  itemId: string,
  patch: Partial<Pick<ChecklistItem, "title" | "description" | "category" | "phase" | "sort_order" | "link_url">>
) {
  const sb = getSupabase();
  const { error } = await sb
    .from("checklist_items")
    .update(patch)
    .eq("id", itemId);
  if (error) throw error;
}
