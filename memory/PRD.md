# fabrika.flo — Telegram Mini App (webapp)

## Original problem statement
Пользователь попросил полностью переработать дизайн mini-приложения `/app/webapp/` — Telegram Mini App цветочного магазина элитных / оригинальных / единичных букетов «fabrika.flo — цветочный цех».

## User choices (verbatim)
- **Палитра**: Романтический editorial — слоновая кость + бордо/винный + акцент шампань/золото
- **Типографика**: Модный современный (editorial serif + clean sans)
- **Бренд**: `fabrika.flo` — «цветочный цех»
- **Splash**: элегантная монограмма + анимированный флористический SVG-мотив
- **Скоуп**: полная переделка компоновки каждой страницы

## Design system implemented
- **Palette (tokens в `src/index.css`)**
  - Ivory: `#FDFBF7`, warm ivory `#F5EFE7`, cream `#EFE6D9`
  - Wine primary: `#6A1A2B` (hover `#4F121F`, soft `#8C273B`)
  - Champagne accent: `#D5B47B` (soft tint `#F2E8D5`, deep `#C29E5F`)
  - Ink text: `#282321`, soft ink `#736862`, hairlines `#E8DFD5`
  - Legacy vars (`--gold`, `--green-dark`, `--glass`, `--emerald`) ре-маппированы на новые токены, чтобы вся кодовая база авто-обновилась.
- **Typography**: Fraunces (display, italic) + Manrope (sans, uppercase eyebrow)
- **Компоненты**: pill-primary + sharp-secondary кнопки, editorial product-cards (aspect 4:5), chips для фильтров, glassmorphic bottom nav на ivory, hairline dividers с botanical dot
- **Splash**: SVG-пион с self-drawing анимацией (stroke-dasharray 900 → 0) + курсивная монограмма `f.f` + tagline «цветочный цех», всего ~2.4с

## Pages fully redesigned
1. **Splash** (`App.jsx`) — editorial монограмма + анимированный пион SVG (заменил Будду)
2. **Home** (`pages/Home.jsx`) — editorial hero «Букет как жест, а не как подарок» + callout (2ч / 100% / 7 дн. / 1:1) + процесс i/ii/iii/iv + сетка портфолио + встроенный AI-флорист
3. **Catalog** (`pages/Catalog.jsx`) — chip-фильтры, section-heading, editorial product cards, warm empty state «пусто»
4. **Product** (`pages/Product.jsx`) — hero image 4:5 с бейджем `№ XXX`, editorial eyebrow «Авторский букет», курсивный заголовок, chip-варианты, price/qty в hairline-блоке, admin edit сохранён
5. **Cart** (`pages/Cart.jsx`) — hairline list, курсивные цены, pill-qty stepper, empty-state
6. **Checkout** (`pages/Checkout.jsx`) — секции с eyebrow, chip-поводы, delivery/pickup toggle, leaflet-карта с ивори-маркером, referens-загрузка
7. **Article** (`pages/Article.jsx`) — editorial блог: centered title, italic subhead, hairline separators, drop-quote-стиль
8. **Login** (`pages/Login.jsx`) — монограмма-карта, tagline, TG widget
9. **Profile** (`pages/Profile.jsx`) — page-title, editorial referral card на ivory (убраны тёмные градиенты)
10. **AiGuide** (`pages/AiGuide.jsx`) — светлый чат, курсивный заголовок «Цифровой флорист», wine bubble для user / ivory для AI
11. **Admin** (`pages/Admin.jsx`) — унаследовал новую палитру и типографику через ре-мап CSS-токенов (не переписан полностью — сложный CRUD)

## Layout system
- Desktop header (768px+): sticky glass, левая монограмма `fabrika.flo` + subtitle «цветочный цех», центральные nav-ссылки с uppercase-letterspacing, RU/EN toggle
- Bottom nav (мобильный): glass over ivory (blur 22px), wine active bar сверху, uppercase-labels
- Grid: `grid-cols-2` mobile / `grid-cols-4` desktop для каталога, generous spacing

## Assets / images
Hero изображение — https://images.unsplash.com/photo-1572454591674-2739f30d8c40 (премиальный букет пионовидных роз + гортензий)

## Tech stack (unchanged)
- Vite 8 + React 19 + react-router-dom 7 + leaflet + lucide-react
- Base path: `/webapp/` (BrowserRouter получил `basename="/webapp"`)
- API: `src/api.js` — не тронут, вся бизнес-логика сохранена

## Files changed
| File | Type |
| --- | --- |
| `index.html` | Fonts + title + theme-color (ivory) |
| `src/index.css` | Full editorial design system (light theme) |
| `src/App.css` | Hero/section/process/callout/AI-teaser стили |
| `src/App.jsx` | Splash SVG, Header, BottomNav |
| `src/pages/Home.jsx` | Full rewrite |
| `src/pages/Catalog.jsx` | Full rewrite |
| `src/pages/Product.jsx` | Full rewrite |
| `src/pages/Cart.jsx` | Full rewrite |
| `src/pages/Checkout.jsx` | Full rewrite |
| `src/pages/Article.jsx` | Full rewrite |
| `src/pages/Login.jsx` | Full rewrite |
| `src/pages/Profile.jsx` | Targeted fixes (тёмные градиенты, editorial page-title) |
| `src/pages/AiGuide.jsx` | Targeted fixes (chat bubble palette, header) |

## Backlog / suggestions
- P1: Реальное подключение к backend `/api/fabrika/...` — сейчас devServer proxy настроен только на `/products/`, `/cart/`, `/orders/`, `/profile/`, `/admin/`. Стоит расширить.
- P1: Полностью переписать Admin.jsx под editorial-стайл (сейчас унаследовал tokens, но CRUD-таблицы всё ещё в старой компоновке).
- P2: Добавить favorites, share-to-story, реальный AI-эндпоинт для флориста.
- P2: Реальная монтированная страница `/orders` (сейчас есть Orders.jsx, но роут не подключён в App.jsx).

## Testing status
- Скриншот-проверка: Home, Catalog, Login, Checkout (mobile 390×844) — ✅
- Desktop hero (1440×900) — ✅
- Splash SVG анимация (self-drawing peony) — ✅
- Backend API — не запущен в этом окружении, все запросы fail'ятся (ожидаемо, dev-time)

## Auth credentials
Не создавались — Telegram widget использует существующий bot handle `herbalspiritasia_bot` (нужно поменять на новый бот fabrika.flo при деплое).
