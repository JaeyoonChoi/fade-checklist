import { Topbar } from "@/components/Topbar";
import { GlassCard } from "@/components/GlassCard";
import { ProfileForm } from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="max-w-[900px]">
      <Topbar />
      <GlassCard strong className="p-7 mb-5">
        <p className="text-[11px] tracking-[0.2em] uppercase text-[var(--muted)] mb-2">
          Profile
        </p>
        <h1 className="text-[22px] font-semibold tracking-tight mb-2">
          사용자 프로필
        </h1>
        <p className="text-[13px] text-[var(--muted)] leading-relaxed">
          맞춤형 체크리스트 생성에 사용할 기본 정보를 입력해 주세요. 같은 세션
          ID로만 조회·수정할 수 있어요.
        </p>
      </GlassCard>
      <ProfileForm />
    </div>
  );
}
