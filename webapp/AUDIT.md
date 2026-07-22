# Аудит webapp — что улучшить

Дата: 2026-07-22

Приоритизированный список по реальной критичности для продакшена.

---

## 🔴 Критично — ломает пользовательские сценарии

### 1. Корзина — полностью заглушка

**Файлы:** `src/api/cart/cart.api.ts`, `src/pages/Cart/CartPage.tsx`

`cart.api.ts` всегда возвращает пустую корзину. Мутации `add/remove/updateQty` ничего не делают, но UI (`CartPage`, `QtyStepper` на Product) уже есть.

**Следствие:** пользователь не может добавить букет в корзину; страница `/cart` всегда пустая.

**Рекомендация:** либо реализовать cart API на бэкенде и подключить, либо убрать корзину из UI и оставить только flow «заявка → checkout».

---

### 2. Checkout создаёт Request, но редиректит на Orders

**Файлы:** `src/pages/Checkout/CheckoutPage.tsx`, `src/pages/Orders/OrdersPage.tsx`

`CheckoutPage` вызывает `POST /requests`, а после успеха делает `navigate('/orders')`. Страница Orders показывает `GET /orders/my` — это другая сущность.

**Следствие:** после оформления пользователь не видит свой заказ в списке.

**Рекомендация:** редирект на экран заявок или показывать и requests, и orders; лучше — единый flow «заявка → заказ» с понятным статусом.

---

### 3. «Повторить заказ» — эндпоинта нет

**Файлы:** `src/api/orders/orders.api.ts`, `src/pages/Profile/ProfilePage.tsx`

`ordersApi.repeat()` → `POST orders/my/:id/repeat`, на бэкенде такого route нет.

**Следствие:** кнопка в профиле всегда падает с ошибкой.

**Рекомендация:** удалить кнопку или реализовать endpoint.

---

### 4. Login вне Telegram — фейковый токен

**Файлы:** `src/api/auth/auth.api.ts`, `src/pages/Login/LoginPage.tsx`

`authApi.loginWithTelegramWidget` при отсутствии `POST /auth/telegram-widget` возвращает `tg_widget_${user.id}`. Бэкенд такой JWT не примет.

**Следствие:** вход через браузер выглядит успешным, но API отвечает 401.

**Рекомендация:** реализовать widget-auth на бэкенде или явно блокировать браузерный вход.

---

### 5. `ProtectedRoute` — только клиентская проверка

**Файл:** `src/App.tsx`

Достаточно `localStorage.auth_token` (любая строка) или наличия `initData` в момент рендера.

**Рекомендация:** полагаться на 401 от API + глобальный redirect на `/login`; не считать `hasToken` достаточным для «авторизован».

---

## 🟠 Высокий приоритет — архитектура и данные

### 6. Каталог — фиктивные данные поверх gallery

**Файл:** `src/api/gallery/gallery.mappers.ts`

Подставляет всем работам:
- одну категорию `bouquets`
- `in_stock: true`
- фиктивный вариант «Стандарт» за $50
- `price_display: 'Индивидуальный бюджет'`

Фильтр «Акции» в каталоге не работает — `is_sale` нигде не мапится из `IPortfolioItem`.

**Рекомендация:** расширить Prisma/API gallery нужными полями или упростить UI под реальную модель портфолио.

---

### 7. `galleryApi.getById` — загружает весь список

**Файл:** `src/api/gallery/gallery.api.ts`

Для одного продукта вызывается `list()` и поиск в массиве.

**Рекомендация:** `GET gallery/:id` на бэкенде + отдельный query hook.

---

### 8. Дублирование AI-чата

**Файлы:** `src/pages/Home/HomePage.tsx`, `src/pages/AiGuide/AiGuidePage.tsx`, `src/api/ai/ai.api.ts`

- **Home** — локальный чат на `setTimeout` + regex
- **AiGuide** — отдельная страница с API-заглушкой

Два разных UX, ни один не подключён к реальному AI.

**Рекомендация:** один компонент `AiChat` + один API; на Home — ссылка на `/ai-guide` или встроенный виджет.

---

### 9. `App.tsx` перегружен shell-логикой

**Файл:** `src/App.tsx`

В одном файле: lazy routes, `BottomNav`, `DesktopHeader`, `LoadingFallback`, `ProtectedRoute`, splash timer, cart stub.

**Рекомендация:**

```text
src/app/
  AppShell.tsx
  BottomNav/
  DesktopHeader/
  ProtectedRoute.tsx
  LoadingFallback.tsx
```

---

### 10. Нет обработки ошибок запросов на уровне UI

Нигде не используется `isError` / `error` из React Query. При падении API — вечный spinner или пустой экран.

**Рекомендация:** общий `QueryErrorState` + retry; на страницах — явные error boundaries.

---

### 11. Checkout → Orders vs Profile orders — разный UX

После фикса профиля Orders и Profile показывают `IOrder`, но checkout создаёт `IRequest`. Пользователь видит разные сущности в разных местах без объяснения.

**Рекомендация:** унифицировать отображение жизненного цикла заказа для пользователя.

---

## 🟡 Средний приоритет — производительность и UX

### 12. Leaflet тянется в основной бандл (~154 KB, gzip ~45 KB)

**Файлы:** `src/pages/Checkout/CheckoutPage.tsx`, `src/pages/Profile/components/ProfileAddressSection/`

Карта нужна не на всех страницах.

**Рекомендация:** `React.lazy` для map-компонентов + dynamic import `leaflet` только при открытии секции с картой.

---

### 13. Splash screen блокирует UI 2.4 с всегда

