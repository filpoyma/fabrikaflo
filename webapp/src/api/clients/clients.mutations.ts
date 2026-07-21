import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { IClientProfile } from '../../types/webapp.ts'
import { clientsApi } from './clients.api.ts'
import { clientKeys } from './clients.queries.ts'

export const useUpdateProfileMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<IClientProfile>) => clientsApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}

export const useUploadAvatarMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => clientsApi.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientKeys.all })
    },
  })
}
