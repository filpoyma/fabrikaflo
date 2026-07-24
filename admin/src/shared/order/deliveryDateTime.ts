import { DELIVERY_TIMEZONE, parseDate } from '../lib/dayjs.ts'

export { DELIVERY_TIMEZONE }

export function formatStoredDeliveryDate(
  value: string | null | undefined,
  options?: { month?: '2-digit' | 'long' | 'numeric'; day?: '2-digit' | 'numeric' },
): string | null {
  const parsed = parseDate(value)
  if (!parsed) return null

  const month = options?.month === '2-digit' ? 'MM' : 'MMMM'
  const day = options?.day === '2-digit' ? 'DD' : 'D'

  return parsed.tz(DELIVERY_TIMEZONE).format(`${day} ${month}`)
}

export function toDatetimeLocalValue(value: string | null | undefined): string {
  const parsed = parseDate(value)
  if (!parsed) return ''

  return parsed.tz(DELIVERY_TIMEZONE).format('YYYY-MM-DDTHH:mm')
}
