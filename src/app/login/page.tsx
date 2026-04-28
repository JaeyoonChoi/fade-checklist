import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { GlassCard } from "@/components/GlassCard";
import { Wordmark } from "@/components/Wordmark";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full grid place-items-center px-6 py-12">
      <div className="w-full max-w-[420px] flex flex-col gap-6">
        <div className="flex flex-col items-center gap-2">
          <Wordmark size="lg" />
          <p className="text-[12px] text-[var(--muted)]">사후 체크리스트</p>
        </div>
        <GlassCard strong className="p-7">
          <h1 className="text-[18px] font-semibold tracking-tight mb-1">
            시작하기
          </h1>
          <p className="text-[12px] text-[var(--muted)] mb-5">
            이메일과 비밀번호로 가입하면 같은 계정으로 어디서든 체크리스트를
            이어볼 수 있어요.
          </p>
          <Suspense fallback={null}>
            <AuthForm />
          </Suspense>
        </GlassCard>
      </div>
    </div>
  );
}
