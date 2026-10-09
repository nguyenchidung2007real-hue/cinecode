-- ==============================================================================
-- DỰ ÁN: CINEMAX - HỆ THỐNG ĐẶT VÉ RẠP CHIẾU PHIM ĐA CỤM
-- TỆP: database/schema.sql (PHIÊN BẢN MỞ RỘNG TOÀN DIỆN - TÍNH NĂNG HIỆN TẠI & TƯƠNG LAI)
-- MÔ TẢ: Khởi tạo toàn bộ cấu trúc Cơ sở Dữ liệu chuẩn Doanh nghiệp (Enterprise DDL)
-- BAO GỒM: 29 BẢNG THỰC THỂ (Cốt lõi + Khuyến mãi + Thành viên + Review + Đổi vé + Nhóm + F&B tận ghế + AI)
-- HỆ QUẢN TRỊ: PostgreSQL 14+ / Supabase / Neon / AWS Aurora
-- ==============================================================================

-- Bật extension hỗ trợ UUID tự động và tìm kiếm chuỗi
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. CÁC KIỂU DỮ LIỆU ĐỊNH NGHĨA RIÊNG (CUSTOM ENUM TYPES)
-- ==============================================================================

-- Phân loại độ tuổi chuẩn Thông tư 05/2023/TT-BVHTTDL
CREATE TYPE age_rating_enum AS ENUM ('P', 'K', 'T13', 'T16', 'T18', 'C');

-- Trạng thái phim
CREATE TYPE movie_status_enum AS ENUM ('COMING_SOON', 'NOW_SHOWING', 'SNEAK_SHOW', 'ENDED');

-- Định dạng công nghệ phòng chiếu
CREATE TYPE hall_type_enum AS ENUM ('STANDARD_2D', 'DIGITAL_3D', 'IMAX_LASER', 'FOUR_DX', 'SCREEN_X', 'GOLD_CLASS');

-- Loại ghế trong rạp
CREATE TYPE seat_type_enum AS ENUM ('STANDARD', 'VIP', 'SWEETBOX', 'ACCESSIBLE', 'AISLE');

-- Trạng thái ghế động theo từng suất chiếu
CREATE TYPE seat_status_enum AS ENUM ('AVAILABLE', 'HOLD', 'BOOKED', 'BLOCKED');

-- Trạng thái thanh toán của đơn đặt vé
CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED');

-- Vai trò người dùng trong hệ thống
CREATE TYPE user_role_enum AS ENUM ('CUSTOMER', 'STAFF', 'CINEMA_MANAGER', 'SUPER_ADMIN');

-- [TÍNH NĂNG MỚI] Loại giảm giá voucher
CREATE TYPE discount_type_enum AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');

-- [TÍNH NĂNG MỚI] Trạng thái hoàn tiền
CREATE TYPE refund_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSED');

-- [TÍNH NĂNG MỚI] Hình thức nhận bắp nước
CREATE TYPE concession_delivery_type_enum AS ENUM ('EXPRESS_COUNTER', 'AT_SEAT_DELIVERY', 'TAKE_AWAY');

-- [TÍNH NĂNG MỚI] Trạng thái phòng chờ ảo
CREATE TYPE waiting_room_status_enum AS ENUM ('WAITING', 'ADMITTED', 'EXPIRED');

-- ==============================================================================
-- 2. TẠO CÁC BẢNG THỰC THỂ CỐT LÕI (CORE TABLES - 15 BẢNG ĐẦU TIÊN)
-- ==============================================================================

-- BẢNG 1: CỤM RẠP CHIẾU PHIM (CINEMAS)
CREATE TABLE cinemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(180) UNIQUE NOT NULL,
    address VARCHAR(255) NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),
    phone VARCHAR(25),
    amenities JSONB DEFAULT '["Parking", "AirConditioned", "PopcornBar"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 2: PHÒNG CHIẾU (HALLS)
CREATE TABLE halls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    hall_type hall_type_enum NOT NULL DEFAULT 'STANDARD_2D',
    sound_system VARCHAR(50) DEFAULT 'Dolby Atmos 7.1',
    projector_type VARCHAR(50) DEFAULT 'Christie 4K Laser',
    total_seats INT NOT NULL CHECK (total_seats > 0),
    rows_count INT NOT NULL CHECK (rows_count > 0),
    cols_count INT NOT NULL CHECK (cols_count > 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (cinema_id, name)
);

