Чтобы засеять БД в этом проекте:

1. Подготовка
Из папки fabrikaflo_bot/:

cd fabrikaflo_bot
pnpm install
В .env должен быть DATABASE_URL (PostgreSQL). Если его нет, seed попробует дефолт из prisma/seed.ts — локальный fabrika_db.

2. Миграции (если БД новая или схема менялась)
pnpm prisma:generate
pnpm db:migrate
На проде вместо db:migrate:

pnpm db:deploy
3. Запуск seed
pnpm exec prisma db seed
Или:

npx prisma db seed
Prisma вызовет node prisma/seed.ts (настроено в package.json и prisma.config.ts).

Что делает seed сейчас

Очищает таблицы: OrderPhoto, Order, Request, PortfolioItem, RefreshToken, User
Создаёт заново: пользователей, refresh-токены, портфолио
Заказы и заявки не создаются.
⚠️ Seed полностью перезаписывает эти данные — на проде с реальными клиентами не запускай без необходимости.

Проверка
pnpm db:studio
Откроется Prisma Studio — можно посмотреть, что записалось в таблицы.