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

## Iteration 4 (2026-01-20) — Editorial touches inside pages
- **`src/components/BotanicalIcons.tsx`** (new) — hand-drawn line-art SVG icons: `PeonyIcon`, `DeliveryIcon` (scooter+bouquet crate), `PinIcon`, `VanIcon`, `PickupIcon`. Reused across pages, replaces emojis.
- **`src/index.css`** — added reusable editorial helpers: `.page-header` (eyebrow + italic h1 with hairline), `.editorial-table` (uppercase spaced thead, italic-serif primary cells, champagne row-hover), `.empty-state` (peony icon + italic headline with gold hairline), `.hair-list` (Dashboard list items).
- **`src/pages/DashboardPage`** — full editorial rewrite: page-header with eyebrow, extracted `StatCard` component (uppercase eyebrow → big Fraunces italic number → hairline → hint). Two-list section («Последние заявки» / «Активные доставки») with eyebrow + right-aligned "все заявки" link + `PeonyIcon` / `DeliveryIcon` empty states, replaced emojis 🌸 🚗 📍 with SVG.
- **`src/pages/RequestsPage`** — page-header + `.editorial-table` markup, `PickupIcon`/`VanIcon` replace 🚗/🚚, `.empty-state` with peony replaces plain text, ✅ replaced with uppercase «оформлен» text, comment shown as italic serif quote «…».
- **`src/pages/ClientsPage`** — page-header, editorial table (search input restyled to 13px padding), `PeonyIcon` in empty state (both "not found" and "empty"), Telegram links with champagne underline, italic serif for averageCheck number.
- **`src/pages/OrdersPage`** (Kanban) — page-header, kanban columns re-styled: eyebrow «ЭТАП · 00» → italic serif column title with monochrome icon + 1px hairline underneath (was 2px thick coloured border), replaced 🚗 (delivery address in card) with `PinIcon`, replaced 🚚 (waiting-for-courier line) with `DeliveryIcon`, removed 📅 (time now shown as plain letterspaced ru-RU string).
- **`src/main.tsx`** — `BrowserRouter basename="/fabrikaflo"` (was missing — direct URLs like `/fabrikaflo/requests` used to render Vite 404).

## Next Action Items
- OrdersPage's `renderOrderCard` (~500 lines of the file) — inner cards still use inline styles; adding `.card-editorial` class + status pills would tighten it further. Skipped in this pass to keep scope minimal.
- GalleryPage + TeamPage — same treatment as Requests/Clients (page-header + editorial-table). They already inherit the palette.