-- BẢNG 3: SƠ ĐỒ GHẾ VẬT LÝ CỦA PHÒNG (SEAT TEMPLATES)
CREATE TABLE seat_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    row_code VARCHAR(5) NOT NULL,
    seat_number INT NOT NULL,
    seat_type seat_type_enum NOT NULL DEFAULT 'STANDARD',
    coord_x INT NOT NULL,
    coord_y INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (hall_id, row_code, seat_number)
);

-- BẢNG 4: DANH MỤC THỂ LOẠI PHIM (GENRES)
CREATE TABLE genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 5: DANH MỤC PHIM ĐIỆN ẢNH (MOVIES)
CREATE TABLE movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    original_title VARCHAR(255),
    slug VARCHAR(280) UNIQUE NOT NULL,
    overview TEXT,
    poster_url TEXT NOT NULL,
    backdrop_url TEXT,
    trailer_youtube_id VARCHAR(50),
    duration_min INT NOT NULL CHECK (duration_min > 0),
    release_date DATE NOT NULL,
    end_date DATE,
    age_rating age_rating_enum NOT NULL DEFAULT 'T13',
    director VARCHAR(150),
    cast_members TEXT[],
    producer VARCHAR(150),
    country VARCHAR(80) DEFAULT 'Việt Nam',
    rating_average DECIMAL(3, 1) DEFAULT 0.0 CHECK (rating_average >= 0.0 AND rating_average <= 10.0),
    rating_count INT DEFAULT 0 CHECK (rating_count >= 0),
    status movie_status_enum NOT NULL DEFAULT 'NOW_SHOWING',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 6: LIÊN KẾT PHIM & THỂ LOẠI (MOVIE_GENRES - N:M)
CREATE TABLE movie_genres (
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

-- BẢNG 7: SUẤT CHIẾU (SHOWTIMES)
CREATE TABLE showtimes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE RESTRICT,
    hall_id UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    format VARCHAR(40) NOT NULL DEFAULT '2D Phụ Đề',
    base_price DECIMAL(12, 2) NOT NULL CHECK (base_price >= 0),
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

-- BẢNG 8: TRẠNG THÁI GHẾ ĐỘNG THEO SUẤT CHIẾU (SHOWTIME_SEATS)
CREATE TABLE showtime_seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    seat_template_id UUID NOT NULL REFERENCES seat_templates(id) ON DELETE CASCADE,
    status seat_status_enum NOT NULL DEFAULT 'AVAILABLE',
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    reserved_by_user_id UUID,
    reservation_expires_at TIMESTAMPTZ,
    version INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (showtime_id, seat_template_id)
);

