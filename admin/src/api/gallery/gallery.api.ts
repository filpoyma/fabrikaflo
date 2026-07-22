import api from '../baseApi.ts'
import type { IPortfolioItem } from '../../types/gallery'

export const galleryApi = {
  async list(): Promise<{ data: IPortfolioItem[] }> {
    return api.get('gallery').json()
  },
  async upload(file: File, title?: string, description?: string): Promise<{ data: IPortfolioItem }> {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (description) formData.append('description', description)
    return api.post('gallery', { body: formData }).json()
  },
  async deleteItem(id: string): Promise<{ success: boolean }> {
    return api.delete(`gallery/${id}`).json()
  },
  async update(
    id: string,
    file?: File | null,
    title?: string,
    description?: string,
  ): Promise<{ data: IPortfolioItem }> {
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (title !== undefined) formData.append('title', title)
    if (description !== undefined) formData.append('description', description)
    return api.put(`gallery/${id}`, { body: formData }).json()
  },
}
