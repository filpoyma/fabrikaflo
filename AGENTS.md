# AGENTS.md

## Назначение документа

Этот файл описывает фактическую структуру репозитория `fabrika.flo`, архитектуру приложений, правила размещения кода и основные команды разработки. Он предназначен для разработчиков и AI-агентов, которые меняют код в этом репозитории.

Репозиторий состоит из трёх частей:

1. `fabrikaflo/` — основной административный фронтенд на React + TypeScript + Vite.
2. `fabrikaflo_bot/` — основной API и Telegram-бот на Node.js + Fastify + TypeScript + Prisma + PostgreSQL.
3. `webapp/` — отдельный старый JavaScript-прототип клиентского Telegram Web App. Его не следует смешивать с основной архитектурой без отдельного решения о миграции.

Основной стек нового кода:

- Frontend: React 19, TypeScript, Vite, React Router, TanStack Query, Redux Toolkit, React Redux, `ky`.
- Backend: Node.js 22+, Fastify 5, TypeBox, Fastify Autoload, Prisma 7, PostgreSQL, `pg`, JWT, bcrypt.
- Интеграции: Telegram Bot API через Grammy, Cloudinary для изображений.

---

## Корень репозитория

```text
.
├── AGENTS.md                    # Документация фактической структуры репозитория
├── AGENTS-SKELETON.md           # Универсальный шаблон архитектуры для новых проектов
├── fabrikaflo/                  # Основной React/TypeScript frontend
├── fabrikaflo_bot/              # Fastify API, Telegram bot и Prisma backend
└── webapp/                      # Legacy React/JavaScript-прототип
```

Файлы `.DS_Store`, IDE-настройки и прочие локальные артефакты не являются частью архитектуры и не должны добавляться в коммиты.

---

## Frontend: `fabrikaflo/`

### Назначение

`fabrikaflo` — браузерное административное приложение. Оно отвечает за:

- авторизацию администратора;
- маршрутизацию административных страниц;
- отображение заявок, заказов, клиентов, команды и галереи;
- получение данных через REST API;
- серверное состояние через TanStack Query;
- локальное состояние авторизации через Redux Toolkit;
- переиспользуемые UI-компоненты и визуальные ассеты.

### Дерево frontend

```text
fabrikaflo/
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── eslint.config.js
├── README.md
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── api/
    │   ├── baseApi.ts
    │   ├── queryClient.ts
    │   ├── auth/
    │   │   ├── index.ts
    │   │   ├── auth.api.ts
    │   │   └── auth.mutations.ts
    │   ├── clients/
    │   │   ├── index.ts
    │   │   ├── clients.api.ts
    │   │   └── clients.queries.ts
    │   ├── gallery/
    │   │   ├── index.ts
    │   │   ├── gallery.api.ts
    │   │   ├── gallery.mutations.ts
    │   │   └── gallery.queries.ts
    │   ├── orders/
    │   │   ├── index.ts
    │   │   ├── orders.api.ts
    │   │   ├── orders.mutations.ts
    │   │   └── orders.queries.ts
    │   ├── requests/
    │   │   ├── index.ts
    │   │   ├── requests.api.ts
    │   │   ├── requests.mutations.ts
    │   │   └── requests.queries.ts
    │   └── team/
    │       ├── index.ts
    │       ├── team.api.ts
    │       ├── team.mutations.ts
    │       └── team.queries.ts
    ├── app/
    │   └── providers/
    │       ├── QueryProvider.tsx
    │       └── StoreProvider.tsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   ├── vite.svg
    │   └── icons/
    │       └── *.svg
    ├── components/
    │   └── Sidebar.tsx
    ├── pages/
    │   ├── ClientsPage/ClientsPage.tsx
    │   ├── DashboardPage/DashboardPage.tsx
    │   ├── GalleryPage/GalleryPage.tsx
    │   ├── LoginPage/LoginPage.tsx
    │   ├── OrdersPage/OrdersPage.tsx
    │   ├── RequestsPage/RequestsPage.tsx
    │   └── TeamPage/TeamPage.tsx
    ├── shared/
    │   └── ui/
    │       ├── index.ts
    │       ├── AvatarCircle/
    │       ├── Button/
    │       ├── IconButton/
    │       ├── Modal/
    │       └── SegmentedControl/
    ├── store/
    │   ├── index.ts
    │   └── reducers/
    │       └── auth/
    │           ├── index.ts
    │           ├── auth.reducer.ts
    │           └── selectors.ts
    └── types/
        ├── index.ts
        └── vite-env.d.ts
```

