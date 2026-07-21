import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'

const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://fabriks_user:c20d2e2b2dab2d300ea60b906ceb0062@localhost:5432/fabrika_db?schema=public'

const pool = new pg.Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Cleaning up existing database records...')
  await prisma.orderPhoto.deleteMany()
  await prisma.order.deleteMany()
  await prisma.request.deleteMany()
  await prisma.portfolioItem.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('Seeding Users...')
  await prisma.user.createMany({
    data: [
      {
        id: '63159a65-6a65-4a93-b904-a1a6525123e9',
        telegramId: '123456789',
        tgname: 'mariya_flower',
        name: 'Мария Сидорова',
        phone: '+79001112233',
        role: 'CLIENT',
        passwordHash: null,
        createdAt: '2026-07-10T00:43:48.038Z',
        updatedAt: '2026-07-10T00:43:48.038Z',
        botData: null,
        botState: null,
        login: null,
        avatarUrl: null,
      },
      {
        id: '55290d04-4b19-434a-af91-bfc7aceeeb18',
        telegramId: '987654321',
        tgname: 'alex_green',
        name: 'Александр Петров',
        phone: '+79004445566',
        role: 'CLIENT',
        passwordHash: null,
        createdAt: '2026-07-10T00:43:48.040Z',
        updatedAt: '2026-07-10T00:43:48.040Z',
        botData: null,
        botState: null,
        login: null,
        avatarUrl: null,
      },
      {
        id: '819f2da2-b286-4df0-b315-34c79e0289d6',
        telegramId: '111222333',
        tgname: 'ivan_courier',
        name: 'Иванов Иван',
        phone: '+79007778899',
        role: 'COURIER',
        passwordHash: null,
        createdAt: '2026-07-10T00:43:48.042Z',
        updatedAt: '2026-07-10T00:43:48.042Z',
        botData: null,
        botState: null,
        login: null,
        avatarUrl: null,
      },
      {
        id: 'a34e9e3e-431a-4243-9def-ad7d110639f0',
        telegramId: '8102167121',
        tgname: 'vietromantra',
        name: 'Ro Man',
        phone: null,
        role: 'COURIER',
        passwordHash: null,
        createdAt: '2026-07-10T06:47:25.439Z',
        updatedAt: '2026-07-12T00:24:21.995Z',
        botData: '{}',
        botState: 'WIZARD_OCCASION',
        login: null,
        avatarUrl: null,
      },
      {
        id: '7e790ac1-212a-4775-983e-d21338125f2a',
        telegramId: '6239292089',
        tgname: 'RomanWorkarara',
        name: 'Ro Man',
        phone: '+917028304130',
        role: 'CLIENT',
        passwordHash: null,
        createdAt: '2026-07-10T06:50:46.500Z',
        updatedAt: '2026-07-12T05:20:59.622Z',
        botData: '{}',
        botState: 'WIZARD_OCCASION',
        login: null,
        avatarUrl: null,
      },
      {
        id: '6e961bae-6d34-4792-b22b-50886dc7d3b3',
        telegramId: null,
        tgname: 'krutkris',
        name: 'Krutkris',
        phone: null,
        role: 'ADMIN',
        passwordHash:
          '$2b$10$eFgCY12asb2mHAI/wPekE.lHVttk3N/tBGAKoja5uvbE7NynxBdNq',
        createdAt: '2026-07-11T02:36:53.777Z',
        updatedAt: '2026-07-12T01:16:49.242Z',
        botData: null,
        botState: null,
        login: 'krutkris',
        avatarUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783838799/fabrikaflo_avatars/dzqjardy4xvz1rlnbckn.jpg',
      },
      {
        id: 'd3a06ccd-2dca-47b3-aac8-a14b6ef950e0',
        telegramId: null,
        tgname: null,
        name: 'Kit',
        phone: null,
        role: 'ADMIN',
        passwordHash:
          '$2b$10$nICyJkdclxlyXYgTi7Vp4ek6F0hQH5iwjxLvNFuoXSC1RwmZrAGHu',
        createdAt: '2026-07-12T01:13:00.424Z',
        updatedAt: '2026-07-12T01:15:44.584Z',
        botData: null,
        botState: null,
        login: 'rom',
        avatarUrl: null,
      },
      {
        id: '4d7b6d3d-8833-4d8c-a20c-d14ad88f3bcb',
        telegramId: '1005121723',
        tgname: 'andrey_dobrosvet',
        name: 'Andre First ① Ra ☀️',
        phone: null,
        role: 'CLIENT',
        passwordHash: null,
        createdAt: '2026-07-12T04:24:11.041Z',
        updatedAt: '2026-07-12T04:29:58.873Z',
        botData: '{}',
        botState: 'WIZARD_OCCASION',
        login: null,
        avatarUrl: null,
      },
      {
        id: 'c9b424f5-ba9f-428e-9526-a46573116f68',
        telegramId: '147917436',
        tgname: 'Romantra',
        name: 'Roman Parmen',
        phone: null,
        role: 'ADMIN',
        passwordHash: null,
        createdAt: '2026-07-12T04:25:45.488Z',
        updatedAt: '2026-07-12T06:52:54.471Z',
        botData: '{}',
        botState: 'WIZARD_OCCASION',
        login: null,
        avatarUrl: null,
      },
      {
        id: 'fd42a7f2-feab-47cf-880f-dcda7e9627f9',
        telegramId: '788909',
        tgname: 'krutkris',
        name: 'Kris Retyakova',
        phone: '89197687910',
        role: 'CLIENT',
        passwordHash: null,
        createdAt: '2026-07-12T06:39:49.146Z',
        updatedAt: '2026-07-12T06:41:14.608Z',
        botData: null,
        botState: 'Idle',
        login: null,
        avatarUrl: null,
      },
      {
        id: 'b0203d6b-f515-4959-9775-ac2bd3c6cd3d',
        telegramId: null,
        tgname: null,
        name: 'Admin',
        phone: null,
        role: 'ADMIN',
        passwordHash:
          '$2b$10$c2sUjZP3jx4/ngRiYOjvLOTFQ/ZCQtIDI7ySJ8vMMuhXDuRkRLXF6',
        createdAt: '2026-07-17T04:17:33.367Z',
        updatedAt: '2026-07-17T04:17:33.367Z',
        botData: null,
        botState: null,
        login: 'admin',
        avatarUrl: null,
      },
    ],
  })

  console.log('Seeding Refresh Tokens...')
  await prisma.refreshToken.createMany({
    data: [
      {
        id: 'cd28b610-980c-4975-b1b7-6a033090108d',
        userId: 'b0203d6b-f515-4959-9775-ac2bd3c6cd3d',
        tokenHash:
          'd0729d68eef88a3e9cc50a54dcdcf2884e91cc1062004aac417fd0552cbbbaf6',
        familyId: 'df8cdc02-baec-4ea5-81db-726b11324392',
        expiresAt: '2026-07-28T01:54:19.395Z',
        revokedAt: null,
        createdAt: '2026-07-21T01:54:19.399Z',
      },
    ],
  })

  console.log('Seeding Portfolio Items...')
  await prisma.portfolioItem.createMany({
    data: [
      {
        id: 'deca0c61-efa9-43fc-af38-4e77806c9aa0',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765882/fabrikaflo_portfolio/kq4fposlfcnzv1pamdtz.jpg',
        title: null,
        description: null,
        createdAt: '2026-07-11T02:31:23.383Z',
      },
      {
        id: 'a53e5bba-3209-43d6-a78a-2a6513ffbb03',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765911/fabrikaflo_portfolio/nowvpm77dahnlogonpw4.jpg',
        title: 'Пастельный микс с гортензией. ',
        description: 'Сезонные цветы лета. ',
        createdAt: '2026-07-11T02:31:51.660Z',
      },
      {
        id: '3af4f3fa-5195-47e1-b611-70ba7a564e7a',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765935/fabrikaflo_portfolio/ozxzilup6dizop2ocrn0.jpg',
        title: 'Свежие краски весны. ',
        description: null,
        createdAt: '2026-07-11T02:32:16.301Z',
      },
      {
        id: '68ec7fec-a9d7-41a6-a000-88bb769c3ab1',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765967/fabrikaflo_portfolio/z85wykiu9r8dikd9l6bk.jpg',
        title: 'Цветной взрыв',
        description: null,
        createdAt: '2026-07-11T02:32:47.446Z',
      },
      {
        id: '2dbfa6ae-bdd9-4cd8-a263-75a795cc2121',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765999/fabrikaflo_portfolio/txjpqzg7ut2hzvlcvvy8.jpg',
        title: 'Трудности выбора. ',
        description: null,
        createdAt: '2026-07-11T02:33:19.969Z',
      },
    ],
  })

  console.log('Seeding Requests...')
  await prisma.request.createMany({
    data: [
      {
        id: '576b3ffe-4de7-4cf7-9474-0994bff13b4b',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        occasion: 'Свадьба',
        budget: 4000,
        date: '2026-07-13T23:32:39.281Z',
        deliveryType: 'PICKUP',
        comment: '[Желаемая дата/время: 12 завтра]. особые пожелания',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765999/fabrikaflo_portfolio/txjpqzg7ut2hzvlcvvy8.jpg',
        status: 'CONVERTED',
        createdAt: '2026-07-11T23:32:39.290Z',
        updatedAt: '2026-07-12T00:18:16.692Z',
        deliveryAddress: '',
        recipientPhone: null,
        postcardText: null,
      },
      {
        id: 'e3dead8b-d554-406b-8c2c-a22206f98029',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        occasion: 'День рожденья',
        budget: 5000,
        date: '2026-07-12T20:00:00.000Z',
        deliveryType: 'DELIVERY',
        comment: '[Желаемая дата/время: завтра к 12:00]. Особые пожелания к букету.',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783842299/fabrikaflo_examples/npnqqtzorb08axbydsaf.jpg',
        status: 'CONVERTED',
        createdAt: '2026-07-11T23:45:06.937Z',
        updatedAt: '2026-07-11T23:50:00.328Z',
        deliveryAddress: 'Москва ул. светлая 8 Roman 89104003344',
        recipientPhone: '89104003344',
        postcardText: null,
      },
      {
        id: '79208eb4-56db-4d82-a41c-b623f1b77f1f',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        occasion: 'день рожденья',
        budget: 3000,
        date: '2026-07-12T20:00:00.000Z',
        deliveryType: 'DELIVERY',
        comment: '[Желаемая дата/время: 12 часов завтра]. пожелани я пожелания',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765999/fabrikaflo_portfolio/txjpqzg7ut2hzvlcvvy8.jpg',
        status: 'CONVERTED',
        createdAt: '2026-07-12T00:01:01.696Z',
        updatedAt: '2026-07-12T00:02:29.893Z',
        deliveryAddress: 'Ром 89105667766 верхние небеса',
        recipientPhone: '89105667766',
        postcardText: 'текст открытки',
      },
      {
        id: '8e1f6bd5-6781-4fdc-b033-a08311335522',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        occasion: 'Просто так',
        budget: 4000,
        date: '2026-07-13T23:00:00.000Z',
        deliveryType: 'PICKUP',
        comment: '[Желаемая дата/время: 12 послезавтра к 15:00]. Особые пожелания к букету.',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783845057/fabrikaflo_examples/be7weopjoqby2onkb4kp.jpg',
        status: 'CONTACTED',
        createdAt: '2026-07-12T00:31:00.638Z',
        updatedAt: '2026-07-20T07:18:14.704Z',
        deliveryAddress: '',
        recipientPhone: null,
        postcardText: 'Открытка не нужна.',
      },
      {
        id: 'de223c8f-a219-415f-885c-b76bb5566111',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        occasion: 'Просто так.',
        budget: 4000,
        date: '2026-07-12T20:00:00.000Z',
        deliveryType: 'PICKUP',
        comment: '[Желаемая дата/время: к 12 ти завтра]. Мои любимые красные цветы.',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783845333/fabrikaflo_examples/svvxe16xvbpdaggeihzj.jpg',
        status: 'CONVERTED',
        createdAt: '2026-07-12T00:35:37.879Z',
        updatedAt: '2026-07-12T00:36:05.988Z',
        deliveryAddress: '',
        recipientPhone: '+917028304130',
        postcardText: 'нет',
      },
      {
        id: '775bdb83-048d-430e-9ba8-8ff493d37194',
        clientId: 'fd42a7f2-feab-47cf-880f-dcda7e9627f9',
        occasion: 'День рождения',
        budget: 4000,
        date: '2026-07-12T03:00:00.000Z',
        deliveryType: 'PICKUP',
        comment: '[Желаемая дата/время: Сегодня к 19:00]. Нет',
        examplePhotoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783765999/fabrikaflo_portfolio/txjpqzg7ut2hzvlcvvy8.jpg',
        status: 'PENDING',
        createdAt: '2026-07-12T06:41:14.593Z',
        updatedAt: '2026-07-12T06:41:14.593Z',
        deliveryAddress: '',
        recipientPhone: '89197687910',
        postcardText: 'Привет в лето!',
      },
    ],
  })

  console.log('Seeding Orders...')
  await prisma.order.createMany({
    data: [
      {
        id: 'fcd9da55-e5ec-45cd-9482-aeee4e3e52bb',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        requestId: 'e3dead8b-d554-406b-8c2c-a22206f98029',
        recipientName: 'Ro Man',
        recipientPhone: '89104003344',
        deliveryAddress: 'Москва ул. светлая 8 Roman 89104003344',
        deliveryTime: null,
        budget: 5000,
        wishes: '[Желаемая дата/время: завтра к 12:00]. Особые пожелания к букету.',
        postcardText: null,
        comment: null,
        status: 'ASSEMBLING',
        paymentLink: null,
        courierId: null,
        createdAt: '2026-07-11T23:50:00.319Z',
        updatedAt: '2026-07-11T23:57:07.554Z',
        clientFeedback: null,
      },
      {
        id: 'dbf6f85b-2599-466e-8807-aac86951b2a6',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        requestId: '79208eb4-56db-4d82-a41c-b623f1b77f1f',
        recipientName: 'Ro Man',
        recipientPhone: '89105667766',
        deliveryAddress: 'Ром 89105667766 верхние небеса',
        deliveryTime: '2026-07-19T00:02:00.000Z',
        budget: 3000,
        wishes: '[Желаемая дата/время: 12 часов завтра]. пожелани я пожелания',
        postcardText: 'текст открытки',
        comment: '[Правки клиента]: Убрать зеленые цветы',
        status: 'DELIVERING',
        paymentLink: 'https://google.com',
        courierId: '819f2da2-b286-4df0-b315-34c79e0289d6',
        createdAt: '2026-07-12T00:02:29.888Z',
        updatedAt: '2026-07-20T07:26:09.757Z',
        clientFeedback: null,
      },
      {
        id: '47d3a7fc-92b6-482d-9066-8b336720fbf0',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        requestId: '576b3ffe-4de7-4cf7-9474-0994bff13b4b',
        recipientName: 'Ro Man',
        recipientPhone: '4',
        deliveryAddress: '',
        deliveryTime: '2026-07-17T00:18:00.000Z',
        budget: 4000,
        wishes: '[Желаемая дата/время: 12 завтра]. особые пожелания',
        postcardText: null,
        comment: '123',
        status: 'DELIVERED',
        paymentLink: 'https://google.com',
        courierId: 'a34e9e3e-431a-4243-9def-ad7d110639f0',
        createdAt: '2026-07-12T00:18:16.684Z',
        updatedAt: '2026-07-12T00:24:57.593Z',
        clientFeedback: 'Мои правки к букету. Все нравится. Ну что-нибудь исправьте.',
      },
      {
        id: 'c8a32248-4958-4333-a875-a78d6e50f971',
        clientId: '7e790ac1-212a-4775-983e-d21338125f2a',
        requestId: 'de223c8f-a219-415f-885c-b76bb5566111',
        recipientName: 'Ro Man',
        recipientPhone: '+917028304130',
        deliveryAddress: '',
        deliveryTime: null,
        budget: 4000,
        wishes: '[Желаемая дата/время: к 12 ти завтра]. Мои любимые красные цветы.',
        postcardText: 'нет',
        comment: null,
        status: 'PAID',
        paymentLink: 'https://sdfsdf.ru',
        courierId: null,
        createdAt: '2026-07-12T00:36:05.980Z',
        updatedAt: '2026-07-20T07:25:21.371Z',
        clientFeedback: null,
      },
    ],
  })

  console.log('Seeding Order Photos...')
  await prisma.orderPhoto.createMany({
    data: [
      {
        id: '4479c713-4408-4669-adf5-95da3917b881',
        orderId: 'dbf6f85b-2599-466e-8807-aac86951b2a6',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783843648/fabrikaflo_bouquets/fhh3asgpgd04zratoudy.jpg',
        createdAt: '2026-07-12T00:07:29.547Z',
      },
      {
        id: '359866b1-08c7-4c34-92e0-f681d4db158c',
        orderId: '47d3a7fc-92b6-482d-9066-8b336720fbf0',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783844462/fabrikaflo_bouquets/sdlzt6fjghuqsp9la4of.jpg',
        createdAt: '2026-07-12T00:21:03.083Z',
      },
      {
        id: '2a645dea-2a93-4b1f-a77f-8b0b1d9c1348',
        orderId: '47d3a7fc-92b6-482d-9066-8b336720fbf0',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783844525/fabrikaflo_bouquets/qcygmbmax8tq5p0m0qu9.jpg',
        createdAt: '2026-07-12T00:22:07.033Z',
      },
      {
        id: '67140188-e409-4c83-9a63-d14447ad9a90',
        orderId: 'dbf6f85b-2599-466e-8807-aac86951b2a6',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783844727/fabrikaflo_bouquets/dhyxu2w0v2r0bedkc5o7.jpg',
        createdAt: '2026-07-12T00:25:27.781Z',
      },
      {
        id: '51aec0f1-9483-4479-8049-6c30812d7733',
        orderId: 'c8a32248-4958-4333-a875-a78d6e50f971',
        photoUrl:
          'https://res.cloudinary.com/fabrikagallery/image/upload/v1783845469/fabrikaflo_bouquets/euxww4czv2nbgpz0yqoz.jpg',
        createdAt: '2026-07-12T00:37:50.669Z',
      },
    ],
  })

  console.log('Database seeding finished successfully!')
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
