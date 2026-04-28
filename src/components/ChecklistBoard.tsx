"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "./GlassCard";
import { StatsPanel } from "./StatsPanel";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errorMessage } from "@/lib/error";
import {
  Checklist,
  ChecklistItem,
  PHASES,
  PHASE_LABEL,
  Phase,
  ensureChecklist,
  phaseRank,
  toggleItem,
} from "@/lib/checklists";

type ViewMode = "category" | "timeline";

type Props = {
  mode: "preview" | "full";
};

export function ChecklistBoard({ mode }: Props) {
  const configured = isSupabaseConfigured();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    configured ? "loading" : "idle"
  );
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("category");

  useEffect(() => {
    if (!configured) return;
    ensureChecklist()
      .then((cl) => {
        setChecklist(cl);
        setStatus("idle");
      })
      .catch((e: unknown) => {
        setStatus("error");
        setError(errorMessage(e));
      });
  }, [configured]);

  const sortedByPhase = useMemo(() => {
    if (!checklist) return [] as ChecklistItem[];
    return [...checklist.items].sort((a, b) => {
      const pa = phaseRank(a.phase);
      const pb = phaseRank(b.phase);
      if (pa !== pb) return pa - pb;
      return a.sort_order - b.sort_order;
    });
  }, [checklist]);

  const visibleItems = useMemo(() => {
    if (!checklist) return [];
    if (mode === "preview") return sortedByPhase.slice(0, 5);
    return checklist.items;
  }, [checklist, mode, sortedByPhase]);

  const categoryGroups = useMemo(() => {
    if (mode !== "full" || !checklist) return null;
    const map = new Map<string, ChecklistItem[]>();
    for (const it of checklist.items) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return Array.from(map.entries());
  }, [checklist, mode]);

  const timelineGroups = useMemo(() => {
    if (mode !== "full" || !checklist) return null;
    const map = new Map<Phase, ChecklistItem[]>();
    for (const it of sortedByPhase) {
      const key = it.phase;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return PHASES.filter((p) => map.has(p.key)).map((p) => ({
      key: p.key,
      label: p.label,
      hint: p.hint,
      items: map.get(p.key)!,
    }));
  }, [checklist, mode, sortedByPhase]);

  const total = checklist?.items.length ?? 0;
  const done = checklist?.items.filter((i) => i.completed).length ?? 0;

  async function handleToggle(id: string) {
    if (!checklist) return;
    const target = checklist.items.find((i) => i.id === id);
    if (!target) return;
    const prevValue = target.completed;
    const nextValue = !prevValue;

    setChecklist((cur) =>
      cur
        ? {
            ...cur,
            items: cur.items.map((it) =>
              it.id === id ? { ...it, completed: nextValue } : it
            ),
          }
        : cur
    );

    try {
      await toggleItem(id, nextValue);
    } catch (e) {
      setChecklist((cur) =>
        cur
          ? {
              ...cur,
              items: cur.items.map((it) =>
                it.id === id ? { ...it, completed: prevValue } : it
              ),
            }
          : cur
      );
      setStatus("error");
      setError(errorMessage(e));
    }
  }

  if (!configured) {
    return (
      <SetupNotice
        title="Supabase 연결 필요"
        body={
          <>
            <p className="mb-3">
              체크리스트 저장을 위해 Supabase 환경변수가 필요합니다. 프로젝트 루트의{" "}
              <code className="font-mono text-[12px] bg-black/5 px-1.5 py-0.5 rounded">
                .env.local
              </code>
              에 다음 값을 채워주세요.
            </p>
            <pre className="bg-black/5 rounded-xl p-4 text-[12px] font-mono leading-relaxed overflow-x-auto">
              NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
              {"\n"}
              NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
            </pre>
            <p className="mt-3 text-[12px] text-[var(--muted)]">
              Supabase 프로젝트 생성 후 SQL Editor에서{" "}
              <code className="font-mono">supabase/schema.sql</code> 내용을 실행하세요.
            </p>
          </>
        }
      />
    );
  }

  if (status === "error") {
    return (
      <SetupNotice
        title="데이터를 불러오지 못했어요"
        body={<p className="text-[13px] text-[var(--muted)]">{error}</p>}
      />
    );
  }

  if (status === "loading" || !checklist) {
    return (
      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          <GlassCard className="p-8 text-center text-[13px] text-[var(--muted)]">
            체크리스트 불러오는 중…
          </GlassCard>
        </div>
        <StatsPanel total={0} done={0} />
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0">
        {mode === "preview" && (
          <div className="mb-4 px-1 flex items-center justify-between">
            <div>
              <h2 className="text-[18px] font-semibold tracking-tight">
                이어서 할 일
              </h2>
              <p className="text-[12px] text-[var(--muted)] mt-0.5">
                우선순위가 높은 항목부터 정리되어 있어요
              </p>
            </div>
          </div>
        )}

        {mode === "full" && (
          <ViewToggle value={viewMode} onChange={setViewMode} />
        )}

        {mode === "full" && viewMode === "category" && categoryGroups ? (
          <div className="flex flex-col gap-6">
            {categoryGroups.map(([cat, list]) => (
              <section key={cat}>
                <div className="flex items-center justify-between px-1 mb-3">
                  <h3 className="text-[15px] font-semibold tracking-tight">
                    {cat}
                  </h3>
                  <span className="text-[12px] text-[var(--muted)]">
                    {list.filter((it) => it.completed).length} / {list.length}
                  </span>
                </div>
                <GlassCard className="divide-y divide-[var(--border)]">
                  {list.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      showPhase
                    />
                  ))}
                </GlassCard>
              </section>
            ))}
          </div>
        ) : mode === "full" && viewMode === "timeline" && timelineGroups ? (
          <div className="flex flex-col gap-6">
            {timelineGroups.map((grp, idx) => (
              <section key={grp.key} className="flex gap-4">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="size-3 rounded-full bg-[var(--text)] shrink-0" />
                  {idx < timelineGroups.length - 1 && (
                    <div className="w-px flex-1 bg-[var(--border-strong)] mt-1" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex items-baseline justify-between px-1 mb-3">
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-[15px] font-semibold tracking-tight">
                        {grp.label}
                      </h3>
                      <span className="text-[11px] text-[var(--muted-soft)]">
                        {grp.hint}
                      </span>
                    </div>
                    <span className="text-[12px] text-[var(--muted)]">
                      {grp.items.filter((it) => it.completed).length} /{" "}
                      {grp.items.length}
                    </span>
                  </div>
                  <GlassCard className="divide-y divide-[var(--border)]">
                    {grp.items.map((item) => (
                      <ItemRow
                        key={item.id}
                        item={item}
                        onToggle={handleToggle}
                        showCategory
                      />
                    ))}
                  </GlassCard>
                </div>
              </section>
            ))}
          </div>
        ) : (
          <GlassCard className="divide-y divide-[var(--border)]">
            {visibleItems.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onToggle={handleToggle}
                showCategory
                showPhase
              />
            ))}
          </GlassCard>
        )}

      </div>
      <StatsPanel total={total} done={done} />
    </div>
  );
}

