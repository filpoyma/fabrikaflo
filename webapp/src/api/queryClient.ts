import { QueryClient, keepPreviousData } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 30_000,
      placeholderData: keepPreviousData,
    },
  },
})
