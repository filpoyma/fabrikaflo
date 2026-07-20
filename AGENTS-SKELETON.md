# AGENTS-SKELETON.md

## Назначение

Это универсальный шаблон архитектуры для новых проектов на стеке:

- React + TypeScript + Vite;
- React Router;
- TanStack Query для server state;
- Redux Toolkit для небольшого client/global state;
- Fastify + TypeScript;
- Fastify Autoload и plugins;
- TypeBox для runtime validation и Fastify schemas;
- Prisma + PostgreSQL;
- JWT/bcrypt для dashboard authentication;
- Telegram Bot API/Grammy при необходимости;
- Cloudinary или другой media provider при необходимости.

Файл намеренно не содержит названий конкретного продукта, доменных сущностей и бизнес-терминов. При создании проекта нужно заменить только placeholders (`<project>`, `<feature>`, `<Entity>`, `<PREFIX>`) и сохранить архитектурные границы.

---

## Базовая структура монорепозитория

```text
.
├── AGENTS.md
├── AGENTS-SKELETON.md
├── frontend/                  # React + TypeScript административное приложение
└── backend/                   # Fastify API, integrations и optional bot
```

Если нужны публичный Telegram Mini App и административная панель, они должны иметь отдельные apps и отдельные package manifests.

---

## Frontend blueprint

### Рекомендуемое дерево

```text
frontend/
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
│   └── static-assets
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── App.css
    ├── index.css
    ├── app/
    │   ├── providers/
    │   │   ├── StoreProvider.tsx
    │   │   └── QueryProvider.tsx
    │   └── config.ts
    ├── api/
    │   ├── baseApi.ts
    │   ├── queryClient.ts
    │   └── <feature>/
    │       ├── index.ts
    │       ├── <feature>.api.ts
    │       ├── <feature>.queries.ts
    │       └── <feature>.mutations.ts
    ├── assets/
    │   ├── icons/
    │   └── images/
    ├── components/
    │   └── <ApplicationComponent>.tsx
    ├── pages/
    │   └── <Feature>Page/
    │       ├── <Feature>Page.tsx
    │       └── components/
    ├── shared/
    │   ├── ui/
    │   │   └── <UiPrimitive>/
    │   │       ├── <UiPrimitive>.tsx
    │   │       ├── <UiPrimitive>.css
    │   │       └── index.ts
    │   ├── hooks/
    │   ├── lib/
    │   └── constants/
    ├── store/
    │   ├── index.ts
    │   └── reducers/
    │       └── <slice>/
    │           ├── <slice>.reducer.ts
    │           ├── selectors.ts
    │           └── index.ts
    └── types/
        ├── index.ts
        └── vite-env.d.ts
```

### Frontend dependency boundaries

```text
pages/components
      ↓
api hooks, Redux selectors/actions, shared UI
      ↓
api client / store / shared libraries
      ↓
HTTP API and browser platform
```

Правила:

- `pages` могут импортировать `api`, `store`, `shared` и application components.
- `shared/ui` не импортирует pages, feature API или конкретный business slice.
- `api` не импортирует React components.
- `store` не должен импортировать страницы.
- API response types не должны быть спрятаны внутри JSX.
- Общие утилиты не должны зависеть от конкретной feature без необходимости.

### `main.tsx` и providers

Использовать одну точку создания root и один экземпляр каждого глобального provider:

```tsx
<StrictMode>
  <StoreProvider>
    <QueryProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryProvider>
  </StoreProvider>
</StrictMode>
```

Не создавать `QueryClient` и Redux store внутри render-функций. Если добавляются theme, i18n или notification providers, размещать их в `app/providers` и документировать порядок.

### `App.tsx`

`App.tsx` отвечает за application shell и top-level routing:

- public routes;
- authentication gate;
- protected routes;
- layout/sidebar;
- fallback redirects.

Большие route screens нужно выносить в `pages`. `App.tsx` не должен содержать реализацию таблиц, форм и бизнес-операций.

Рекомендуемая схема:

```text
App
├── unauthenticated route tree
│   └── LoginPage
└── authenticated shell
    ├── Navigation/Layout
    └── protected route tree
        ├── FeaturePageA
        ├── FeaturePageB
        └── FeaturePageC
```

### API client

`src/api/baseApi.ts` должен быть единственным местом настройки HTTP клиента:

- base URL из `VITE_API_URL`;
- общий timeout;
- Authorization header;
- нормализация ошибок;
- общие hooks/interceptors;
- при необходимости обработка 401 и очистка auth state.

Не создавать новый `ky`/`fetch` client в каждой feature. Feature API-функции должны использовать `baseApi`.

### API feature structure

```text
src/api/<feature>/
├── index.ts
├── <feature>.api.ts
├── <feature>.queries.ts
└── <feature>.mutations.ts
```

