import { getSupabase } from "./supabase";

export type ReportInput = {
  gift_history: string;
  business: string;
  overseas_assets: string;
  debts: string;
  insurance_structure: string;
  heir_agreements: string;
  extra_notes: string;
};

export type RecommendedItem = {
  category: string;
  phase: string;
  title: string;
  description: string;
  link_url: string | null;
};

export type TaxReport = {
  id: string;
  user_id: string;
  profile_snapshot: unknown;
  report_input: ReportInput;
  summary: string | null;
  markdown: string;
  recommended_items: RecommendedItem[];
  applied_at: string | null;
  created_at: string;
};

export function emptyReportInput(): ReportInput {
  return {
    gift_history: "",
    business: "",
    overseas_assets: "",
    debts: "",
    insurance_structure: "",
    heir_agreements: "",
    extra_notes: "",
  };
}

export async function fetchLatestReport(): Promise<TaxReport | null> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await sb
    .from("tax_reports")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as TaxReport | null) ?? null;
}

export async function listReports(): Promise<TaxReport[]> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return [];

  const { data, error } = await sb
    .from("tax_reports")
    .select("*")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as TaxReport[];
}

export async function generateReport(
  input: ReportInput
): Promise<TaxReport> {
  const res = await fetch("/api/report/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `리포트 생성 실패 (${res.status})`);
  }
  const data = (await res.json()) as { report: TaxReport };
  return data.report;
}

export async function applyRecommendations(
  reportId: string
): Promise<{ added: number; skipped: number }> {
  const sb = getSupabase();
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) throw new Error("로그인이 필요합니다.");

  const { data: report, error: reportErr } = await sb
    .from("tax_reports")
    .select("id, user_id, recommended_items")
    .eq("id", reportId)
    .single();
  if (reportErr) throw reportErr;
  if (!report) throw new Error("리포트를 찾을 수 없습니다.");

  const { data: checklist, error: clErr } = await sb
    .from("checklists")
    .select("id")
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (clErr) throw clErr;
  if (!checklist) throw new Error("먼저 체크리스트를 초기화해 주세요.");

  const { data: existingItems, error: existErr } = await sb
    .from("checklist_items")
    .select("title, sort_order")
    .eq("checklist_id", checklist.id);
  if (existErr) throw existErr;

  const existingTitles = new Set(
    (existingItems ?? []).map((i) => (i.title ?? "").trim())
  );
  const maxSort = (existingItems ?? []).reduce(
    (m, i) => Math.max(m, i.sort_order ?? 0),
    0
  );

  const recs = (report.recommended_items ?? []) as RecommendedItem[];
  const toInsert = recs
    .filter((r) => r.title && !existingTitles.has(r.title.trim()))
    .map((r, idx) => ({
      checklist_id: checklist.id,
      category: r.category || "금융·상속",
      phase: r.phase || "month",
      title: r.title,
      description: r.description ?? "",
      sort_order: maxSort + 1 + idx,
      link_url: r.link_url ?? null,
    }));

  if (toInsert.length > 0) {
    const { error: insErr } = await sb
      .from("checklist_items")
      .insert(toInsert);
    if (insErr) throw insErr;
  }

  const { error: updErr } = await sb
    .from("tax_reports")
    .update({ applied_at: new Date().toISOString() })
    .eq("id", reportId);
  if (updErr) throw updErr;

  return {
    added: toInsert.length,
    skipped: recs.length - toInsert.length,
  };
}
