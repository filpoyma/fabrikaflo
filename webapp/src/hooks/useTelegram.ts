import { useEffect } from 'react'

type HapticStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'

export function useTelegram() {
  const tg = window.Telegram?.WebApp

  useEffect(() => {
    if (tg) {
      tg.ready()
      tg.expand()
    }
  }, [tg])

  const user = tg?.initDataUnsafe?.user || null
  const initData = tg?.initData || ''
  const colorScheme = tg?.colorScheme || 'dark'

  const haptic = {
    impact: (style: HapticStyle = 'medium') => tg?.HapticFeedback?.impactOccurred(style),
    success: () => tg?.HapticFeedback?.notificationOccurred('success'),
    error: () => tg?.HapticFeedback?.notificationOccurred('error'),
  }

  const close = () => tg?.close()
  const showAlert = (msg: string) => tg?.showAlert(msg)
  const showConfirm = (msg: string, cb: (confirmed: boolean) => void) => tg?.showConfirm(msg, cb)

  return {
    tg,
    user,
    initData,
    colorScheme,
    haptic,
    close,
    showAlert,
    showConfirm,
  }
}
