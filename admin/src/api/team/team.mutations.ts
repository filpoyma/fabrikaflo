import { useMutation, useQueryClient } from '@tanstack/react-query'
import { teamApi, type ICreateTeamMember } from './team.api.ts'
import { teamKeys } from './team.queries.ts'

export const useCreateTeamMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (body: ICreateTeamMember) => teamApi.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useUpdateTeamMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ICreateTeamMember }) =>
      teamApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useUploadAvatarMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      teamApi.uploadAvatar(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}

export const useDeleteTeamMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => teamApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.all })
    },
  })
}
