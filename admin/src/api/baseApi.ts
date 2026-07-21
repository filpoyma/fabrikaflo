import ky, { isHTTPError, type BeforeRequestHook, type BeforeErrorHook } from 'ky'

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/v1'

const tokenInterceptor: BeforeRequestHook = ({ request }) => {
  const token = localStorage.getItem('token')
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
}

type ApiErrorBody = { message?: string; error?: string }

const errorInterceptor: BeforeErrorHook = async ({ error }) => {
  if (!isHTTPError(error)) return error

  try {
    const data = error.data as ApiErrorBody | undefined
    if (data && data.message) {
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
  hooks: {
    beforeRequest: [tokenInterceptor],
    beforeError: [errorInterceptor],
  },
})

export default api
