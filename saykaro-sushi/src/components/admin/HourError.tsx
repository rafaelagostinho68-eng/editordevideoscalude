"use client";
import { useContext } from "react";
import { FormStateContext } from "./ActionForm";

export function HourError({ name }: { name: string }) {
  const err = useContext(FormStateContext).fields?.[name];
  return err ? <p className="err col-span-3" role="alert">{err}</p> : null;
}
