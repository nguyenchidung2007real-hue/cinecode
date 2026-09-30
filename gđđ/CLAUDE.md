# 🎭 CLAUDE.md - Master Instructions for Claude Code CLI

> **Project**: CineMax AI - Smart Cinema & Ticket Booking Web Platform  
> **Repository**: [https://github.com/nguyenchidung2007real-hue/cinecode](https://github.com/nguyenchidung2007real-hue/cinecode)  
> **Methodology**: Vibe Coding with strict Design System & Multi-Agent Protocol

---

## ⚡ Quick Start for Claude Code
Whenever you start a session in this repository:
1. **Always read [AGENT.md](./AGENT.md)** first for full architectural details, component structure, and design rules.
2. **Respect the Smart Mock Fallback**: `src/lib/mockData.ts` must ALWAYS work smoothly without requiring real API keys.
3. **Design System**:
   - Dark Cinema Theme: `#0B0C10`, `#14151B`
   - Accents: Netflix Red `#E50914`, Neon Red `#FF2E4C`, Gold `#FFD700`
   - Rounded corners: `rounded-xl` for cards, `rounded-2xl` for modals.
   - Glassmorphism: `backdrop-blur-md bg-white/5 border border-white/10`.
4. **Never modify core backend/API files** when executing UI-focused goals.
5. **Always verify build**: After modifying components, ensure `npm run build` succeeds without TypeScript errors.

---

## 🎯 Current Sprint Goals & Progress
- [x] **Goal 1**: Mood-Based Discovery (Gợi ý phim theo tâm trạng người xem) -> Done
- [x] **Goal 2**: VietQR / MoMo Payment Simulator (Mô phỏng thanh toán quét mã QR trước khi xuất vé) -> Done
- [x] **Goal 3**: My Tickets Wallet (Ví lưu trữ vé điện tử đã đặt vào LocalStorage) -> Done
- [x] **Goal 4**: Chatbot phát hiện tâm trạng & Đặt vé nhanh (Claude Backend x Antigravity Frontend) -> Done (Build verified 0 errors)
- [x] **Goal 5**: Hugging Face Semantic Search & RAG (`hfRagService.ts`, `/api/search`, `SemanticSearchModal.tsx`) -> Done (Build verified 0 errors)
- [x] **Goal 6**: Vercel Deployment & SEO Optimization (`seo.ts`, `sitemap.ts`, `robots.ts`, `og.png`) -> Done (Build verified 0 errors)
- [x] **Goal 7**: Beta Cinemas Live Crawler & 2 Specialized Dashboards (`/admin` and `/dashboard`) -> Done (Build verified 0 errors)

---

## 🔗 Direct Raw GitHub Links for Claude Code
Since GitHub web scraping may be cached or blocked for directories, fetch files directly from:
- `AGENT.md`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/AGENT.md
- `src/lib/moodDetector.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/lib/moodDetector.ts
- `src/lib/seatRecommender.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/lib/seatRecommender.ts
- `src/lib/hfRagService.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/lib/hfRagService.ts
- `src/lib/betaCrawler.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/lib/betaCrawler.ts
- `src/lib/mockData.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/lib/mockData.ts
- `src/app/api/chat/route.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/api/chat/route.ts
- `src/app/api/search/route.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/api/search/route.ts
- `src/app/api/admin/sync-beta/route.ts`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/api/admin/sync-beta/route.ts
- `src/app/page.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/page.tsx
- `src/app/admin/page.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/admin/page.tsx
- `src/app/dashboard/page.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/app/dashboard/page.tsx
- `src/components/BookingModal.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/components/BookingModal.tsx
- `src/components/AiChatWidget.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/components/AiChatWidget.tsx
- `src/components/SemanticSearchModal.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/components/SemanticSearchModal.tsx
- `src/components/Navbar.tsx`: https://raw.githubusercontent.com/nguyenchidung2007real-hue/cinecode/main/src/components/Navbar.tsx

