import type { IUser } from '../types/user'

const API_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000/api/fabrika'

let accessToken: string | null = null
let refreshPromise: Promise<AuthSession | null> | null = null

export type AuthSession = {
  accessToken: string
  user: IUser
}

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function clearLegacyAuthStorage(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}

export async function refreshAccessToken(): Promise<AuthSession | null> {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) return null
        const data = (await response.json()) as AuthSession
        accessToken = data.accessToken
        return data
      })
      .catch(() => null)
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

clearLegacyAuthStorage()
