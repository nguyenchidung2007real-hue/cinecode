// src/lib/cinemaSettingsStore.ts
// -----------------------------------------------------------------------------
// Kho lưu trữ Cài đặt Vận hành Rạp & Kênh Phát Thông Báo Trực Tiếp đến Khách Hàng
// Hỗ trợ Admin thay đổi ngay lập tức banner, giá vé và thông báo trên trang khách
// -----------------------------------------------------------------------------

export interface CinemaAnnouncement {
  enabled: boolean;
  text: string;
  type: "promo" | "alert" | "event" | "maintenance";
  actionText: string;
  actionUrl: string;
  updatedAt: string;
}

export interface CinemaSettings {
  announcement: CinemaAnnouncement;
  ticketPricing: {
    standardPrice: number;
    vipPrice: number;
    couplePrice: number;
    studentDiscountPercent: number;
  };
  hotline: string;
  operatingCinemas: string;
  allowOnlineRefunds: boolean;
  emergencyAlert: string | null;
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_SETTINGS: CinemaSettings = {
  announcement: {
    enabled: true,
    text: "🔥 ƯU ĐÃI THÀNH VIÊN: Đồng giá vé 45k Thứ 4 hàng tuần & Miễn phụ thu ghế VIP cho học sinh - sinh viên!",
    type: "promo",
    actionText: "Xem Ưu Đãi",
    actionUrl: "#promo-section",
    updatedAt: new Date().toISOString(),
  },
  ticketPricing: {
    standardPrice: 55000,
    vipPrice: 75000,
    couplePrice: 130000,
    studentDiscountPercent: 20,
  },
  hotline: "1900 6017 (8:00 - 22:00)",
  operatingCinemas: "CineMax Bà Triệu & CineMax Landmark 81 & Beta Cinemas Xuân Thủy",
  allowOnlineRefunds: true,
  emergencyAlert: null,
  updatedAt: new Date().toISOString(),
  updatedBy: "Admin Hệ Thống",
};

// Singleton an toàn với Next.js HMR trong bộ nhớ
declare global {
  // eslint-disable-next-line no-var
  var __cinemaSettings: CinemaSettings | undefined;
}

function getSettingsStore(): CinemaSettings {
  if (!globalThis.__cinemaSettings) {
    globalThis.__cinemaSettings = { ...DEFAULT_SETTINGS };
  }
  return globalThis.__cinemaSettings;
}

export function getCinemaSettings(): CinemaSettings {
  return { ...getSettingsStore() };
}

export function updateCinemaSettings(
  patch: Partial<CinemaSettings>,
  actor: string = "Admin"
): CinemaSettings {
  const current = getSettingsStore();
  const next: CinemaSettings = {
    ...current,
    ...patch,
    announcement: patch.announcement ? { ...current.announcement, ...patch.announcement } : current.announcement,
    ticketPricing: patch.ticketPricing ? { ...current.ticketPricing, ...patch.ticketPricing } : current.ticketPricing,
    updatedAt: new Date().toISOString(),
    updatedBy: actor,
  };
  globalThis.__cinemaSettings = next;
  return { ...next };
}
