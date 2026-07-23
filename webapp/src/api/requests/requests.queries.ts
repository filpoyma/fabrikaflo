import { useQuery } from '@tanstack/react-query'
import { requestsApi } from './requests.api.ts'

export const requestKeys = {
  all: ['requests'] as const,
  my: () => [...requestKeys.all, 'my'] as const,
}

export const useMyRequestsQuery = () =>
  useQuery({
    queryKey: requestKeys.my(),
    queryFn: async () => {
      const response = await requestsApi.listMy()
      return response.data ?? []
    },
  })
