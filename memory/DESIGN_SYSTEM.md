# fabrika.flo — Editorial Design System

Unified across both frontends of the project:

## Palette
- **Ivory canvas** `#F5F1EA` (admin `bg-primary`) / `#FDFBF7` (webapp bg + cards)
- **Wine primary** `#6A1A2B` (hover `#4F121F`, soft `#8C273B`)
- **Champagne accent** `#D5B47B` (soft tint `#F2E8D5`, deep `#C29E5F`)
- **Ink text** `#282321`, soft ink `#736862`, hairline `#E8DFD5`
- **Sage support** `#7A8B6F` (success)
- **Error** `#B53D3D`

## Typography
- **Display**: `Fraunces` (editorial serif, weights 300/400 + italic)
- **Sans**: `Manrope` (300/400/500/600/700) — uppercase eyebrow letter-spacing 0.22–0.28em

## Frontends
| App | Path | Vite port | Purpose |
| --- | --- | --- | --- |
| `webapp` | `/app/webapp/` | 5173 | Telegram Mini App (mobile-first) |
| `fabrikaflo` | `/app/fabrikaflo/` | 5174 | Admin panel (desktop-first) |
| `fabrikaflo_bot` | `/app/fabrikaflo_bot/` | 3000 | Fastify + Prisma backend |

Both frontends share the same tokens/fonts/spacing/aesthetics so the whole product feels
like one editorial magazine surface.

## Iteration 5 (2026-01-20) — OrdersPage cards + Gallery/Team page-headers
- **`src/index.css`** — added new reusable classes:
  - `.card-editorial` (kanban/detail cards on white with hover-lift + champagne border)
  - `.card-thumb` (4:3 image slot with `.thumb-badge` overlay pill)
  - `.status-pill` + variants `--info / --sage / --warn / --gold / --ok / --err`
  - `.card-detail` (row with uppercase-eyebrow label + value, `.v.serif`, `.v.number`)
  - `.page-header.with-action` (page-header + right-aligned button)
  - `.section-eyebrow` (uppercase group label + italic count) — for Team roles
- **`src/pages/OrdersPage/OrdersPage.tsx`** — full refactor of `renderOrderCard` header + thumb + details:
  - Replaced coloured 4px `borderLeft` with `.card-editorial` (subtle hairline everywhere)
  - Extracted status color helper `getStatusPillClass` → uses new `.status-pill--<variant>` classes
  - Details block: `.card-detail` rows with uppercase eyebrow labels («Бюджет», «Состав», «Открытка», «Референс», «Куда»)
  - Budget number in italic Fraunces (`.v.number`)
  - Wishes/postcard shown as italic serif quotes «…» (`.v.serif`)
  - Removed emojis: 👤 (client), 💰 (budget), 🌿 (composition), 💌 (postcard), 📷 📋 (reference photo), 🚴 (courier), 📝 (comment), ⚠️ (client feedback), 🚗 🚚 📅 (delivery info)
- **`src/pages/GalleryPage/GalleryPage.tsx`** — `.page-header.with-action` + editorial `.empty-state` with `PeonyIcon` for empty portfolio, removed all 📸 hints inside upload boxes.
- **`src/pages/TeamPage/TeamPage.tsx`** — `.page-header.with-action`, editorial `.empty-state` with `PeonyIcon`, `.section-eyebrow` with italic count for Administrators/Couriers groups, role labels now use `.status-pill--warn` (admin) / `.status-pill--sage` (courier), Telegram-link status also in uppercase letterspaced style.
- **`src/pages/LoginPage/LoginPage.tsx`** — removed lone ⚠️ before error message (cleanup).

## Next Action Items
- Полный e2e прогон через testing_agent, когда backend снова стабильно запущен (Postgres после ре-старта пода — нужно re-migrate + re-seed)
- Реализовать `GET /api/fabrika/articles` на backend (сейчас в webapp `api.getArticle` бросает 'Not implemented')
- LLM-интеграция для AI-флориста (заменить mock-ответы на реальные)
- Mobile-адаптация admin-панели (сейчас desktop-first: 260px sidebar + 4-col kanban ломается на планшетах)
