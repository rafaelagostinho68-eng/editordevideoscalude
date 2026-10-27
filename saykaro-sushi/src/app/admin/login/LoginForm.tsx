"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, {});
  return (
    <form action={action} className="mt-6 space-y-4" autoComplete="on">
      <div>
        <label htmlFor="email" className="lbl">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" inputMode="email" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="lbl">Senha</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state.error && <p role="alert" className="rounded-xl border border-shu/50 bg-shu/10 px-3 py-2 text-sm text-bad">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
