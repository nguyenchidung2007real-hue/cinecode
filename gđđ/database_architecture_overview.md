# 🗄️ CƠ SỞ DỮ LIỆU & KIẾN TRÚC LƯU TRỮ — CINEMAX AI
> **Dự án**: Nền Tảng Mua Vé Xem Phim CineMax AI (Chuẩn Rạp Beta Cinemas)  
> **Thư mục**: `gđđ/` (Tài liệu Giai Đoạn Đầu)  
> **Định dạng**: Bảng Markdown Tiêu Chuẩn GFM (Tương thích 100% Word, Typora, GitHub, VS Code, Notion)

---

## 1. CÁC BẢNG CƠ SỞ DỮ LIỆU CHÍNH (LOGICAL DATABASE TABLES)

Dưới đây là chi tiết các bảng thực thể được chuẩn hóa dạng bảng trực quan:

### 1.1. Bảng `MOVIE` (Danh Mục Phim)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Ví Dụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | **PK** | Không | Mã định danh duy nhất của phim (VD: `dune-2`, `mai`, `exhuma`, `godzilla-kong`) |
| `title` | `VARCHAR(255)` | | Không | Tên phim phát hành tại Việt Nam (VD: *"Dune: Phần Hai"*) |
| `originalTitle` | `VARCHAR(255)` | | Có | Tên gốc của phim (VD: *"Dune: Part Two"*) |
| `durationMinutes` | `INT` | | Không | Thời lượng chiếu phim tính theo phút (VD: `166`, `120`) |
| `ageRating` | `VARCHAR(10)` | | Không | Giới hạn độ tuổi rạp: `P` (Mọi lứa tuổi), `K`, `T13`, `T16`, `T18` |
| `poster` | `VARCHAR(500)` | | Có | Đường dẫn ảnh poster dọc tỉ lệ 2:3 chuẩn rạp |
| `backdrop` | `VARCHAR(500)` | | Có | Đường dẫn ảnh banner ngang tỉ lệ 16:9 |
| `trailerUrl` | `VARCHAR(500)` | | Có | Link nhúng YouTube trailer chính thức |
| `status` | `VARCHAR(32)` | | Không | Trạng thái: `now_playing` (Đang chiếu) hoặc `upcoming` (Sắp chiếu) |

---

### 1.2. Bảng `CINEMA` (Cụm Rạp Chiếu Phim)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Ví Dụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | **PK** | Không | Mã rạp (Mặc định: `beta-cinemas-xuan-thuy`) |
| `name` | `VARCHAR(255)` | | Không | Tên cụm rạp: *"Beta Cinemas Xuân Thủy"* |
| `address` | `VARCHAR(500)` | | Không | Địa chỉ: *"Tầng 4, TTTM Pico Mall, 173 Xuân Thủy, Cầu Giấy"* |
| `city` | `VARCHAR(100)` | | Không | Thành phố: *"Hà Nội"* |
| `totalRooms` | `INT` | | Không | Số lượng phòng chiếu đang vận hành (VD: `3` phòng) |

---

### 1.3. Bảng `ROOM` (Phòng Chiếu Phim)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Ví Dụ |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(128)` | **PK** | Không | Mã kết hợp `cinemaId:roomName` (VD: `beta-cinemas-xuan-thuy:Beta 01`) |
| `cinemaId` | `VARCHAR(64)` | **FK** | Không | Khóa ngoại liên kết tới bảng `CINEMA(id)` |
| `roomName` | `VARCHAR(100)` | | Không | Tên phòng chiếu: *"Phòng Beta 01 (Dolby 7.1)"*, *"Phòng Beta 02"* |
| `totalSeats` | `INT` | | Không | Sức chứa phòng: **102 ghế** (8 hàng ghế đơn A-H + 1 hàng ghế đôi K) |

---

### 1.4. Bảng `SHOWTIME` (Suất Chiếu Phim)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Quy Tắc |
| :--- | :--- | :---: | :---: | :--- |
| `id` | `VARCHAR(64)` | **PK** | Không | Mã suất chiếu: `st-beta-1`, `st-beta-2`,... |
| `movieId` | `VARCHAR(64)` | **FK** | Không | Khóa ngoại tới bảng `MOVIE(id)` |
| `cinemaId` | `VARCHAR(64)` | **FK** | Không | Khóa ngoại tới bảng `CINEMA(id)` |
| `roomName` | `VARCHAR(100)` | | Không | Phòng chiếu tổ chức suất chiếu này |
| `format` | `VARCHAR(50)` | | Không | Định dạng: `2D Phụ Đề`, `2D Lồng Tiếng`, `IMAX Laser` |
| `date` | `DATE` | | Không | Ngày chiếu định dạng `YYYY-MM-DD` theo múi giờ Việt Nam (UTC+7) |
| `time` | `TIME` | | Không | Giờ bắt đầu định dạng `HH:mm` (VD: `09:30`, `19:30`) |
| `durationMinutes` | `INT` | | Không | Thời lượng phim (phút) |
| `totalOccupiedTime`| `INT` | | Không | **Tổng chiếm dụng phòng** = Thời lượng + 10p trailer + 15p dọn dẹp |

