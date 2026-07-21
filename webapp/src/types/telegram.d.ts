export {}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
    onTelegramAuth?: (user: TelegramWidgetUser) => void
  }
}

export interface TelegramUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
}

export interface TelegramWidgetUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
  }
  colorScheme: 'light' | 'dark'
  ready: () => void
  expand: () => void
  close: () => void
  showAlert: (message: string, callback?: () => void) => void
  showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
  }
  LocationManager?: {
    init: (callback: () => void) => void
    getLocation: (callback: (data: { latitude: number; longitude: number } | null) => void) => void
  }
}