### Точка входа и провайдеры

`src/main.tsx` создаёт React root и подключает провайдеры в следующем порядке:

```text
StrictMode
└── StoreProvider
    └── QueryProvider
        └── BrowserRouter
            └── App
```

Обязанности провайдеров:

- `StoreProvider` подключает Redux store через `react-redux`.
- `QueryProvider` подключает общий экземпляр `QueryClient`.
- `BrowserRouter` предоставляет маршрутизацию.
- `App` решает, показывать ли login-flow или защищённую административную оболочку.

Не следует создавать отдельные экземпляры Redux store или `QueryClient` внутри страниц и компонентов.

### Маршрутизация и авторизация

`src/App.tsx` — центральная точка маршрутизации. Сейчас логика устроена так:

1. Селектор `selectIsAuthenticated` читает auth-состояние Redux.
2. Если пользователь не авторизован, доступны `/login` и redirect всех остальных маршрутов на `/login`.
3. Если пользователь авторизован, отображаются `Sidebar` и контент страницы.
4. Неизвестные защищённые маршруты перенаправляются на `/`.

При добавлении новой административной страницы нужно:

- создать отдельную папку в `src/pages/<Name>Page/`;
- добавить маршрут в `App.tsx`;
- использовать существующие API hooks, а не делать ручные запросы из JSX;
- переиспользовать компоненты из `src/shared/ui`;
- учитывать состояние загрузки, ошибки, пустого результата и успешного действия.

### API-слой frontend

API организован по feature-first принципу:

```text
src/api/<feature>/
├── index.ts              # публичные экспорты feature API
├── <feature>.api.ts      # чистые HTTP-функции
├── <feature>.queries.ts  # useQuery hooks
└── <feature>.mutations.ts# useMutation hooks
```

Не каждая feature обязана иметь все файлы. Например, если у сущности пока нет mutations, файл mutations не создаётся.

`baseApi.ts` — единый HTTP-клиент:

- использует `ky`;
- получает URL из `VITE_API_URL`;
- по умолчанию использует `http://localhost:3000/api/v1`;
- добавляет Bearer token из `localStorage`;
- нормализует сообщение HTTP-ошибки;
- задаёт общий timeout 30 секунд.

`queryClient.ts` — единственный общий TanStack Query client. Текущие defaults отключают refetch при фокусе окна и автоматические retries.

Правила API-слоя:

- HTTP-функции не должны содержать JSX и не должны напрямую менять UI.
- Query/mutation hooks должны жить рядом с API своей feature.
- Страницы используют hooks, а не `fetch`/`ky` напрямую.
- Query keys должны быть стабильными и зависеть от параметров запроса.
- После mutation нужно инвалидировать только затронутые query keys.
- Типы ответа API должны быть явными.
- Ошибки должны доходить до страницы в предсказуемом виде.

### Redux

Redux предназначен для небольшого глобального клиентского состояния, которое действительно нужно нескольким частям приложения. Серверные коллекции и результаты REST-запросов хранятся в TanStack Query, а не в Redux.

Текущая структура:

```text
src/store/
├── index.ts
└── reducers/
    └── auth/
        ├── auth.reducer.ts
        ├── selectors.ts
        └── index.ts
```

`store/index.ts` должен содержать только сборку store и типы `RootState`/`AppDispatch`.

Каждый slice оформляется отдельной папкой:

```text
reducers/<slice>/
├── <slice>.reducer.ts
├── selectors.ts
└── index.ts
```

`index.ts` slice экспортирует actions, reducer и selectors. Компоненты должны импортировать actions/selectors из slice, а не читать поля state анонимными функциями по всему приложению.

Auth slice хранит:

- `token: string | null`;
- `user: IUser | null`.

Auth actions:

- `setCredentials` сохраняет token и user в Redux и `localStorage`;
- `logout` очищает Redux state и `localStorage`.

Auth selectors:

- `selectAuthToken`;
- `selectAuthUser`;
- `selectIsAuthenticated`.

При добавлении slice не следует помещать его реализацию обратно в `store/index.ts`.

### Pages, components и shared UI

`pages/` содержит route-level компоненты. Страница может координировать запросы, состояние фильтров и композицию секций, но не должна превращаться в универсальный UI-компонент.

`components/` содержит крупные application-level компоненты, которые могут быть нужны нескольким страницам. Сейчас здесь находится `Sidebar`.

