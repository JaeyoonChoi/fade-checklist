"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { GlassCard } from "./GlassCard";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errorMessage } from "@/lib/error";
import {
  ReportInput,
  TaxReport,
  applyRecommendations,
  emptyReportInput,
  fetchLatestReport,
  generateReport,
} from "@/lib/reports";
import { PHASE_LABEL, Phase } from "@/lib/checklists";

export function TaxReportPanel() {
  const configured = isSupabaseConfigured();
  const [input, setInput] = useState<ReportInput>(emptyReportInput());
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(configured);
  const [generating, setGenerating] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!configured) return;
    (async () => {
      try {
        const latest = await fetchLatestReport();
        if (latest) {
          setReport(latest);
          setInput({ ...emptyReportInput(), ...(latest.report_input ?? {}) });
        }
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [configured]);

  function update<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setApplyResult("");
    setGenerating(true);
    try {
      const next = await generateReport(input);
      setReport(next);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleApply() {
    if (!report) return;
    setApplyResult("");
    setError("");
    setApplying(true);
    try {
      const { added, skipped } = await applyRecommendations(report.id);
      setApplyResult(
        `체크리스트에 ${added}개 추가, 중복 ${skipped}개 스킵했습니다.`
      );
      const refreshed = await fetchLatestReport();
      if (refreshed) setReport(refreshed);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setApplying(false);
    }
  }

  if (!configured) {
    return (
      <GlassCard className="p-6 text-[13px] text-[var(--muted)]">
        Supabase 환경변수가 설정되어야 리포트를 사용할 수 있습니다.
      </GlassCard>
    );
  }
  if (loading) {
    return (
      <GlassCard className="p-8 text-center text-[13px] text-[var(--muted)]">
        불러오는 중…
      </GlassCard>
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-24">
      <form onSubmit={handleGenerate} className="flex flex-col gap-5">
        <Section
          title="추가 정보 입력"
          subtitle="프로필에 이미 입력한 항목 외에, 절세 전략에 필요한 정보를 자유롭게 적어주세요."
        >
          <Field
            label="최근 10년 증여 이력"
            hint="수증자 / 시기 / 금액 / 유형 (예: 자녀 A에게 2022년 5천만원 현금)"
          >
            <Textarea
              value={input.gift_history}
              onChange={(v) => update("gift_history", v)}
              placeholder="예: 2022년 자녀에게 5천만원, 2024년 배우자에게 3억 부동산 지분 이전"
            />
          </Field>
          <Field
            label="사업체 / 가업"
            hint="업종, 지분율, 평가액, 승계 의향"
          >
            <Textarea
              value={input.business}
              onChange={(v) => update("business", v)}
              placeholder="예: 제조업 법인 지분 60% (평가액 약 30억), 자녀에게 가업 승계 고려 중"
            />
          </Field>
          <Field
            label="해외자산"
            hint="국가, 종류, 평가액"
          >
            <Textarea
              value={input.overseas_assets}
              onChange={(v) => update("overseas_assets", v)}
              placeholder="예: 미국 주식계좌 약 2억, 일본 부동산 1채 약 5억"
            />
          </Field>
          <Field label="부채" hint="종류, 잔액, 담보 여부">
            <Textarea
              value={input.debts}
              onChange={(v) => update("debts", v)}
              placeholder="예: 주택담보대출 잔액 1.5억, 신용대출 3천만원"
            />
          </Field>
          <Field
            label="보험 계약자 / 수익자 구조"
            hint="누가 계약자·피보험자·수익자인지"
          >
            <Textarea
              value={input.insurance_structure}
              onChange={(v) => update("insurance_structure", v)}
              placeholder="예: 종신보험 사망보험금 5억, 계약자=본인 / 피보험자=본인 / 수익자=배우자"
            />
          </Field>
          <Field
            label="상속인 간 협의 사항"
            hint="분쟁 가능성, 분할 합의, 특별수익 여부"
          >
            <Textarea
              value={input.heir_agreements}
              onChange={(v) => update("heir_agreements", v)}
              placeholder="예: 장남이 가업 승계, 차녀에게는 현금성 자산으로 보전 합의 중"
            />
          </Field>
          <Field label="추가 메모">
            <Textarea
              value={input.extra_notes}
              onChange={(v) => update("extra_notes", v)}
              placeholder="기타 알려야 할 정보"
            />
          </Field>
        </Section>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={generating}
            className="inline-flex items-center px-6 h-11 rounded-full bg-[var(--text)] text-[var(--accent-contrast)] text-[14px] font-medium disabled:opacity-50 hover:opacity-90 transition"
          >
            {generating
              ? "생성 중… (10~30초 소요)"
              : report
              ? "리포트 다시 생성"
              : "리포트 생성"}
          </button>
          {error && <span className="text-[12px] text-red-600">{error}</span>}
        </div>
      </form>

      {report && (
        <ReportView
          report={report}
          applying={applying}
          applyResult={applyResult}
          onApply={handleApply}
        />
      )}
    </div>
  );
}

function ReportView({
  report,
  applying,
  applyResult,
  onApply,
}: {
  report: TaxReport;
  applying: boolean;
  applyResult: string;
  onApply: () => void;
}) {
  return (
    <GlassCard className="p-7">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-1">
            Latest Report
          </p>
          <p className="text-[12px] text-[var(--muted)]">
            {new Date(report.created_at).toLocaleString("ko-KR")} 생성
            {report.applied_at &&
              ` · ${new Date(report.applied_at).toLocaleString(
                "ko-KR"
              )} 체크리스트 반영`}
          </p>
        </div>
      </div>

      {report.summary && (
        <div className="rounded-xl hairline border bg-white/40 p-4 mb-5 text-[13px] leading-relaxed text-[var(--text-soft)]">
          {report.summary}
        </div>
      )}

      <article className="prose-tax">
        <ReactMarkdown>{report.markdown}</ReactMarkdown>
      </article>

      {report.recommended_items.length > 0 && (
        <div className="mt-7 pt-6 border-t hairline">
          <h3 className="text-[14px] font-semibold mb-3">
            체크리스트 추천 항목 ({report.recommended_items.length})
          </h3>
          <ul className="flex flex-col gap-2 mb-5">
            {report.recommended_items.map((r, i) => (
              <li
                key={i}
                className="rounded-xl hairline border bg-white/30 px-4 py-3 text-[13px]"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] text-[var(--muted)]">
                    {r.category}
                  </span>
                  <span className="text-[11px] text-[var(--muted-soft)]">
                    ·
                  </span>
                  <span className="text-[11px] text-[var(--muted)]">
                    {PHASE_LABEL[r.phase as Phase] ?? r.phase}
                  </span>
                </div>
                <p className="font-medium text-[var(--text)]">{r.title}</p>
                {r.description && (
                  <p className="text-[12px] text-[var(--muted)] mt-1 leading-relaxed">
                    {r.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onApply}
              disabled={applying}
              className="inline-flex items-center px-5 h-10 rounded-full hairline border text-[13px] hover:border-[var(--text)] hover:text-[var(--text)] transition disabled:opacity-50"
            >
              {applying ? "반영 중…" : "체크리스트에 반영"}
            </button>
            {applyResult && (
              <span className="text-[12px] text-[var(--muted)]">
                {applyResult}
              </span>
            )}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-[15px] font-semibold tracking-tight mb-1">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12px] text-[var(--muted)] mb-5 leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="flex flex-col gap-5">{children}</div>
    </GlassCard>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-[13px] font-medium text-[var(--text)]">
          {label}
        </label>
        {hint && (
          <span className="text-[11px] text-[var(--muted-soft)]">{hint}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      placeholder={placeholder}
      className="w-full rounded-xl hairline border bg-white/40 px-4 py-3 text-[13px] outline-none focus:border-[var(--text)] resize-y"
    />
  );
}
