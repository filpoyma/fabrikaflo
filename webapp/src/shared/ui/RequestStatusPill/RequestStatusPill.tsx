import type { TActiveRequestStatus } from '../../order/requestLabels.ts'
import { REQUEST_STATUS_LABEL } from '../../order/requestLabels.ts'
import styles from './RequestStatusPill.module.css'

export interface IRequestStatusPillProps {
  status: TActiveRequestStatus
  testId?: string
}

export function RequestStatusPill({ status, testId }: IRequestStatusPillProps) {
  return (
    <span
      className={styles.pill}
      data-status={status}
      data-testid={testId ?? `request-status-${status}`}
    >
      {REQUEST_STATUS_LABEL[status]}
    </span>
  )
}
