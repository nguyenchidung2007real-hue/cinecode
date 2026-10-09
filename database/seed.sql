-- ==============================================================================
-- DỰ ÁN: CINEMAX - HỆ THỐNG ĐẶT VÉ RẠP CHIẾU PHIM ĐA CỤM
-- TỆP: database/seed.sql (MỞ RỘNG TOÀN DIỆN CHO CẢ TÍNH NĂNG HIỆN TẠI VÀ SẮP CÓ)
-- MÔ TẢ: Bộ Dữ liệu Khởi tạo Mẫu Chuẩn Doanh nghiệp (Enterprise Seed Data)
-- ==============================================================================

-- 1. THỂ LOẠI PHIM (GENRES)
INSERT INTO genres (id, name, slug, description) VALUES
('11111111-0000-0000-0000-000000000001', 'Hành động', 'hanh-dong', 'Phim có nhiều cảnh chiến đấu, rượt đuổi kịch tính, tiết tấu dồn dập'),
('11111111-0000-0000-0000-000000000002', 'Khoa học viễn tưởng', 'khoa-hoc-vien-tuong', 'Khám phá vũ trụ, công nghệ tương lai, du hành thời gian'),
('11111111-0000-0000-0000-000000000003', 'Kinh dị', 'kinh-di', 'Yếu tố giật gân, tâm linh bí ẩn gây sợ hãi hồi hộp'),
('11111111-0000-0000-0000-000000000004', 'Hoạt hình', 'hoat-hinh', 'Phim đồ họa hoạt hình 3D cho gia đình và thanh thiếu niên'),
('11111111-0000-0000-0000-000000000005', 'Hài hước', 'hai-huoc', 'Tình tiết gây cười sảng khoái, châm biếm sâu sắc'),
('11111111-0000-0000-0000-000000000006', 'Tâm lý - Chính kịch', 'tam-ly-chinh-kich', 'Khai thác chiều sâu nội tâm nhân vật, xung đột gia đình và xã hội'),
('11111111-0000-0000-0000-000000000007', 'Lãng mạn', 'lang-man', 'Tình yêu đôi lứa ngọt ngào, cảm xúc sâu lắng')
ON CONFLICT (id) DO NOTHING;

-- 2. CỤM RẠP CHIẾU PHIM (CINEMAS)
INSERT INTO cinemas (id, name, slug, address, ward, district, city, latitude, longitude, phone) VALUES
('22222222-0000-0000-0000-000000000001', 'CGV Vincom Landmark 81', 'cgv-vincom-landmark-81', 'Tầng B1, Vincom Center Landmark 81, 720A Điện Biên Phủ', 'Phường 22', 'Bình Thạnh', 'TP. Hồ Chí Minh', 10.795038, 106.721868, '1900 6017'),
('22222222-0000-0000-0000-000000000002', 'CGV Vincom Center Bà Triệu', 'cgv-vincom-ba-trieu', 'Tầng 6, Vincom Center, 191 Bà Triệu', 'Lê Đại Hành', 'Hai Bà Trưng', 'Hà Nội', 21.011681, 105.849743, '1900 6017'),
('22222222-0000-0000-0000-000000000003', 'Lotte Cinema Keangnam Landmark', 'lotte-cinema-keangnam', 'Tầng 5, Keangnam Landmark Tower, E6 Phạm Hùng', 'Mễ Trì', 'Nam Từ Liêm', 'Hà Nội', 21.017324, 105.783856, '024 3837 8032'),
('22222222-0000-0000-0000-000000000004', 'Galaxy Cinema Nguyễn Du', 'galaxy-cinema-nguyen-du', '116 Nguyễn Du', 'Bến Thành', 'Quận 1', 'TP. Hồ Chí Minh', 10.774591, 106.693821, '1900 2224'),
('22222222-0000-0000-0000-000000000005', 'BHD Star Cineplex Bitexco', 'bhd-star-bitexco', 'Tầng 3 & 4, Tòa nhà Bitexco, 2 Hải Triều', 'Bến Nghé', 'Quận 1', 'TP. Hồ Chí Minh', 10.771612, 106.704253, '1900 2099')
ON CONFLICT (id) DO NOTHING;

