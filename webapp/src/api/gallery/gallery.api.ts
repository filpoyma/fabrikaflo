import api from '../baseApi.ts'
import type { IPortfolioItem } from '../../types/domain.ts'
import type { ICategory, IProduct, IProductInput } from '../../types/webapp.ts'
import { galleryToProduct } from './gallery.mappers.ts'

export const galleryApi = {
  async list(): Promise<IProduct[]> {
    const response = await api.get('gallery').json<{ data: IPortfolioItem[] }>()
    return (response.data ?? []).map(galleryToProduct)
  },
  async getById(id: string): Promise<IProduct> {
    const response = await api.get(`gallery/${id}`).json<{ data: IPortfolioItem }>()
    return galleryToProduct(response.data)
  },
  async getCategories(): Promise<ICategory[]> {
    return [{ name: 'Авторские букеты', slug: 'bouquets' }]
  },
  async uploadImage(file: File): Promise<{ ok: true; url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('gallery/upload', { body: formData }).json<{ url?: string; photoUrl?: string }>()
    return { ok: true, url: response.url || response.photoUrl || '' }
  },
  async create(data: IProductInput): Promise<IProduct> {
    const response = await api
      .post('gallery', {
        json: {
          title: data.name,
          description: data.description,
          photoUrl: data.photo_url,
        },
      })
      .json<{ data: IPortfolioItem }>()
    return galleryToProduct(response.data)
  },
  async update(id: string, data: IProductInput): Promise<IProduct> {
    const response = await api
      .patch(`gallery/${id}`, {
        json: {
          title: data.name,
          description: data.description,
          photoUrl: data.photo_url,
        },
      })
      .json<{ data: IPortfolioItem }>()
    return galleryToProduct(response.data)
  },
  async delete(id: string): Promise<{ success: boolean }> {
    return api.delete(`gallery/${id}`).json()
  },
}
