import { Seat } from "@/types";

export interface OrphanCheckResult {
  isValid: boolean;
  orphanSeatIds: string[];
  message: string | null;
}

/**
 * Thuật toán phát hiện và ngăn chặn ghế mồ côi (Orphan Seat Prevention Algorithm)
 * Chuẩn hệ thống rạp CGV, Galaxy Cinema, BookMyShow:
 * - Không cho phép để lại đúng 1 ghế trống đơn độc ở đầu dãy ghế (cạnh lối đi/vách tường).
 * - Không cho phép để lại đúng 1 ghế trống đơn độc bị kẹp giữa 2 ghế đã có người mua hoặc đang chọn.
 * - Cho phép khoảng trống từ 2 ghế trở lên (để khách đi cặp đôi hoặc nhóm vẫn mua được).
 * - Ngoại lệ thông minh: Nếu ghế mồ côi đã tồn tại sẵn từ trước (do suất chiếu cũ), người dùng không bị phạt.
 */
export function checkOrphanSeats(
  rowSeats: Seat[],
  currentSelectedSeatIds: Set<string>,
  targetSeatToToggle?: Seat
): OrphanCheckResult {
  // Tạo bản sao danh sách ID đã chọn sau khi thử nghiệm hành động (nếu có targetSeatToToggle)
  const simulatedSelected = new Set(currentSelectedSeatIds);
  if (targetSeatToToggle) {
    if (simulatedSelected.has(targetSeatToToggle.id)) {
      simulatedSelected.delete(targetSeatToToggle.id);
    } else {
      simulatedSelected.add(targetSeatToToggle.id);
    }
  }

  // Sắp xếp ghế trong hàng theo số thứ tự 1, 2, 3...
  const sorted = [...rowSeats].sort((a, b) => a.number - b.number);
  if (sorted.length <= 2) {
    return { isValid: true, orphanSeatIds: [], message: null };
  }

  // Xác định trạng thái của từng ghế: OCCUPIED (đã đặt trước HOẶC đang chọn) vs FREE (còn trống)
  const isOccupiedAfter = (seat: Seat) =>
    seat.status === "booked" || simulatedSelected.has(seat.id);

  const isOccupiedBefore = (seat: Seat) =>
    seat.status === "booked" || currentSelectedSeatIds.has(seat.id);

  // Tìm các cụm ghế trống liên tiếp (consecutive free segments)
  const newOrphans: string[] = [];

  let currentFreeSegment: Seat[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const seat = sorted[i];
    if (!isOccupiedAfter(seat)) {
      currentFreeSegment.push(seat);
    } else {
      if (currentFreeSegment.length === 1) {
        // Phát hiện 1 ghế đơn độc đứng một mình
        const orphanCandidate = currentFreeSegment[0];
        // Kiểm tra xem ghế này có phải đã bị mồ côi sẵn từ trước không
        const wasAlreadyOrphan = checkSingleSeatWasOrphanBefore(sorted, orphanCandidate, isOccupiedBefore);
        if (!wasAlreadyOrphan) {
          newOrphans.push(orphanCandidate.id);
        }
      }
      currentFreeSegment = [];
    }
  }

  // Kiểm tra cụm trống cuối cùng nếu chạm đến hết hàng
  if (currentFreeSegment.length === 1) {
    const orphanCandidate = currentFreeSegment[0];
    const wasAlreadyOrphan = checkSingleSeatWasOrphanBefore(sorted, orphanCandidate, isOccupiedBefore);
    if (!wasAlreadyOrphan) {
      newOrphans.push(orphanCandidate.id);
    }
  }

  if (newOrphans.length > 0) {
    const seatNames = newOrphans.join(", ");
    return {
      isValid: false,
      orphanSeatIds: newOrphans,
      message: `Không được để trống duy nhất 1 ghế (${seatNames}). Vui lòng chọn ghế liền kề hoặc cách tối thiểu 2 ghế để rạp tối ưu chỗ ngồi!`,
    };
  }

  return {
    isValid: true,
    orphanSeatIds: [],
    message: null,
  };
}

/**
 * Kiểm tra xem một ghế có phải vốn dĩ đã là ghế mồ côi từ trước khi người dùng thao tác hay không.
 */
function checkSingleSeatWasOrphanBefore(
  sortedRow: Seat[],
  candidate: Seat,
  isOccupiedBefore: (s: Seat) => boolean
): boolean {
  const index = sortedRow.findIndex((s) => s.id === candidate.id);
  if (index === -1) return false;

  // Nếu trước đó ghế này đã bị occupied thì không phải mồ côi cũ
  if (isOccupiedBefore(candidate)) return false;

  const leftOccupied = index === 0 || isOccupiedBefore(sortedRow[index - 1]);
  const rightOccupied = index === sortedRow.length - 1 || isOccupiedBefore(sortedRow[index + 1]);

  return leftOccupied && rightOccupied;
}
