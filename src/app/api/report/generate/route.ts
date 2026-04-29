import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { chat, extractJson } from "@/lib/anthropic";
import { TAX_STRATEGY_SYSTEM } from "@/lib/prompts";
import type { ReportInput, RecommendedItem, TaxReport } from "@/lib/reports";

type AiResponse = {
  summary?: string;
  markdown?: string;
  recommended_items?: RecommendedItem[];
};

export async function POST(request: Request) {
  let body: { input?: Partial<ReportInput> };
  try {
    body = (await request.json()) as { input?: Partial<ReportInput> };
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청 본문입니다." },
      { status: 400 }
    );
  }

  const input: ReportInput = {
    gift_history: body.input?.gift_history ?? "",
    business: body.input?.business ?? "",
    overseas_assets: body.input?.overseas_assets ?? "",
    debts: body.input?.debts ?? "",
    insurance_structure: body.input?.insurance_structure ?? "",
    heir_agreements: body.input?.heir_agreements ?? "",
    extra_notes: body.input?.extra_notes ?? "",
  };

  const sb = await getSupabaseServer();
  const {
    data: { user },
    error: authErr,
  } = await sb.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { data: profile } = await sb
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const userPrompt = buildUserPrompt(profile, input);

  let aiText: string;
  try {
    aiText = await chat({
      system: TAX_STRATEGY_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 12000,
      temperature: 0.4,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }

  let parsed: AiResponse;
  try {
    parsed = extractJson<AiResponse>(aiText);
  } catch (e) {
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : String(e),
        raw: aiText.slice(0, 2000),
      },
      { status: 502 }
    );
  }

  const markdown = (parsed.markdown ?? "").trim();
  if (!markdown) {
    return NextResponse.json(
      { error: "AI가 리포트 본문을 생성하지 못했습니다." },
      { status: 502 }
    );
  }

  const recommended = sanitizeRecommendations(parsed.recommended_items);

  const { data: inserted, error: insErr } = await sb
    .from("tax_reports")
    .insert({
      user_id: user.id,
      profile_snapshot: profile ?? null,
      report_input: input,
      summary: (parsed.summary ?? "").trim() || null,
      markdown,
      recommended_items: recommended,
    })
    .select("*")
    .single();
  if (insErr) {
    return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ report: inserted as TaxReport });
}

function buildUserPrompt(
  profile: Record<string, unknown> | null,
  input: ReportInput
): string {
  const lines: string[] = [];
  lines.push("## 사용자 프로필");
  if (profile) {
    lines.push(`- 현재 나이: ${stringOr(profile.current_age_bracket)}`);
    lines.push(
      `- 사망 예상 나이: ${stringOr(profile.expected_death_bracket)}`
    );
    lines.push(`- 부동산 보유: ${stringOr(profile.real_estate_bracket)}`);
    lines.push(`- 금융자산: ${stringOr(profile.financial_assets)}`);
    lines.push(
      `- 사망보험금: ${stringOr(profile.life_insurance_bracket)}`
    );
    lines.push(`- 혼인 상태: ${stringOr(profile.marital_status)}`);
    lines.push(`- 배우자: ${formatPerson(profile.spouse)}`);
    lines.push(`- 자녀: ${formatPersonList(profile.children)}`);
    lines.push(`- 손주: ${formatPersonList(profile.grandchildren)}`);
    lines.push(`- 기타: ${stringOr(profile.other_notes)}`);
  } else {
    lines.push("(프로필 미입력)");
  }

  lines.push("");
  lines.push("## 절세 리포트용 추가 입력");
  lines.push(`- 최근 10년 증여 이력: ${stringOr(input.gift_history)}`);
  lines.push(`- 사업체/가업: ${stringOr(input.business)}`);
  lines.push(`- 해외자산: ${stringOr(input.overseas_assets)}`);
  lines.push(`- 부채: ${stringOr(input.debts)}`);
  lines.push(
    `- 보험 계약자/수익자 구조: ${stringOr(input.insurance_structure)}`
  );
  lines.push(`- 상속인 간 협의 사항: ${stringOr(input.heir_agreements)}`);
  lines.push(`- 추가 메모: ${stringOr(input.extra_notes)}`);

  lines.push("");
  lines.push(
    "위 정보를 바탕으로 시스템 메시지에 명시된 JSON 한 객체만 반환하세요."
  );
  return lines.join("\n");
}

function stringOr(v: unknown): string {
  if (v == null) return "(미입력)";
  if (typeof v === "string") return v.trim() || "(미입력)";
  return JSON.stringify(v);
}

function formatPerson(v: unknown): string {
  if (!v || typeof v !== "object") return "(없음)";
  const p = v as { name?: string; age?: string; notes?: string };
  const parts = [p.name, p.age ? `${p.age}세` : null, p.notes]
    .filter(Boolean)
    .join(", ");
  return parts || "(정보 없음)";
}

function formatPersonList(v: unknown): string {
  if (!Array.isArray(v) || v.length === 0) return "(없음)";
  return v.map(formatPerson).join(" | ");
}

const VALID_PHASES = new Set([
  "immediate",
  "week",
  "month",
  "quarter",
  "halfyear",
  "year",
]);

function sanitizeRecommendations(raw: unknown): RecommendedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((r) => {
      if (!r || typeof r !== "object") return null;
      const obj = r as Record<string, unknown>;
      const title = typeof obj.title === "string" ? obj.title.trim() : "";
      if (!title) return null;
      const phase =
        typeof obj.phase === "string" && VALID_PHASES.has(obj.phase)
          ? obj.phase
          : "month";
      return {
        category:
          typeof obj.category === "string" && obj.category.trim()
            ? obj.category.trim()
            : "금융·상속",
        phase,
        title,
        description:
          typeof obj.description === "string" ? obj.description.trim() : "",
        link_url:
          typeof obj.link_url === "string" && obj.link_url.trim()
            ? obj.link_url.trim()
            : null,
      } satisfies RecommendedItem;
    })
    .filter((x): x is RecommendedItem => x !== null)
    .slice(0, 10);
}
