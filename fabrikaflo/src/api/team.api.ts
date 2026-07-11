import api from './baseApi.ts'

export interface ITeamMember {
  id: string
  name: string | null
  username: string | null
  login: string | null
  phone: string | null
  role: 'ADMIN' | 'COURIER'
  telegramId: string | null
  createdAt: string
}

export interface ICreateTeamMember {
  name: string
  username?: string
  login?: string
  phone?: string
  role: 'ADMIN' | 'COURIER'
  password?: string
}

export const teamApi = {
  async list() {
    return api.get('team').json<{ data: ITeamMember[] }>()
  },
  async create(body: ICreateTeamMember) {
    return api.post('team', { json: body }).json<{ data: ITeamMember }>()
  },
  async deleteItem(id: string) {
    return api.delete(`team/${id}`).json<{ success: boolean }>()
  },
}
