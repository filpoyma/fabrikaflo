import type { TOrderStatus } from '../../../types/domain.ts'
import { ORDER_STATUS_LABEL } from '../../order/orderLabels.ts'
import styles from './OrderStatusPill.module.css'

export interface IOrderStatusPillProps {
  status: TOrderStatus
  testId?: string
}

export function OrderStatusPill({ status, testId }: IOrderStatusPillProps) {
  return (
    <span className={styles.pill} data-status={status} data-testid={testId ?? `order-status-${status}`}>
      {ORDER_STATUS_LABEL[status] || status}
    </span>
  )
}
