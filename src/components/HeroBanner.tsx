"use client";

import React, { useState, useEffect } from "react";
import { Movie } from "@/types";
import { ChevronLeft, ChevronRight, Play, Ticket } from "lucide-react";

interface HeroBannerProps {
  movie?: Movie;
  movies?: Movie[];
  onWatchTrailer: (movie: Movie) => void;
  onBookTicket: (movie: Movie) => void;
  isHalloween?: boolean;
}

interface DesignedBanner {
  id: string;
  movieId: string;
  movieTitle: string;
  tagline: string;
  releaseNote: string;
  badge: string;
  formatTag: string;
  bgImage: string;
  posterImage: string;
  accentColor: string;
  ageRating: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  movie,
  movies = [],
  onWatchTrailer,
  onBookTicket,
  isHalloween = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Danh mục Banner ngang Key Visual nghệ thuật điện ảnh tràn viền Cinematic
  const designedBanners: DesignedBanner[] = [
    ...(isHalloween
      ? [
          {
            id: "b-exhuma-halloween",
            movieId: "exhuma",
            movieTitle: "QUẬT MỘ TRÙNG MA (EXHUMA)",
            tagline: "ĐÊM KINH HOÀNG HALLOWEEN • SIÊU PHẨM KINH DỊ TÂM LINH",
            releaseNote:
              "Bộ đôi pháp sư trẻ khai quật một ngôi mộ bí ẩn tại vùng hẻo lánh, vô tình giải phóng thế lực tà ác đáng sợ. Thưởng thức âm thanh Dolby Atmos rùng rợn sống động.",
            badge: "🎃 ĐỀ XUẤT HALLOWEEN",
            formatTag: "2D Phụ Đề • Dolby 7.1",
            bgImage: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
            posterImage: "/images/posters/exhuma.jpg",
            accentColor: "#FF7518",
            ageRating: "T18",
          },
        ]
      : []),
    {
      id: "b-conan",
      movieId: "conan-movie-27",
      movieTitle: "CONAN: NGÔI SAO 5 CÁNH 1 TRIỆU ĐÔ",
      tagline: "SIÊU ĐẠO CHÍCH KID ĐỐI ĐẦU CONAN & HEIJI HATTORI",
      releaseNote: "Cuộc đối đầu kịch tính tại Hakodate tìm kiếm thanh kiếm báu giấu kín bí mật thế kỷ. Trải nghiệm đỉnh cao với định dạng sắc nét và âm thanh sống động.",
      badge: "ANIME SỐ 1 NHẬT BẢN",
      formatTag: "2D • IMAX",
      bgImage: "/images/posters/conan-backdrop.jpg",
      posterImage: "/images/posters/conan-movie-27.jpg",
      accentColor: "#E50914",
      ageRating: "T13",
    },
    {
      id: "b-dune-2",
      movieId: "dune-2",
      movieTitle: "DUNE: PHẦN HAI",
      tagline: "SIÊU BOM TẤN KHOA HỌC VIỄN TƯỞNG ĐOẠT GIẢI OSCAR",
      releaseNote: "Paul Atreides liên minh cùng Chani và người Fremen trên hành trình báo thù những kẻ hủy diệt gia tộc. Trải nghiệm định dạng IMAX Laser 4K.",
      badge: "BOM TẤN TOÀN CẦU",
      formatTag: "IMAX Laser • 2D",
      bgImage: "/images/posters/dune-2-backdrop.jpg",
      posterImage: "/images/posters/dune-2.jpg",
      accentColor: "#F5C518",
      ageRating: "T16",
    },
    {
      id: "b-godzilla-kong",
      movieId: "godzilla-x-kong",
      movieTitle: "GODZILLA X KONG: ĐẾ CHẾ MỚI",
      tagline: "HAI ĐẠI QUÁI THÚ BẮT TAY TRONG TRẬN CHIẾN TRÁI ĐẤT RỖNG",
      releaseNote: "Một hiểm họa mới đe dọa sự tồn vong của thế giới buộc Godzilla và Kong phải hợp sức chiến đấu bảo vệ nhân loại.",
      badge: "BOM TẤN HÀNH ĐỘNG",
      formatTag: "4DX • IMAX 3D",
      bgImage: "/images/posters/godzilla-x-kong-backdrop.jpg",
      posterImage: "/images/posters/godzilla-x-kong.jpg",
      accentColor: "#E50914",
      ageRating: "T13",
    },
    {
      id: "b-doraemon",
      movieId: "doraemon-earth-symphony",
      movieTitle: "DORAEMON: BẢN GIAO HƯỞNG ĐỊA CẦU",
      tagline: "GIAI ĐIỆU ÂM NHẠC KỲ DIỆU GIẢI CỨU TRÁI ĐẤT KHỎI DIỆT VONG",
      releaseNote: "Chuyến phiêu lưu âm nhạc cùng Doraemon và nhóm bạn đến hành tinh giai điệu thần tiên với nhiều khoảnh khắc cảm động.",
      badge: "HOẠT HÌNH GIA ĐÌNH",
      formatTag: "2D Lồng Tiếng",
      bgImage: "/images/posters/doraemon-backdrop.jpg",
      posterImage: "/images/posters/doraemon-earth-symphony.jpg",
      accentColor: "#38bdf8",
      ageRating: "P",
    },
  ];