Назначения:

- `<feature>.api.ts` — async functions, которые знают HTTP endpoints и response/request types.
- `<feature>.queries.ts` — `useQuery` hooks, query keys и query options.
- `<feature>.mutations.ts` — `useMutation` hooks и invalidation после записи.
- `index.ts` — публичный barrel export.

Пример потока данных:

```text
Page
  → useFeatureQuery()
  → queryClient
  → feature.api.ts
  → baseApi
  → Backend route
```

Серверное состояние (`lists`, `details`, loading/error/cache) хранится в TanStack Query. Redux не используется как второй cache для тех же HTTP-данных.

### Redux slice structure

Redux используется для client state: auth session, UI preferences, wizard draft, локальный cart или другой state, который не является нормальным server cache.

```text
src/store/
├── index.ts
└── reducers/<slice>/
    ├── <slice>.reducer.ts
    ├── selectors.ts
    └── index.ts
```

`store/index.ts`:

```ts
import { configureStore } from '@reduxjs/toolkit'
import { featureReducer } from './reducers/feature'

export const store = configureStore({
  reducer: {
    feature: featureReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
```

`<slice>/index.ts` должен экспортировать reducer, actions и selectors. Компоненты используют:

```ts
import { featureActions, selectSomething } from '@/store/reducers/feature'
```

Не экспортировать slice implementation через случайные глубокие пути, если публичный `index.ts` уже существует.

Selectors должны быть именованными и переиспользуемыми:

```ts
export const selectFeatureItems = (state: RootState) => state.feature.items
export const selectIsFeatureReady = (state: RootState) => state.feature.status === 'ready'
```

Если slice взаимодействует с глобальным logout/reset action, описать это через `extraReducers` и не дублировать очистку в каждом компоненте.

### UI components

Shared UI-компонент должен:

- иметь маленький и понятный public API;
- быть независимым от backend feature;
- принимать данные и callbacks через props;
- корректно работать в loading/disabled/error состояниях;
- поддерживать keyboard и accessible labels;
- иметь локальные стили рядом с компонентом.

Feature-specific компонент помещается в `pages/<Feature>Page/components` или `components/<Feature>`, а не в `shared/ui`.

### Типизация

Использовать strict TypeScript и не ослаблять типизацию через `any` без документированной причины.

Размещать типы так:

- component props — рядом с компонентом;
- API request/response — рядом с API feature или в domain types;
- общие domain entities — `src/types`;
- Redux state — в slice;
- form-specific values — рядом с формой.

Не копировать типы backend механически, если frontend API преобразует даты, nullable-поля или имена свойств.

---

## Backend blueprint

### Рекомендуемое дерево

```text
backend/
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.build.json
├── eslint.config.js
├── prisma.config.ts
├── README.md
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
└── src/
    ├── server.ts
    ├── app.ts
    ├── config.ts
    ├── logger.ts
    ├── lib/
    │   ├── errors.ts
    │   ├── result.ts
    │   └── utils.ts
    ├── plugins/
    │   ├── external/
    │   │   ├── env.ts
    │   │   ├── prisma.ts
    │   │   ├── cors.ts
    │   │   ├── helmet.ts
    │   │   ├── sensible.ts
    │   │   ├── multipart.ts
    │   │   └── media.ts
    │   └── app/
    │       ├── auth/index.ts
    │       ├── bot/index.ts
    │       └── system/index.ts
    ├── modules/
    │   └── <feature>/
    │       ├── index.ts
    │       ├── routes.ts
    │       ├── handlers.ts
    │       ├── service.ts
    │       ├── schema.ts
    │       ├── types.ts
    │       └── constants.ts
    └── generated/
        └── prisma/             # generated; не редактировать
```

### Server lifecycle

`server.ts` должен быть тонким entrypoint:

1. создать приложение через `buildApp()`;
2. дождаться `ready()`;
3. вызвать `listen()`;
4. обработать startup errors;
5. обработать SIGINT/SIGTERM;
6. закрыть Fastify и внешние ресурсы.

`app.ts` отвечает за composition root:

```text
create Fastify
  → external plugins
  → app plugins
  → business modules
  → global error handler
  → return app
```

Порядок регистрации должен быть явным и стабильным. Plugin, который использует decorator другого plugin, должен объявить dependency через `fastify-plugin`.

### External plugins

External plugins подключают инфраструктуру и внешние сервисы:

- environment/config;
- database/Prisma;
- CORS;
- security headers;
- multipart;
- media provider;
- access logging;
- rate limiting и прочие cross-cutting concerns.

Каждый decorator должен иметь TypeScript module augmentation. Инициализация и cleanup внешнего ресурса должны находиться в одном plugin.

