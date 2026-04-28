"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "./GlassCard";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errorMessage } from "@/lib/error";
import {
  AGE_BRACKETS,
  DEATH_AGE_BRACKETS,
  INSURANCE_BRACKETS,
  MARITAL_STATUSES,
  Person,
  REAL_ESTATE_BRACKETS,
  UserProfile,
  emptyProfile,
  fetchProfile,
  getCurrentUserId,
  saveProfile,
} from "@/lib/profile";

export function ProfileForm() {
  const configured = isSupabaseConfigured();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(configured);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!configured) return;
    (async () => {
      try {
        const userId = await getCurrentUserId();
        const existing = await fetchProfile();
        setProfile(existing ?? emptyProfile(userId));
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [configured]);

  function update<K extends keyof UserProfile>(key: K, value: UserProfile[K]) {
    setProfile((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError("");
    try {
      await saveProfile(profile);
      setSavedAt(new Date());
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  if (!configured) {
    return (
      <GlassCard className="p-6 text-[13px] text-[var(--muted)]">
        Supabase 환경변수가 설정되어야 프로필을 저장할 수 있습니다.
      </GlassCard>
    );
  }
  if (loading || !profile) {
    return (
      <GlassCard className="p-8 text-center text-[13px] text-[var(--muted)]">
        프로필 불러오는 중…
      </GlassCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-24">
      <Section title="기본 정보">
        <Field label="현재 나이">
          <BracketRadio
            options={AGE_BRACKETS}
            value={profile.current_age_bracket}
            onChange={(v) => update("current_age_bracket", v)}
          />
        </Field>
        <Field label="사망 예상 나이">
          <BracketRadio
            options={DEATH_AGE_BRACKETS}
            value={profile.expected_death_bracket}
            onChange={(v) => update("expected_death_bracket", v)}
          />
        </Field>
      </Section>

      <Section title="자산">
        <Field label="부동산 총 보유금액">
          <BracketRadio
            options={REAL_ESTATE_BRACKETS}
            value={profile.real_estate_bracket}
            onChange={(v) => update("real_estate_bracket", v)}
          />
        </Field>
        <Field label="예적금/펀드/주식/채권" hint="자유롭게 적어주세요">
          <textarea
            value={profile.financial_assets ?? ""}
            onChange={(e) => update("financial_assets", e.target.value)}
            rows={3}
            placeholder="예: 예적금 5천만원, 주식 3천만원(국내 ETF 위주), …"
            className="w-full rounded-xl hairline border bg-white/40 px-4 py-3 text-[13px] outline-none focus:border-[var(--text)]"
          />
        </Field>
        <Field label="사망보험금">
          <BracketRadio
            options={INSURANCE_BRACKETS}
            value={profile.life_insurance_bracket}
            onChange={(v) => update("life_insurance_bracket", v)}
          />
        </Field>
      </Section>

      <Section title="가족">
        <Field label="혼인 상태">
          <BracketRadio
            options={MARITAL_STATUSES}
            value={profile.marital_status}
            onChange={(v) => {
              update("marital_status", v);
              if (v !== "기혼") update("spouse", null);
              else if (!profile.spouse) update("spouse", {});
            }}
          />
        </Field>
        {profile.marital_status === "기혼" && (
          <Field label="배우자 정보">
            <PersonInputs
              value={profile.spouse ?? {}}
              onChange={(v) => update("spouse", v)}
            />
          </Field>
        )}
        <Field label="자녀">
          <PersonList
            value={profile.children}
            onChange={(v) => update("children", v)}
            addLabel="자녀 추가"
          />
        </Field>
        <Field label="손주">
          <PersonList
            value={profile.grandchildren}
            onChange={(v) => update("grandchildren", v)}
            addLabel="손주 추가"
          />
        </Field>
      </Section>

      <Section title="기타">
        <Field label="추가로 알리고 싶은 정보" hint="자유 입력">
          <textarea
            value={profile.other_notes ?? ""}
            onChange={(e) => update("other_notes", e.target.value)}
            rows={4}
            placeholder="예: 사업체 운영 중, 해외 자산 보유, 특별한 가족 상황 등"
            className="w-full rounded-xl hairline border bg-white/40 px-4 py-3 text-[13px] outline-none focus:border-[var(--text)]"
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 flex items-center gap-3 mt-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-6 h-11 rounded-full bg-[var(--text)] text-[var(--accent-contrast)] text-[14px] font-medium disabled:opacity-50 hover:opacity-90 transition"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
        {savedAt && (
          <span className="text-[12px] text-[var(--muted)]">
            {savedAt.toLocaleTimeString("ko-KR")} 저장됨
          </span>
        )}
        {error && (
          <span className="text-[12px] text-red-600">{error}</span>
        )}
      </div>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <GlassCard className="p-6">
      <h2 className="text-[15px] font-semibold tracking-tight mb-5">{title}</h2>
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

function BracketRadio({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 h-9 rounded-full text-[13px] transition border ${
              active
                ? "bg-[var(--text)] text-[var(--accent-contrast)] border-[var(--text)]"
                : "hairline text-[var(--text-soft)] hover:border-[var(--text)]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function PersonInputs({
  value,
  onChange,
}: {
  value: Person;
  onChange: (v: Person) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <input
        value={value.name ?? ""}
        onChange={(e) => onChange({ ...value, name: e.target.value })}
        placeholder="이름"
        className="rounded-xl hairline border bg-white/40 px-4 h-10 text-[13px] outline-none focus:border-[var(--text)]"
      />
      <input
        value={value.age ?? ""}
        onChange={(e) => onChange({ ...value, age: e.target.value })}
        placeholder="나이"
        className="rounded-xl hairline border bg-white/40 px-4 h-10 text-[13px] outline-none focus:border-[var(--text)]"
      />
      <input
        value={value.notes ?? ""}
        onChange={(e) => onChange({ ...value, notes: e.target.value })}
        placeholder="메모 (관계·건강 등)"
        className="rounded-xl hairline border bg-white/40 px-4 h-10 text-[13px] outline-none focus:border-[var(--text)]"
      />
    </div>
  );
}

function PersonList({
  value,
  onChange,
  addLabel,
}: {
  value: Person[];
  onChange: (v: Person[]) => void;
  addLabel: string;
}) {
  function updateAt(i: number, person: Person) {
    onChange(value.map((p, idx) => (idx === i ? person : p)));
  }
  function removeAt(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, {}]);
  }
  return (
    <div className="flex flex-col gap-2">
      {value.length === 0 && (
        <p className="text-[12px] text-[var(--muted-soft)]">
          아직 추가된 항목이 없습니다.
        </p>
      )}
      {value.map((p, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <PersonInputs value={p} onChange={(v) => updateAt(i, v)} />
          </div>
          <button
            type="button"
            onClick={() => removeAt(i)}
            aria-label="삭제"
            className="size-10 shrink-0 rounded-full hairline border text-[var(--muted)] hover:text-[var(--text)] hover:border-[var(--text)] grid place-items-center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start inline-flex items-center gap-1.5 px-4 h-9 rounded-full hairline border text-[13px] text-[var(--text-soft)] hover:border-[var(--text)] hover:text-[var(--text)] transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {addLabel}
      </button>
    </div>
  );
}
