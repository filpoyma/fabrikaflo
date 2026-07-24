export type TWizardData = {
  orderId?: string
  occasion?: string
  budget?: number
  dateText?: string
  deliveryType?: string
  deliveryAddress?: string
  recipientPhone?: string
  comment?: string
  postcardText?: string
  examplePhotoUrl?: string | null
  isPortfolioOrder?: boolean
  portfolioTitle?: string
}

export function parseWizardData(raw: string | null | undefined): TWizardData {
  if (!raw) return {}

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return parsed as TWizardData
    }
  } catch {
    // invalid JSON — start fresh
  }

  return {}
}
