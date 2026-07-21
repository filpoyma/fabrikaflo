import api from '../baseApi.ts'
import type { IPortfolioItem } from '../../types/domain.ts'
import type { ICategory, IProduct, IProductInput } from '../../types/webapp.ts'
import { galleryToProduct } from './gallery.mappers.ts'

type GalleryListResponse = { data?: IPortfolioItem[] }
type GalleryItemResponse = { data?: IPortfolioItem }
type UploadResponse = { url?: string; photoUrl?: string }

export const galleryApi = {
  async list(): Promise<IProduct[]> {
    const response = await api.get('gallery').json<GalleryListResponse>()
    return (response.data || []).map(galleryToProduct)
  },
  async getById(id: string): Promise<IProduct> {
    const items = await galleryApi.list()
    const found = items.find((item) => item.id === id)
    if (!found) throw new Error('Portfolio item not found')
    return found
  },
  async getCategories(): Promise<ICategory[]> {
    return [{ name: 'Авторские букеты', slug: 'bouquets' }]
  },
  async uploadImage(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('gallery/upload', { body: formData }).json<UploadResponse>()
    return { ok: true as const, url: response.url || response.photoUrl || '' }
  },
  async create(data: IProductInput) {
    const response = await api
      .post('gallery', {
        json: {
          title: data.name,
          description: data.description,
          photoUrl: data.photo_url,
        },
      })
      .json<GalleryItemResponse | IPortfolioItem>()
    const item = 'data' in response && response.data ? response.data : (response as IPortfolioItem)
    return galleryToProduct(item)
  },
  async update(id: string, data: IProductInput) {
    const response = await api
      .patch(`gallery/${id}`, {
        json: {
          title: data.name,
          description: data.description,
          photoUrl: data.photo_url,
        },
      })
      .json<GalleryItemResponse | IPortfolioItem>()
    const item = 'data' in response && response.data ? response.data : (response as IPortfolioItem)
    return galleryToProduct(item)
  },
  async delete(id: string) {
    return api.delete(`gallery/${id}`).json()
  },
}
