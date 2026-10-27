"use client";
import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import type { FormState } from "@/server/admin/form";

const Ctx = createContext<FormState>({});
export const FormStateContext = Ctx;

/**
 * Formulário do painel ligado a uma Server Action.
 * Usa onSubmit (e não action=) de propósito: o React 19 limpa os campos após o envio, o que apagaria
 * o que a pessoa digitou quando há erro de validação.
 */
export function ActionForm({
  action, children, className = "space-y-4", submit = "Salvar", resetOnSuccess = false, hideSubmit = false, submitClass = "btn btn-primary", footer,
}: {
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  submit?: string;
  resetOnSuccess?: boolean;
  hideSubmit?: boolean;
  submitClass?: string;
  footer?: React.ReactNode;
}) {
  const [state, run, pending] = useActionState<FormState, FormData>(action, {});
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);

  return (
    <Ctx.Provider value={state}>
      <form
        ref={ref}
        className={className}
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => run(fd));
        }}
      >
        {children}
        <div className="flex flex-wrap items-center gap-3">
          {!hideSubmit && <button type="submit" disabled={pending} className={submitClass}>{pending ? "Salvando…" : submit}</button>}
          {footer}
          <div role="status" aria-live="polite" className="text-sm">
            {!pending && state.ok && <span className="text-ok">✓ {state.message ?? "Salvo."}</span>}
            {!pending && state.error && <span className="text-bad">{state.error}</span>}
          </div>
        </div>
      </form>
    </Ctx.Provider>
  );
}

/** Rótulo + campo + mensagem de erro do campo (lida do estado da Server Action). */
export function Field({ name, id, label, hint, children, className }: { name: string; id?: string; label: string; hint?: string; children: React.ReactNode; className?: string }) {
  const state = useContext(Ctx);
  const error = state.fields?.[name];
  return (
    <div className={className}>
      <label htmlFor={id ?? name} className="lbl">{label}</label>
      {children}
      {hint && !error && <p className="hint">{hint}</p>}
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
