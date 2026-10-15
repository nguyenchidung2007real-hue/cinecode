"use client";

import React from "react";
import { Film, Glasses, Building2, PhoneCall, Megaphone, FileText, Ticket } from "lucide-react";

interface CgvQuickIconBarProps {
  onScrollToSection?: (sectionId: string) => void;
}

export const CgvQuickIconBar: React.FC<CgvQuickIconBarProps> = ({ onScrollToSection }) => {
  const items = [
    {
      id: "cinemas",
      icon: Building2,
      enTitle: "CINEMAX CINEMAS",
      vnTitle: "RẠP CINEMAX",
      badgeColor: "bg-[#e71a0f]",
      action: () => {
        const el = document.getElementById("matrix-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "now-showing",
      icon: Film,
      enTitle: "NOW SHOWING",
      vnTitle: "PHIM ĐANG CHIẾU",
      badgeColor: "bg-neutral-800",
      action: () => {
        const el = document.getElementById("commercial-tabs");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "special",
      icon: Glasses,
      enTitle: "CINEMAX SPECIAL",
      vnTitle: "RẠP ĐẶC BIỆT",
      badgeColor: "bg-[#e71a0f]",
      action: () => {
        const el = document.getElementById("special-cinema-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "rental",
      icon: Ticket,
      enTitle: "HALL RENTAL & GROUP SALE",
      vnTitle: "THUÊ RẠP & VÉ NHÓM",
      badgeColor: "bg-neutral-800",
      action: () => {
        const el = document.getElementById("price-table");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "contact",
      icon: PhoneCall,
      enTitle: "CONTACT CINEMAX",
      vnTitle: "LIÊN HỆ CINEMAX",
      badgeColor: "bg-[#e71a0f]",
      action: () => {
        window.location.href = "tel:19006017";
      },
    },
    {
      id: "news",
      icon: Megaphone,
      enTitle: "NEWS & OFFERS",
      vnTitle: "TIN MỚI & ƯU ĐÃI",
      badgeColor: "bg-neutral-800",
      action: () => {
        const el = document.getElementById("promo-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      },
    },
    {
      id: "register",
      icon: FileText,
      enTitle: "REGISTER NOW",
      vnTitle: "ĐĂNG KÝ THÀNH VIÊN",
      badgeColor: "bg-[#e71a0f]",
      action: () => {
        window.location.href = "/dashboard";
      },
    },
  ];

  return (
    <div className="w-full bg-[#fdfcf0] border-t-2 border-b border-[#e5e0d8] shadow-sm select-none">
      <div className="max-w-[1040px] mx-auto px-2 sm:px-4">
        <div className="grid grid-cols-4 sm:grid-cols-7 divide-x divide-[#e8e4d8] py-2.5">
          {items.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className="group flex flex-col items-center justify-center px-1 sm:px-2 py-1.5 transition-all hover:bg-white/60 rounded-xl cursor-pointer"
              >
                {/* Icon Họa Tiết Vintage */}
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border border-[#e5e0d8] group-hover:border-[#e71a0f] flex items-center justify-center text-neutral-700 group-hover:text-[#e71a0f] shadow-sm group-hover:shadow-md transition-all duration-300 transform group-hover:scale-110">
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>

                {/* Tiêu đề tiếng Anh & tiếng Việt */}
                <div className="mt-1.5 text-center leading-tight">
                  <span className="block text-[8px] sm:text-[9px] font-black uppercase tracking-tight text-neutral-800 group-hover:text-[#e71a0f] transition-colors truncate max-w-[85px] sm:max-w-none">
                    {item.enTitle}
                  </span>
                  <span className="block text-[9px] sm:text-[10px] font-bold text-neutral-500 group-hover:text-neutral-900 transition-colors truncate max-w-[85px] sm:max-w-none mt-0.5">
                    {item.vnTitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
