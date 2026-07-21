import React from 'react'
import { PeonyIcon } from '../../../components/BotanicalIcons'

type InlineQueryLoaderProps = {
  message?: string
}

export const InlineQueryLoader: React.FC<InlineQueryLoaderProps> = ({
  message = 'Загрузка…',
}) => (
  <div className="empty-state" style={{ padding: '32px 24px' }} role="status" aria-live="polite">
    <PeonyIcon size={36} color="var(--color-gold-deep)" />
    <div className="headline">{message}</div>
  </div>
)
