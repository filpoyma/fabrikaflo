import { useQuery } from '@tanstack/react-query'
import { clientsApi } from './clients.api.ts'

export const clientKeys = {
  all: ['clients'] as const,
  lists: () => [...clientKeys.all, 'list'] as const,
  couriers: () => [...clientKeys.all, 'couriers'] as const,
}

export const useClientsQuery = () =>
  useQuery({
    queryKey: clientKeys.lists(),
    queryFn: async () => {
      const response = await clientsApi.list()
      return response.data ?? []
    },
  })

export const useCouriersQuery = () =>
  useQuery({
    queryKey: clientKeys.couriers(),
    queryFn: async () => {
      const response = await clientsApi.listCouriers()
      return response.data ?? []
    },
  })
