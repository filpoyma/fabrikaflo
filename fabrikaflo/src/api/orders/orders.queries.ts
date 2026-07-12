import { useQuery } from '@tanstack/react-query'
import { ordersApi } from './orders.api.ts'

export const orderKeys = {
  all: ['orders'] as const,
  lists: () => [...orderKeys.all, 'list'] as const,
  details: () => [...orderKeys.all, 'detail'] as const,
  detail: (id: string) => [...orderKeys.details(), id] as const,
}

export const useOrdersQuery = (options?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: orderKeys.lists(),
    queryFn: async () => {
      const response = await ordersApi.list()
      return response.data ?? []
    },
    refetchInterval: options?.refetchInterval,
  })
