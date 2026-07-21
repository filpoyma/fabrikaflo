import api from '../baseApi.ts'
import type { IClientStats, IUser } from '../../types'

export const clientsApi = {
  async list() {
    return api.get('clients').json<{ data: IClientStats[] }>()
  },
  async listCouriers() {
    return api.get('clients/couriers').json<{ data: IUser[] }>()
  },
}
