import { useQuery } from '@tanstack/react-query'
import { ordersApi } from './orders.api.ts'

export const orderKeys = {
  all: ['orders'] as const,
  my: () => [...orderKeys.all, 'my'] as const,
  detail: (id: string) => [...orderKeys.my(), id] as const,
}

export const useMyOrdersQuery = () =>
  useQuery({
    queryKey: orderKeys.my(),
    queryFn: async () => {
      const response = await ordersApi.listMy()
      return response.data ?? []
    },
  })

export const useMyOrderQuery = (id: string | undefined) =>
  useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: async () => {
      const response = await ordersApi.getMy(id!)
      return response.data
    },
    enabled: Boolean(id),
  })
