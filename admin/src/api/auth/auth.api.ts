import api from '../baseApi.ts'
import type { IUser } from '../../types'

export type AuthResponse = {
  accessToken: string
  user: IUser
}

export const authApi = {
  async login(login: string, password: string) {
    return api.post('auth/login', { json: { login, password } }).json<AuthResponse>()
  },
  async refresh() {
    return api.post('auth/refresh').json<AuthResponse>()
  },
  async logout() {
    return api.post('auth/logout').json<{ ok: boolean }>()
  },
  async getMe() {
    return api.get('auth/me').json<{ user: IUser }>()
  },
}