**Файл:** `src/App.tsx`

Даже при быстрой загрузке данных пользователь ждёт фиксированный таймер.

**Рекомендация:** скрывать splash после `Promise.all([minTime, criticalQueries])` или сократить до ~1 с.

---

### 14. Hero-картинка с Unsplash на Home

**Файл:** `src/pages/Home/HomePage.tsx`

Внешний URL без fallback → лишний DNS/TLS, риск при блокировке CDN.

**Рекомендация:** положить в `public/` или Cloudinary.

---

### 15. Nominatim без User-Agent и rate limit

**Файлы:** `src/pages/Checkout/CheckoutPage.tsx`, `src/pages/Profile/components/ProfileAddressSection/`

Прямые запросы с клиента в `nominatim.openstreetmap.org`. OSM требует User-Agent и лимитирует запросы.

**Рекомендация:** прокси через бэкенд или другой geocoding provider.

---

### 16. Дефолтные координаты карты — несогласованы

- `ProfileAddressSection`: Бали (`-8.409518, 115.188919`)
- `CheckoutPage`: Москва

**Рекомендация:** единый `DEFAULT_MAP_CENTER` (Москва) в `shared/constants`.

---

### 17. `ArticlePage` всегда 404

**Файл:** `src/pages/Article/ArticlePage.tsx`

`articleNotImplemented()` всегда reject. Маршрут `/article/:id` есть, контента нет.

**Рекомендация:** убрать route или реализовать articles API.

---

### 18. Нет тестов

В `webapp/` нет ни одного test-файла.

**Рекомендация:** минимум — unit для `orderFormat`, `galleryToProduct`, e2e smoke на login/checkout flow.

---

## 🟢 Низкий приоритет — техдолг и чистка

### 19. Мёртвые типы

Не используются в runtime:
- `IProfileLegacyOrder`, `ILegacyOrderLineItem`
- `IStatusTone`
- `ITeamMember`
- `IOrderListItem`
- `TLegacyOrderStatus`
- `IGalleryItem` (alias)

**Рекомендация:** удалить из `src/types/` и `src/types/index.ts`.

---

### 20. Admin CRUD в gallery API

**Файл:** `src/api/gallery/gallery.api.ts`

`create/update/delete/upload` — остатки админки, в webapp не вызываются.

**Рекомендация:** удалить из webapp API-слоя.

---

### 21. Глобальный CSS ~620 строк

**Файлы:** `src/index.css`, `src/App.css`

Содержат layout-классы (`product-card`, `ai-teaser`, `hero-editorial`), хотя страницы уже на CSS Modules.

**Рекомендация:** постепенно переносить в модули страниц; оставить в global только tokens + reset.

---

### 22. `updateCart` prop — мёртвый контракт

**Файлы:** `src/App.tsx`, `src/types/pages.ts`

`PageWithCartProps.updateCart` передаётся в 4 страницы, но `updateCartCount` в App — пустая функция.

**Рекомендация:** убрать prop до реализации cart badge.

---

### 23. Emoji в UI вместо иконок

**Файл:** `src/pages/Profile/ProfilePage.tsx`

`✏️`, `📋`, `🔄`, `🛒`, `💳` — непоследовательно с SVG-иконками в остальном приложении.

**Рекомендация:** заменить на `IconButton` + SVG из `assets/icons`.

---

### 24. Accessibility

- Product cards — `div` + `onClick` вместо `Link`/`button`
- AI chat inputs без `aria-label`
- Нет `ErrorBoundary`
- Splash без `role="status"` / `aria-live`

**Рекомендация:** пройтись по web interface guidelines, добавить семантику и fallback-состояния.

---

### 25. `galleryApi.getCategories` — хардкод

**Файл:** `src/api/gallery/gallery.api.ts`

Всегда одна категория. Фильтр «Акции» (`slug: sale`) никогда не даст результатов.

**Рекомендация:** категории из API или убрать фильтр до появления данных.

---

## Рекомендуемый порядок работ

| # | Задача | Effort |
|---|--------|--------|
| 1 | Определить продуктовый flow: заявка vs корзина vs заказ | решение |
| 2 | Починить checkout redirect (requests ≠ orders) | S |
| 3 | Убрать/реализовать repeat order, cart stub, widget login | M |
| 4 | Error states в React Query | S |
| 5 | Вынести App shell в `src/app/` | S |
| 6 | Lazy-load Leaflet | S |
| 7 | Почистить типы и мёртвый API | S |
| 8 | Унифицировать AI chat | M |
| 9 | Реальные поля каталога (цена, акции, категории) | L |
| 10 | Тесты + e2e smoke | M |

**Effort:** S = small (1–2 дня), M = medium (3–5 дней), L = large (1+ неделя)

---

## Что уже хорошо

- Структура страниц в папках с CSS Modules
- Shared UI (`Button`, `Chip`, `OrderStatusPill`, `PageTitle`)
- React Query для серверного состояния
- Telegram `initData` auth flow на бэкенде работает
- Lazy loading страниц + chunk retry
- TypeScript без `@ts-nocheck`
- Сборка и линт проходят

---

## Авторизация (справка)

| Сценарий | Как входит | Что уходит в API | Статус |
|----------|------------|------------------|--------|
| Открыто из Telegram | Автоматически через `initData` | `X-Init-Data` | ✅ Работает |
| Браузер + виджет | `/login` → `localStorage` | `Bearer` (заглушка) | ❌ Бэкенд не принимает |
| Админка | login/password | `Bearer` (настоящий JWT) | Для `admin/`, не для webapp |
