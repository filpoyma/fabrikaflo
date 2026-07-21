import ky, {
  isHTTPError,
  type AfterResponseHook,
  type AfterResponseState,
  type BeforeErrorHook,
  type BeforeRequestHook,
} from 'ky'
import { getAccessToken, refreshAccessToken } from './authSession.ts'

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/fabrika'

function isAuthRoute(url: string): boolean {
  return (
    url.endsWith('/auth/login') ||
    url.endsWith('/auth/refresh') ||
    url.endsWith('/auth/logout')
  )
}

const tokenInterceptor: BeforeRequestHook = ({ request }) => {
  const token = getAccessToken()
  if (token) {
    request.headers.set('Authorization', `Bearer ${token}`)
  }
}

const refreshInterceptor: AfterResponseHook = async ({
  request,
  response,
}: AfterResponseState) => {
  if (response.status !== 401 || isAuthRoute(request.url)) {
    return response
  }

  const session = await refreshAccessToken()
  if (!session) {
    return response
  }

  const retryHeaders = new Headers(request.headers)
  retryHeaders.set('Authorization', `Bearer ${session.accessToken}`)

  return ky(request.url, {
    method: request.method,
    headers: retryHeaders,
    body: request.body,
    credentials: 'include',
    retry: { limit: 0 },
  })
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
  credentials: 'include',
  retry: { limit: 0 },
  hooks: {
    beforeRequest: [tokenInterceptor],
    afterResponse: [refreshInterceptor],
    beforeError: [errorInterceptor],
  },
})

export default api