  const total = designedBanners.length;

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);
    return () => clearInterval(timer);
  }, [isPaused, total]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const activeBanner = designedBanners[currentIndex];
  const targetMovie = movies.find((m) => m.id === activeBanner.movieId) || movies[0];

  const handleClickBanner = () => {
    if (targetMovie) {
      onBookTicket(targetMovie);
    }
  };

  return (
    <section
      className={`relative w-full min-h-[80vh] flex items-center select-none overflow-hidden transition-colors duration-500 ${
        isHalloween ? "bg-transparent" : "bg-[#0B0C10]"
      }`}
      aria-label="Hero Banner CineMax"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Ảnh Backdrop tràn viền 100% chiều ngang (không bo góc) */}
      <div className="absolute inset-0 z-0">
        <img
          key={activeBanner.id}
          src={activeBanner.bgImage}
          alt={activeBanner.movieTitle}
          className="w-full h-full object-cover object-center scale-100 transition-transform duration-1000 ease-out"
        />

        {/* 2. Lớp phủ Gradient đen điện ảnh mờ dần về phía trái và phía dưới */}
        <div
          className={`absolute inset-0 bg-gradient-to-r transition-colors duration-500 ${
            isHalloween
              ? "from-[#07020d] via-[#07020d]/85 via-40% to-transparent"
              : "from-[#0B0C10] via-[#0B0C10]/80 via-40% to-transparent"
          }`}
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t transition-colors duration-500 ${
            isHalloween
              ? "from-[#07020d] via-[#07020d]/50 to-transparent"
              : "from-[#0B0C10] via-[#0B0C10]/40 to-transparent"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      </div>

      {/* 3. Vùng chứa nội dung Hero Banner */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-36 sm:pb-28 flex items-center justify-between gap-8">
        {/* Cột trái: Typography & Chi tiết phim */}
        <div className="flex-1 max-w-2xl space-y-4">
          {/* Đúng 2 nhãn: Phân loại độ tuổi & Định dạng chiếu */}
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-md ${
                activeBanner.ageRating === "T18"
                  ? "bg-[#DC2626]"
                  : activeBanner.ageRating === "T16"
                  ? "bg-[#EA580C]"
                  : activeBanner.ageRating === "T13"
                  ? "bg-[#D97706]"
                  : "bg-[#16A34A]"
              }`}
            >
              {activeBanner.ageRating}
            </span>
            <span className="px-3 py-1 rounded-md text-xs font-black bg-white/10 backdrop-blur-md text-white border border-white/20 uppercase tracking-wider shadow-sm">
              {activeBanner.formatTag}
            </span>
            <span className="text-xs font-bold text-[#F5C518] uppercase tracking-wider ml-1 hidden sm:inline">
              {activeBanner.tagline}
            </span>
          </div>

          {/* Tiêu đề phim: Chữ đậm, sắc nét, màu trắng & vàng kim với khoảng cách dòng thoáng tránh đè chữ */}
          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white uppercase leading-[1.18] sm:leading-[1.14] drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] py-1">
            {activeBanner.movieTitle}
          </h1>

          {/* Đoạn mô tả phim ngắn gọn */}
          <p className="text-sm sm:text-base text-[#9CA3AF] line-clamp-3 leading-relaxed max-w-xl font-normal drop-shadow">
            {activeBanner.releaseNote}
          </p>

          {/* Nhóm nút CTA: ĐẶT VÉ NGAY & Xem Trailer */}
          <div className="flex flex-wrap items-center gap-4 pt-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (targetMovie) onBookTicket(targetMovie);
              }}
              className="px-8 py-3.5 rounded-lg bg-[#E50914] hover:bg-[#b80710] text-white font-heading font-bold text-base uppercase tracking-wider shadow-lg shadow-red-600/40 flex items-center gap-2.5 transform hover:scale-105 active:scale-95 transition-all cursor-pointer border border-red-500/30"
            >
              <Ticket className="w-4 h-4" />
              <span>ĐẶT VÉ NGAY</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (targetMovie) onWatchTrailer(targetMovie);
              }}
              className="px-6 py-3.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-heading font-semibold text-base backdrop-blur-md border border-white/20 flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Xem Trailer</span>
            </button>
          </div>
        </div>

        {/* Cột phải: Poster phụ nghiêng nhẹ, nhô ra khỏi bố cục kèm đổ bóng phát sáng */}
        <div className="hidden lg:flex shrink-0 items-center justify-center relative">
          {/* Ánh sáng phát quang hắt phía sau poster */}
          <div
            className="absolute -inset-6 rounded-3xl opacity-35 blur-3xl transition-all duration-700 pointer-events-none"
            style={{ backgroundColor: activeBanner.accentColor }}
          />

          {/* Poster nhô nhẹ ra bố cục, nghiêng góc nghệ thuật */}
          <div className="relative w-56 xl:w-64 aspect-[2/3] rounded-xl overflow-hidden border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.9)] transform rotate-2 hover:rotate-0 hover:scale-105 transition-all duration-500 drop-shadow-2xl bg-neutral-900 group cursor-pointer"
               onClick={handleClickBanner}>
            <img
              src={activeBanner.posterImage}
              alt={activeBanner.movieTitle}
              className="w-full h-full object-cover"
            />
            {/* Lớp bóng kính mờ nhẹ và thanh thông tin che gọn phần đáy */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 via-30% to-transparent pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 p-3.5 flex items-center justify-between text-white text-[11px] font-bold">
              <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[10px] font-black uppercase">
                {activeBanner.ageRating}
              </span>
              <span className="font-heading text-xs tracking-wider text-[#F5C518] uppercase drop-shadow">
                {activeBanner.formatTag}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mũi tên chuyển Slide Trái / Phải */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Slide trước"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-lg bg-black/40 hover:bg-[#E50914] text-white flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer border border-white/10 shadow-lg"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Slide tiếp theo"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-lg bg-black/40 hover:bg-[#E50914] text-white flex items-center justify-center transition-all backdrop-blur-sm cursor-pointer border border-white/10 shadow-lg"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 5. Dải dots điều hướng slide ở góc dưới */}
      <div className="absolute bottom-6 right-8 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
        {designedBanners.map((b, idx) => (
          <button
            key={b.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(idx);
            }}
            aria-label={`Slide ${idx + 1}`}
            className={`transition-all duration-300 rounded-sm cursor-pointer ${
              currentIndex === idx
                ? "w-6 h-1.5 bg-[#E50914]"
                : "w-2 h-1.5 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
};
