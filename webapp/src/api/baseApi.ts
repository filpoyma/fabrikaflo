import ky, { isHTTPError, type BeforeErrorHook, type BeforeRequestHook } from 'ky'
import { getInitData } from './telegramSession.ts'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api/fabrika'

type ApiErrorBody = { message?: string; error?: string }

const beforeRequest: BeforeRequestHook = ({ request }) => {
  request.headers.set('Bypass-Tunnel-Reminder', 'true')

  const tgInitData = getInitData()
  if (tgInitData) {
    request.headers.set('X-Init-Data', tgInitData)
    return
  }

  const token = localStorage.getItem('auth_token')
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
}

const beforeError: BeforeErrorHook = async ({ error }) => {
  if (!isHTTPError(error)) return error

  try {
    const data = (await error.response.clone().json()) as ApiErrorBody
    if (data?.message) {
      Object.defineProperty(error, 'message', {
        value: data.message,
        writable: true,
        configurable: true,
      })
    }
  } catch {
    // Ignore JSON parsing errors
  }

  return error
}

const api = ky.create({
  prefix: API_URL,
  timeout: 30000,
  retry: { limit: 0 },
  hooks: {
    beforeRequest: [beforeRequest],
    beforeError: [beforeError],
  },
})

export async function requestSafe<T>(requestFn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await requestFn()
  } catch (error) {
    console.warn('API fallback:', error)
    return fallback
  }
}

export default api