-- 3. PHÒNG CHIẾU (HALLS)
INSERT INTO halls (id, cinema_id, name, hall_type, sound_system, projector_type, total_seats, rows_count, cols_count) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Phòng IMAX Laser 01', 'IMAX_LASER', 'IMAX 12.1 Channel', 'IMAX Dual 4K Laser', 108, 9, 12),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Phòng 4DX Cinema 02', 'FOUR_DX', 'Dolby Atmos 7.1', 'Christie 4K Laser', 80, 8, 10),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'Phòng Cinema 01', 'STANDARD_2D', 'Dolby Surround 7.1', 'Barco 2K', 96, 8, 12),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000003', 'Phòng Lotte Hall 01', 'DIGITAL_3D', 'Dolby Atmos', 'Christie 4K', 108, 9, 12),
('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000004', 'Phòng Galaxy Hall 01', 'STANDARD_2D', 'Dolby 7.1', 'Barco Laser', 96, 8, 12)
ON CONFLICT (id) DO NOTHING;

-- 4. TẠO SƠ ĐỒ GHẾ MẪU VẬT LÝ CHO PHÒNG IMAX LASER (HALL 1)
DO $$
DECLARE
    v_hall_id UUID := '33333333-0000-0000-0000-000000000001';
    v_rows TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K'];
    v_r TEXT;
    v_col INT;
    v_seat_type seat_type_enum;
    v_y INT := 1;
BEGIN
    FOREACH v_r IN ARRAY v_rows LOOP
        FOR v_col IN 1..12 LOOP
            IF v_r IN ('A', 'B', 'C', 'D') THEN
                v_seat_type := 'STANDARD';
            ELSIF v_r IN ('E', 'F', 'G', 'H') THEN
                v_seat_type := 'VIP';
            ELSE
                v_seat_type := 'SWEETBOX';
            END IF;

            INSERT INTO seat_templates (hall_id, row_code, seat_number, seat_type, coord_x, coord_y)
            VALUES (v_hall_id, v_r, v_col, v_seat_type, v_col, v_y)
            ON CONFLICT (hall_id, row_code, seat_number) DO NOTHING;
        END LOOP;
        v_y := v_y + 1;
    END LOOP;
END $$;

