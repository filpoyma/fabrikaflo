import 'dotenv/config'
import pg from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.ts'
import bcrypt from 'bcrypt'

const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://fabriks_user:c20d2e2b2dab2d300ea60b906ceb0062@localhost:5432/fabrika_db?schema=public'

const pool = new pg.Pool({ connectionString: databaseUrl })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding flower shop database...')

  // Clear existing data
  await prisma.portfolioItem.deleteMany()
  await prisma.orderPhoto.deleteMany()
  await prisma.order.deleteMany()
  await prisma.request.deleteMany()
  await prisma.user.deleteMany()

  // 1. Seed Admin User
  const adminPasswordHash = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      name: 'Администратор Магазина',
      username: 'admin',
      phone: '+79998887766',
      role: 'ADMIN',
      passwordHash: adminPasswordHash,
    }
  })
  console.log('Admin user seeded:', adminUser.username)

  // 2. Seed Client Users
  const client1 = await prisma.user.create({
    data: {
      telegramId: '123456789',
      username: 'mariya_flower',
      name: 'Мария Сидорова',
      phone: '+79001112233',
      role: 'CLIENT',
    }
  })

  const client2 = await prisma.user.create({
    data: {
      telegramId: '987654321',
      username: 'alex_green',
      name: 'Александр Петров',
      phone: '+79004445566',
      role: 'CLIENT',
    }
  })

  // 3. Seed Courier Users
  const courier1 = await prisma.user.create({
    data: {
      telegramId: '111222333',
      username: 'ivan_courier',
      name: 'Иванов Иван',
      phone: '+79007778899',
      role: 'COURIER',
    }
  })
  console.log('Clients and Couriers seeded.')

  // 4. Seed Requests (Заявки)
  const request1 = await prisma.request.create({
    data: {
      clientId: client1.id,
      occasion: 'День Рождения мамы',
      budget: 5000,
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // in 2 days
      deliveryType: 'DELIVERY',
      comment: 'Нужен нежный букет в розовых и кремовых тонах. Хочется, чтобы выглядел воздушно и естественно.',
      status: 'PENDING'
    }
  })

  const request2 = await prisma.request.create({
    data: {
      clientId: client2.id,
      occasion: 'Годовщина свадьбы',
      budget: 8000,
      date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // in 1 day
      deliveryType: 'PICKUP',
      comment: 'Букет-компаньон с ранункулюсами и пионами, упаковка в крафтовую бумагу.',
      status: 'CONVERTED'
    }
  })
  console.log('Requests seeded.')

  // 5. Seed Orders (Заказы)
  const order1 = await prisma.order.create({
    data: {
      clientId: client2.id,
      requestId: request2.id,
      recipientName: 'Елена Петрова',
      recipientPhone: '+79005556677',
      deliveryAddress: 'г. Москва, ул. Ленина, д. 10, кв. 85',
      deliveryTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      budget: 8000,
      wishes: 'Ранункулюсы, пионы, веточки эвкалипта. Упаковка в матовую светлую бумагу, перевязать розовой лентой.',
      postcardText: 'Любимой супруге в день нашей годовщины! Спасибо за каждый день вместе.',
      comment: 'Доставить строго с 10:00 до 12:00. Получатель не знает о сюрпризе, позвонить за 15 минут.',
      status: 'PAID',
      paymentLink: 'https://pay.fabrikaflo.ru/order-8000-12345',
      courierId: courier1.id
    }
  })

  const order2 = await prisma.order.create({
    data: {
      clientId: client1.id,
      recipientName: 'Мария Сидорова',
      recipientPhone: '+79001112233',
      deliveryAddress: 'г. Москва, пр-т Мира, д. 150, кв. 14',
      deliveryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      budget: 5000,
      wishes: 'Розовые французские розы, диантусы, сезонная зелень. Круглая форма.',
      postcardText: 'С днем рождения!',
      comment: 'Доставить на работу в офис.',
      status: 'CREATED'
    }
  })
  console.log('Orders seeded.')

  // 6. Seed Portfolio Items (Наши работы)
  const portfolioItems = [
    {
      photoUrl: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?q=80&w=800&auto=format&fit=crop',
      title: 'Нежный ранункулюс и мимоза',
      description: 'Весеннее вдохновение. Сочетание нежно-розовых ранункулюсов и ароматной желтой мимозы в крафте.'
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=800&auto=format&fit=crop',
      title: 'Пастельный микс',
      description: 'Наш фирменный букет из пионовидных роз, гортензии и эвкалипта.'
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?q=80&w=800&auto=format&fit=crop',
      title: 'Весенние нарциссы',
      description: 'Лаконичная сезонная композиция с нарциссами, гиацинтами и веточками вербы.'
    },
    {
      photoUrl: 'https://images.unsplash.com/photo-1587334274728-79f999abb870?q=80&w=800&auto=format&fit=crop',
      title: 'Элегантный моно-букет',
      description: 'Крупные пионовидные розы премиальных сортов в лаконичной светлой упаковке.'
    }
  ]

  for (const item of portfolioItems) {
    await prisma.portfolioItem.create({ data: item })
  }
  console.log('Portfolio items seeded.')
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
