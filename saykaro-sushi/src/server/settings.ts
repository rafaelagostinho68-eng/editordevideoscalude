import { db } from "./db";
import type { RestaurantSettings, OpeningHour, PaymentMethod, DeliveryZone } from "@prisma/client";
import { computeOpenStatus, type OpenStatus } from "@/lib/hours";

/** Linha única (id = 1). Criada com os padrões do schema na primeira leitura. */
export async function getSettings(): Promise<RestaurantSettings> {
  return db.restaurantSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
}

export type PublicSettings = {
  name: string; tagline: string; description: string; logoUrl: string | null;
  whatsappPrimary: string; whatsappSecondary: string | null; instagram: string | null;
  announcement: string | null; ordersPaused: boolean; pausedMessage: string | null;
  deliveryEnabled: boolean; pickupEnabled: boolean;
  status: OpenStatus;
  paymentMethods: { id: number; label: string; instructions: string | null }[];
  zones: { id: number; name: string; feeCents: number }[];
};

export const mediaUrl = (path: string | null | undefined) => (path ? `/media/${path}` : null);

export async function getPublicSettings(): Promise<PublicSettings> {
  const [s, hours, methods, zones] = await Promise.all([
    getSettings(),
    db.openingHour.findMany({ orderBy: { weekday: "asc" } }),
    db.paymentMethod.findMany({ where: { enabled: true }, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
    db.deliveryZone.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
  ]);
  return {
    name: s.name, tagline: s.tagline, description: s.description, logoUrl: mediaUrl(s.logoPath),
    whatsappPrimary: s.whatsappPrimary, whatsappSecondary: s.whatsappSecondary, instagram: s.instagram,
    announcement: s.announcement, ordersPaused: s.ordersPaused, pausedMessage: s.pausedMessage,
    deliveryEnabled: s.deliveryEnabled, pickupEnabled: s.pickupEnabled,
    status: computeOpenStatus({ statusMode: s.statusMode, hours, timezone: s.timezone }),
    paymentMethods: methods.map((m: PaymentMethod) => ({ id: m.id, label: m.label, instructions: m.instructions })),
    zones: zones.map((z: DeliveryZone) => ({ id: z.id, name: z.name, feeCents: z.feeCents })),
  };
}

export type { OpeningHour };
