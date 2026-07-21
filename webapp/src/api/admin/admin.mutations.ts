import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { IAdminSettings, IProductInput } from '../../types/webapp.ts'
import { adminApi } from './admin.api.ts'
import { adminKeys } from './admin.queries.ts'
import { galleryKeys } from '../gallery/gallery.queries.ts'

export const useAdminUpdateOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateOrder(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

export const useAdminConvertRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      adminApi.convertRequest(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all })
    },
  })
}

export const useAdminUploadImageMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => adminApi.uploadImage(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useAdminCreateProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: IProductInput) => adminApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useAdminUpdateProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: IProductInput }) =>
      adminApi.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useAdminDeleteProductMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: galleryKeys.all })
    },
  })
}

export const useAdminUpdateSettingsMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: IAdminSettings) => adminApi.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.settings() })
    },
  })
}

export const useAdminAddTeamMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Record<string, unknown>) => adminApi.addTeamMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.team() })
    },
  })
}

export const useAdminDeleteTeamMemberMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => adminApi.deleteTeamMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.team() })
    },
  })
}
