import { useMutation } from '@tanstack/react-query'
import type { ICreateRequestPayload } from '../../types/webapp.ts'
import { requestsApi } from './requests.api.ts'

export const useCreateRequestMutation = () =>
  useMutation({
    mutationFn: (data: ICreateRequestPayload) => requestsApi.create(data),
  })

export const useUploadRequestPhotoMutation = () =>
  useMutation({
    mutationFn: (file: File) => requestsApi.uploadPhoto(file),
  })
