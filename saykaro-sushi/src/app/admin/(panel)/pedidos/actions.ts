"use server";
import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { db } from "@/server/db";
import { guard } from "@/server/admin/guard";
import { ALL_STATUSES } from "@/server/orders";

export async function changeOrderStatus(orderId: number, status: OrderStatus): Promise<void> {
  const admin = await guard();
  if (!ALL_STATUSES.includes(status)) return;
  const order = await db.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order || order.status === status) return;
  await db.$transaction([
    db.order.update({ where: { id: orderId }, data: { status } }),
    db.orderStatusEvent.create({ data: { orderId, status, adminId: admin.id } }),
  ]);
  revalidatePath("/admin", "layout");
}
