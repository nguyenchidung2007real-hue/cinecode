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
  LogOut,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { formatVND } from "@/lib/utils";
import { MOCK_MOVIES } from "@/lib/mockData";

interface CustomerSession {
  phone: string;
  name: string;
}

export default function CustomerDashboardPage() {
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [loginPhone, setLoginPhone] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isInitializing, setIsInitializing] = useState(true);

  const [activeTab, setActiveTab] = useState<"tickets" | "membership" | "vouchers" | "ai_recommendations">("tickets");
  const [allTickets, setAllTickets] = useState<any[]>([]);
  const [selectedTicketForQr, setSelectedTicketForQr] = useState<any | null>(null);
  const [copiedVoucher, setCopiedVoucher] = useState<string | null>(null);

  // Khởi tạo phiên khách hàng từ LocalStorage
  useEffect(() => {
    try {
      const storedPhone = localStorage.getItem("cinemax_customer_phone");
      const storedName = localStorage.getItem("cinemax_customer_name");

      if (storedPhone) {
        setCustomer({
          phone: storedPhone,
          name: storedName || "Khách Hàng Beta",
        });
      }

      const storedTickets = localStorage.getItem("cinemax_tickets");
      if (storedTickets) {
        const parsed = JSON.parse(storedTickets);
        setAllTickets(parsed);
      }
    } catch (e) {
      console.error("Lỗi đọc dữ liệu khách hàng:", e);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Lọc vé theo số điện thoại khách hàng hiện tại
  const customerTickets = React.useMemo(() => {
    if (!customer?.phone) return [];
    const cleanPhone = customer.phone.replace(/[\s.\-()]/g, "");
    const filtered = allTickets.filter((t) => {
      if (!t.customerPhone) return true; // Cho phép hiển thị vé demo chưa gắn sđt
      const tPhone = String(t.customerPhone).replace(/[\s.\-()]/g, "");
      return tPhone.endsWith(cleanPhone.slice(-9)) || cleanPhone.endsWith(tPhone.slice(-9));
    });
    return filtered.length > 0 ? filtered : allTickets; // Fallback hiển thị vé nếu vừa mua
  }, [customer, allTickets]);

  useEffect(() => {
    if (customerTickets.length > 0 && !selectedTicketForQr) {
      setSelectedTicketForQr(customerTickets[0]);
    }
  }, [customerTickets, selectedTicketForQr]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const clean = loginPhone.trim().replace(/[\s.\-()]/g, "");
    if (!clean) {
      setLoginError("Vui lòng nhập Số điện thoại của bạn.");
      return;
    }

    const phoneRegex = /^(?:\+84|84|0)\d{9,10}$/;
    if (!phoneRegex.test(clean)) {
      setLoginError("Số điện thoại không hợp lệ. Vui lòng nhập định dạng 10 chữ số (VD: 0912345678).");
      return;
    }

    const displayName = loginName.trim() || "Khách Hàng Beta";
    const session: CustomerSession = { phone: clean, name: displayName };

    try {
      localStorage.setItem("cinemax_customer_phone", clean);
      localStorage.setItem("cinemax_customer_name", displayName);
      setCustomer(session);
      setLoginError("");
    } catch (err) {
      setLoginError("Không thể lưu phiên đăng nhập. Vui lòng kiểm tra cài đặt trình duyệt.");
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("cinemax_customer_phone");
      localStorage.removeItem("cinemax_customer_name");
      setCustomer(null);
      setLoginPhone("");
      setLoginName("");
      setSelectedTicketForQr(null);
    } catch (err) {
      console.error("Lỗi đăng xuất:", err);
    }
  };

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

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Đang tải thông tin thành viên...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Header Beta Cinemas */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-sky-600 transition-colors bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-200 mr-2 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trang Chủ</span>
            </Link>
            <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center shadow-md shadow-sky-600/20">
              <Ticket className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-sm tracking-wide text-slate-900">
                  <span className="text-sky-600">BETA</span> VÍ VÉ & THÀNH VIÊN
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-black bg-sky-100 text-sky-700 uppercase border border-sky-200">
                  HITC
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Thành viên thân thiết Beta Cinemas Xuân Thủy</p>
            </div>
          </div>

          {/* Phần điều khiển phiên khách hàng */}
          {customer ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900">{customer.name}</span>
                <span className="text-[10px] font-mono text-sky-600">{customer.phone}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 transition-colors font-medium"
                title="Đăng xuất khỏi ví vé"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400">
              Chưa đăng nhập
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col gap-6">
        
        {/* Trường hợp 1: Chưa đăng nhập -> Hiện Form nhập Số Điện Thoại & Tên */}
        {!customer ? (
          <div className="max-w-md w-full mx-auto my-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-600 p-0.5 shadow-lg shadow-sky-600/20 mx-auto mb-5 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>

            <h2 className="text-xl font-black text-center text-slate-900">Đăng Nhập Thành Viên</h2>
            <p className="text-xs text-slate-500 text-center mt-1.5 leading-relaxed">
              Vui lòng nhập Số điện thoại để mở ví vé đã đặt, kiểm tra quyền lợi Beta Student VIP và điểm thưởng tích lũy.
            </p>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Số điện thoại đặt vé <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    placeholder="Ví dụ: 0912 345 678"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Họ và tên thành viên <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-sky-500 text-slate-900 text-sm outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-md shadow-sky-600/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Xác Nhận & Mở Ví Vé</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-200 text-center">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                💡 Hệ thống đồng bộ thông minh theo Số điện thoại bạn đã sử dụng khi mua vé. Không yêu cầu mật khẩu phức tạp!
              </p>
            </div>
          </div>
        ) : (
          /* Trường hợp 2: Đã đăng nhập -> Hiển thị trọn vẹn thông tin thẻ thành viên & ví vé */
          <>
            {/* Banner Thẻ Thành Viên Beta Student Member */}
            <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center text-2xl font-black text-sky-600 shrink-0">
                    <Award className="w-8 h-8 text-sky-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{customer.name}</h2>
                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-700 border border-sky-200">
                        BETA STUDENT VIP
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Mã thẻ: <span className="font-mono text-slate-900 font-bold">BETA-{customer.phone.slice(-4) || "HITC"}</span> • SĐT:{" "}
                      <span className="text-sky-600 font-mono font-semibold">{customer.phone}</span> • Rạp thường xem:{" "}
                      <span className="text-slate-800 font-semibold">Beta Cinemas Xuân Thủy (HITC Cầu Giấy)</span>
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                      <div>
                        Điểm tích lũy: <strong className="text-sky-600 text-sm">{120 + customerTickets.length * 50} Điểm</strong>
                      </div>
                      <div>•</div>
                      <div>
                        Vé đã đặt: <strong className="text-slate-900 text-sm">{customerTickets.length} Vé</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Ưu Đãi Hiện Có</div>
                    <div className="text-lg font-black text-sky-600">3 Mã Giảm Giá</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px bg-white px-2 rounded-xl">
              {[
                { id: "tickets", label: `Ví Vé Của Tôi (${customerTickets.length})`, icon: Ticket },
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
                        ? "border-sky-600 text-sky-600 bg-sky-50"
                        : "border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
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
                {customerTickets.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 max-w-lg mx-auto shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto mb-4 text-sky-600">
                      <Ticket className="w-8 h-8" />
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Bạn chưa có vé nào trong ví</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Hãy chọn một bộ phim yêu thích tại rạp Beta Xuân Thủy và trải nghiệm quy trình đặt vé nhanh chóng!
                    </p>
                    <Link
                      href="/"
                      className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
                    >
                      <span>Đặt Vé Ngay Bây Giờ</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Danh sách thẻ vé */}
                    <div className="lg:col-span-2 space-y-4">
                      {customerTickets.map((ticket, index) => {
                        const isSelected = selectedTicketForQr?.bookingCode === ticket.bookingCode;
                        return (
                          <div
                            key={ticket.bookingCode || ticket.bookingId || index}
                            onClick={() => setSelectedTicketForQr(ticket)}
                            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                              isSelected
                                ? "bg-white border-sky-500 shadow-md ring-2 ring-sky-200"
                                : "bg-white border-slate-200 hover:border-slate-300 shadow-sm"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={ticket.posterPath || MOCK_MOVIES[0].posterPath}
                                alt={ticket.movieTitle}
                                className="w-14 h-20 object-cover rounded-xl shrink-0 shadow-sm border border-slate-200"
                              />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Đã Thanh Toán
                                  </span>
                                  <span className="text-xs text-slate-400 font-mono">#{ticket.bookingCode || ticket.bookingId}</span>
                                </div>
                                <h4 className="font-bold text-base text-slate-900">{ticket.movieTitle}</h4>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                                  <span>{ticket.cinemaName || "Beta Cinemas Xuân Thủy"}</span>
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Suất: <strong>{ticket.showTime}</strong> ({ticket.showDate}) • {ticket.roomName || "Phòng Beta"}</span>
                                </p>
                              </div>
                            </div>

                            <div className="sm:text-right w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                              <div className="text-xs text-slate-500">Ghế ngồi:</div>
                              <div className="text-base font-black text-sky-600">{ticket.seats?.join(", ")}</div>
                              <div className="text-xs font-bold text-slate-900 mt-1">{formatVND(ticket.totalAmount)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Khung Mã QR Chi Tiết Check-in Cổng Rạp */}
                    {selectedTicketForQr && (
                      <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center justify-center sticky top-24 shadow-sm">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-sky-700 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 mb-3">
                          MÃ QR CHECK-IN TẠI BETA XUÂN THỦY
                        </span>
                        <h3 className="font-bold text-base text-slate-900 mb-1">{selectedTicketForQr.movieTitle}</h3>
                        <p className="text-xs text-slate-500 mb-4">
                          {selectedTicketForQr.cinemaName || "Beta Cinemas Xuân Thủy"} • {selectedTicketForQr.roomName || "Phòng Beta"}
                        </p>

                        <div className="p-3 bg-white rounded-2xl shadow-sm mb-4 border border-slate-200">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                              `CINEMAX-CHECKIN|${selectedTicketForQr.bookingCode || selectedTicketForQr.bookingId}|${selectedTicketForQr.movieTitle}|${selectedTicketForQr.seats?.join(",")}`
                            )}`}
                            alt="QR Code"
                            className="w-40 h-40"
                          />
                        </div>

                        <div className="text-xs text-slate-600 font-mono mb-2">
                          Mã vé: <strong className="text-slate-900 text-sm">{selectedTicketForQr.bookingCode || selectedTicketForQr.bookingId}</strong>
                        </div>
                        <div className="text-xs text-sky-600 font-bold mb-4">
                          Vị trí ghế: {selectedTicketForQr.seats?.join(", ")}
                        </div>

                        <div className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 w-full">
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
                  <div key={voucher.code} className="p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm hover:border-sky-300 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          {voucher.tag}
                        </span>
                        <span className="text-[11px] text-slate-400">HSD: {voucher.expiry}</span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900 mb-1">{voucher.title}</h4>
                      <div className="text-lg font-black text-sky-600 mb-2">{voucher.discount}</div>
                      <p className="text-xs text-slate-500 leading-relaxed">{voucher.condition}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                        {voucher.code}
                      </div>
                      <button
                        onClick={() => handleCopyCode(voucher.code)}
                        className="flex items-center gap-1.5 text-xs text-slate-700 hover:text-sky-700 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors font-medium"
                      >
                        {copiedVoucher === voucher.code ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Đã chép</span>
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
                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-sky-600" />
                    <span>Quyền Lợi Hạng Thẻ Beta Student VIP</span>
                  </h3>
                  <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">✓</span>
                      <span>Mua vé xem phim với giá đồng giá sinh viên <strong>55.000đ</strong> tất cả các ngày trong tuần.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">✓</span>
                      <span>Tích lũy <strong>10% điểm thưởng</strong> trên mỗi giao dịch đặt vé và mua combo bắp nước 68k.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">✓</span>
                      <span>Tặng 01 vé xem phim 2D miễn phí vào tuần sinh nhật của bạn.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sky-600 font-bold">✓</span>
                      <span>Ưu tiên giữ chỗ ghế VIP và Sweetbox tại cụm rạp Beta Xuân Thủy.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-sky-600" />
                    <span>Thông Tin Cụm Rạp Beta Xuân Thủy</span>
                  </h3>
                  <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
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
                <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-4 shadow-sm">
                  <div className="p-2.5 rounded-xl bg-white text-sky-600 shrink-0 border border-sky-200 shadow-sm">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Phân Tích Gu Phim Cá Nhân Từ CineBot AI</h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      Dựa trên các cuộc trò chuyện và lịch sử xem phim của bạn tại Beta Xuân Thủy, AI nhận thấy bạn rất hứng thú với các thể loại <strong>Khoa học viễn tưởng hùng vĩ</strong>, <strong>Tâm lý giật gân sâu sắc</strong> và <strong>Hoạt hình chữa lành cảm xúc</strong>.
                    </p>
                  </div>
                </div>

                <h3 className="font-bold text-base text-slate-900 mt-6">Phim Đề Xuất Dành Riêng Cho Bạn Hôm Nay:</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {MOCK_MOVIES.slice(0, 3).map((movie) => (
                    <div key={movie.id} className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between hover:border-sky-300 transition-all shadow-sm">
                      <div className="flex gap-3">
                        <img src={movie.posterPath} alt={movie.title} className="w-16 h-24 object-cover rounded-lg shrink-0 border border-slate-200" />
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{movie.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{movie.overview}</p>
                          <div className="mt-2 text-xs text-sky-600 font-bold">★ {movie.voteAverage} IMDb</div>
                        </div>
                      </div>
                      <Link
                        href="/"
                        className="mt-4 w-full py-2 text-center rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Xem Suất Chiếu Tại Beta Xuân Thủy
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
