import type React from "react";

/**
 * Tính toán style CSS 3D perspective cho khung màn hình chiếu rạp theo ghế đang được chọn.
 *
 * Biên độ được clamp an toàn cho mọi hàng ghế từ A -> K:
 * - Hàng A cận màn hình: rotateX = -24deg, scale = 1.12 (ngước mắt nhìn lên, màn hình rộng)
 * - Hàng E, F, G giữa rạp: rotateX = -12deg đến -8deg (góc nhìn cân bằng chuẩn SMPTE/Dolby)
 * - Hàng K ghế đôi cuối rạp: rotateX = -2deg, scale = 0.95 (tầm mắt ngang tự nhiên, không bị lật dương)
 */
export function getScreen3DStyle(lastSelectedSeatId?: string): React.CSSProperties {
  if (!lastSelectedSeatId) {
    return {
      transform: "perspective(900px) rotateX(-8deg) scale(1)",
      transition: "transform 0.5s ease",
    };
  }

  const rowChar = lastSelectedSeatId.charAt(0).toUpperCase(); // 'A' -> 'K'
  const colNum = parseInt(lastSelectedSeatId.slice(1), 10) || 6;

  // Chuẩn hóa rowIndex trong khoảng [0..10] (A=0 ... H=7 ... K=10)
  const rawRowIndex = Math.max(0, Math.min(10, rowChar.charCodeAt(0) - 65));

  // Nội suy mượt từ -24deg (Hàng A sát màn) về -2deg (Hàng K cuối rạp, nhìn ngang tầm mắt)
  const rotateX = -24 + (rawRowIndex / 10) * 22;

  // Scale từ 1.12 (Hàng A) về 0.95 (Hàng K ở xa)
  const scale = Number((1.12 - (rawRowIndex / 10) * 0.17).toFixed(3));

  // Nếu là hàng ghế đôi K, căn chỉnh hệ số nghiêng ngang phù hợp
  const maxColsInRow = rowChar === "K" ? 6 : 12;
  const centerCol = (maxColsInRow + 1) / 2;
  const rotateY = Math.max(-14, Math.min(14, (centerCol - colNum) * 2.2));

  return {
    transform: `perspective(850px) rotateX(${rotateX.toFixed(1)}deg) rotateY(${rotateY.toFixed(1)}deg) scale(${scale})`,
    transition: "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
  };
}
