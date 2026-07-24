import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)
dayjs.locale('ru')

export const DELIVERY_TIMEZONE = 'Europe/Moscow'

export { dayjs }

export function parseDate(value: string | null | undefined) {
  if (!value) return null

  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}