function SetupNotice({
  title,
  body,
}: {
  title: string;
  body: React.ReactNode;
}) {
  return (
    <GlassCard strong className="p-7">
      <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
        Setup
      </p>
      <h2 className="text-[20px] font-semibold tracking-tight mb-3">{title}</h2>
      <div className="text-[13px] text-[var(--text-soft)] leading-relaxed">
        {body}
      </div>
    </GlassCard>
  );
}

function ViewToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  const options: { key: ViewMode; label: string }[] = [
    { key: "category", label: "카테고리" },
    { key: "timeline", label: "타임라인" },
  ];
  return (
    <div className="mb-4 inline-flex hairline border rounded-full p-1 bg-[var(--surface)]">
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`px-4 h-8 rounded-full text-[12px] font-medium transition-colors ${
              active
                ? "bg-[var(--text)] text-[var(--accent-contrast)]"
                : "text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ItemRow({
  item,
  onToggle,
  showCategory = false,
  showPhase = false,
}: {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  showCategory?: boolean;
  showPhase?: boolean;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onToggle(item.id)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onToggle(item.id);
        }
      }}
      className="flex items-start gap-4 px-5 py-4 cursor-pointer group select-none outline-none focus-visible:bg-black/5"
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 size-5 rounded-md border transition-colors grid place-items-center shrink-0 ${
          item.completed
            ? "bg-[var(--text)] border-[var(--text)]"
            : "border-[var(--border-strong)] group-hover:border-[var(--text)]"
        }`}
      >
        {item.completed && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-contrast)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {showCategory && (
            <span className="text-[10px] tracking-[0.1em] uppercase px-2 py-0.5 rounded-full hairline border text-[var(--muted)]">
              {item.category}
            </span>
          )}
          {showPhase && (
            <span className="text-[10px] tracking-[0.02em] px-2 py-0.5 rounded-full bg-black/5 text-[var(--text-soft)]">
              {PHASE_LABEL[item.phase] ?? item.phase}
            </span>
          )}
          <span
            className={`text-[14px] font-medium ${
              item.completed
                ? "line-through text-[var(--muted)]"
                : "text-[var(--text)]"
            }`}
          >
            {item.title}
          </span>
          {item.link_url && (
            <a
              href={item.link_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] hover:text-[var(--text)] underline-offset-2 hover:underline"
              aria-label={`${item.title} 관련 사이트 열기`}
            >
              바로가기
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </a>
          )}
        </div>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}
