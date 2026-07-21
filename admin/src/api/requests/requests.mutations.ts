import { useMutation, useQueryClient } from '@tanstack/react-query'
import { requestsApi, type TConvertRequestData } from './requests.api.ts'
import { requestKeys } from './requests.queries.ts'
import { orderKeys } from '../orders/orders.queries.ts'

export const useUpdateRequestStatusMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      requestsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
    },
  })
}

export const useConvertRequestMutation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TConvertRequestData }) =>
      requestsApi.convert(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all })
      queryClient.invalidateQueries({ queryKey: orderKeys.all })
    },
  })
}
