import { parseDate } from './dayjs.ts'

export function formatDate(value: string | undefined, format = 'D MMMM YYYY'): string {
  const parsed = parseDate(value)
  if (!parsed) return '—'

  return parsed.format(format)
}

export function formatDateTime(value: string | undefined): string {
  const parsed = parseDate(value)
  if (!parsed) return '—'

  return parsed.format('D MMMM YYYY, HH:mm')
}
