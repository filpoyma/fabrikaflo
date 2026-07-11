import api from './baseApi.ts'

export const authApi = {
  async login(username: string, password: string) {
    return api.post('auth/login', { json: { username, password } }).json<{ token: string; user: any }>()
  },
  async getMe() {
    return api.get('auth/me').json<{ user: any }>()
  },
}
