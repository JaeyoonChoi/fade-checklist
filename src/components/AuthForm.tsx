"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/error";

type Mode = "signin" | "signup";

export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setSubmitting(true);
    const sb = getSupabase();
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.replace(next);
          router.refresh();
          return;
        }
        setInfo(
          "가입이 완료됐어요. 이메일 인증이 필요하면 받은편지함을 확인하고, 그렇지 않으면 로그인 탭으로 이동해 주세요."
        );
        setMode("signin");
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next);
        router.refresh();
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="inline-flex hairline border rounded-full p-1 bg-[var(--surface)] self-start">
        {(["signin", "signup"] as const).map((m) => {
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError("");
                setInfo("");
              }}
              className={`px-4 h-8 rounded-full text-[12px] font-medium transition-colors ${
                active
                  ? "bg-[var(--text)] text-[var(--accent-contrast)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {m === "signin" ? "로그인" : "회원가입"}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-[var(--muted)]">이메일</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl hairline border bg-white/40 px-4 h-11 text-[14px] outline-none focus:border-[var(--text)]"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[12px] text-[var(--muted)]">비밀번호</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl hairline border bg-white/40 px-4 h-11 text-[14px] outline-none focus:border-[var(--text)]"
        />
        {mode === "signup" && (
          <span className="text-[11px] text-[var(--muted-soft)]">
            6자 이상
          </span>
        )}
      </label>

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 inline-flex items-center justify-center h-11 rounded-full bg-[var(--text)] text-[var(--accent-contrast)] text-[14px] font-medium disabled:opacity-50 hover:opacity-90 transition"
      >
        {submitting
          ? "처리 중…"
          : mode === "signin"
          ? "로그인"
          : "회원가입"}
      </button>

      {error && (
        <p className="text-[12px] text-red-600 leading-relaxed">{error}</p>
      )}
      {info && (
        <p className="text-[12px] text-[var(--text-soft)] leading-relaxed">
          {info}
        </p>
      )}
    </form>
  );
}
