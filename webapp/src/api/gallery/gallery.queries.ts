import { useQuery } from '@tanstack/react-query'
import { galleryApi } from './gallery.api.ts'

export const galleryKeys = {
  all: ['gallery'] as const,
  lists: () => [...galleryKeys.all, 'list'] as const,
  details: () => [...galleryKeys.all, 'detail'] as const,
  detail: (id: string) => [...galleryKeys.details(), id] as const,
  categories: () => [...galleryKeys.all, 'categories'] as const,
}

export const useProductsQuery = () =>
  useQuery({
    queryKey: galleryKeys.lists(),
    queryFn: () => galleryApi.list(),
  })

export const useProductQuery = (id: string | undefined) =>
  useQuery({
    queryKey: galleryKeys.detail(id ?? ''),
    queryFn: () => galleryApi.getById(id!),
    enabled: Boolean(id),
  })

export const useCategoriesQuery = () =>
  useQuery({
    queryKey: galleryKeys.categories(),
    queryFn: () => galleryApi.getCategories(),
  })