-- BẢNG 9: NGƯỜI DÙNG & TÀI KHOẢN (USERS)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    phone VARCHAR(25) UNIQUE,
    password_hash VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'CUSTOMER',
    avatar_url TEXT,
    loyalty_points INT DEFAULT 0 CHECK (loyalty_points >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 10: ĐƠN ĐẶT VÉ (BOOKINGS)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE RESTRICT,
    total_amount DECIMAL(12, 2) NOT NULL CHECK (total_amount >= 0),
    discount_amount DECIMAL(12, 2) DEFAULT 0 CHECK (discount_amount >= 0),
    final_amount DECIMAL(12, 2) NOT NULL CHECK (final_amount >= 0),
    payment_status payment_status_enum NOT NULL DEFAULT 'PENDING',
    idempotency_key VARCHAR(100) UNIQUE NOT NULL,
    customer_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 11: VÉ ĐIỆN TỬ CHI TIẾT (TICKETS)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    showtime_seat_id UUID UNIQUE NOT NULL REFERENCES showtime_seats(id) ON DELETE RESTRICT,
    ticket_code VARCHAR(60) UNIQUE NOT NULL,
    qr_code_payload TEXT NOT NULL,
    is_checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMPTZ,
    checked_in_by_staff_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 12: DANH MỤC BẮP NƯỚC (CONCESSIONS)
CREATE TABLE concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cinema_id UUID NOT NULL REFERENCES cinemas(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'COMBO',
    description TEXT,
    price DECIMAL(12, 2) NOT NULL CHECK (price >= 0),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 13: CHI TIẾT BẮP NƯỚC THEO ĐƠN HÀNG (BOOKING_CONCESSIONS)
CREATE TABLE booking_concessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    concession_id UUID NOT NULL REFERENCES concessions(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price >= 0),
    subtotal DECIMAL(12, 2) NOT NULL CHECK (subtotal >= 0),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 14: LỊCH SỬ GIAO DỊCH THANH TOÁN (PAYMENTS)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    gateway VARCHAR(30) NOT NULL,
    gateway_transaction_id VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'VND',
    status VARCHAR(30) NOT NULL,
    webhook_payload JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 15: NHẬT KÝ AN NINH (SYSTEM_AUDIT_LOGS)
CREATE TABLE system_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(80) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(100) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 3. CÁC TÍNH NĂNG MỞ RỘNG & SẮP CÓ (UPCOMING ENTERPRISE FEATURES - 14 BẢNG TIẾP THEO)
-- ==============================================================================

-- BẢNG 16: HẠNG THÀNH VIÊN (MEMBERSHIP_TIERS)
-- Bronze, Silver, Gold, Platinum, Diamond
CREATE TABLE membership_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    min_spending DECIMAL(12, 2) NOT NULL DEFAULT 0,
    point_multiplier DECIMAL(3, 2) NOT NULL DEFAULT 1.0,
    benefits JSONB DEFAULT '[]'::jsonb,
    badge_color VARCHAR(20) DEFAULT '#94a3b8',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 17: SỔ CÁI ĐIỂM THƯỞNG THÀNH VIÊN (USER_LOYALTY_TRANSACTIONS)
-- Ghi nhận lịch sử cộng / trừ điểm loyalty minh bạch
CREATE TABLE user_loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    points_delta INT NOT NULL, -- Dương: tích điểm; Âm: tiêu điểm
    transaction_type VARCHAR(50) NOT NULL, -- BOOKING_EARN, REDEEM_DISCOUNT, BIRTHDAY_GIFT, EXPIRED
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 18: MÃ GIẢM GIÁ & VOUCHER KHUYẾN MÃI (COUPONS)
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type discount_type_enum NOT NULL DEFAULT 'PERCENTAGE',
    discount_value DECIMAL(12, 2) NOT NULL CHECK (discount_value > 0),
    min_order_amount DECIMAL(12, 2) DEFAULT 0,
    max_discount_amount DECIMAL(12, 2),
    total_usage_limit INT,
    current_usage_count INT DEFAULT 0,
    per_user_limit INT DEFAULT 1,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_to TIMESTAMPTZ NOT NULL,
    applicable_cinema_ids UUID[],
    applicable_movie_ids UUID[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CHECK (valid_to > valid_from)
);

-- BẢNG 19: LỊCH SỬ SỬ DỤNG MÃ GIẢM GIÁ (COUPON_REDEMPTIONS)
CREATE TABLE coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    discount_applied DECIMAL(12, 2) NOT NULL,
    redeemed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 20: THẺ QUÀ TẶNG & VÍ TRẢ TRƯỚC (GIFT_CARDS)
CREATE TABLE gift_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_code VARCHAR(30) UNIQUE NOT NULL,
    pin_hash VARCHAR(255) NOT NULL,
    initial_balance DECIMAL(12, 2) NOT NULL CHECK (initial_balance > 0),
    current_balance DECIMAL(12, 2) NOT NULL CHECK (current_balance >= 0),
    sender_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    recipient_email VARCHAR(120),
    greeting_message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 21: GIAO DỊCH THẺ QUÀ TẶNG (GIFT_CARD_TRANSACTIONS)
CREATE TABLE gift_card_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gift_card_id UUID NOT NULL REFERENCES gift_cards(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    amount_deducted DECIMAL(12, 2) NOT NULL,
    remaining_balance DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 22: ĐÁNH GIÁ & BÌNH LUẬN PHIM (MOVIE_REVIEWS)
-- Tính năng xác thực người đã thực sự mua vé (Verified Buyer) như Rotten Tomatoes
CREATE TABLE movie_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL, -- Xác thực đã mua vé
    rating_score INT NOT NULL CHECK (rating_score >= 1 AND rating_score <= 10),
    title VARCHAR(150),
    content TEXT,
    has_spoilers BOOLEAN DEFAULT FALSE,
    is_verified_buyer BOOLEAN DEFAULT FALSE,
    likes_count INT DEFAULT 0,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (movie_id, user_id)
);

-- BẢNG 23: LƯỢT THÍCH BÌNH LUẬN (REVIEW_LIKES)
CREATE TABLE review_likes (
    review_id UUID NOT NULL REFERENCES movie_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id, user_id)
);

-- BẢNG 24: THEO DÕI & NHẮN BÁO MỞ VÉ SỚM (MOVIE_WATCHLISTS)
-- Nhận thông báo khi có vé sớm (Presale Alert)
CREATE TABLE movie_watchlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id UUID NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    notify_on_presale BOOLEAN DEFAULT TRUE,
    is_notified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, movie_id)
);

