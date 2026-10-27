import { ActionForm, Field } from "@/components/admin/ActionForm";
import { formatDateTime } from "@/lib/time";
import { db } from "@/server/db";
import { requireAdmin } from "@/server/auth/session";
import { changePassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const admin = await requireAdmin();
  const user = await db.adminUser.findUnique({ where: { id: admin.id } });
  return (
    <div className="max-w-xl space-y-5">
      <header>
        <h1 className="font-display text-2xl font-bold">Minha conta</h1>
        <p className="mt-1 text-sm text-muted">{admin.name} · {admin.email}{user?.lastLoginAt ? ` · último acesso ${formatDateTime(user.lastLoginAt)}` : ""}</p>
      </header>
      <section className="card">
        <h2 className="mb-3 font-semibold">Trocar senha</h2>
        <ActionForm action={changePassword} resetOnSuccess submit="Alterar senha">
          <Field name="current" label="Senha atual"><input id="current" name="current" type="password" autoComplete="current-password" className="field" required /></Field>
          <Field name="next" label="Nova senha" hint="Mínimo de 10 caracteres. Prefira uma frase longa."><input id="next" name="next" type="password" autoComplete="new-password" minLength={10} className="field" required /></Field>
          <Field name="confirm" label="Repita a nova senha"><input id="confirm" name="confirm" type="password" autoComplete="new-password" minLength={10} className="field" required /></Field>
        </ActionForm>
        <p className="hint mt-3">Ao trocar a senha, todos os outros aparelhos conectados são desconectados.</p>
      </section>
    </div>
  );
}
