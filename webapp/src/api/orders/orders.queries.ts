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
    queryFn: () => ordersApi.listMy(),
  })

export const useMyOrderQuery = (id: string | undefined) =>
  useQuery({
    queryKey: orderKeys.detail(id ?? ''),
    queryFn: () => ordersApi.getMy(id!),
    enabled: Boolean(id),
  })
