import { useMutation } from '@tanstack/react-query'
import type { TelegramWidgetUser } from '../../types/telegram.d.ts'
import { authApi } from './auth.api.ts'

export const useLoginWithTelegramWidgetMutation = () =>
  useMutation({
    mutationFn: (user: TelegramWidgetUser) => authApi.loginWithTelegramWidget(user),
  })
