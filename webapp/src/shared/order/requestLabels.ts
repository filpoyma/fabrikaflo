import type { IRequest } from '../../types/domain.ts'
import { formatStoredDeliveryDateTime } from './deliveryDateTime.ts'

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
  return formatStoredDeliveryDateTime(date)
}
