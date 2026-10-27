"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { fail, ok, str, type FormState } from "@/server/admin/form";

export async function setPendingResolved(id: number, resolved: boolean): Promise<void> {
  await guard();
  await db.catalogPending.update({ where: { id }, data: { resolved } }).catch(() => {});
  revalidatePath("/admin", "layout");
}

export async function addPending(_p: FormState, fd: FormData): Promise<FormState> {
  await guard();
  const title = str(fd, "title").slice(0, 120);
  const details = str(fd, "details").slice(0, 600);
  if (title.length < 3) return fail("Informe um título.", { title: "Informe um título." });
  await db.catalogPending.create({ data: { title, details, source: "Painel" } });
  revalidatePath("/admin", "layout");
  return ok("Pendência anotada.");
}
