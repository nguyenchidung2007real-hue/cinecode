-- ==============================================================================
-- DỰ ÁN: CINEMAX - HỆ THỐNG ĐẶT VÉ RẠP CHIẾU PHIM ĐA CỤM
-- TỆP: database/functions.sql (MỞ RỘNG TOÀN DIỆN CHO TÍNH NĂNG HIỆN TẠI & TƯƠNG LAI)
-- MÔ TẢ: Các Stored Procedures, Functions và Triggers tự động hóa nghiệp vụ
-- ==============================================================================

-- ==============================================================================
-- 1. TRIGGER: TỰ ĐỘNG CẬP NHẬT CỘT updated_at KHI CÓ THAY ĐỔI DỮ LIỆU
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Gắn trigger cho các bảng có cột updated_at
DROP TRIGGER IF EXISTS set_timestamp_cinemas ON cinemas;
CREATE TRIGGER set_timestamp_cinemas BEFORE UPDATE ON cinemas FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_halls ON halls;
CREATE TRIGGER set_timestamp_halls BEFORE UPDATE ON halls FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_movies ON movies;
CREATE TRIGGER set_timestamp_movies BEFORE UPDATE ON movies FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_showtimes ON showtimes;
CREATE TRIGGER set_timestamp_showtimes BEFORE UPDATE ON showtimes FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_showtime_seats ON showtime_seats;
CREATE TRIGGER set_timestamp_showtime_seats BEFORE UPDATE ON showtime_seats FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_users ON users;
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_bookings ON bookings;
CREATE TRIGGER set_timestamp_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_movie_reviews ON movie_reviews;
CREATE TRIGGER set_timestamp_movie_reviews BEFORE UPDATE ON movie_reviews FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();


-- ==============================================================================
-- 2. TRIGGER: TỰ ĐỘNG TÍNH GIỜ KẾT THÚC SUẤT CHIẾU (END_TIME)
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_calculate_showtime_end_time()
RETURNS TRIGGER AS $$
DECLARE
    v_duration_min INT;
    v_turnaround_padding INT := 15; -- 15 phút dọn rạp và chiếu trailer
BEGIN
    SELECT duration_min INTO v_duration_min
    FROM movies
    WHERE id = NEW.movie_id;

    IF v_duration_min IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy thông tin bộ phim có ID %', NEW.movie_id;
    END IF;

    IF NEW.end_time IS NULL OR NEW.end_time <= NEW.start_time THEN
        NEW.end_time := NEW.start_time + ((v_duration_min + v_turnaround_padding) || ' minutes')::INTERVAL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calculate_showtime_end_time_trigger ON showtimes;
CREATE TRIGGER calculate_showtime_end_time_trigger
BEFORE INSERT OR UPDATE OF start_time, movie_id ON showtimes
FOR EACH ROW EXECUTE FUNCTION trigger_calculate_showtime_end_time();


