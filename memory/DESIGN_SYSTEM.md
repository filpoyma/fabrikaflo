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

## Iteration 3 (2026-01-20) — Admin palette unified
- **`/app/fabrikaflo/src/index.css`** — remapped every CSS variable to editorial palette (kept legacy names like `--color-sage`, `--btn-primary-bg` — now wine/champagne). Fonts swapped to Fraunces + Manrope. Radii lowered (4–10px) for editorial print feel. Warm ivory shadows.
- **`/app/fabrikaflo/src/components/Sidebar.tsx`** — full rewrite: dark-wine bg, italic monogram `fabrika.flo` with champagne dot, hairline, uppercase spaced nav items, champagne active-state highlight (readable ink text on champagne, not wine-on-wine). Logout pill hovers to champagne.
- **`/app/fabrikaflo/src/pages/TeamPage/TeamPage.tsx`** — role labels: `ADMIN` (wine on champagne tint), `COURIER` (ink on cream) — was blue/green.
- **`/app/fabrikaflo/index.html`** — title + theme-color updated.
- **`/app/fabrikaflo/vite.config.ts`** — port 5174, proxy `/api/fabrika` → `http://127.0.0.1:3000` (real Fastify backend).
- **`/app/fabrikaflo/.env`** — `VITE_API_URL=/api/fabrika` (unified with webapp).

## Next Action Items
- Реальный запуск backend с постоянной БД (Postgres теряется при рестарте пода — если нужно, автоматизировать re-seed скриптом)
- Editorial-глубина в остальных админ-страницах (RequestsPage/OrdersPage table-стили, ClientsPage cards) — они уже унаследовали палитру, но editorial-eyebrows и hairline-разделители усилят единство
- Заменить эмодзи (🌸 🚗) в DashboardPage на SVG-иконки того же стиля что в Sidebar