Пример lifecycle для database plugin:

```text
load config
  → create pool
  → create driver adapter
  → create Prisma client
  → decorate Fastify
  → onClose disconnect client and end pool
```

### Configuration

Все environment variables описываются TypeBox schema и читаются через один `loadConfig()`.

Группировать настройки:

- HTTP/server;
- runtime/environment;
- logging;
- database;
- authentication/security;
- integrations;
- media/storage.

Правила:

- production secrets не должны иметь безопасно выглядящие hardcoded defaults;
- обязательные переменные валидируются при старте;
- бизнес-модули используют `fastify.config`, а не `process.env` напрямую;
- README содержит список переменных и пример `.env.example`;
- логирование секретов запрещено.

### Feature module contract

Каждая feature имеет изолированный модуль:

```text
modules/<feature>/
├── index.ts
├── routes.ts
├── handlers.ts
├── service.ts
└── schema.ts
```

Обязанности:

#### `index.ts`

Fastify plugin feature. Регистрирует `routes` и при необходимости hooks.

#### `routes.ts`

Описывает:

- HTTP method;
- URL path;
- TypeBox schema;
- auth preHandlers;
- handler.

Routes не содержат database queries и бизнес-ветвления.

#### `schema.ts`

Содержит TypeBox schemas для:

- params;
- querystring;
- body;
- response;
- tags/metadata.

Request validation и response serialization должны быть описаны на route level.

#### `handlers.ts`

Адаптирует Fastify request/reply к service API:

- извлекает params/query/body;
- получает authenticated user из request;
- вызывает service;
- возвращает domain result.

Handler не должен превращаться в service.

#### `service.ts`

Содержит бизнес-правила, Prisma queries, transactions, permission checks и orchestration внешних сервисов. Service не знает о React и не форматирует UI-состояния.

### Request flow

Стандартный request flow:

```text
HTTP request
  ↓
Fastify route
  ↓
TypeBox/AJV validation
  ↓
authentication/authorization preHandler
  ↓
handler
  ↓
service
  ↓
Prisma/integration
  ↓
typed response serialization
```

Ошибки проходят через global error handler. Не нужно вручную оборачивать каждый handler в одинаковый `try/catch`, если ошибка может быть обработана Fastify.

### Authentication

Рекомендуемая auth architecture:

```text
auth plugin
├── authenticate(request, reply)
├── requireRole/requireAdmin(request, reply)
└── request.user decorator/type
```

Auth plugin может поддерживать несколько способов входа, например JWT для dashboard и signed init data для Telegram Mini App. Каждый способ должен:

- валидировать подпись/токен;
- получать пользователя из базы;
- устанавливать `request.user`;
- выбрасывать typed Unauthorized/Forbidden errors;
- не доверять пользовательским role/id из body.

Пароли:

- хранить только bcrypt hash;
- никогда не возвращать hash в response;
- не логировать password или token;
- использовать production secret из environment;
- предусмотреть expiration/revocation strategy для JWT.

### Error model

Создать централизованные typed errors:

```text
NotFoundError
UnauthorizedError
ForbiddenError
ValidationError
ConflictError
TooManyRequestsError
InternalError
```

Единый error response должен содержать минимум:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "error": "Bad Request",
  "message": "Readable message"
}
```

Validation errors могут дополнительно содержать `details`. В production не возвращать stack trace, SQL, credentials и внутренние детали 500-ошибок.

### Prisma and PostgreSQL

Правила базы:

- `prisma/schema.prisma` — источник persistence schema;
- schema changes проходят через migration;
- generated client не редактируется вручную;
- connection URL хранится в environment;
- связанные изменения выполняются transaction;
- индексы и unique constraints проектируются вместе с endpoint queries;
- delete behavior отношений задаётся явно;
- response DTO не должен случайно раскрывать секретные поля.

Стандартный flow изменения модели:

```text
edit schema.prisma
  → prisma generate
  → prisma migrate dev
  → update service
  → update TypeBox schema
  → update frontend API types/hooks
  → run tests
