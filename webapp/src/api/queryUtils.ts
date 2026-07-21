export const isInitialQueryLoad = (isPending: boolean, data: unknown) =>
  isPending && data === undefined
