import { dayjs, DELIVERY_TIMEZONE, parseDate } from '../lib/dayjs.ts'

export { DELIVERY_TIMEZONE }

export function formatDeliveryDateTime(date: string, time: string): string | null {
  const normalizedDate = date.trim()
  if (!normalizedDate) return null

  const normalizedTime = time.trim() || '12:00'
  const parsed = dayjs.tz(
    `${normalizedDate} ${normalizedTime}`,
    'YYYY-MM-DD HH:mm',
    DELIVERY_TIMEZONE,
  )

  return parsed.isValid() ? parsed.format() : null
}

export function formatDeliveryDateTimeFromForm(date: string, time: string): string | null {
  const normalizedDate = date.trim()
  if (!normalizedDate) return null

  const normalizedTime = time.trim() || '12:00'
  const parsed = dayjs(`${normalizedDate} ${normalizedTime}`, 'YYYY-MM-DD HH:mm')

  return parsed.isValid() ? parsed.format('DD.MM.YYYY, HH:mm') : null
}

export function formatStoredDeliveryDateTime(value: string | null | undefined): string | null {
  const parsed = parseDate(value)
  if (!parsed) return null

  return parsed.tz(DELIVERY_TIMEZONE).format('DD.MM.YYYY, HH:mm')
}
