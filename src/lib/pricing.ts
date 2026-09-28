import { seatTier, type SeatTier } from "@/lib/seatLayout";
import type { PopcornFlavor, DrinkType, DrinkSize, SelectedComboItem } from "@/types";

/**
 * CineMax AI - Bộ tính giá phía server (nguồn sự thật DUY NHẤT về tiền).
 *
 * Khớp 100% với bảng giá trong BookingModal.tsx và mockData.ts:
 * - Ghế thường (Standard): 55.000đ
 * - Ghế VIP: 75.000đ (+20.000đ)
 * - Ghế đôi (Couple Sweetbox): 130.000đ (+75.000đ)
 *
 * Nguyên tắc: client chỉ gửi ĐỊNH DANH (id combo, số lượng, vị bắp, loại và cỡ nước). Mọi đơn giá đều tra ở đây.
 * Tiền là số nguyên VND, không dùng số thực để tránh sai số.
 */

export const CURRENCY = "VND";

const BASE_TICKET_PRICE = 55_000;
const VIP_SURCHARGE = 20_000;
const COUPLE_SURCHARGE = 75_000;

interface CatalogItem {
  readonly name: string;
  readonly basePrice: number;
  readonly maxQuantity: number;
  readonly popcornSlots: number; // số vị bắp tối đa được chọn cho MỖI phần
  readonly drinkSlots: number; // số ly nước tối đa cho MỖI phần
}

export const CONCESSION_CATALOG: Readonly<Record<string, CatalogItem>> = {
  "combo-beta-solo": {
    name: "Combo Beta Solo (1 Bắp + 1 Nước)",
    basePrice: 59_000,
    maxQuantity: 10,
    popcornSlots: 1,
    drinkSlots: 1,
  },
  "combo-beta-couple": {
    name: "Combo Beta Couple Đôi Bạn (Bắp 2 Ngăn + 2 Nước)",
    basePrice: 89_000,
    maxQuantity: 10,
    popcornSlots: 2,
    drinkSlots: 2,
  },
  "combo-beta-party": {
    name: "Combo Beta Party Sinh Viên (2 Bắp + 3 Nước)",
    basePrice: 129_000,
    maxQuantity: 10,
    popcornSlots: 2,
    drinkSlots: 3,
  },
  // Hỗ trợ alias tên rút gọn nếu client cũ gửi
  "combo-solo": {
    name: "Combo Beta Solo (1 Bắp + 1 Nước)",
    basePrice: 59_000,
    maxQuantity: 10,
    popcornSlots: 1,
    drinkSlots: 1,
  },
  "combo-couple": {
    name: "Combo Beta Couple Đôi Bạn (Bắp 2 Ngăn + 2 Nước)",
    basePrice: 89_000,
    maxQuantity: 10,
    popcornSlots: 2,
    drinkSlots: 2,
  },
};

const POPCORN_FLAVOR_EXTRA: Readonly<Record<PopcornFlavor, number>> = {
  sweet: 0,
  salted: 0,
  caramel: 10_000,
  cheese: 10_000,
};

const DRINK_TYPE_EXTRA: Readonly<Record<DrinkType, number>> = {
  pepsi: 0,
  "7up": 0,
  mirinda: 0,
  peach_tea: 5_000,
};

const DRINK_SIZE_EXTRA: Readonly<Record<DrinkSize, number>> = {
  regular: 0,
  large: 12_000,
};

const MAX_CONCESSION_LINES = 10;

export interface PricedConcession extends SelectedComboItem {}

export interface TicketLine {
  seat: string;
  tier: SeatTier;
  price: number;
}

export interface PriceBreakdown {
  currency: typeof CURRENCY;
  ticketLines: TicketLine[];
  ticketsSubtotal: number;
  concessions: PricedConcession[];
  concessionsSubtotal: number;
  total: number;
}

export type PriceResult = { ok: true; price: PriceBreakdown } | { ok: false; error: string };