`shared/ui/` содержит переиспользуемые визуальные primitives:

- `Button` — кнопки и варианты их размеров/состояний;
- `IconButton` — кнопка с иконкой;
- `Modal` — модальное окно;
- `AvatarCircle` — отображение avatar/fallback;
- `SegmentedControl` — переключатель вариантов.

Каждый UI-компонент обычно располагается в своей папке и имеет:

```text
ComponentName/
├── ComponentName.tsx
└── index.ts
```

Если у компонента есть локальные стили, они хранятся рядом с ним, как у `Modal/Modal.css`.

### Типы frontend

Общие доменные интерфейсы находятся в `src/types/index.ts`. В него не следует помещать типы, которые используются только одним компонентом или feature API.

Правила размещения типов:

- тип одной API feature — рядом с её API либо в доменном types-файле;
- общий доменный тип — в `src/types`;
- пропсы одного компонента — рядом с компонентом;
- тип Redux state — рядом со slice;
- типы, сгенерированные Prisma/backend, не копируются вслепую без проверки формата JSON API.

### Стили и assets

- глобальные стили находятся в `src/index.css`;
- стили приложения — в `src/App.css`;
- SVG/PNG, импортируемые из TypeScript, находятся в `src/assets`;
- публичные файлы, доступные по URL без импорта, находятся в `public`;
- SVG подключаются через `vite-plugin-svgr` и могут использоваться как React-компоненты.

Визуальные токены проекта уже представлены CSS custom properties. Новые компоненты должны использовать существующие переменные, а не создавать случайные цвета и размеры в каждом файле.

---

## Backend: `fabrikaflo_bot/`

### Назначение

Backend объединяет REST API для frontend, Telegram bot workflow и доступ к PostgreSQL. Код организован вокруг Fastify plugins и feature-first business modules.

### Дерево backend

```text
fabrikaflo_bot/
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── prisma.config.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── config.ts
│   ├── logger.ts
│   ├── lib/
│   │   └── errors.ts
│   ├── plugins/
│   │   ├── external/
│   │   │   ├── access-log.ts
│   │   │   ├── cloudinary.ts
│   │   │   ├── cors.ts
│   │   │   ├── env.ts
│   │   │   ├── helmet.ts
│   │   │   ├── multipart.ts
│   │   │   ├── prisma.ts
│   │   │   └── sensible.ts
│   │   └── app/
│   │       ├── auth/index.ts
│   │       ├── bot/
│   │       │   ├── index.ts
│   │       │   ├── courier.ts
│   │       │   ├── keyboards.ts
│   │       │   ├── orders.ts
│   │       │   ├── portfolio.ts
│   │       │   ├── utils.ts
│   │       │   └── wizard.ts
│   │       └── system/index.ts
│   └── modules/
│       ├── auth/
│       ├── clients/
│       ├── gallery/
│       ├── orders/
│       ├── requests/
│       └── team/
├── test/
│   └── root.test.ts
└── README.md
```

Generated Prisma client располагается в `src/generated/prisma` после `prisma generate`. Это generated output и не должен редактироваться вручную.

### Запуск приложения

`src/server.ts` — production/dev entrypoint:

1. вызывает `buildApp()`;
2. ждёт `app.ready()`;
3. запускает Fastify на `app.config.PORT` и `app.config.HOST`;
4. обрабатывает `SIGINT` и `SIGTERM`;
5. корректно закрывает Fastify, Prisma и connection pool.

`src/app.ts` создаёт Fastify instance и регистрирует слои в строгом порядке:

```text
Fastify instance
├── external plugins       # env, DB, CORS, security, uploads, integrations
├── app plugins             # auth, bot, system, cross-cutting logic
└── business modules        # REST feature modules under API prefix
```

Порядок важен: следующие слои используют decorators, зарегистрированные предыдущими слоями.

### External plugins

`src/plugins/external` — инфраструктурные адаптеры:

- `env.ts` — валидирует и декорирует `fastify.config`;
- `prisma.ts` — создаёт PostgreSQL pool, Prisma adapter и Prisma client, закрывает их в `onClose`;
- `cors.ts` — CORS policy;
- `helmet.ts` — security headers;
- `sensible.ts` — Fastify utility decorators;
- `multipart.ts` — multipart/file uploads;
- `cloudinary.ts` — image hosting integration;
- `access-log.ts` — access logging.

Инфраструктурный plugin должен быть независим от бизнес-модуля настолько, насколько это возможно. Его задача — подключить внешнюю систему и предоставить typed decorator.

