import type { IRequest } from '../../types/domain.ts'

export type TActiveRequestStatus = 'PENDING' | 'CONTACTED'

export const REQUEST_STATUS_LABEL: Record<TActiveRequestStatus, string> = {
  PENDING: 'Отправлена',
  CONTACTED: 'На связи',
}

export function isActiveRequestStatus(status: IRequest['status']): status is TActiveRequestStatus {
  return status === 'PENDING' || status === 'CONTACTED'
}

export function isActiveRequest(request: IRequest): request is IRequest & { status: TActiveRequestStatus } {
  return isActiveRequestStatus(request.status)
}

export function formatRequestDeliveryDate(date: string | null | undefined): string | null {
  if (!date) return null

  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return null

  const dateStr = parsed.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const timeStr = parsed.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

  return `${dateStr}, ${timeStr}`
}
