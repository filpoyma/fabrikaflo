import type { TDeliveryType } from '../../types/domain.ts'
import type { IOrder } from '../../types/domain.ts'
import type { ICheckoutFormState } from '../../types/ui.ts'

const KNOWN_OCCASIONS = [
  'День рождения',
  'Свидание',
  'Годовщина',
  'Свадьба',
  'Просто так',
] as const

export interface IRepeatCheckoutState {
  budget: number
  occasion: string
  customOccasion: string
  deliveryType: TDeliveryType
  deliveryAddress: string
  recipientPhone: string
  postcardText: string
  comment: string
}

function resolveOccasion(source: string | null | undefined): Pick<ICheckoutFormState, 'occasion' | 'customOccasion'> {
  if (!source?.trim()) {
    return { occasion: 'Просто так', customOccasion: '' }
  }

  const trimmed = source.trim()
  if ((KNOWN_OCCASIONS as readonly string[]).includes(trimmed)) {
    return { occasion: trimmed, customOccasion: '' }
  }

  return { occasion: 'Другое', customOccasion: trimmed }
}

export function buildCheckoutRepeatState(order: IOrder): IRepeatCheckoutState {
  const isPickup =
    order.request?.deliveryType === 'PICKUP' || order.deliveryAddress === 'Самовывоз'

  return {
    ...resolveOccasion(order.request?.occasion),
    budget: order.budget || 4000,
    deliveryType: isPickup ? 'PICKUP' : 'DELIVERY',
    deliveryAddress: isPickup ? '' : order.deliveryAddress || '',
    recipientPhone: order.recipientPhone || '',
    postcardText: order.postcardText || '',
    comment: order.comment || order.wishes || '',
  }
}
