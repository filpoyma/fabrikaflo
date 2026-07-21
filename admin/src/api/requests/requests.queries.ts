import { useQuery } from '@tanstack/react-query'
import { requestsApi } from './requests.api.ts'

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
}

export const useRequestsQuery = (options?: { refetchInterval?: number }) =>
  useQuery({
    queryKey: requestKeys.lists(),
    queryFn: async () => {
      const response = await requestsApi.list()
      return response.data ?? []
    },
    refetchInterval: options?.refetchInterval,
  })
