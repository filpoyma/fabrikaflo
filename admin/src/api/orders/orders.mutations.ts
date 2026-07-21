import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from './orders.api.ts'
import { orderKeys } from './orders.queries.ts'

export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useUploadOrderPhotoMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      ordersApi.uploadPhoto(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useSendOrderApprovalMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => ordersApi.sendApproval(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useSendOrderPaymentMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, paymentLink }: { id: string; paymentLink: string }) =>
      ordersApi.sendPayment(id, paymentLink),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}

export const useAssignOrderCourierMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, courierId }: { id: string; courierId: string }) =>
      ordersApi.assignCourier(id, courierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
