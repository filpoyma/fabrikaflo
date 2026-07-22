import api from '../baseApi.ts'
import type { IUser } from '../../types/user'

export type AuthResponse = {
  accessToken: string
  user: IUser
}

export const authApi = {
  async login(login: string, password: string): Promise<AuthResponse> {
    return api.post('auth/login', { json: { login, password } }).json()
  },
  async refresh(): Promise<AuthResponse> {
    return api.post('auth/refresh').json()
  },
  async logout(): Promise<{ ok: boolean }> {
    return api.post('auth/logout').json()
  },
  async getMe(): Promise<{ user: IUser }> {
    return api.get('auth/me').json()
  },
}