export interface PriceInput {
  format?: string;
  date?: string; // YYYY-MM-DD
  seats: readonly string[];
  concessions: unknown; // dữ liệu thô từ client, được kiểm tra chặt ở đây
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function priceConcessions(raw: unknown): { ok: true; lines: PricedConcession[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, lines: [] };
  if (!Array.isArray(raw)) return { ok: false, error: "Danh sách combo không hợp lệ." };
  if (raw.length > MAX_CONCESSION_LINES) return { ok: false, error: "Quá nhiều dòng combo." };

  const lines: PricedConcession[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) return { ok: false, error: "Dòng combo không hợp lệ." };

    const id = typeof entry.id === "string" ? entry.id : "";
    const item = Object.prototype.hasOwnProperty.call(CONCESSION_CATALOG, id) ? CONCESSION_CATALOG[id] : undefined;
    if (!item) return { ok: false, error: `Combo không tồn tại: ${id.slice(0, 40)}` };

    const quantity = Number(entry.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > item.maxQuantity) {
      return { ok: false, error: `Số lượng không hợp lệ cho ${item.name}.` };
    }

    const flavorsRaw = entry.popcornFlavors ?? [];
    const drinksRaw = entry.drinks ?? [];
    if (!Array.isArray(flavorsRaw) || !Array.isArray(drinksRaw)) {
      return { ok: false, error: `Tuỳ chọn của ${item.name} không hợp lệ.` };
    }
    if (flavorsRaw.length > item.popcornSlots || drinksRaw.length > item.drinkSlots) {
      return { ok: false, error: `Vượt số lượng tuỳ chọn cho phép của ${item.name}.` };
    }

    let extraPerUnit = 0;
    const popcornFlavors: PopcornFlavor[] = [];
    for (const flavor of flavorsRaw) {
      if (typeof flavor !== "string" || !Object.prototype.hasOwnProperty.call(POPCORN_FLAVOR_EXTRA, flavor)) {
        return { ok: false, error: "Vị bắp không hợp lệ." };
      }
      const typedFlavor = flavor as PopcornFlavor;
      popcornFlavors.push(typedFlavor);
      extraPerUnit += POPCORN_FLAVOR_EXTRA[typedFlavor];
    }

    const drinks: Array<{ type: DrinkType; size: DrinkSize }> = [];
    for (const drink of drinksRaw) {
      if (!isRecord(drink)) return { ok: false, error: "Thức uống không hợp lệ." };
      const type = typeof drink.type === "string" ? drink.type : "";
      const size = typeof drink.size === "string" ? drink.size : "";
      if (
        !Object.prototype.hasOwnProperty.call(DRINK_TYPE_EXTRA, type) ||
        !Object.prototype.hasOwnProperty.call(DRINK_SIZE_EXTRA, size)
      ) {
        return { ok: false, error: "Loại hoặc cỡ nước không hợp lệ." };
      }
      const typedDrink = { type: type as DrinkType, size: size as DrinkSize };
      drinks.push(typedDrink);
      extraPerUnit += DRINK_TYPE_EXTRA[typedDrink.type] + DRINK_SIZE_EXTRA[typedDrink.size];
    }

    lines.push({
      id,
      name: item.name,
      quantity,
      basePrice: item.basePrice,
      popcornFlavors,
      drinks,
      extraPrice: extraPerUnit,
      totalPrice: (item.basePrice + extraPerUnit) * quantity,
    });
  }
  return { ok: true, lines };
}

export function calculatePrice(input: PriceInput): PriceResult {
  const unit = BASE_TICKET_PRICE;

  const ticketLines: TicketLine[] = input.seats.map((seat) => {
    const tier = seatTier(seat);
    const surcharge = tier === "vip" ? VIP_SURCHARGE : tier === "couple" ? COUPLE_SURCHARGE : 0;
    return { seat, tier, price: unit + surcharge };
  });
  const ticketsSubtotal = ticketLines.reduce((sum, line) => sum + line.price, 0);

  const concessionResult = priceConcessions(input.concessions);
  if (!concessionResult.ok) return concessionResult;
  const concessionsSubtotal = concessionResult.lines.reduce((sum, line) => sum + line.totalPrice, 0);

  return {
    ok: true,
    price: {
      currency: CURRENCY,
      ticketLines,
      ticketsSubtotal,
      concessions: concessionResult.lines,
      concessionsSubtotal,
      total: ticketsSubtotal + concessionsSubtotal,
    },
  };
}
