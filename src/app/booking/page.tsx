"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Movie, BookingInfo } from "@/types";
import { MOCK_MOVIES } from "@/lib/mockData";
import { BookingModal } from "@/components/BookingModal";
import {
  ArrowLeft,
  Film,
  Home,
  ChevronRight,
  Loader2,
} from "lucide-react";

function BookingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const movieIdParam = searchParams.get("movieId") || searchParams.get("id");
  const showtimeIdParam = searchParams.get("showtimeId") || undefined;
  const seatsParam = searchParams.get("seats");
  const couponParam = searchParams.get("coupon") || undefined;
  const comboParam = searchParams.get("combo") || undefined;

  const initialSeats = seatsParam
    ? seatsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const [movies, setMovies] = useState<Movie[]>(MOCK_MOVIES);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Tải danh sách phim và nhận diện phim được chọn theo movieId từ URL
  useEffect(() => {
    let cancelled = false;

    async function loadMovies() {
      try {
        const res = await fetch("/api/movies");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0 && !cancelled) {
            setMovies(data);
            return data;
          }
        }
      } catch (err) {
        console.warn("Không tải được /api/movies, sử dụng dữ liệu mặc định:", err);
      }
      return MOCK_MOVIES;
    }

    loadMovies().then((movieList) => {
      if (cancelled) return;

      if (movieIdParam) {
        const target = movieList.find(
          (m: Movie) => String(m.id).toLowerCase() === movieIdParam.toLowerCase()
        );
        if (target) {
          setSelectedMovie(target);
          setIsLoading(false);
          return;
        }
      }

      // Nếu không truyền movieId hoặc không tìm thấy, mặc định chọn phim đầu tiên
      if (movieList.length > 0) {
        setSelectedMovie(movieList[0]);
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [movieIdParam]);

  const handleReturnHome = () => {
    router.push("/");
  };

  const handleBookingSuccess = (booking: BookingInfo) => {
    // Lưu thông tin vé mới vào localStorage đã được xử lý trong BookingModal
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0C10] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 text-[#E50914] animate-spin mb-4" />
        <p className="text-sm text-neutral-400">Đang tải phòng chiếu và suất chiếu CineMax...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white flex flex-col">
      {/* Top Header thanh điều hướng trang Đặt Vé độc lập */}
      <header className="border-b border-white/10 bg-[#12141C]/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1080px] mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 group cursor-pointer"
              title="Về trang chủ CineMax"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E50914] flex items-center justify-center font-black text-white text-base shadow-md shadow-red-900/40 group-hover:scale-105 transition-transform">
                C
              </div>
              <span className="font-heading font-black text-xl tracking-wider text-white group-hover:text-red-400 transition-colors">
                CINEMAX
              </span>
            </Link>

            <div className="h-5 w-px bg-white/10 hidden sm:block" />

            {/* Breadcrumb điều hướng */}
            <nav className="hidden sm:flex items-center gap-2 text-xs text-neutral-400">
              <Link href="/" className="hover:text-white transition-colors flex items-center gap-1">
                <Home className="w-3.5 h-3.5" />
                <span>Trang Chủ</span>
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
              <span className="text-neutral-300 font-semibold">Đặt Vé Phim</span>
              {selectedMovie && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-red-400 font-bold truncate max-w-[200px]">
                    {selectedMovie.title}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Nút Quay lại chọn phim ở góc trên */}
          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 hover:text-white text-xs sm:text-sm font-bold border border-white/10 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span>Quay lại chọn phim</span>
          </Link>
        </div>
      </header>

      {/* Main Content: Màn hình Đặt Vé Full-Page độc lập */}
      <main className="flex-1 max-w-[1080px] w-full mx-auto px-2 sm:px-4 py-6 sm:py-8">
        {selectedMovie ? (
          <BookingModal
            movie={selectedMovie}
            initialSeats={initialSeats}
            initialShowtimeId={showtimeIdParam}
            initialCouponCode={couponParam}
            initialComboId={comboParam}
            onClose={handleReturnHome}
            onBookingSuccess={handleBookingSuccess}
          />
        ) : (
          <div className="py-20 text-center bg-[#12141C] border border-white/10 rounded-2xl p-8">
            <Film className="w-12 h-12 text-neutral-500 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-white mb-2">Chưa chọn phim nào</h2>
            <p className="text-xs text-neutral-400 mb-6">
              Vui lòng quay lại trang chủ để chọn bộ phim điện ảnh bạn muốn thưởng thức.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Xem danh sách phim chiếu rạp</span>
            </Link>
          </div>
        )}
      </main>

      {/* Footer nhỏ trang Đặt Vé */}
      <footer className="border-t border-white/10 py-6 text-center text-xs text-neutral-500">
        <p>© 2026 CineMax Cinema. Nền tảng đặt vé xem phim điện ảnh trực tuyến.</p>
      </footer>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0B0C10] flex items-center justify-center text-white">
          <Loader2 className="w-10 h-10 text-[#E50914] animate-spin" />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}
