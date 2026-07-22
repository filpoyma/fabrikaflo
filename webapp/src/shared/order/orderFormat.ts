export function formatOrderDate(
  createdAt: string | undefined,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!createdAt) return 'Дата неизвестна'

  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return 'Дата неизвестна'

  return date.toLocaleDateString(
    'ru-RU',
    options ?? { day: 'numeric', month: 'long', year: 'numeric' },
  )
}

export function formatOrderBudget(budget: number | undefined | null): string {
  if (budget == null || Number.isNaN(Number(budget))) return '—'
  return `${Number(budget).toLocaleString('ru-RU')} ₽`
}
