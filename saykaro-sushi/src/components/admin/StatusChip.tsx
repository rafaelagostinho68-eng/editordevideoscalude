import type { OrderStatus } from "@prisma/client";
import { STATUS_LABEL } from "@/server/orders";

const TONE: Record<OrderStatus, string> = {
  AWAITING_WHATSAPP: "chip-warn",
  RECEIVED: "chip-ok",
  PREPARING: "chip-ok",
  OUT_FOR_DELIVERY: "chip-ok",
  COMPLETED: "",
  CANCELLED: "chip-bad",
};

export function StatusChip({ status }: { status: OrderStatus }) {
  return <span className={`chip ${TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
