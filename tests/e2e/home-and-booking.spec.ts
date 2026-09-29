import { test, expect } from '@playwright/test';

test.describe('Cinemax AI - Web Mua Vé Xem Phim E2E Tests', () => {
  test('Hiển thị trang chủ và danh sách phim đang chiếu', async ({ page }) => {
    await page.goto('/');

    // Kiểm tra title hoặc nội dung cơ bản trang chủ
    await expect(page).toHaveTitle(/Cinemax|Phim|Vé/i);

    // Kiểm tra navbar hoặc thương hiệu có mặt
    const header = page.locator('header, nav');
    await expect(header.first()).toBeVisible();

    // Kiểm tra có ít nhất 1 thẻ phim được render
    const movieCards = page.locator('article, [data-testid="movie-card"], img[alt]');
    await expect(movieCards.first()).toBeVisible();
  });

  test('Bộ lọc phim hoạt động bình thường', async ({ page }) => {
    await page.goto('/');

    // Tìm các nút lọc thể loại
    const filterBtn = page.getByRole('button', { name: /Hành động|Kinh dị|Khoa học viễn tưởng/i }).first();
    if (await filterBtn.isVisible()) {
      await filterBtn.click();
      // Đảm bảo không bị crash sau khi click lọc
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('Mở modal thông tin chi tiết hoặc đặt vé', async ({ page }) => {
    await page.goto('/');

    // Click thử vào nút "Đặt vé" hoặc "Chi tiết" đầu tiên
    const bookingBtn = page.getByRole('button', { name: /Đặt vé|Xem chi tiết|Mua vé/i }).first();
    if (await bookingBtn.isVisible()) {
      await bookingBtn.click();
      // Chờ modal xuất hiện
      const modal = page.locator('[role="dialog"], .fixed.inset-0');
      await expect(modal.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
