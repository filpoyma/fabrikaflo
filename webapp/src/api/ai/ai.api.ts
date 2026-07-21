import { API_URL } from '../baseApi.ts'
import type { IAiChatResponse } from '../../types/webapp.ts'

export const aiApi = {
  API_BASE: API_URL,
  sendChatText: async (_prompt: string): Promise<IAiChatResponse> => ({
    ok: true,
    text: 'Мне нравится ваш выбор — расскажите чуть больше о поводе, и я предложу цветовую гамму. (Backend AI-endpoint not implemented yet.)',
    audio_url: null,
  }),
  sendVoiceFile: async (): Promise<IAiChatResponse> => ({
    ok: true,
    user_text: '…',
    text: 'Голосовой ввод пока в разработке.',
    audio_url: null,
  }),
}