-- BẢNG 25: ĐẶT VÉ THEO NHÓM & XEM CHUNG (GROUP_BOOKINGS)
CREATE TABLE group_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    leader_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    group_name VARCHAR(100) DEFAULT 'Xem Phim Cùng Bạn Bè',
    invite_code VARCHAR(20) UNIQUE NOT NULL,
    total_seats_target INT NOT NULL DEFAULT 2,
    status VARCHAR(30) DEFAULT 'ORGANIZING', -- ORGANIZING, COMPLETED, EXPIRED
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 26: THÀNH VIÊN NHÓM XEM PHIM (GROUP_BOOKING_MEMBERS)
CREATE TABLE group_booking_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_booking_id UUID NOT NULL REFERENCES group_bookings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    guest_name VARCHAR(100),
    showtime_seat_id UUID REFERENCES showtime_seats(id) ON DELETE SET NULL,
    has_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 27: YÊU CẦU HOÀN VÉ & ĐỔI VÉ (REFUND_REQUESTS)
CREATE TABLE refund_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    original_amount DECIMAL(12, 2) NOT NULL,
    refund_amount DECIMAL(12, 2) NOT NULL,
    penalty_fee DECIMAL(12, 2) DEFAULT 0,
    status refund_status_enum NOT NULL DEFAULT 'PENDING',
    processed_by_staff_id UUID REFERENCES users(id),
    processed_at TIMESTAMPTZ,
    bank_account_info JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 28: DỊCH VỤ GIAO BẮP NƯỚC TẬN GHẾ (CONCESSION_DELIVERIES)
CREATE TABLE concession_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    delivery_type concession_delivery_type_enum NOT NULL DEFAULT 'EXPRESS_COUNTER',
    seat_location VARCHAR(20), -- e.g. "Ghế F7 - Phòng IMAX 01"
    estimated_delivery_time TIMESTAMPTZ,
    delivery_status VARCHAR(30) DEFAULT 'PREPARING', -- PREPARING, DELIVERED, PICKED_UP
    delivered_by_staff_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BẢNG 29: PHÒNG CHỜ ẢO CHỐNG SẬP CAO ĐIỂM (WAITING_ROOM_SESSIONS)
CREATE TABLE waiting_room_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    showtime_id UUID NOT NULL REFERENCES showtimes(id) ON DELETE CASCADE,
    user_ip VARCHAR(45) NOT NULL,
    session_token VARCHAR(100) UNIQUE NOT NULL,
    queue_number INT NOT NULL,
    status waiting_room_status_enum NOT NULL DEFAULT 'WAITING',
    admitted_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- 4. ĐÁNH CHỈ MỤC TỐI ƯU HÓA TRUY VẤN TẢI CAO (INDEXING STRATEGY)
-- ==============================================================================

-- Core Indexes
CREATE INDEX idx_halls_cinema_id ON halls(cinema_id);
CREATE INDEX idx_seat_templates_lookup ON seat_templates(hall_id, row_code);
CREATE INDEX idx_showtimes_lookup ON showtimes(movie_id, hall_id, start_time);
CREATE INDEX idx_showtimes_interval ON showtimes(hall_id, start_time, end_time);
CREATE INDEX idx_showtime_seats_query ON showtime_seats(showtime_id, status);
CREATE INDEX idx_showtime_seats_expiry ON showtime_seats(status, reservation_expires_at) WHERE status = 'HOLD';
CREATE INDEX idx_bookings_user ON bookings(user_id, created_at DESC);
CREATE INDEX idx_bookings_code ON bookings(booking_code);
CREATE INDEX idx_tickets_booking ON tickets(booking_id);
CREATE INDEX idx_tickets_lookup_code ON tickets(ticket_code);

-- Upcoming Feature Indexes
CREATE INDEX idx_coupons_validity ON coupons(code, is_active, valid_from, valid_to);
CREATE INDEX idx_gift_cards_lookup ON gift_cards(card_code, is_active);
CREATE INDEX idx_movie_reviews_movie ON movie_reviews(movie_id, is_approved, rating_score DESC);
CREATE INDEX idx_watchlists_user_movie ON movie_watchlists(user_id, movie_id);
CREATE INDEX idx_group_bookings_code ON group_bookings(invite_code);
CREATE INDEX idx_waiting_room_lookup ON waiting_room_sessions(showtime_id, status, queue_number);
