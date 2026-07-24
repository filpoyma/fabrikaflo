import { parseDate } from '../lib/dayjs.ts'

export function formatOrderDate(createdAt: string | undefined, format = 'D MMMM YYYY'): string {
  const parsed = parseDate(createdAt)
  if (!parsed) return 'Дата неизвестна'

  return parsed.format(format)
}

export function formatOrderBudget(budget: number | undefined | null): string {
  if (budget == null || Number.isNaN(Number(budget))) return '—'
  return `${Number(budget).toLocaleString('ru-RU')} ₽`
}