-- 5. DANH MỤC PHIM BOM TẤN (MOVIES)
INSERT INTO movies (id, title, original_title, slug, overview, poster_url, backdrop_url, trailer_youtube_id, duration_min, release_date, age_rating, director, cast_members, status, rating_average, rating_count) VALUES
('44444444-0000-0000-0000-000000000001', 'Dune: Phần Hai', 'Dune: Part Two', 'dune-phan-hai', 'Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc anh.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80', 'Way9Dexny3w', 166, '2024-03-01', 'T16', 'Denis Villeneuve', ARRAY['Timothée Chalamet', 'Zendaya'], 'NOW_SHOWING', 8.8, 14200),
('44444444-0000-0000-0000-000000000002', 'Oppenheimer', 'Oppenheimer', 'oppenheimer', 'Câu chuyện lịch sử kịch tính về cuộc đời của nhà vật lý lý thuyết J. Robert Oppenheimer.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&auto=format&fit=crop&q=80', 'uYPbbksJxIg', 180, '2023-07-21', 'T18', 'Christopher Nolan', ARRAY['Cillian Murphy', 'Emily Blunt'], 'NOW_SHOWING', 8.9, 21500),
('44444444-0000-0000-0000-000000000003', 'Quật Mộ Trùng Ma', 'Exhuma', 'quat-mo-trung-ma', 'Khai quật ngôi mộ bí ẩn giải phóng thế lực tà ác cổ xưa.', 'https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80', 'dffkY6y8K4o', 134, '2024-03-15', 'T18', 'Jang Jae-hyun', ARRAY['Choi Min-sik', 'Kim Go-eun'], 'NOW_SHOWING', 8.4, 9800),
('44444444-0000-0000-0000-000000000004', 'Avatar 3: Lửa & Tro Tàn', 'Avatar: Fire and Ash', 'avatar-3-lua-va-tro-tan', 'Hành tinh Pandora giới thiệu Tộc Người Tro (Ash People) hung bạo.', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80', 'd9MyW72ELq0', 190, '2025-12-19', 'T16', 'James Cameron', ARRAY['Sam Worthington', 'Zoe Saldana'], 'COMING_SOON', 9.1, 5200)
ON CONFLICT (id) DO NOTHING;

-- 6. LIÊN KẾT PHIM VÀ THỂ LOẠI (MOVIE_GENRES)
INSERT INTO movie_genres (movie_id, genre_id) VALUES
('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
('44444444-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'),
('44444444-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000006'),
('44444444-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000003')
ON CONFLICT (movie_id, genre_id) DO NOTHING;

-- 7. MENU BẮP NƯỚC RẠP PHIM (CONCESSIONS)
INSERT INTO concessions (id, cinema_id, name, category, description, price, image_url) VALUES
('55555555-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Combo Solo Bắp Ngọt', 'COMBO', '1 Bắp rang bơ thơm lừng vị Caramel hoặc Phô mai + 1 Nước ngọt lớn', 89000, 'https://images.unsplash.com/photo-1585647347384-2593bc35786b?w=600'),
('55555555-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Combo Couple Đôi Bạn', 'COMBO', '1 Bắp rang bơ khổng lồ (2 vị tự chọn) + 2 Nước ngọt lớn + 1 Snack khoai tây', 139000, 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=600')
ON CONFLICT (id) DO NOTHING;

-- 8. TÀI KHOẢN NGƯỜI DÙNG MẪU (USERS)
INSERT INTO users (id, full_name, email, phone, password_hash, role, loyalty_points) VALUES
('66666666-0000-0000-0000-000000000001', 'Quản Trị Viên Hệ Thống', 'admin@cinemax.vn', '0901234567', '$2b$10$w6FzV.F0Q1z8R0Qx8fQeAOLX9U2W3x1G9f0Z8r0Qx8fQeAOLX9U2W', 'SUPER_ADMIN', 1500),
('66666666-0000-0000-0000-000000000002', 'Trưởng Rạp Landmark 81', 'manager.landmark@cinemax.vn', '0902345678', '$2b$10$w6FzV.F0Q1z8R0Qx8fQeAOLX9U2W3x1G9f0Z8r0Qx8fQeAOLX9U2W', 'CINEMA_MANAGER', 800),
('66666666-0000-0000-0000-000000000003', 'Nhân Viên Soát Vé Cửa 01', 'staff.scanner1@cinemax.vn', '0903456789', '$2b$10$w6FzV.F0Q1z8R0Qx8fQeAOLX9U2W3x1G9f0Z8r0Qx8fQeAOLX9U2W', 'STAFF', 200),
('66666666-0000-0000-0000-000000000004', 'Nguyễn Văn An (Khách Hàng VIP)', 'an.nguyen@gmail.com', '0912345678', '$2b$10$w6FzV.F0Q1z8R0Qx8fQeAOLX9U2W3x1G9f0Z8r0Qx8fQeAOLX9U2W', 'CUSTOMER', 450)
ON CONFLICT (id) DO NOTHING;

-- 9. SUẤT CHIẾU MẪU (SHOWTIMES)
INSERT INTO showtimes (id, movie_id, hall_id, start_time, end_time, format, base_price, status) VALUES
('77777777-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', '2026-10-10 18:30:00+07', '2026-10-10 21:31:00+07', 'IMAX Laser', 160000, 'OPEN_BOOKING')
ON CONFLICT (id) DO NOTHING;

-- 10. KHỞI TẠO BẢNG TRẠNG THÁI GHẾ ĐỘNG CHO SUẤT CHIẾU 1
INSERT INTO showtime_seats (showtime_id, seat_template_id, status, price)
SELECT 
    '77777777-0000-0000-0000-000000000001',
    st.id,
    CASE 
        WHEN st.row_code = 'F' AND st.seat_number IN (6, 7) THEN 'BOOKED'::seat_status_enum
        ELSE 'AVAILABLE'::seat_status_enum
    END,
    CASE 
        WHEN st.seat_type = 'VIP' THEN 185000
        WHEN st.seat_type = 'SWEETBOX' THEN 360000
        ELSE 160000
    END
FROM seat_templates st
WHERE st.hall_id = '33333333-0000-0000-0000-000000000001'
ON CONFLICT (showtime_id, seat_template_id) DO NOTHING;

-- 11. ĐƠN ĐẶT VÉ VÀ VÉ ĐIỆN TỬ MẪU
INSERT INTO bookings (id, booking_code, user_id, showtime_id, total_amount, discount_amount, final_amount, payment_status, idempotency_key) VALUES
('88888888-0000-0000-0000-000000000001', 'CINE-20261010-VIP99', '66666666-0000-0000-0000-000000000004', '77777777-0000-0000-0000-000000000001', 509000, 0, 509000, 'PAID', 'IDEMP-998877665544-DEMO')
ON CONFLICT (id) DO NOTHING;

INSERT INTO tickets (id, booking_id, showtime_seat_id, ticket_code, qr_code_payload, is_checked_in)
SELECT 
    '99999999-0000-0000-0000-000000000001',
    '88888888-0000-0000-0000-000000000001',
    ss.id,
    'TK-20261010-F6',
    'token_sample_f6',
    FALSE
FROM showtime_seats ss
JOIN seat_templates st ON ss.seat_template_id = st.id
WHERE ss.showtime_id = '77777777-0000-0000-0000-000000000001'
  AND st.row_code = 'F' AND st.seat_number = 6
ON CONFLICT (id) DO NOTHING;

INSERT INTO booking_concessions (booking_id, concession_id, quantity, unit_price, subtotal) VALUES
('88888888-0000-0000-0000-000000000001', '55555555-0000-0000-0000-000000000002', 1, 139000, 139000);

INSERT INTO payments (booking_id, gateway, gateway_transaction_id, amount, status) VALUES
('88888888-0000-0000-0000-000000000001', 'MOMO', 'MOMO_TXN_9988221144', 509000, 'SUCCESS');

-- ==============================================================================
-- DỮ LIỆU SEED CHO CÁC TÍNH NĂNG MỞ RỘNG & TƯƠNG LAI
-- ==============================================================================

-- 12. HẠNG THÀNH VIÊN (MEMBERSHIP_TIERS)
INSERT INTO membership_tiers (tier_name, min_spending, point_multiplier, badge_color, benefits) VALUES
('Bronze', 0, 1.0, '#cd7f32', '["Tích lũy 5% giá trị vé", "Quà sinh nhật bắp nước"]'::jsonb),
('Silver', 2000000, 1.2, '#94a3b8', '["Tích lũy 6% giá trị vé", "1 Vé xem phim 2D miễn phí dịp sinh nhật"]'::jsonb),
('Gold', 5000000, 1.5, '#f59e0b', '["Tích lũy 8% giá trị vé", "Lối đi ưu tiên Fast-track", "Nâng cấp ghế VIP miễn phí"]'::jsonb),
('Diamond', 10000000, 2.0, '#38bdf8', '["Tích lũy 10% giá trị vé", "Phòng chờ thương gia riêng", "Vé Sneak Show bom tấn miễn phí"]'::jsonb)
ON CONFLICT (tier_name) DO NOTHING;

-- 13. MÃ GIẢM GIÁ & VOUCHER (COUPONS)
INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, total_usage_limit, valid_from, valid_to) VALUES
('CINEMAX2026', 'Giảm 20% tối đa 50.000 VNĐ cho đơn vé đầu tiên', 'PERCENTAGE', 20.00, 100000, 50000, 1000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '90 days'),
('DISCOUNT50K', 'Giảm trực tiếp 50.000 VNĐ cho combo bắp nước và vé trên 250.000 VNĐ', 'FIXED_AMOUNT', 50000, 250000, 50000, 500, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- 14. THẺ QUÀ TẶNG ĐIỆN TỬ (GIFT_CARDS)
INSERT INTO gift_cards (card_code, pin_hash, initial_balance, current_balance, sender_user_id, recipient_email, greeting_message, expires_at) VALUES
('GIFT-2026-HAPPY', '$2b$10$w6FzV.F0Q1z8R0Qx8fQeAOLX9U2W3x1G9f0Z8r0Qx8fQeAOLX9U2W', 500000, 500000, '66666666-0000-0000-0000-000000000001', 'an.nguyen@gmail.com', 'Chúc mừng sinh nhật! Thưởng thức một bộ phim bom tấn thật vui nhé!', NOW() + INTERVAL '365 days')
ON CONFLICT (card_code) DO NOTHING;

-- 15. ĐÁNH GIÁ PHIM XÁC THỰC (MOVIE_REVIEWS - VERIFIED BUYER)
INSERT INTO movie_reviews (movie_id, user_id, booking_id, rating_score, title, content, is_verified_buyer, likes_count) VALUES
('44444444-0000-0000-0000-000000000001', '66666666-0000-0000-0000-000000000004', '88888888-0000-0000-0000-000000000001', 10, 'Tuyệt phẩm điện ảnh thế kỷ!', 'Âm thanh phòng IMAX Landmark 81 rung chuyển từng tế bào. Hình ảnh sa mạc Arrakis quá choáng ngợp!', TRUE, 42)
ON CONFLICT (movie_id, user_id) DO NOTHING;

-- 16. THEO DÕI MỞ VÉ SỚM (MOVIE_WATCHLISTS)
INSERT INTO movie_watchlists (user_id, movie_id, notify_on_presale) VALUES
('66666666-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000004', TRUE)
ON CONFLICT (user_id, movie_id) DO NOTHING;

-- 17. ĐẶT VÉ THEO NHÓM (GROUP_BOOKINGS)
INSERT INTO group_bookings (leader_user_id, showtime_id, group_name, invite_code, total_seats_target, expires_at) VALUES
('66666666-0000-0000-0000-000000000004', '77777777-0000-0000-0000-000000000001', 'Nhóm bạn thân xem Dune 2', 'DUNE2-FRIENDS', 4, NOW() + INTERVAL '2 hours')
ON CONFLICT (invite_code) DO NOTHING;