```

Seed должен быть идемпотентным или явно документировать, какие данные он пересоздаёт.

### Optional Telegram bot layer

Если проект включает Telegram bot, держать его в `src/plugins/app/bot` и разделять:

```text
bot/
├── index.ts       # registration/lifecycle
├── keyboards.ts   # UI keyboards
├── wizard.ts      # conversation state machine
├── handlers/      # command/callback/message handlers
├── utils.ts
└── <domain>.ts    # сценарии конкретного домена
```

Bot handlers могут вызывать domain services, но не должны дублировать правила, находящиеся в `modules/<feature>/service.ts`.

Состояние conversation должно быть явным: state name, collected data, transition и reset behavior.

### Optional media layer

Загрузка файлов разделяется на:

1. multipart transport plugin;
2. media provider adapter;
3. domain service, который сохраняет URL и связь с entity.

Не смешивать Cloudinary SDK calls с route handler. Provider можно заменить без переписывания всех feature modules.

---

## API contract rules

Backend и frontend изменяются как единый контракт.

При изменении endpoint нужно синхронно обновить:

1. TypeBox request schema;
2. TypeBox response schema;
3. backend service/handler;
4. frontend API function;
5. frontend request/response types;
6. query/mutation invalidation;
7. UI состояния и ошибки;
8. документацию и tests.

Рекомендуемый endpoint style:

```text
GET    /api/<prefix>/<resource>
GET    /api/<prefix>/<resource>/:id
POST   /api/<prefix>/<resource>
PATCH  /api/<prefix>/<resource>/:id
DELETE /api/<prefix>/<resource>/:id
```

Если operation не является обычным CRUD, использовать ясное action name и документировать его.

Dates, nullable fields, enums, pagination и error codes должны быть согласованы на обеих сторонах. Не полагаться на неявное преобразование `Date` в строку.

---

## Naming and imports

Рекомендуемые соглашения:

- folders: `kebab-case` или согласованный feature name;
- React components: `PascalCase`;
- hooks: `useSomething`;
- selectors: `selectSomething`;
- actions: `<slice>Actions.someAction`;
- API files: `<feature>.api.ts`, `.queries.ts`, `.mutations.ts`;
- backend modules: lowercase feature directory;
- backend services: `create<Feature>Service` либо единый согласованный service export.

Импорты:

- использовать barrel `index.ts` для публичного API feature;
- не импортировать внутренние implementation-файлы через глубокие пути из внешней feature;
- type-only imports оформлять как `import type`;
- сохранять выбранную в проекте стратегию расширений `.ts`/`.tsx`;
- не создавать циклические runtime imports между store и pages.

---

## Testing and verification

Минимальный набор проверок для frontend:

```bash
pnpm build
pnpm lint
```

Минимальный набор для backend:

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm test
```

Для database changes:

```bash
pnpm prisma:generate
pnpm db:migrate
```

Тестировать минимум:

- auth success/failure;
- authorization boundaries;
- validation errors;
- not found/conflict cases;
- service business rules;
- query invalidation после mutation;
- loading/error/empty UI states.

---

## Security checklist

- [ ] Production secrets находятся только в environment/secret manager.
- [ ] JWT secret не имеет дефолтного слабого значения.
- [ ] Пароли хранятся только в bcrypt hash.
- [ ] Auth и role checks выполняются на backend.
- [ ] Frontend route guard не считается механизмом безопасности.
- [ ] CORS ограничен реальными origins в production.
- [ ] File uploads ограничены size, mime type и destination.
- [ ] Ошибки не раскрывают SQL, stack traces, tokens или credentials.
- [ ] Логи не содержат password, JWT и Telegram init data.
- [ ] Все внешние webhook/signature payloads проверяются криптографически.

---

## Правила расширения архитектуры

Перед созданием нового каталога ответить на вопросы:

1. Это новая feature или часть существующей feature?
2. Это client state или server state?
3. Это shared UI или domain-specific UI?
4. Это infrastructure plugin или business module?
5. Где находится источник истины: Prisma, API, Query cache или Redux?
6. Какой публичный contract должен быть экспортирован через `index.ts`?
7. Как feature будет протестирована и проверена?

Не создавать новые глобальные слои без необходимости. Предпочтительный порядок добавления кода:

```text
existing feature folder
  → shared folder only if reused twice or more
  → new infrastructure layer only if cross-cutting
```

---

## Definition of done

Feature считается завершённой, когда:

- backend route имеет TypeBox schemas;
- auth/authorization правила проверены;
- service не смешан с transport layer;
- Prisma migration применима;
- frontend API использует общий client;
- server state находится в TanStack Query;
- client state находится в подходящем Redux slice или локальном state;
- UI обрабатывает loading/error/empty/success;
- API contract синхронен между frontend и backend;
- typecheck/build/lint/test прошли;
- документация и env requirements обновлены.

---

## Команды-шаблоны

Frontend:

```bash
cd frontend
pnpm install
pnpm dev
pnpm build
pnpm lint
```

Backend:

```bash
cd backend
pnpm install
pnpm prisma:generate
pnpm db:migrate
pnpm dev
pnpm typecheck
pnpm build
pnpm lint
pnpm test
```

Локальный запуск полного стека:

```text
PostgreSQL
  ↓
Backend API/Bot
  ↓
Frontend
```

Frontend должен использовать URL backend через `VITE_API_URL`, а backend — `DATABASE_URL` и прочие настройки через validated environment schema.
