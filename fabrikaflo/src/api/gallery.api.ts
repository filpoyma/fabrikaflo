import api from './baseApi.ts'
import type { IPortfolioItem } from '../types'

export const galleryApi = {
  async list() {
    return api.get('gallery').json<{ data: IPortfolioItem[] }>()
  },
  async upload(file: File, title?: string, description?: string) {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (description) formData.append('description', description)
    return api.post('gallery', { body: formData }).json<{ data: IPortfolioItem }>()
  },
  async deleteItem(id: string) {
    return api.delete(`gallery/${id}`).json<{ success: boolean }>()
  },
  async update(id: string, file?: File | null, title?: string, description?: string) {
    const formData = new FormData()
    if (file) formData.append('file', file)
    if (title !== undefined) formData.append('title', title)
    if (description !== undefined) formData.append('description', description)
    return api.put(`gallery/${id}`, { body: formData }).json<{ data: IPortfolioItem }>()
  },
}