---

### 1.5. Bảng `SEAT_LAYOUT` (Danh Mục Sơ Đồ 102 Ghế)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Phân Tầng Giá |
| :--- | :--- | :---: | :---: | :--- |
| `seatId` | `VARCHAR(10)` | **PK** | Không | Mã ghế duy nhất: `A1`..`H12`, `K1`..`K6` |
| `row` | `CHAR(1)` | | Không | Hàng ghế: `A`, `B`, `C`, `D`, `E`, `F`, `G`, `H`, `K` (loại bỏ `J`) |
| `col` | `INT` | | Không | Số thứ tự cột: từ `1` đến `12` (hàng K từ `1` đến `6`) |
| `tier` | `VARCHAR(20)` | | Không | Phân hạng ghế: `standard` (55.000đ), `vip` (75.000đ), `couple` (130.000đ) |
| `isSweetSpot` | `BOOLEAN` | | Không | `true` đối với ghế VIP trung tâm (E5, E6, F5, F6) nhìn màn hình đẹp nhất |

---

### 1.6. Bảng `BOOKING` (Đơn Đặt Vé & Giao Dịch)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Ý Nghĩa |
| :--- | :--- | :---: | :---: | :--- |
| `bookingId` | `VARCHAR(32)` | **PK** | Không | Mã đơn hàng tất định sinh từ SHA-256 của `holdId` (VD: `bk-a1b2c3d4e5f6`) |
| `showtimeId` | `VARCHAR(64)` | **FK** | Không | Khóa ngoại tới suất chiếu `SHOWTIME(id)` |
| `customerName` | `VARCHAR(200)`| | Không | Họ tên khách hàng đặt vé |
| `customerPhone`| `VARCHAR(20)` | | Không | Số điện thoại dùng để nhận vé và xác thực replay an toàn |
| `customerEmail`| `VARCHAR(200)`| | Có | Email nhận vé điện tử |
| `seats` | `JSON / TEXT` | | Không | Mảng danh sách ghế đã chốt: `["A1", "A2"]` hoặc `["K1"]` |
| `concessions` | `JSON / TEXT` | | Có | Chi tiết bắp nước: combo, vị bắp (ngọt/phô mai/caramel), kích cỡ nước |
| `totalAmount` | `INT` | | Không | **Tổng tiền VNĐ do Server tính độc lập**, từ chối giá do client gửi |
| `status` | `VARCHAR(20)` | | Không | Máy trạng thái vé: `pending` → `valid` → `used` (hoặc `void`) |
| `createdAt` | `TIMESTAMP` | | Không | Thời điểm phát sinh đơn đặt vé |

---

### 1.7. Bảng `TICKET` (Vé Điện Tử E-Ticket & Soát Vé)
| Tên Cột | Kiểu Dữ Liệu | Khóa | Cho Phép Rỗng | Mô Tả & Bảo Mật |
| :--- | :--- | :---: | :---: | :--- |
| `bookingId` | `VARCHAR(32)` | **PK, FK** | Không | Mã đơn hàng liên kết `BOOKING(bookingId)` |
| `qrToken` | `VARCHAR(255)`| | Không | Chuỗi mã QR an toàn: `bookingId.HMAC_SHA256(bookingId, SECRET)` |
| `status` | `VARCHAR(20)` | | Không | Trạng thái: `valid` (Còn hạn), `used` (Đã qua cửa), `void` (Đã hủy) |
| `usedAt` | `TIMESTAMP` | | Có | Thời điểm nhân viên rạp quét vé thành công |
| `scannedBy` | `VARCHAR(64)` | | Có | Mã nhân viên hoặc ID thiết bị máy quét tại cửa |

---

## 2. THIẾT KẾ CƠ SỞ DỮ LIỆU REDIS HIỆU NĂNG CAO (REDIS IN-MEMORY KV)

Hệ thống sử dụng Upstash Redis qua REST API để vận hành trong môi trường Serverless:

