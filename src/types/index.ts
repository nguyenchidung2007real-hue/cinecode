export interface Movie {
  id: string | number;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string;
  backdropPath: string;
  releaseDate: string;
  voteAverage: number;
  voteCount: number;
  genres: string[];
  durationMinutes: number;
  director: string;
  cast: string[];
  trailerYoutubeId: string;
  ageRating: string; // e.g. "T18", "T16", "P", "K"
  status: "now_playing" | "upcoming" | "trending";
}

export type SeatType = "standard" | "vip" | "couple" | "empty";
export type SeatStatus = "available" | "selected" | "booked";

export interface Seat {
  id: string; // e.g. "A1", "F12"
  row: string;
  number: number;
  type: SeatType;
  price: number;
  status: SeatStatus;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
}

export interface ShowTime {
  id: string;
  movieId: string | number;
  cinemaId: string;
  cinemaName: string;
  roomName: string;
  format: "2D Phụ Đề" | "2D Lồng Tiếng" | "IMAX Laser" | "4DX";
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}

export interface BookingInfo {
  bookingId: string;
  movieTitle: string;
  posterPath: string;
  cinemaName: string;
  roomName: string;
  format: string;
  showDate: string;
  showTime: string;
  seats: string[];
  totalAmount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  qrCodeUrl?: string;
  qrToken?: string;
  status?: "valid" | "used";
  usedAt?: string;
  scannedBy?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  recommendation?: {
    movieId: string | number;
    movieTitle: string;
    posterPath?: string;
    reason: string;
    suggestedSeats?: string[];
  };
}

