import { useMutation } from '@tanstack/react-query'
import { authApi } from './auth.api.ts'

export const useLoginMutation = () =>
  useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      authApi.login(login, password),
  })

export const useLogoutMutation = () =>
  useMutation({
    mutationFn: () => authApi.logout(),
  })
