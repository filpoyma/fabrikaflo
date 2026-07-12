import { useQuery } from '@tanstack/react-query'
import { teamApi } from './team.api.ts'

export const teamKeys = {
  all: ['team'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
}

export const useTeamQuery = () =>
  useQuery({
    queryKey: teamKeys.lists(),
    queryFn: async () => {
      const response = await teamApi.list()
      return response.data ?? []
    },
  })
