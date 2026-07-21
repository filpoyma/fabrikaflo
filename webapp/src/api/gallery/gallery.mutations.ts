import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { IProductInput } from '../../types/webapp.ts'
import { galleryApi } from './gallery.api.ts'
import { galleryKeys } from './gallery.queries.ts'

export const useUploadGalleryImageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => galleryApi.uploadImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useCreateProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: IProductInput) => galleryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useUpdateProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IProductInput }) => galleryApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useDeleteProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => galleryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useToggleProductMutation = () =>
  useMutation({
    mutationFn: async (_id: string) => ({ ok: true as const }),
  })
