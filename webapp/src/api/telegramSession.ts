let initData = ''

export function setInitData(data: string) {
  initData = data || ''
}

export function getInitData(): string {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData
  }
  return initData
}
