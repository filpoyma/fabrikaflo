import type { ICheckoutFormState } from '../../types';
import { formatDeliveryDateTimeFromForm } from './deliveryDateTime.ts';
import { formatOrderBudget } from './orderFormat.ts';

export function buildCheckoutSuccessMessage(form: ICheckoutFormState): string {
  const finalOccasion = form.occasion === 'Другое' ? form.customOccasion : form.occasion;
  const lines: string[] = ['Заявка отправлена', ''];

  lines.push(`Повод: ${finalOccasion}`);
  lines.push(`Бюджет: ${formatOrderBudget(form.budget)}`);

  const dateTime = formatDeliveryDateTimeFromForm(form.deliveryDate, form.deliveryTime);
  if (dateTime) {
    lines.push(`Дата: ${dateTime}`);
  }

  if (form.deliveryType === 'PICKUP') {
    lines.push('Самовывоз: Сергиев Посад, ул. Вифанская, 29');
  } else {
    lines.push(`Доставка: ${form.deliveryAddress}`);
  }

  lines.push(`Телефон: ${form.recipientPhone}`);
  lines.push('');
  lines.push('Флорист свяжется с вами в Telegram.');
  lines.push('Заявку можно посмотреть в разделе «Профиль» - «Все заказы».');

  return lines.join('\n');
}
