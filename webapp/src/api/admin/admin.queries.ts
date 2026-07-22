import { useQuery } from '@tanstack/react-query'
import type { UseQueryOptions } from '@tanstack/react-query'
import { adminApi } from './admin.api.ts'
import { galleryApi } from '../gallery/gallery.api.ts'

export const adminKeys = {
  all: ['admin'] as const,
  orders: (status?: string) => [...adminKeys.all, 'orders', status || 'all'] as const,
  products: () => [...adminKeys.all, 'products'] as const,
  categories: () => [...adminKeys.all, 'categories'] as const,
  settings: () => [...adminKeys.all, 'settings'] as const,
  referrals: () => [...adminKeys.all, 'referrals'] as const,
  stats: (period?: string, customStart?: string, customEnd?: string) =>
    [...adminKeys.all, 'stats', period, customStart, customEnd] as const,
  team: () => [...adminKeys.all, 'team'] as const,
  auditLogs: () => [...adminKeys.all, 'audit-logs'] as const,
}

export const useAdminOrdersQuery = (
  status?: string,
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.orders(status),
    queryFn: async () => {
      const response = await adminApi.getOrders(status)
      return response.data ?? []
    },
    ...options,
  })

export const useAdminProductsQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.products(),
    queryFn: () => adminApi.getProducts(),
    ...options,
  })

export const useAdminCategoriesQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.categories(),
    queryFn: () => galleryApi.getCategories(),
    ...options,
  })

export const useAdminSettingsQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.settings(),
    queryFn: () => adminApi.getSettings(),
    ...options,
  })

export const useAdminReferralsQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.referrals(),
    queryFn: () => adminApi.getReferrals(),
    ...options,
  })

export const useAdminStatsQuery = (
  period?: string,
  customStart?: string,
  customEnd?: string,
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.stats(period, customStart, customEnd),
    queryFn: () => adminApi.getStats(period, customStart, customEnd),
    ...options,
  })

export const useAdminTeamQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.team(),
    queryFn: async () => {
      const response = await adminApi.getTeamMembers()
      return response.data ?? []
    },
    ...options,
  })

export const useAdminAuditLogsQuery = (
  options: Omit<UseQueryOptions, 'queryKey' | 'queryFn'> = {},
) =>
  useQuery({
    queryKey: adminKeys.auditLogs(),
    queryFn: () => adminApi.getAuditLogs(),
    ...options,
  })
