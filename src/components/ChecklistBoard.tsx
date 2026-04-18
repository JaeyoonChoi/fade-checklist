"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassCard } from "./GlassCard";
import { StatsPanel } from "./StatsPanel";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  Checklist,
  ChecklistItem,
  ensureChecklistForSession,
  toggleItem,
} from "@/lib/checklists";
import { getOrCreateSessionId, isUuid, setSessionId } from "@/lib/session";

type Props = {
  mode: "preview" | "full";
  forcedSessionId?: string;
};

export function ChecklistBoard({ mode, forcedSessionId }: Props) {
  const configured = isSupabaseConfigured();
  const [sessionId, setSid] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">(
    configured ? "loading" : "idle"
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!configured) return;
    try {
      let sid: string;
      if (forcedSessionId) {
        if (!isUuid(forcedSessionId)) {
          setStatus("error");
          setError("유효하지 않은 세션 ID 형식입니다.");
          return;
        }
        sid = forcedSessionId;
        setSessionId(sid);
      } else {
        sid = getOrCreateSessionId();
      }
      setSid(sid);
      ensureChecklistForSession(sid)
        .then((cl) => {
          setChecklist(cl);
          setStatus("idle");
        })
        .catch((e: unknown) => {
          setStatus("error");
          setError(e instanceof Error ? e.message : String(e));
        });
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [configured, forcedSessionId]);

  const visibleItems = useMemo(() => {
    if (!checklist) return [];
    return mode === "preview" ? checklist.items.slice(0, 5) : checklist.items;
  }, [checklist, mode]);

  const grouped = useMemo(() => {
    if (mode !== "full" || !checklist) return null;
    const map = new Map<string, ChecklistItem[]>();
    for (const it of checklist.items) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return Array.from(map.entries());
  }, [checklist, mode]);

  const total = checklist?.items.length ?? 0;
  const done = checklist?.items.filter((i) => i.completed).length ?? 0;

  async function handleToggle(id: string) {
    let nextValue: boolean | null = null;
    let prevValue: boolean | null = null;
    setChecklist((cur) => {
      if (!cur) return cur;
      const target = cur.items.find((i) => i.id === id);
      if (!target) return cur;
      prevValue = target.completed;
      nextValue = !target.completed;
      return {
        ...cur,
        items: cur.items.map((it) =>
          it.id === id ? { ...it, completed: nextValue! } : it
        ),
      };
    });
    if (nextValue === null) return;
    try {
      await toggleItem(id, nextValue);
    } catch (e) {
      setChecklist((cur) =>
        cur
          ? {
              ...cur,
              items: cur.items.map((it) =>
                it.id === id ? { ...it, completed: prevValue! } : it
              ),
            }
          : cur
      );
      setStatus("error");
      setError(e instanceof Error ? e.message : String(e));
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
        {mode === "preview" && sessionId && (
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

        {grouped ? (
          <div className="flex flex-col gap-6">
            {grouped.map(([cat, list]) => (
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
                    />
                  ))}
                </GlassCard>
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
              />
            ))}
          </GlassCard>
        )}

        {sessionId && (
          <p className="text-[11px] text-[var(--muted-soft)] mt-4 px-1 font-mono">
            세션 {sessionId.slice(0, 8)}… · 공유 URL: /c/{sessionId}
          </p>
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

function ItemRow({
  item,
  onToggle,
  showCategory = false,
}: {
  item: ChecklistItem;
  onToggle: (id: string) => void;
  showCategory?: boolean;
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
          <span
            className={`text-[14px] font-medium ${
              item.completed
                ? "line-through text-[var(--muted)]"
                : "text-[var(--text)]"
            }`}
          >
            {item.title}
          </span>
        </div>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          {item.description}
        </p>
      </div>
    </div>
  );
}
