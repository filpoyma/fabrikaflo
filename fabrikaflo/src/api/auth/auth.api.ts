import api from '../baseApi.ts'
import type { IUser } from '../../types'

export const authApi = {
  async login(login: string, password: string) {
    return api.post('auth/login', { json: { login, password } }).json<{ token: string; user: IUser }>()
  },
  async getMe() {
    return api.get('auth/me').json<{ user: IUser }>()
  },
}
