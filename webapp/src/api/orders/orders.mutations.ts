import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from './orders.api.ts'
import { orderKeys } from './orders.queries.ts'

export const useApproveOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ordersApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useDisapproveOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, feedback }: { id: string; feedback: string }) =>
      ordersApi.disapprove(id, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useUploadReceiptMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: string; file: File }) =>
      ordersApi.uploadReceipt(orderId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useRepeatOrderMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => ordersApi.repeat(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
