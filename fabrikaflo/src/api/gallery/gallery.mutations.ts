import { useMutation, useQueryClient } from '@tanstack/react-query'
import { galleryApi } from './gallery.api.ts'
import { galleryKeys } from './gallery.queries.ts'

export const useUploadGalleryItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      file,
      title,
      description,
    }: {
      file: File
      title?: string
      description?: string
    }) => galleryApi.upload(file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useUpdateGalleryItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      file,
      title,
      description,
    }: {
      id: string
      file?: File | null
      title?: string
      description?: string
    }) => galleryApi.update(id, file, title, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useDeleteGalleryItemMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => galleryApi.deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}
