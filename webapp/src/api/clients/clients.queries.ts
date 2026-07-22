import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import type { IClientProfile } from '../../types/webapp.ts'
import { clientsApi } from './clients.api.ts'

export const clientKeys = {
  all: ['clients'] as const,
  profile: () => [...clientKeys.all, 'profile'] as const,
}

export const useProfileQuery = (
  options: Omit<UseQueryOptions<IClientProfile>, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: clientKeys.profile(),
    queryFn: async () => {
      const response = await clientsApi.getProfile()
      return response.data
    },
    ...options,
  })
