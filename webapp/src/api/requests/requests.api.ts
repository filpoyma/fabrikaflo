import api from '../baseApi.ts'
import type { ICreateRequestPayload } from '../../types/webapp.ts'
import type { IRequest } from '../../types/domain.ts'

export const requestsApi = {
  async create(data: ICreateRequestPayload): Promise<{ data: IRequest }> {
    return api.post('requests', { json: data }).json()
  },
  async uploadPhoto(file: File): Promise<{ url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('requests/upload', { body: formData }).json()
  },
}
