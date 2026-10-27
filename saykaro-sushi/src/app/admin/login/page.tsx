import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { getAdmin } from "@/server/auth/session";
import { getSettings, mediaUrl } from "@/server/settings";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");
  const s = await getSettings();
  return (
    <main className="seigaiha grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-line bg-surface/95 p-6 shadow-2xl backdrop-blur">
        <Logo name={s.name} logoUrl={mediaUrl(s.logoPath)} />
        <h1 className="mt-6 text-center font-display text-xl font-bold">Acesso ao painel</h1>
        <p className="mt-1 text-center text-sm text-muted">Área restrita à administração do restaurante.</p>
        <LoginForm />
      </div>
    </main>
  );
}
