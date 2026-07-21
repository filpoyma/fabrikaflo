import api from '../baseApi.ts'
import type { ICreateRequestPayload } from '../../types/webapp.ts'

export const requestsApi = {
  async create(data: ICreateRequestPayload) {
    return api.post('requests', { json: data }).json()
  },
  async uploadPhoto(file: File) {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('requests/upload', { body: formData }).json<{ url?: string }>()
  },
}
