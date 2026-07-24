import { InlineKeyboard } from 'grammy'

const PICKUP_LABELS = new Set(['самовывоз', ''])

function isRoutableAddress(address: string | null | undefined): address is string {
  if (!address) return false
  return !PICKUP_LABELS.has(address.trim().toLowerCase())
}

export function buildGoogleMapsRouteUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}

export function buildYandexMapsRouteUrl(address: string): string {
  return `https://yandex.ru/maps/?rtext=~${encodeURIComponent(address)}&rtt=auto`
}

export function buildCourierDeliveryKeyboard(
  orderId: string,
  deliveryAddress: string | null | undefined,
): InlineKeyboard {
  const keyboard = new InlineKeyboard()

  if (isRoutableAddress(deliveryAddress)) {
    keyboard
      .url('Яндекс карты', buildYandexMapsRouteUrl(deliveryAddress))
      .url('Google Maps', buildGoogleMapsRouteUrl(deliveryAddress))
      .row()
  }

  keyboard.text('✅ Доставлено', `courier_complete:${orderId}`)

  return keyboard
}
