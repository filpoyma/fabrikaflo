import type { ICart } from '../../types/webapp.ts'

const emptyCart: ICart = {
  items: [],
  subtotal_usd: 0,
  total_usd: 0,
  subtotal_display: '$ 0',
  total_display: '$ 0',
  discount_percent: 0,
  discount_usd: 0,
}

export const cartApi = {
  async get(): Promise<ICart> {
    return emptyCart
  },
  async add(_productId: string, _variantIndex: number, _qty: number) {
    return { ok: true as const }
  },
  async remove(_productId: string, _variantIndex: number) {
    return { ok: true as const }
  },
  async updateQty(_productId: string, _variantIndex: number, _qty: number) {
    return { ok: true as const }
  },
}