Если plugin добавляет Fastify decorator, тип нужно расширить через module augmentation:

```ts
declare module 'fastify' {
  interface FastifyInstance {
    someService: SomeService
  }
}
```

### Configuration

`src/config.ts` — единый источник env-конфигурации. Схема описывается TypeBox и читается через `env-schema`. Конфигурация кэшируется после первой загрузки.

Классы настроек текущего проекта:

- HTTP: `HOST`, `PORT`;
- logging: `LOG_LEVEL`, `LOG_PRETTY`;
- runtime: `NODE_ENV`;
- database: `DATABASE_URL`;
- Telegram: bot token, mode, webhook URL, Mini App URL, admin chat ID;
- security: JWT secret, CORS origins;
- media: Cloudinary credentials.

Новые env-переменные нужно добавлять одновременно в TypeBox schema, документацию и окружение деплоя. Не читать `process.env` напрямую в бизнес-коде.

### Business modules

Каждая бизнес-фича находится в `src/modules/<feature>/`:

```text
modules/<feature>/
├── index.ts       # Fastify plugin, подключает routes
├── routes.ts      # HTTP method + path + schema + handler
├── handlers.ts    # request/reply адаптеры
├── service.ts     # бизнес-логика и Prisma calls
└── schema.ts      # TypeBox request/response schemas
```

Текущие feature modules:

- `auth` — login и current user;
- `clients` — клиенты и связанные данные;
- `gallery` — portfolio/gallery;
- `orders` — заказы;
- `requests` — заявки;
- `team` — пользователи/команда.

Разделение обязанностей:

- `routes.ts` знает HTTP contract и вызывает handler.
- `schema.ts` описывает валидацию входа и сериализацию ответа.
- `handlers.ts` извлекает данные из Fastify request и вызывает service.
- `service.ts` содержит бизнес-правила, запросы к Prisma и orchestration.
- `index.ts` регистрирует feature plugin.

Handler не должен содержать сложную бизнес-логику. Service не должен зависеть от React, frontend query hooks или HTTP UI-состояния.

Для новой feature:

1. создать `src/modules/<feature>`;
2. добавить `index.ts`, `routes.ts`, `handlers.ts`, `service.ts`, `schema.ts`;
3. зарегистрировать route через Fastify Autoload автоматически либо явно, если требуется особый порядок;
4. добавить модели/enum в Prisma schema при необходимости;
5. создать migration;
6. добавить frontend API feature и страницу/компоненты;
7. добавить тесты и обновить документацию.

### API prefix и route naming

Business modules подключаются с префиксом `/api/fabrika`. Конкретный URL формируется из имени module directory и route path.

Пример для `modules/auth/routes.ts`:

```text
POST /api/fabrika/auth/login
GET  /api/fabrika/auth/me
```

Frontend API URL должен совпадать с реальным backend prefix. Если prefix меняется, это нужно синхронно обновить в `baseApi.ts` и документации.

### Authentication and authorization

`src/plugins/app/auth/index.ts` предоставляет:

- `fastify.authenticate` — Fastify preHandler;
- `fastify.requireAdmin` — проверку роли администратора;
- `request.user` — типизированного текущего пользователя.

Поддерживаются два способа идентификации:

1. Telegram Mini App: проверка `x-init-data` и HMAC-подписи.
2. Dashboard/API: Bearer JWT.

Правила:

- приватные endpoints явно используют `preHandler: [fastify.authenticate]`;
- admin-only endpoints дополнительно используют `fastify.requireAdmin`;
- JWT secret должен приходить из окружения и не использовать дефолтное значение в production;
- не логировать токены, пароли и Telegram init data;
- пароль проверять через bcrypt;
- не доверять role, user ID или другим идентификаторам из тела запроса, если они должны быть получены из `request.user`.

### Ошибки

`src/lib/errors.ts` содержит типизированные Fastify errors:

- not found;
- unauthorized;
- forbidden;
- validation;
- conflict;
- rate limit;
- internal.

Глобальный error handler в `app.ts`:

- логирует необработанную ошибку;
- отдельно форматирует AJV validation errors;
- возвращает statusCode, code, error, message;
- скрывает детали 500-ошибок в production;
- показывает подробное сообщение в development.

Бизнес-код должен выбрасывать подходящий typed error, а не вручную формировать одинаковые HTTP-ответы в каждом handler.

### Prisma и база данных

