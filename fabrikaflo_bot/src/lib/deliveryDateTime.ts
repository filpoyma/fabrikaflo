const MOSCOW_OFFSET = '+03:00'

const NAIVE_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/

/** Parse delivery datetime as Europe/Moscow wall-clock unless an offset is already present. */
export function parseDeliveryDateTime(value: string): Date | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  if (/[zZ]$/.test(trimmed) || /[+-]\d{2}:\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const match = trimmed.match(NAIVE_DATETIME_RE)
  if (!match) {
    const date = new Date(trimmed)
    return Number.isNaN(date.getTime()) ? null : date
  }

  const [, year, month, day, hours = '12', minutes = '00', seconds = '00'] = match
  const date = new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}${MOSCOW_OFFSET}`)
  return Number.isNaN(date.getTime()) ? null : date
}
