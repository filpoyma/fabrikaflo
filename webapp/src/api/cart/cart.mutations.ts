import { useMutation, useQueryClient } from '@tanstack/react-query'
import { cartApi } from './cart.api.ts'
import { cartKeys } from './cart.queries.ts'

const invalidateCart = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: cartKeys.all })
}

export const useAddToCartMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      variantIndex,
      qty,
    }: {
      productId: string
      variantIndex: number
      qty: number
    }) => cartApi.add(productId, variantIndex, qty),
    onSuccess: () => invalidateCart(queryClient),
  })
}

export const useRemoveFromCartMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ productId, variantIndex }: { productId: string; variantIndex: number }) =>
      cartApi.remove(productId, variantIndex),
    onSuccess: () => invalidateCart(queryClient),
  })
}

export const useUpdateCartItemQtyMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      variantIndex,
      qty,
    }: {
      productId: string
      variantIndex: number
      qty: number
    }) => cartApi.updateQty(productId, variantIndex, qty),
    onSuccess: () => invalidateCart(queryClient),
  })
}