| Tên Khóa (Key Pattern) | Kiểu Dữ Liệu | Thời Gian Sống (TTL) | Mục Đích Sử Dụng | Thao Tác Nguyên Tử (Atomic Operations) |
| :--- | :--- | :--- | :--- | :--- |
| `cinemax:{<stId>}:seats` | **HASH** | Vĩnh viễn (hoặc hết suất) | Quản lý trạng thái từng ghế. Field: `seatId` (A1..K6), Value: `"held"` hoặc `"booked"` | `HSETNX`, `HDEL`, `HMGET` |
| `cinemax:{<stId>}:hold:<holdId>` | **STRING** (JSON) | 5 phút (Trần cứng 15 phút) | Phiên giữ ghế tạm thời khi khách đang thanh toán. Hết hạn tự thu hồi về `"free"` | Lua Script `HOLD_SEATS`, `RELEASE_HOLD` |
| `cinemax:{<stId>}:booking:<bkId>`| **STRING** (JSON) | Vĩnh viễn | Ghi nhận chốt ghế vĩnh viễn sau thanh toán, đảm bảo tính lũy đẳng (Idempotency) | Lua Script `COMMIT_SEATS` |
| `cinemax:ticket:<bkId>` | **STRING** (JSON) | 30 ngày | Bản ghi vé điện tử đầy đủ (phim, phòng, ghế, bắp nước, QR token) | `SETNX`, `SET`, `GET` |
| `cinemax:ticket:used:<bkId>` | **STRING** | 30 ngày | Khóa phân tán chống quét vé hai lần tại cửa rạp | `SET key "timestamp\|staff" EX 2592000 NX` |
| `cinemax:showtimes:rooms` | **SET** | Vĩnh viễn | Danh sách bucket các phòng chiếu để tra cứu suất chiếu | `SADD`, `SMEMBERS` |
| `cinemax:showtimes:room:<hash>` | **STRING** (JSON Array) | Vĩnh viễn | Danh sách toàn bộ suất chiếu của 1 phòng chiếu duy nhất | Khóa phân tán `SET key:lock ... NX PX 8000` |
| `cinemax:showtime:<stId>` | **STRING** (JSON) | Vĩnh viễn | Tra cứu suất chiếu trực tiếp O(1) theo mã suất chiếu | `GET`, `SET` |
| `cinemax:ratelimit:<ip>:<min>` | **STRING** (Counter) | 60 giây | Bộ lọc giới hạn tần suất request (Rate Limiter) chống DDoS | `INCR`, `EXPIRE` |

---

## 3. MÁY TRẠNG THÁI & CHU TRÌNH AN TOÀN (STATE MACHINES)

### 3.1. Chu Trình Trạng Thái Ghế
```
[Ghế Trống (Free)]
       │
       ▼  (POST /api/seats - Lua Script kiểm tra tất cả ghế phải Free)
[Đang Giữ (Held)] ──(Hết 5 phút TTL hoặc Quá trần cứng 15 phút)──> [Ghế Trống (Free)]
       │
       ▼  (Thanh toán thành công -> seatStore.commit())
[Đã Bán (Booked / Sold)] (Khóa vĩnh viễn)
```

### 3.2. Chu Trình Trạng Thái Vé
```
[Tạo vé PENDING] ──(Thanh toán thất bại)──> [Hủy vé VOID]
       │
       ▼  (Thanh toán thành công & Chốt ghế thành công)
[Vé Hợp Lệ (VALID)] ──(Quét mã QR tại cửa)──> [Đã Sử Dụng (USED)]
       │
       ▼  (Hoàn tiền / Đổi suất)
[Hủy vé VOID]
```

---

## 4. TỔNG KẾT CÁC CƠ CHẾ BẢO ĐẢM DỮ LIỆU
1. **Chống Bán Trùng Ghế (Overbooking)**: Thực thi 100% bằng Redis Lua Script, loại bỏ hoàn toàn Race Condition kể cả khi có 50 request cùng chọn 1 ghế trong mili-giây.
2. **Chống Thất Thoát Tài Chính**: Áp dụng quy tắc tạo vé `PENDING` trước khi thu tiền và kích hoạt `VALID` sau khi chốt ghế.
3. **Chống Gian Lận Giá**: Toàn bộ giá vé và combo bắp nước do server tính toán độc lập, từ chối mọi giá do client gửi lên.
4. **Chống Quét Vé Hai Lần**: Lệnh `SET ... NX` đảm bảo 2 máy quét ở 2 cửa khác nhau bấm cùng lúc chỉ 1 máy báo hợp lệ.
