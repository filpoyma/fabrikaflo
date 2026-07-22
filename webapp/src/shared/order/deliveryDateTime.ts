export function formatDeliveryDateTime(date: string, time: string): string | null {
  const normalizedDate = date.trim()
  if (!normalizedDate) return null

  const normalizedTime = time.trim() || '12:00'
  return `${normalizedDate}T${normalizedTime}`
}
