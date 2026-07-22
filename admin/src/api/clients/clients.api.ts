import api from '../baseApi.ts'
import type { IClientStats } from '../../types/client'
import type { IUser } from '../../types/user'

export const clientsApi = {
  async list(): Promise<{ data: IClientStats[] }> {
    return api.get('clients').json()
  },
  async listCouriers(): Promise<{ data: IUser[] }> {
    return api.get('clients/couriers').json()
  },
}
