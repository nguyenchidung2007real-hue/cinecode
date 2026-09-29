"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Ticket,
  User,
  CreditCard,
  Gift,
  Sparkles,
  Clock,
  MapPin,
  QrCode,
  ArrowLeft,
  ChevronRight,
  Award,
  Calendar,
  Heart,
  Tag,
  Copy,
  CheckCircle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { MOCK_MOVIES } from "@/lib/mockData";

export default function CustomerDashboardPage() {
  const [activeTab, setActiveTab] = useState<"tickets" | "membership" | "vouchers" | "ai_recommendations">("tickets");
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<any | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("cinemax_tickets");
      if (stored) {
        const parsed = JSON.parse(stored);
        setTickets(parsed);
        if (parsed.length > 0) {
          setSelectedTicketForQr(parsed[0]);
        }
      }
    } catch (e) {
      console.error("Lỗi đọc vé:", e);
    }
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedVoucher(code);
    setTimeout(() => setCopiedVoucher(null), 2500);
  };

  const vouchers = [
    {
      code: "BETASV15",
      title: "Ưu Đãi Sinh Viên Cầu Giấy",
      discount: "Giảm 15.000đ / vé",
      condition: "Áp dụng cho HSSV ĐHQG, Sư Phạm, Báo Chí tại Beta Xuân Thủy",
      expiry: "30/10/2026",
      tag: "Sinh Viên",
    },
    {
      code: "BETACOMBO",
      title: "Thứ 3 Vui Vẻ - Tặng Bắp Ngọt",
      discount: "Tặng 1 Bắp 60oz",
      condition: "Khi đặt từ 2 vé xem phim bất kỳ vào thứ Ba hàng tuần",
      expiry: "31/12/2026",
      tag: "Happy Day",
    },
    {
      code: "CINEAI20",
      title: "Đặc Quyền AI CineBot",
      discount: "Giảm 20% Combo Bắp Nước",
      condition: "Khi đặt vé qua gợi ý tâm trạng từ CineBot AI",
      expiry: "15/11/2026",
      tag: "AI Special",
    },
  ];

  return (
    <div className="min-h-screen bg-[#07152E] text-neutral-100 flex flex-col font-sans">
      {/* Top Header Beta Cinemas */}
      <header className="border-b border-[#034EA2]/30 bg-[#0B2046]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors bg-[#07152E] px-2.5 py-1.5 rounded-lg border border-[#034EA2]/40 mr-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang Chủ</span>
            </Link>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#034EA2] to-[#00B2FF] flex items-center justify-center shadow-lg shadow-[#034EA2]/30">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-white">
                  <span className="text-[#00B2FF]">BETA</span> VÍ VÉ & THÀNH VIÊN
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-[#FF5722] text-white uppercase">
                  HITC
                </span>
              </div>
              <p className="text-[11px] text-slate-300">Thành viên thân thiết Beta Cinemas Xuân Thủy</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="text-xs px-3 py-1.5 rounded-lg bg-[#07152E] hover:bg-[#034EA2]/40 border border-[#034EA2]/50 text-slate-200 transition-colors font-medium"
            >
              Cổng Quản Trị Rạp
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6">
        {/* Banner Thẻ Thành Viên Beta Student Member */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0B2046] via-[#0D2857] to-[#081B3A] border border-[#034EA2]/40 p-6 shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00B2FF]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-[#FF5722] to-[#00B2FF] p-0.5 shadow-xl shadow-[#034EA2]/20">
                <div className="w-full h-full bg-[#0B2046] rounded-[14px] flex items-center justify-center text-2xl font-black text-amber-400">
                  <Award className="w-8 h-8 text-amber-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white">Khách Hàng Thân Thiết</h2>
                  <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    BETA STUDENT VIP
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Mã thẻ thành viên: <span className="font-mono text-white font-bold">BETA-HN-239</span> • Rạp thường xem:{" "}
                  <span className="text-[#00B2FF] font-semibold">Beta Cinemas Xuân Thủy (HITC Cầu Giấy)</span>
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
                  <div>
                    Điểm tích lũy: <strong className="text-amber-400 text-sm">320 Điểm</strong> (Đủ đổi 1 Combo Solo)
                  </div>
                  <div>•</div>
                  <div>
                    Vé đã xem: <strong className="text-white text-sm">{tickets.length} Vé</strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2.5 rounded-xl bg-[#07152E]/80 border border-[#034EA2]/40 text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Ưu Đãi Hiện Có</div>
                <div className="text-lg font-black text-[#00B2FF]">3 Mã Giảm Giá</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#034EA2]/30 gap-2 overflow-x-auto pb-px">
          {[
            { id: "tickets", label: `Ví Vé Của Tôi (${tickets.length})`, icon: Ticket },
            { id: "vouchers", label: "Voucher & Mã Giảm Giá", icon: Tag },
            { id: "membership", label: "Đặc Quyền Thành Viên", icon: CreditCard },
            { id: "ai_recommendations", label: "Gu Phim & Gợi Ý AI", icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                  active
                    ? "border-[#00B2FF] text-[#00B2FF] bg-[#034EA2]/20"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: VÍ VÉ CỦA TÔI */}
        {activeTab === "tickets" && (
          <div>
            {tickets.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-[#0B2046]/40 border border-[#034EA2]/30 max-w-lg mx-auto shadow-xl">
                <div className="w-16 h-16 rounded-full bg-[#034EA2]/20 border border-[#00B2FF]/30 flex items-center justify-center mx-auto mb-4 text-[#00B2FF]">
                  <Ticket className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-base text-white">Bạn chưa có vé nào trong ví</h3>
                <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                  Hãy chọn một bộ phim yêu thích tại rạp Beta Xuân Thủy và trải nghiệm quy trình đặt vé nhanh chóng!
                </p>
                <Link
                  href="/"
                  className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#034EA2] to-[#00B2FF] text-white text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-[#034EA2]/30"
                >
                  <span>Đặt Vé Ngay Bây Giờ</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Danh sách thẻ vé */}
                <div className="lg:col-span-2 space-y-4">
                  {tickets.map((ticket, index) => {
                    const isSelected = selectedTicketForQr?.bookingCode === ticket.bookingCode;
                    return (
                      <div
                        key={ticket.bookingCode || ticket.bookingId || index}
                        onClick={() => setSelectedTicketForQr(ticket)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                          isSelected
                            ? "bg-[#0B2046]/80 border-[#00B2FF] shadow-lg shadow-[#034EA2]/40"
                            : "bg-[#0B2046]/30 border-[#034EA2]/30 hover:border-[#00B2FF]/50"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={ticket.posterPath || MOCK_MOVIES[0].posterPath}
                            alt={ticket.movieTitle}
                            className="w-14 h-20 object-cover rounded-xl shrink-0 shadow-md border border-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Đã Thanh Toán
                              </span>
                              <span className="text-xs text-slate-400 font-mono">#{ticket.bookingCode || ticket.bookingId}</span>
                            </div>
                            <h4 className="font-bold text-base text-white">{ticket.movieTitle}</h4>
                            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-1">
                              <MapPin className="w-3.5 h-3.5 text-[#FF5722]" />
                              <span>{ticket.cinemaName || "Beta Cinemas Xuân Thủy"}</span>
                            </p>
                            <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              <span>Suất: <strong>{ticket.showTime}</strong> ({ticket.showDate}) • {ticket.roomName || "Phòng Beta"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#034EA2]/30">
                          <div className="text-xs text-slate-400">Ghế ngồi:</div>
                          <div className="text-base font-black text-amber-400">{ticket.seats?.join(", ")}</div>
                          <div className="text-xs font-bold text-white mt-1">{formatVND(ticket.totalAmount)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Khung Mã QR Chi Tiết Check-in Cổng Rạp */}
                {selectedTicketForQr && (
                  <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0B2046] to-[#07152E] border border-[#034EA2]/50 text-center flex flex-col items-center justify-center sticky top-24 shadow-2xl">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00B2FF] px-2.5 py-1 rounded-full bg-[#034EA2]/40 border border-[#00B2FF]/40 mb-3">
                      MÃ QR CHECK-IN TẠI BETA XUÂN THỦY
                    </span>
                    <h3 className="font-bold text-base text-white mb-1">{selectedTicketForQr.movieTitle}</h3>
                    <p className="text-xs text-slate-300 mb-4">
                      {selectedTicketForQr.cinemaName || "Beta Cinemas Xuân Thủy"} • {selectedTicketForQr.roomName || "Phòng Beta"}
                    </p>

                    <div className="p-3 bg-white rounded-2xl shadow-xl mb-4 border border-[#00B2FF]/30">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                          `CINEMAX-CHECKIN|${selectedTicketForQr.bookingCode || selectedTicketForQr.bookingId}|${selectedTicketForQr.movieTitle}|${selectedTicketForQr.seats?.join(",")}`
                        )}`}
                        alt="QR Code"
                        className="w-40 h-40"
                      />
                    </div>

                    <div className="text-xs text-slate-300 font-mono mb-2">
                      Mã vé: <strong className="text-white text-sm">{selectedTicketForQr.bookingCode || selectedTicketForQr.bookingId}</strong>
                    </div>
                    <div className="text-xs text-amber-400 font-bold mb-4">
                      Vị trí ghế: {selectedTicketForQr.seats?.join(", ")}
                    </div>

                    <div className="text-[11px] text-slate-300 leading-relaxed bg-[#07152E] p-3 rounded-xl border border-[#034EA2]/40 w-full">
                      💡 Xuất trình mã này cho nhân viên soát vé tại <strong>Tầng 4 Tòa nhà HITC 239 Xuân Thủy</strong> để vào phòng chiếu.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: VOUCHER & ƯU ĐÃI BETA */}
        {activeTab === "vouchers" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vouchers.map((voucher) => (
              <div key={voucher.code} className="p-5 rounded-2xl bg-[#0B2046]/40 border border-[#034EA2]/30 flex flex-col justify-between shadow-lg hover:border-[#00B2FF]/50 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#034EA2]/40 text-[#00B2FF] border border-[#00B2FF]/30">
                      {voucher.tag}
                    </span>
                    <span className="text-[11px] text-slate-400">HSD: {voucher.expiry}</span>
                  </div>
                  <h4 className="font-bold text-base text-white mb-1">{voucher.title}</h4>
                  <div className="text-lg font-black text-amber-400 mb-2">{voucher.discount}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{voucher.condition}</p>
                </div>

                <div className="mt-5 pt-4 border-t border-[#034EA2]/30 flex items-center justify-between">
                  <div className="font-mono text-xs font-bold text-white bg-[#07152E] px-2.5 py-1 rounded border border-[#034EA2]/40">
                    {voucher.code}
                  </div>
                  <button
                    onClick={() => handleCopyCode(voucher.code)}
                    className="flex items-center gap-1.5 text-xs text-slate-200 hover:text-white px-3 py-1 rounded-lg bg-[#034EA2]/30 hover:bg-[#034EA2]/60 border border-[#00B2FF]/30 transition-colors"
                  >
                    {copiedVoucher === voucher.code ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Đã chép</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Sao chép</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: ĐẶC QUYỀN THÀNH VIÊN */}
        {activeTab === "membership" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#0B2046]/40 border border-[#034EA2]/30 space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Quyền Lợi Hạng Thẻ Beta Student VIP</span>
              </h3>
              <ul className="space-y-3 text-xs text-slate-200 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Mua vé xem phim với giá đồng giá sinh viên <strong>55.000đ</strong> tất cả các ngày trong tuần.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Tích lũy <strong>10% điểm thưởng</strong> trên mỗi giao dịch đặt vé và mua combo bắp nước 68k.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Tặng 01 vé xem phim 2D miễn phí vào tuần sinh nhật của bạn.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>Ưu tiên giữ chỗ ghế VIP và Sweetbox tại cụm rạp Beta Xuân Thủy.</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#0B2046]/40 border border-[#034EA2]/30 space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#FF5722]" />
                <span>Thông Tin Cụm Rạp Beta Xuân Thủy</span>
              </h3>
              <div className="space-y-2 text-xs text-slate-200 leading-relaxed">
                <p><strong>Địa chỉ:</strong> Tầng 4, Tòa nhà HITC, 239 Xuân Thủy, P. Dịch Vọng Hậu, Q. Cầu Giấy, Hà Nội.</p>
                <p><strong>Giờ mở cửa:</strong> 08:30 - 23:30 (Tất cả các ngày trong tuần bao gồm Lễ Tết).</p>
                <p><strong>Tiện ích rạp:</strong> 3 phòng chiếu chuẩn quốc tế, âm thanh Dolby 7.1 sống động, bãi đỗ xe máy & ô tô rộng rãi tại tầng hầm HITC.</p>
                <p><strong>Hotline CSKH:</strong> 1900 636 807 (Hỗ trợ 24/7)</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GU PHIM & GỢI Ý AI */}
        {activeTab === "ai_recommendations" && (
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-gradient-to-r from-[#034EA2]/30 via-[#0B2046] to-[#0B2046] border border-[#00B2FF]/40 flex items-start gap-4 shadow-xl">
              <div className="p-2.5 rounded-xl bg-[#034EA2]/40 text-[#00B2FF] shrink-0 border border-[#00B2FF]/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Phân Tích Gu Phim Cá Nhân Từ CineBot AI</h4>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  Dựa trên các cuộc trò chuyện và lịch sử xem phim của bạn tại Beta Xuân Thủy, AI nhận thấy bạn rất hứng thú với các thể loại <strong>Khoa học viễn tưởng hùng vĩ</strong>, <strong>Tâm lý giật gân sâu sắc</strong> và <strong>Hoạt hình chữa lành cảm xúc</strong>.
                </p>
              </div>
            </div>

            <h3 className="font-bold text-base text-white mt-6">Phim Đề Xuất Dành Riêng Cho Bạn Hôm Nay:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {MOCK_MOVIES.slice(0, 3).map((movie) => (
                <div key={movie.id} className="p-4 rounded-xl bg-[#0B2046]/40 border border-[#034EA2]/30 flex flex-col justify-between hover:border-[#00B2FF]/50 transition-all">
                  <div className="flex gap-3">
                    <img src={movie.posterPath} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shrink-0 border border-white/10" />
                    <div>
                      <h4 className="font-bold text-sm text-white">{movie.title}</h4>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{movie.overview}</p>
                      <div className="mt-2 text-xs text-amber-400 font-bold">★ {movie.voteAverage} IMDb</div>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="mt-4 w-full py-2 text-center rounded-lg bg-gradient-to-r from-[#034EA2] to-[#00B2FF] text-white text-xs font-bold hover:brightness-110 transition-all shadow-md shadow-[#034EA2]/30"
                  >
                    Xem Suất Chiếu Tại Beta Xuân Thủy
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
