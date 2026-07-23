import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ICreateRequestPayload } from '../../types/webapp.ts'
import { requestsApi } from './requests.api.ts'
import { requestKeys } from './requests.queries.ts'

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: ICreateRequestPayload) => requestsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.my() })
    },
  })
}

export const useUploadRequestPhotoMutation = () =>
  useMutation({
    mutationFn: (file: File) => requestsApi.uploadPhoto(file),
  })
