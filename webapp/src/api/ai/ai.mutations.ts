import { useMutation } from '@tanstack/react-query'
import { aiApi } from './ai.api.ts'

export const useSendAiChatTextMutation = () =>
  useMutation({
    mutationFn: ({ prompt }: { prompt: string }) => aiApi.sendChatText(prompt),
  })

export const useSendAiVoiceFileMutation = () =>
  useMutation({
    mutationFn: ({ blob: _blob }: { blob: Blob }) => aiApi.sendVoiceFile(),
  })
