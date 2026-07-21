import { useQuery } from '@tanstack/react-query'
import { cartApi } from './cart.api.ts'

export const cartKeys = {
  all: ['cart'] as const,
  current: () => [...cartKeys.all, 'current'] as const,
}

export const useCartQuery = () =>
  useQuery({
    queryKey: cartKeys.current(),
    queryFn: () => cartApi.get(),
  })