-- ==============================================================================
-- 3. TRIGGER: CHỐNG XUNG ĐỘT LỊCH CHIẾU TRONG CÙNG PHÒNG (COLLISION DETECTION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_prevent_showtime_collision()
RETURNS TRIGGER AS $$
DECLARE
    v_conflicting_showtime RECORD;
BEGIN
    SELECT id, start_time, end_time INTO v_conflicting_showtime
    FROM showtimes
    WHERE hall_id = NEW.hall_id
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND status != 'CANCELLED'
      AND (
          (NEW.start_time < end_time AND NEW.end_time > start_time)
      )
    LIMIT 1;

    IF v_conflicting_showtime.id IS NOT NULL THEN
        RAISE EXCEPTION 'Xung đột lịch chiếu! Phòng chiếu này đã có suất chiếu từ % đến % (Showtime ID: %)',
            v_conflicting_showtime.start_time, v_conflicting_showtime.end_time, v_conflicting_showtime.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_showtime_collision_trigger ON showtimes;
CREATE TRIGGER prevent_showtime_collision_trigger
BEFORE INSERT OR UPDATE OF start_time, end_time, hall_id ON showtimes
FOR EACH ROW EXECUTE FUNCTION trigger_prevent_showtime_collision();


-- ==============================================================================
-- 4. FUNCTION: KHỞI TẠO BẢNG TRẠNG THÁI GHẾ CHO MỘT SUẤT CHIẾU MỚI
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_showtime_seats(
    p_showtime_id UUID
)
RETURNS INT AS $$
DECLARE
    v_hall_id UUID;
    v_base_price DECIMAL(12, 2);
    v_inserted_count INT := 0;
BEGIN
    SELECT hall_id, base_price INTO v_hall_id, v_base_price
    FROM showtimes
    WHERE id = p_showtime_id;

    IF v_hall_id IS NULL THEN
        RAISE EXCEPTION 'Suất chiếu không tồn tại!';
    END IF;

    INSERT INTO showtime_seats (showtime_id, seat_template_id, status, price)
    SELECT 
        p_showtime_id,
        st.id,
        'AVAILABLE'::seat_status_enum,
        CASE 
            WHEN st.seat_type = 'VIP' THEN v_base_price + 25000
            WHEN st.seat_type = 'SWEETBOX' THEN (v_base_price * 2) + 40000
            ELSE v_base_price
        END
    FROM seat_templates st
    WHERE st.hall_id = v_hall_id
      AND st.is_active = TRUE
      AND st.seat_type != 'AISLE'
    ON CONFLICT (showtime_id, seat_template_id) DO NOTHING;

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;
    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 5. FUNCTION: KHÓA GHẾ NGUYÊN TỬ TRONG GIAO DỊCH (ATOMIC SEAT RESERVATION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION reserve_seats_atomic(
    p_showtime_id UUID,
    p_seat_ids UUID[],
    p_user_id UUID,
    p_hold_duration_seconds INT DEFAULT 600
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    reserved_seat_count INT
) AS $$
DECLARE
    v_conflict_count INT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    v_expires_at := NOW() + (p_hold_duration_seconds || ' seconds')::INTERVAL;

    SELECT COUNT(*) INTO v_conflict_count
    FROM showtime_seats
    WHERE showtime_id = p_showtime_id
      AND id = ANY(p_seat_ids)
      AND (
          status = 'BOOKED'
          OR (status = 'HOLD' AND reservation_expires_at > NOW() AND reserved_by_user_id != p_user_id)
      )
    FOR UPDATE;

    IF v_conflict_count > 0 THEN
        RETURN QUERY SELECT FALSE, 'Một hoặc nhiều ghế đã có người khác chọn hoặc đặt trước đó!', 0;
        RETURN;
    END IF;

    UPDATE showtime_seats
    SET status = 'HOLD',
        reserved_by_user_id = p_user_id,
        reservation_expires_at = v_expires_at,
        version = version + 1
    WHERE showtime_id = p_showtime_id
      AND id = ANY(p_seat_ids);

    RETURN QUERY SELECT TRUE, 'Giữ ghế thành công trong 10 phút!', array_length(p_seat_ids, 1);
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 6. FUNCTION: GIẢI PHÓNG TỰ ĐỘNG CÁC GHẾ HẾT HẠN TẠM GIỮ (RECONCILIATION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION release_expired_seat_reservations()
RETURNS INT AS $$
DECLARE
    v_released_count INT;
BEGIN
    UPDATE showtime_seats
    SET status = 'AVAILABLE',
        reserved_by_user_id = NULL,
        reservation_expires_at = NULL,
        version = version + 1
    WHERE status = 'HOLD'
      AND reservation_expires_at <= NOW();

    GET DIAGNOSTICS v_released_count = ROW_COUNT;
    RETURN v_released_count;
END;
$$ LANGUAGE plpgsql;


-- ==============================================================================
-- 7. [TÍNH NĂNG MỚI] TRIGGER: TỰ ĐỘNG CẬP NHẬT ĐIỂM ĐÁNH GIÁ PHIM TỪ REVIEWS
-- Khi có người review, tự động tính lại rating_average và rating_count trong bảng movies
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_update_movie_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_movie_id UUID;
    v_avg DECIMAL(3, 1);
    v_count INT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_movie_id := OLD.movie_id;
    ELSE
        v_movie_id := NEW.movie_id;
    END IF;

    SELECT COALESCE(ROUND(AVG(rating_score), 1), 0.0), COUNT(*)
    INTO v_avg, v_count
    FROM movie_reviews
    WHERE movie_id = v_movie_id
      AND is_approved = TRUE;

    UPDATE movies
    SET rating_average = v_avg,
        rating_count = v_count
    WHERE id = v_movie_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_movie_rating_trigger ON movie_reviews;
CREATE TRIGGER update_movie_rating_trigger
AFTER INSERT OR UPDATE OF rating_score, is_approved OR DELETE ON movie_reviews
FOR EACH ROW EXECUTE FUNCTION trigger_update_movie_rating();


-- ==============================================================================
-- 8. [TÍNH NĂNG MỚI] TRIGGER: TỰ ĐỘNG TÍCH ĐIỂM THÀNH VIÊN KHI THANH TOÁN THÀNH CÔNG
-- Mỗi 10.000 VNĐ tích 1 điểm loyalty (nhân với hệ số hạng thành viên)
-- ==============================================================================
CREATE OR REPLACE FUNCTION trigger_award_loyalty_points()
RETURNS TRIGGER AS $$
DECLARE
    v_points_earned INT;
BEGIN
    -- Chỉ thưởng điểm khi đơn hàng chuyển sang PAID từ trạng thái khác
    IF NEW.payment_status = 'PAID' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'PAID') THEN
        -- Quy tắc: 10.000 VNĐ = 1 điểm
        v_points_earned := FLOOR(NEW.final_amount / 10000);

        IF v_points_earned > 0 THEN
            -- Cộng điểm vào bảng users
            UPDATE users
            SET loyalty_points = loyalty_points + v_points_earned
            WHERE id = NEW.user_id;

            -- Ghi sổ cái giao dịch điểm thưởng
            INSERT INTO user_loyalty_transactions (user_id, booking_id, points_delta, transaction_type, description)
            VALUES (NEW.user_id, NEW.id, v_points_earned, 'BOOKING_EARN', 'Tích điểm từ đơn hàng ' || NEW.booking_code);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS award_loyalty_points_trigger ON bookings;
CREATE TRIGGER award_loyalty_points_trigger
AFTER UPDATE OF payment_status ON bookings
FOR EACH ROW EXECUTE FUNCTION trigger_award_loyalty_points();
