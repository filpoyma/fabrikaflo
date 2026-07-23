import type { ICheckoutFormState } from '../../types/ui.ts'
import { formatDeliveryDateTime } from './deliveryDateTime.ts'
import { formatOrderBudget } from './orderFormat.ts'

export function buildCheckoutSuccessMessage(form: ICheckoutFormState): string {
  const finalOccasion = form.occasion === 'Другое' ? form.customOccasion : form.occasion
  const lines: string[] = ['Заявка отправлена', '']

  lines.push(`Повод: ${finalOccasion}`)
  lines.push(`Бюджет: ${formatOrderBudget(form.budget)}`)

  const dateTime = formatDeliveryDateTime(form.deliveryDate, form.deliveryTime)
  if (dateTime) {
    const date = new Date(dateTime)
    if (!Number.isNaN(date.getTime())) {
      const dateStr = date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const timeStr = date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
      lines.push(`Дата: ${dateStr}, ${timeStr}`)
    }
  }

  if (form.deliveryType === 'PICKUP') {
    lines.push('Самовывоз: Сергиев Посад, ул. Вифанская, 29')
  } else {
    lines.push(`Доставка: ${form.deliveryAddress}`)
  }

  lines.push(`Телефон: ${form.recipientPhone}`)
  lines.push('')
  lines.push('Флорист свяжется с вами в Telegram.')
  lines.push('Заявку можно посмотреть в разделе «История».')

  return lines.join('\n')
}
