"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wordmark } from "./Wordmark";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

const NAV = [
  { href: "/", label: "대시보드" },
  { href: "/profile", label: "프로필" },
  { href: "/checklist", label: "체크리스트" },
  { href: "/report", label: "절세 리포트" },
  { href: "/settings", label: "프롬프트 설정" },
];

export function Sidebar() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [email, setEmail] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!configured) return;
    const sb = getSupabase();
    sb.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
    };
  }, [configured]);

  async function handleSignOut() {
    if (!configured) return;
    setSigningOut(true);
    try {
      await getSupabase().auth.signOut();
      router.replace("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="w-[240px] shrink-0 px-5 py-7 flex flex-col gap-8">
      <Link href="/" className="flex flex-col gap-2 -ml-0.5">
        <Wordmark size="md" />
        <p className="text-[11px] text-[var(--muted)] tracking-tight">
          사후 체크리스트
        </p>
      </Link>

      <div>
        <p className="text-[10px] tracking-[0.18em] text-[var(--muted-soft)] uppercase mb-3 px-2">
          Overview
        </p>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-lg text-[14px] text-[var(--text-soft)] hover:bg-black/5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto">
        <p className="text-[10px] tracking-[0.18em] text-[var(--muted-soft)] uppercase mb-3 px-2">
          Account
        </p>
        <div className="rounded-xl hairline border px-3 py-3 flex flex-col gap-2">
          <p
            className="text-[12px] text-[var(--text-soft)] truncate"
            title={email ?? undefined}
          >
            {email ?? "로그인 필요"}
          </p>
          {email && (
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="self-start text-[11px] text-[var(--muted)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
            >
              {signingOut ? "로그아웃 중…" : "로그아웃"}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
