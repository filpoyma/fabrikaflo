import { useQuery } from '@tanstack/react-query'
import { galleryApi } from './gallery.api.ts'

export const galleryKeys = {
  all: ['gallery'] as const,
  lists: () => [...galleryKeys.all, 'list'] as const,
}

export const useGalleryQuery = () =>
  useQuery({
    queryKey: galleryKeys.lists(),
    queryFn: async () => {
      const response = await galleryApi.list()
      return response.data ?? []
    },
  })
