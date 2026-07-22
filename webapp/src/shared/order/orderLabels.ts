import type { TOrderStatus } from '../../types/domain.ts'

export const ORDER_STATUS_LABEL: Record<TOrderStatus, string> = {
  CREATED: 'Создан',
  ASSEMBLING: 'Сборка',
  ASSEMBLED: 'Согласование',
  WAITING_FOR_APPROVAL: 'Согласование',
  APPROVED: 'Одобрен',
  WAITING_FOR_PAYMENT: 'Ожидает оплаты',
  PAID: 'Оплачен',
  DELIVERING: 'В пути',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменён',
}
