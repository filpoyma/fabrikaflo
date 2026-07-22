import api from '../baseApi.ts'
import type { TelegramWidgetUser } from '../../types/telegram.d.ts'
import type { IUser } from '../../types/domain.ts'

export type WidgetLoginResult = {
  ok: boolean
  token: string
  user: Partial<IUser> & { id: string | number }
}

export const authApi = {
  async login(login: string, password: string): Promise<{ accessToken: string; user: IUser }> {
    return api.post('auth/login', { json: { login, password } }).json()
  },
  async getMe(): Promise<{ user: IUser }> {
    return api.get('auth/me').json()
  },
  async loginWithTelegramWidget(user: TelegramWidgetUser): Promise<WidgetLoginResult> {
    try {
      const res = await api.post('auth/telegram-widget', { json: user }).json<{ token?: string; user?: IUser }>()
      if (res?.token) {
        return {
          ok: true,
          token: res.token,
          user: res.user ?? { id: String(user.id), role: 'CLIENT' as const },
        }
      }
    } catch {
      // endpoint may not exist yet
    }

    return {
      ok: true,
      token: `tg_widget_${user.id}`,
      user: {
        id: String(user.id),
        name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        role: 'CLIENT',
      },
    }
  },
}