Prisma schema находится в `prisma/schema.prisma`. Используется PostgreSQL и Prisma 7 с `@prisma/adapter-pg`.

Основные модели текущего проекта:

- `User`;
- `Request`;
- `Order`;
- `OrderPhoto`;
- `PortfolioItem`.

Основные правила:

- schema является источником истины для persistence-модели;
- изменения schema сопровождаются migration;
- после изменения schema запускать `prisma generate`;
- не редактировать generated Prisma client;
- сложные связанные операции выполнять через transaction;
- учитывать `onDelete` поведение отношений;
- не возвращать passwordHash и другие секретные поля в API response;
- не помещать Prisma-запросы в routes.

### Telegram bot

`src/plugins/app/bot/` содержит bot-specific orchestration:

- `index.ts` — регистрация бота и lifecycle;
- `wizard.ts` — пошаговые conversation flows;
- `keyboards.ts` — Telegram keyboards;
- `orders.ts`, `courier.ts`, `portfolio.ts` — специализированные сценарии;
- `utils.ts` — bot helper functions.

Bot-код может использовать backend services и Prisma через Fastify decorators, но не должен дублировать доменные правила, уже реализованные в `modules/*/service.ts`.

### Backend scripts

Из `fabrikaflo_bot/`:

```bash
pnpm dev             # node --watch src/server.ts
pnpm start           # запуск сервера
pnpm build           # production TypeScript build
pnpm typecheck       # typecheck без emit
pnpm lint            # ESLint
pnpm test            # Node test runner
pnpm prisma:generate # генерация Prisma client
pnpm db:migrate      # prisma migrate dev
pnpm db:deploy       # prisma migrate deploy
pnpm db:studio       # Prisma Studio
```

---

## Legacy frontend: `webapp/`

`webapp` — отдельное старое приложение на JavaScript/JSX. Оно имеет собственный `package.json`, `package-lock.json`, Vite config, API-файл и набор страниц:

```text
webapp/src/
├── App.jsx
├── main.jsx
├── api.js
├── hooks/
│   ├── useLanguage.jsx
│   └── useTelegram.js
└── pages/
    ├── Admin.jsx
    ├── AiGuide.jsx
    ├── Article.jsx
    ├── Cart.jsx
    ├── Catalog.jsx
    ├── Checkout.jsx
    ├── Home.jsx
    ├── Login.jsx
    ├── Orders.jsx
    ├── Product.jsx
    └── Profile.jsx
```

Новый код следует писать в `fabrikaflo`, если задача относится к административному приложению, либо в `fabrikaflo_bot`, если относится к API/боту. `webapp` изменяется только при явной задаче на legacy Mini App или миграцию.

---

## Общий workflow изменения feature

Для полноценной новой доменной feature рекомендуется следующий порядок:

```text
Требование
  ↓
Prisma schema и migration
  ↓
Backend schema + service + handler + routes
  ↓
Backend test/typecheck
  ↓
Frontend types + api functions
  ↓
Frontend queries/mutations
  ↓
Page/components
  ↓
Frontend build/lint
```

Перед изменением нужно найти существующий аналог и повторить его структуру. Не создавать параллельные способы доступа к API, state или database.

---

## Проверка перед завершением работы

Frontend:

```bash
cd fabrikaflo
pnpm build
pnpm lint
```

Backend:

```bash
cd fabrikaflo_bot
pnpm typecheck
pnpm build
pnpm lint
pnpm test
```

Если изменялась Prisma schema:

```bash
pnpm prisma:generate
pnpm db:migrate
```

В итоговом сообщении нужно указать:

- какие файлы изменены;
- какие проверки выполнены;
- какие проверки невозможно выполнить и почему;
- есть ли миграции или изменения env;
- есть ли известные ограничения.

---

## Правила для AI-агентов

1. Сначала прочитать ближайшие существующие файлы и повторить их стиль.
2. Не перемещать код между frontend и backend без явной необходимости.
3. Не помещать серверное состояние в Redux без причины.
4. Не делать API-запросы напрямую из JSX, если для feature существует API-модуль.
5. Не помещать бизнес-логику в Fastify routes/handlers.
6. Не редактировать generated Prisma client.
7. Не менять `webapp`, если задача относится к основному frontend.
8. Не менять локальные пользовательские файлы и unrelated dirty changes.
9. Перед завершением запускать релевантные typecheck/build/lint/test команды.
10. При изменении контракта API синхронно обновлять backend schema, frontend types и hooks.
