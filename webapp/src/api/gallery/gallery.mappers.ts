import type { IPortfolioItem } from '../../types/domain.ts'
import type { IProduct } from '../../types/webapp.ts'

export const galleryToProduct = (item: IPortfolioItem): IProduct => ({
  id: item.id,
  name: item.title || 'Авторский букет',
  description: item.description || 'Оригинальный букет, собранный нашими флористами.',
  photo_url: item.photoUrl,
  category_slug: 'bouquets',
  category_name: 'Авторские букеты',
  in_stock: true,
  variants: [{ name: 'Стандарт', price_usd: 50 }],
  price_display: 'Индивидуальный бюджет',
})
